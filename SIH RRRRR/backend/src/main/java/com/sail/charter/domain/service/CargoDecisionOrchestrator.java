package com.sail.charter.domain.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sail.charter.api.dto.DecisionChainResponseDto;
import com.sail.charter.api.dto.IdleEstimateResponseDto;
import com.sail.charter.api.dto.OpportunityLaneDto;
import com.sail.charter.api.dto.PortfolioAllocationResponseDto;
import com.sail.charter.api.dto.ScenarioPerturbationDto;
import com.sail.charter.api.exception.ResourceNotFoundException;
import com.sail.charter.client.cache.ForecastCacheService;
import com.sail.charter.client.mlservice.MlServiceClient;
import com.sail.charter.client.mlservice.MlServiceUnavailableException;
import com.sail.charter.client.mlservice.dto.*;
import com.sail.charter.domain.entity.*;
import com.sail.charter.domain.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CargoDecisionOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(CargoDecisionOrchestrator.class);

    private final CargoRequestRepository cargoRequestRepository;
    private final PortRepository portRepository;
    private final PortConstraintRepository portConstraintRepository;
    private final RouteRepository routeRepository;
    private final VesselClassRepository vesselClassRepository;
    private final ForecastRunRepository forecastRunRepository;
    private final ForecastResultRepository forecastResultRepository;
    private final VesselRankingRepository vesselRankingRepository;
    private final RiskEventRepository riskEventRepository;
    private final RecommendationRepository recommendationRepository;
    private final ScenarioRepository scenarioRepository;
    private final IdleEstimateRepository idleEstimateRepository;
    private final PortfolioAllocationRepository portfolioAllocationRepository;
    private final MlServiceClient mlServiceClient;
    private final ForecastCacheService forecastCacheService;
    private final ObjectMapper objectMapper;

    public CargoDecisionOrchestrator(
            CargoRequestRepository cargoRequestRepository,
            PortRepository portRepository,
            PortConstraintRepository portConstraintRepository,
            RouteRepository routeRepository,
            VesselClassRepository vesselClassRepository,
            ForecastRunRepository forecastRunRepository,
            ForecastResultRepository forecastResultRepository,
            VesselRankingRepository vesselRankingRepository,
            RiskEventRepository riskEventRepository,
            RecommendationRepository recommendationRepository,
            ScenarioRepository scenarioRepository,
            IdleEstimateRepository idleEstimateRepository,
            PortfolioAllocationRepository portfolioAllocationRepository,
            MlServiceClient mlServiceClient,
            ForecastCacheService forecastCacheService,
            ObjectMapper objectMapper
    ) {
        this.cargoRequestRepository = cargoRequestRepository;
        this.portRepository = portRepository;
        this.portConstraintRepository = portConstraintRepository;
        this.routeRepository = routeRepository;
        this.vesselClassRepository = vesselClassRepository;
        this.forecastRunRepository = forecastRunRepository;
        this.forecastResultRepository = forecastResultRepository;
        this.vesselRankingRepository = vesselRankingRepository;
        this.riskEventRepository = riskEventRepository;
        this.recommendationRepository = recommendationRepository;
        this.scenarioRepository = scenarioRepository;
        this.idleEstimateRepository = idleEstimateRepository;
        this.portfolioAllocationRepository = portfolioAllocationRepository;
        this.mlServiceClient = mlServiceClient;
        this.forecastCacheService = forecastCacheService;
        this.objectMapper = objectMapper;
    }

    /**
     * Standard entry point for Task 11: Normal cargo decision orchestration.
     */
    @Transactional
    public DecisionChainResponseDto processCargoRequest(Long cargoRequestId) {
        return executePipeline(cargoRequestId, null, false);
    }

    /**
     * Entry point for Task 12: Scenario simulation endpoint with perturbations.
     */
    @Transactional
    public DecisionChainResponseDto runScenario(Long cargoRequestId, ScenarioPerturbationDto perturbation) {
        return executePipeline(cargoRequestId, perturbation, true);
    }

    /**
     * Core reusable pipeline function (Task 11 & Task 12 unified code path per §31).
     */
    @Transactional
    public DecisionChainResponseDto executePipeline(
            Long cargoRequestId,
            ScenarioPerturbationDto perturbation,
            boolean isScenario
    ) {
        CargoRequest cargoRequest = cargoRequestRepository.findById(cargoRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("CargoRequest not found: " + cargoRequestId));

        Port destPort = cargoRequest.getDestinationPort();
        PortConstraint portConstraint = portConstraintRepository.findTopByPortId(destPort.getId())
                .orElseGet(() -> new PortConstraint(null, destPort, 14.5, 240.0, 35.0, 4, 2500.0, 3.5,
                        DataProvenance.ASSUMPTION, "http://assumption", OffsetDateTime.now()));

        Route route = resolveRoute(cargoRequest.getOriginRegion(), destPort);
        List<VesselClass> vesselClasses = vesselClassRepository.findAll();
        if (vesselClasses.isEmpty()) {
            vesselClasses = createDefaultVesselClasses();
        }

        Map<String, Object> perturbationMap = extractPerturbationMap(perturbation);

        try {
            log.info("Executing decision orchestration pipeline for cargoRequestId={}, isScenario={}",
                    cargoRequestId, isScenario);

            // Step 1: Vessel Ranking & Feasibility Filter (/internal/v1/optimize/vessel-rank)
            List<VesselRankRequestDto.VesselCandidateItemDto> candidateDtos = vesselClasses.stream()
                    .map(vc -> new VesselRankRequestDto.VesselCandidateItemDto(
                            vc.getId(),
                            vc.getName(),
                            vc.getTypicalDraftM(),
                            vc.getTypicalLoaM(),
                            vc.getTypicalBeamM(),
                            vc.getDwtMax(),
                            1200000.0,
                            4.0,
                            75.0,
                            15.0
                    ))
                    .collect(Collectors.toList());

            VesselRankRequestDto rankRequest = new VesselRankRequestDto(
                    destPort.getId(),
                    portConstraint.getMaxDraftM(),
                    portConstraint.getMaxLoaM(),
                    portConstraint.getMaxBeamM(),
                    cargoRequest.getTonnage(),
                    candidateDtos,
                    "DEFAULT_BALANCED"
            );

            VesselRankResponseDto rankResponse = mlServiceClient.rankVessels(rankRequest);

            // Identify best surviving vessel class
            String chosenClassName = rankResponse.getRankings().stream()
                    .filter(VesselRankResponseDto.VesselRankItemDto::getFeasible)
                    .map(VesselRankResponseDto.VesselRankItemDto::getVesselClassName)
                    .findFirst()
                    .orElse("Panamax");

            VesselClass chosenVesselClass = vesselClasses.stream()
                    .filter(vc -> vc.getName().equalsIgnoreCase(chosenClassName))
                    .findFirst()
                    .orElse(vesselClasses.get(0));

            // Step 2: Distributional Forecast (/internal/v1/forecast)
            ForecastRequestDto forecastReq = new ForecastRequestDto(
                    cargoRequest.getOriginRegion(),
                    destPort.getName(),
                    chosenVesselClass.getName().toUpperCase(),
                    30,
                    LocalDate.now().toString()
            );

            ForecastResponseDto forecastResp = mlServiceClient.getForecast(forecastReq);

            // Only update system-of-record Redis cache on normal runs, not scenario runs (§12)
            if (!isScenario) {
                forecastCacheService.cacheForecast(route.getId(), chosenVesselClass.getId(), forecastResp);
            }

            // Step 3: Market-Entry Timing Optimizer (/internal/v1/optimize/entry-timing)
            long deadlineDays = ChronoUnit.DAYS.between(LocalDate.now(), cargoRequest.getDeadline());
            double baseRate = forecastResp.getExpectedValueUsdPerTon();
            double currentSpotRate = baseRate;

            double freightShockPct = (perturbation != null && perturbation.getFreightShockPct() != null)
                    ? perturbation.getFreightShockPct() : 0.0;
            double congestionShockPct = (perturbation != null && perturbation.getCongestionShockPct() != null)
                    ? perturbation.getCongestionShockPct() : 0.0;

            // Apply freight shock: future expected freight is shocked relative to today's spot rate
            double forecastExpectedRate = (baseRate * 0.95) * (1.0 + freightShockPct / 100.0);

            Double baseSpread = (forecastResp.getInterval90() != null && forecastResp.getInterval90().size() >= 2)
                    ? forecastResp.getInterval90().get(1) - forecastResp.getInterval90().get(0)
                    : 3.5;
            Double spread = baseSpread * (1.0 + Math.abs(freightShockPct) / 100.0);

            double baseTurnaroundDays = portConstraint.getAvgTurnaroundDays() != null ? portConstraint.getAvgTurnaroundDays() : 3.5;
            double portQueueDays = baseTurnaroundDays * (1.0 + congestionShockPct / 100.0);

            EntryTimingRequestDto timingReq = new EntryTimingRequestDto(
                    cargoRequest.getTonnage(),
                    currentSpotRate,
                    forecastExpectedRate,
                    spread,
                    (double) Math.max(7, deadlineDays),
                    route.getTypicalTransitDays() != null ? route.getTypicalTransitDays() : 14.0,
                    portQueueDays,
                    7.0,
                    0.5
            );

            EntryTimingResponseDto timingResp = mlServiceClient.optimizeEntryTiming(timingReq);

            // Step 4: Composite Risk Engine (/internal/v1/risk/score)
            double portCongestionSubScore = Math.min(1.0, 0.40 * (1.0 + congestionShockPct / 100.0));
            double commodityPriceShockSubScore = Math.min(1.0, 0.25 + (Math.max(0.0, freightShockPct) / 100.0) * 0.5);

            RiskScoreRequestDto riskReq = new RiskScoreRequestDto(
                    cargoRequest.getId(),
                    0.35,
                    portCongestionSubScore,
                    0.30,
                    0.45,
                    commodityPriceShockSubScore,
                    null,
                    null,
                    "Bay of Bengal",
                    cargoRequest.getDeadline().getMonthValue(),
                    null,
                    null,
                    timingResp.getSplitPct()
            );

            RiskScoreResponseDto riskResp = mlServiceClient.scoreRisk(riskReq);

            // If scenario has freight shock, update reported forecast display to reflect perturbed value
            ForecastResponseDto reportedForecast = forecastResp;
            if (isScenario && freightShockPct != 0.0) {
                double mult = 1.0 + freightShockPct / 100.0;
                reportedForecast = new ForecastResponseDto(
                        forecastResp.getExpectedValueUsdPerTon() * mult,
                        forecastResp.getInterval50() != null ? List.of(forecastResp.getInterval50().get(0) * mult, forecastResp.getInterval50().get(1) * mult) : null,
                        forecastResp.getInterval90() != null ? List.of(forecastResp.getInterval90().get(0) * mult, forecastResp.getInterval90().get(1) * mult) : null,
                        Math.min(1.0, forecastResp.getProbIncreaseGt8Pct() + (freightShockPct > 0 ? 0.35 : -0.2)),
                        forecastResp.getConfidenceScore(),
                        forecastResp.getModelUsed() + " [PERTURBED]",
                        forecastResp.getDataProvenance(),
                        forecastResp.getGeneratedAt()
                );
            }

            // =========================================================================
            // PERSISTENCE BRANCHING (§17, §31)
            // =========================================================================
            if (isScenario) {
                // Task 12: Do NOT create a new cargo_request row or overwrite recommendation table.
                // Store strictly under the scenarios table (§31).
                DecisionChainResponseDto.RecommendationSummaryDto recSummary = new DecisionChainResponseDto.RecommendationSummaryDto(
                        null,
                        timingResp.getRecommendedAction(),
                        timingResp.getSplitPct(),
                        toJson(timingResp.getRationale()),
                        OffsetDateTime.now()
                );

                Scenario scenario = scenarioRepository.save(new Scenario(
                        null,
                        cargoRequest,
                        toJson(perturbationMap),
                        toJson(recSummary),
                        OffsetDateTime.now()
                ));

                log.info("Persisted scenario simulation under scenarios table id={}, cargoRequestId={}",
                        scenario.getId(), cargoRequestId);

                DecisionChainResponseDto scenarioResponse = assembleScenarioResponse(
                        cargoRequest,
                        false,
                        scenario.getId(),
                        perturbationMap,
                        reportedForecast,
                        rankResponse,
                        riskResp,
                        timingResp
                );
                attachIdleEstimate(scenarioResponse, cargoRequest, chosenVesselClass, portConstraint, false);
                attachPortfolioAllocation(scenarioResponse, cargoRequest, forecastResp, 0.5);
                return scenarioResponse;

            } else {
                // Task 11: Persist into all 5 PostgreSQL tables per Section 17 schema
                ForecastRun forecastRun = forecastRunRepository.save(new ForecastRun(
                        null,
                        cargoRequest,
                        route,
                        chosenVesselClass,
                        forecastResp.getModelUsed(),
                        OffsetDateTime.now()
                ));

                String provenanceJson = toJson(forecastResp.getDataProvenance());
                ForecastResult forecastResult = forecastResultRepository.save(new ForecastResult(
                        null,
                        forecastRun,
                        forecastResp.getExpectedValueUsdPerTon(),
                        forecastResp.getInterval50() != null ? forecastResp.getInterval50().get(0) : 26.0,
                        forecastResp.getInterval50() != null ? forecastResp.getInterval50().get(1) : 28.0,
                        forecastResp.getInterval90() != null ? forecastResp.getInterval90().get(0) : 24.0,
                        forecastResp.getInterval90() != null ? forecastResp.getInterval90().get(1) : 31.0,
                        forecastResp.getProbIncreaseGt8Pct(),
                        forecastResp.getConfidenceScore(),
                        provenanceJson
                ));

                Map<String, VesselClass> nameToVc = vesselClasses.stream()
                        .collect(Collectors.toMap(vc -> vc.getName().toUpperCase(), vc -> vc));

                List<VesselRanking> rankingsToSave = rankResponse.getRankings().stream()
                        .map(r -> {
                            VesselClass vc = nameToVc.getOrDefault(r.getVesselClassName().toUpperCase(), chosenVesselClass);
                            return new VesselRanking(
                                    null,
                                    forecastRun,
                                    vc,
                                    r.getScore(),
                                    r.getEstimatedLandedCost(),
                                    r.getExpectedDelayDays(),
                                    r.getFeasible(),
                                    r.getInfeasibilityReason()
                            );
                        })
                        .collect(Collectors.toList());
                List<VesselRanking> savedRankings = vesselRankingRepository.saveAll(rankingsToSave);

                String topDriversJson = toJson(riskResp.getTopDrivers());
                RiskEvent riskEvent = riskEventRepository.save(new RiskEvent(
                        null,
                        cargoRequest,
                        riskResp.getRiskScore(),
                        riskResp.getCategory(),
                        topDriversJson,
                        riskResp.getMitigationSuggestion(),
                        OffsetDateTime.now()
                ));

                String rationaleJson = toJson(timingResp.getRationale());
                Recommendation recommendation = recommendationRepository.save(new Recommendation(
                        null,
                        cargoRequest,
                        timingResp.getRecommendedAction(),
                        timingResp.getSplitPct(),
                        rationaleJson,
                        forecastRun,
                        riskEvent,
                        OffsetDateTime.now()
                ));

                cargoRequest.setStatus("PROCESSED");
                cargoRequestRepository.save(cargoRequest);

                DecisionChainResponseDto response = assembleResponse(cargoRequest, false, forecastRun, forecastResult, savedRankings, riskEvent, recommendation);
                attachIdleEstimate(response, cargoRequest, chosenVesselClass, portConstraint, false);
                attachPortfolioAllocation(response, cargoRequest, forecastResp, 0.5);
                return response;
            }

        } catch (MlServiceUnavailableException e) {
            log.warn("FastAPI unreachable ({}). Triggering degraded-mode fallback using Redis cache.", e.getMessage());
            return handleDegradedFallback(cargoRequest, route, vesselClasses, portConstraint, isScenario, perturbationMap);
        }
    }

    private DecisionChainResponseDto handleDegradedFallback(
            CargoRequest cargoRequest,
            Route route,
            List<VesselClass> vesselClasses,
            PortConstraint portConstraint,
            boolean isScenario,
            Map<String, Object> perturbationMap
    ) {
        VesselClass defaultVessel = vesselClasses.get(0);

        Optional<ForecastResponseDto> cachedOpt = forecastCacheService.getCachedForecast(route.getId(), defaultVessel.getId());

        ForecastResponseDto forecastData;
        Map<String, String> provenance = new HashMap<>();
        if (cachedOpt.isPresent()) {
            forecastData = cachedOpt.get();
            provenance.put("status", "DEGRADED");
            provenance.put("note", "Served from Redis cache due to ML service outage");
            provenance.put("cached_generated_at", forecastData.getGeneratedAt());
        } else {
            provenance.put("status", "DEGRADED");
            provenance.put("note", "Fallback baseline estimation");
            forecastData = new ForecastResponseDto(
                    27.50,
                    List.of(26.0, 29.0),
                    List.of(24.0, 32.0),
                    0.30,
                    50.0,
                    "cached_proxy_baseline",
                    provenance,
                    OffsetDateTime.now().toString()
            );
        }

        double freightShockPct = perturbationMap.containsKey("freight_shock_pct")
                ? ((Number) perturbationMap.get("freight_shock_pct")).doubleValue() : 0.0;

        String action = freightShockPct > 20.0 ? "CHARTER_NOW" : "SPLIT";
        double splitPct = freightShockPct > 20.0 ? 100.0 : 50.0;

        if (isScenario) {
            DecisionChainResponseDto.RecommendationSummaryDto recSummary = new DecisionChainResponseDto.RecommendationSummaryDto(
                    null,
                    action,
                    splitPct,
                    toJson(Map.of("action", action, "degraded", true, "note", "Degraded fallback scenario")),
                    OffsetDateTime.now()
            );

            Scenario scenario = scenarioRepository.save(new Scenario(
                    null,
                    cargoRequest,
                    toJson(perturbationMap),
                    toJson(recSummary),
                    OffsetDateTime.now()
            ));

            DecisionChainResponseDto.ForecastSummaryDto fDto = new DecisionChainResponseDto.ForecastSummaryDto(
                    null,
                    forecastData.getExpectedValueUsdPerTon() * (1.0 + freightShockPct / 100.0),
                    forecastData.getInterval50().get(0),
                    forecastData.getInterval50().get(1),
                    forecastData.getInterval90().get(0),
                    forecastData.getInterval90().get(1),
                    forecastData.getProbIncreaseGt8Pct(),
                    forecastData.getConfidenceScore(),
                    forecastData.getModelUsed(),
                    provenance,
                    forecastData.getGeneratedAt()
            );

            List<DecisionChainResponseDto.VesselRankingSummaryDto> rankDtos = vesselClasses.stream()
                    .map(vc -> new DecisionChainResponseDto.VesselRankingSummaryDto(
                            vc.getId(), vc.getName(), 60.0, 1, true, null, 1200000.0, 3.5
                    ))
                    .collect(Collectors.toList());

            DecisionChainResponseDto.RiskSummaryDto riskDto = new DecisionChainResponseDto.RiskSummaryDto(
                    null, 50.0, "MEDIUM", List.of(), "Degraded fallback mode active", OffsetDateTime.now()
            );

            DecisionChainResponseDto scenarioResp = new DecisionChainResponseDto(
                    cargoRequest.getId(),
                    cargoRequest.getUser().getId(),
                    cargoRequest.getTonnage(),
                    cargoRequest.getOriginRegion(),
                    cargoRequest.getDestinationPort().getId(),
                    cargoRequest.getDestinationPort().getName(),
                    cargoRequest.getDeadline(),
                    cargoRequest.getContractPreference(),
                    cargoRequest.getCreatedAt(),
                    "DEGRADED",
                    true,
                    scenario.getId(),
                    true,
                    perturbationMap,
                    fDto,
                    rankDtos,
                    riskDto,
                    recSummary
            );
            attachIdleEstimate(scenarioResp, cargoRequest, defaultVessel, portConstraint, true);
            attachPortfolioAllocation(scenarioResp, cargoRequest, forecastData, 0.5);
            return scenarioResp;
        }

        // Standard degraded path
        ForecastRun degradedRun = forecastRunRepository.save(new ForecastRun(
                null,
                cargoRequest,
                route,
                defaultVessel,
                "degraded_fallback_v1",
                OffsetDateTime.now()
        ));

        ForecastResult degradedResult = forecastResultRepository.save(new ForecastResult(
                null,
                degradedRun,
                forecastData.getExpectedValueUsdPerTon(),
                forecastData.getInterval50().get(0),
                forecastData.getInterval50().get(1),
                forecastData.getInterval90().get(0),
                forecastData.getInterval90().get(1),
                forecastData.getProbIncreaseGt8Pct(),
                forecastData.getConfidenceScore(),
                toJson(provenance)
        ));

        List<VesselRanking> degradedRankings = new ArrayList<>();
        for (VesselClass vc : vesselClasses) {
            boolean feasible = vc.getTypicalDraftM() <= portConstraint.getMaxDraftM();
            String reason = feasible ? null : String.format("Vessel draft %.1fm exceeds port max draft %.1fm",
                    vc.getTypicalDraftM(), portConstraint.getMaxDraftM());
            double score = feasible ? 60.0 : 0.0;
            degradedRankings.add(new VesselRanking(
                    null,
                    degradedRun,
                    vc,
                    score,
                    1200000.0,
                    4.0,
                    feasible,
                    reason
            ));
        }
        List<VesselRanking> savedRankings = vesselRankingRepository.saveAll(degradedRankings);

        List<Map<String, Object>> fallbackDrivers = List.of(
                Map.of("factor", "ml_service_status", "sub_score", 0.80, "provenance", "DEGRADED", "detail", "ML Service outage - degraded mode active")
        );
        RiskEvent degradedRisk = riskEventRepository.save(new RiskEvent(
                null,
                cargoRequest,
                50.0,
                "MEDIUM",
                toJson(fallbackDrivers),
                "Degraded mode active: secure 50% now under conservative policy, retain 50% flexible.",
                OffsetDateTime.now()
        ));

        Map<String, Object> fallbackRationale = Map.of(
                "action", "SPLIT",
                "narrative", "ML service unavailable. Recommendation derived from cached baseline under degraded mode.",
                "degraded", true
        );
        Recommendation degradedRec = recommendationRepository.save(new Recommendation(
                null,
                cargoRequest,
                "SPLIT",
                50.0,
                toJson(fallbackRationale),
                degradedRun,
                degradedRisk,
                OffsetDateTime.now()
        ));

        cargoRequest.setStatus("DEGRADED");
        cargoRequestRepository.save(cargoRequest);

        DecisionChainResponseDto response = assembleResponse(cargoRequest, true, degradedRun, degradedResult, savedRankings, degradedRisk, degradedRec);
        attachIdleEstimate(response, cargoRequest, defaultVessel, portConstraint, true);
        attachPortfolioAllocation(response, cargoRequest, forecastData, 0.5);
        return response;
    }

    private DecisionChainResponseDto assembleScenarioResponse(
            CargoRequest cargoRequest,
            boolean degraded,
            Long scenarioId,
            Map<String, Object> perturbationMap,
            ForecastResponseDto forecastResp,
            VesselRankResponseDto rankResponse,
            RiskScoreResponseDto riskResp,
            EntryTimingResponseDto timingResp
    ) {
        DecisionChainResponseDto.ForecastSummaryDto forecastDto = new DecisionChainResponseDto.ForecastSummaryDto(
                null,
                forecastResp.getExpectedValueUsdPerTon(),
                forecastResp.getInterval50() != null ? forecastResp.getInterval50().get(0) : null,
                forecastResp.getInterval50() != null ? forecastResp.getInterval50().get(1) : null,
                forecastResp.getInterval90() != null ? forecastResp.getInterval90().get(0) : null,
                forecastResp.getInterval90() != null ? forecastResp.getInterval90().get(1) : null,
                forecastResp.getProbIncreaseGt8Pct(),
                forecastResp.getConfidenceScore(),
                forecastResp.getModelUsed(),
                forecastResp.getDataProvenance(),
                forecastResp.getGeneratedAt()
        );

        List<DecisionChainResponseDto.VesselRankingSummaryDto> rankingDtos = rankResponse.getRankings().stream()
                .map(r -> new DecisionChainResponseDto.VesselRankingSummaryDto(
                        r.getVesselClassId(),
                        r.getVesselClassName(),
                        r.getScore(),
                        r.getRank(),
                        r.getFeasible(),
                        r.getInfeasibilityReason(),
                        r.getEstimatedLandedCost(),
                        r.getExpectedDelayDays()
                ))
                .collect(Collectors.toList());

        DecisionChainResponseDto.RiskSummaryDto riskDto = new DecisionChainResponseDto.RiskSummaryDto(
                null,
                riskResp.getRiskScore(),
                riskResp.getCategory(),
                fromJson(toJson(riskResp.getTopDrivers()), List.class),
                riskResp.getMitigationSuggestion(),
                OffsetDateTime.now()
        );

        DecisionChainResponseDto.RecommendationSummaryDto recDto = new DecisionChainResponseDto.RecommendationSummaryDto(
                null,
                timingResp.getRecommendedAction(),
                timingResp.getSplitPct(),
                toJson(timingResp.getRationale()),
                OffsetDateTime.now()
        );

        return new DecisionChainResponseDto(
                cargoRequest.getId(),
                cargoRequest.getUser().getId(),
                cargoRequest.getTonnage(),
                cargoRequest.getOriginRegion(),
                cargoRequest.getDestinationPort().getId(),
                cargoRequest.getDestinationPort().getName(),
                cargoRequest.getDeadline(),
                cargoRequest.getContractPreference(),
                cargoRequest.getCreatedAt(),
                cargoRequest.getStatus(),
                degraded,
                scenarioId,
                true,
                perturbationMap,
                forecastDto,
                rankingDtos,
                riskDto,
                recDto
        );
    }

    private DecisionChainResponseDto assembleResponse(
            CargoRequest cargoRequest,
            boolean degraded,
            ForecastRun run,
            ForecastResult result,
            List<VesselRanking> rankings,
            RiskEvent risk,
            Recommendation rec
    ) {
        DecisionChainResponseDto.ForecastSummaryDto forecastDto = new DecisionChainResponseDto.ForecastSummaryDto(
                run.getId(),
                result.getExpectedValue(),
                result.getInterval50Low(),
                result.getInterval50High(),
                result.getInterval90Low(),
                result.getInterval90High(),
                result.getProbIncreasePct(),
                result.getConfidenceScore(),
                run.getModelUsed(),
                fromJson(result.getDataProvenanceJson(), Map.class),
                run.getGeneratedAt().toString()
        );

        List<DecisionChainResponseDto.VesselRankingSummaryDto> rankingDtos = rankings.stream()
                .map(r -> new DecisionChainResponseDto.VesselRankingSummaryDto(
                        r.getVesselClass().getId(),
                        r.getVesselClass().getName(),
                        r.getScore(),
                        null,
                        r.getFeasible(),
                        r.getInfeasibilityReason(),
                        r.getEstimatedLandedCost(),
                        r.getExpectedDelayDays()
                ))
                .collect(Collectors.toList());

        DecisionChainResponseDto.RiskSummaryDto riskDto = new DecisionChainResponseDto.RiskSummaryDto(
                risk.getId(),
                risk.getRiskScore(),
                risk.getCategory(),
                fromJson(risk.getTopDriversJson(), List.class),
                risk.getMitigationSuggestion(),
                risk.getComputedAt()
        );

        DecisionChainResponseDto.RecommendationSummaryDto recDto = new DecisionChainResponseDto.RecommendationSummaryDto(
                rec.getId(),
                rec.getAction(),
                rec.getSplitPct(),
                rec.getRationaleJson(),
                rec.getCreatedAt()
        );

        return new DecisionChainResponseDto(
                cargoRequest.getId(),
                cargoRequest.getUser().getId(),
                cargoRequest.getTonnage(),
                cargoRequest.getOriginRegion(),
                cargoRequest.getDestinationPort().getId(),
                cargoRequest.getDestinationPort().getName(),
                cargoRequest.getDeadline(),
                cargoRequest.getContractPreference(),
                cargoRequest.getCreatedAt(),
                cargoRequest.getStatus(),
                degraded,
                forecastDto,
                rankingDtos,
                riskDto,
                recDto
        );
    }

    private Map<String, Object> extractPerturbationMap(ScenarioPerturbationDto perturbation) {
        Map<String, Object> map = new HashMap<>();
        if (perturbation != null) {
            if (perturbation.getFreightShockPct() != null) {
                map.put("freight_shock_pct", perturbation.getFreightShockPct());
            }
            if (perturbation.getCongestionShockPct() != null) {
                map.put("congestion_shock_pct", perturbation.getCongestionShockPct());
            }
            if (perturbation.getBunkerShockPct() != null) {
                map.put("bunker_shock_pct", perturbation.getBunkerShockPct());
            }
            if (perturbation.getAvailabilityShockPct() != null) {
                map.put("availability_shock_pct", perturbation.getAvailabilityShockPct());
            }
            if (perturbation.getAdditionalParameters() != null) {
                map.putAll(perturbation.getAdditionalParameters());
            }
        }
        return map;
    }

    private Route resolveRoute(String originRegion, Port destPort) {
        return routeRepository.findByOriginRegionAndDestinationPortId(originRegion, destPort.getId())
                .orElseGet(() -> routeRepository.save(new Route(null, originRegion, destPort, 4500.0, 15.0)));
    }

    private List<VesselClass> createDefaultVesselClasses() {
        return List.of(
                vesselClassRepository.save(new VesselClass(null, "Handysize", 10000.0, 40000.0, 10.0, 170.0, 27.0)),
                vesselClassRepository.save(new VesselClass(null, "Supramax", 40000.0, 65000.0, 12.0, 195.0, 32.2)),
                vesselClassRepository.save(new VesselClass(null, "Panamax", 65000.0, 100000.0, 14.0, 228.0, 32.3)),
                vesselClassRepository.save(new VesselClass(null, "Capesize", 100000.0, 180000.0, 18.0, 295.0, 45.0))
        );
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private <T> T fromJson(String json, Class<T> clazz) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, clazz);
        } catch (Exception e) {
            return null;
        }
    }

    // =========================================================================
    // TASK 19 — Charter Portfolio Strategy (§13) helpers
    // =========================================================================

    private void attachPortfolioAllocation(
            DecisionChainResponseDto response,
            CargoRequest cargoRequest,
            ForecastResponseDto forecastData,
            double defaultLambda
    ) {
        try {
            Optional<PortfolioAllocation> existing =
                    portfolioAllocationRepository.findFirstByCargoRequestIdOrderByIdDesc(cargoRequest.getId());
            if (existing.isPresent()) {
                response.setPortfolioAllocation(mapPortfolioToDto(existing.get()));
            } else {
                response.setPortfolioAllocation(computeAndSavePortfolioAllocation(cargoRequest, forecastData, defaultLambda));
            }
        } catch (Exception e) {
            log.warn("Failed to attach portfolio allocation, using fallback: {}", e.getMessage());
            response.setPortfolioAllocation(createFallbackPortfolioAllocation(cargoRequest, forecastData, defaultLambda));
        }
    }

    public PortfolioAllocationResponseDto computeAndSavePortfolioAllocation(
            CargoRequest cargoRequest,
            ForecastResponseDto forecastData,
            double riskAversionLambda
    ) {
        double q05 = (forecastData.getInterval90() != null && forecastData.getInterval90().size() >= 2)
                ? forecastData.getInterval90().get(0) : forecastData.getExpectedValueUsdPerTon() * 0.85;
        double q95 = (forecastData.getInterval90() != null && forecastData.getInterval90().size() >= 2)
                ? forecastData.getInterval90().get(1) : forecastData.getExpectedValueUsdPerTon() * 1.15;

        PortfolioRequestDto req = new PortfolioRequestDto(
                forecastData.getExpectedValueUsdPerTon(),
                q05,
                q95,
                cargoRequest.getTonnage(),
                riskAversionLambda
        );

        PortfolioResponseDto mlResp = null;
        try {
            mlResp = mlServiceClient.optimizePortfolio(req);
        } catch (Exception e) {
            log.warn("ML service portfolio optimisation failed: {}", e.getMessage());
        }
        if (mlResp == null) {
            return createFallbackPortfolioAllocation(cargoRequest, forecastData, riskAversionLambda);
        }

        PortfolioAllocation saved = portfolioAllocationRepository.save(new PortfolioAllocation(
                null,
                cargoRequest,
                mlResp.getRiskAversionLambda(),
                mlResp.getLambdaLabel(),
                mlResp.getSpotPct(),
                mlResp.getShortTermPct(),
                mlResp.getMediumTermPct(),
                mlResp.getTotalExpectedCostUsd(),
                mlResp.getPortfolioVariance(),
                mlResp.getObjectiveValue(),
                mlResp.getSolverUsed(),
                toJson(mlResp.getAllocations()),
                toJson(mlResp.getAssumptions()),
                mlResp.getDisclaimer(),
                toJson(mlResp.getDataProvenance()),
                OffsetDateTime.now()
        ));

        return new PortfolioAllocationResponseDto(
                saved.getId(),
                cargoRequest.getId(),
                saved.getRiskAversionLambda(),
                saved.getLambdaLabel(),
                saved.getSpotPct(),
                saved.getShortTermPct(),
                saved.getMediumTermPct(),
                saved.getTotalExpectedCostUsd(),
                saved.getPortfolioVariance(),
                saved.getObjectiveValue(),
                saved.getSolverUsed(),
                mlResp.getAllocations(),
                mlResp.getAssumptions(),
                saved.getDisclaimer(),
                mlResp.getDataProvenance(),
                saved.getCreatedAt()
        );
    }

    public PortfolioAllocationResponseDto mapPortfolioToDto(PortfolioAllocation entity) {
        List<Map<String, Object>> allocations = null;
        Map<String, Object> assumptions = null;
        Map<String, String> provenance = null;
        try {
            allocations = objectMapper.readValue(entity.getAllocationsJson(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
            assumptions = objectMapper.readValue(entity.getAssumptionsJson(),
                    objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class));
            provenance = objectMapper.readValue(entity.getDataProvenanceJson(),
                    objectMapper.getTypeFactory().constructMapType(Map.class, String.class, String.class));
        } catch (Exception e) {
            log.warn("Failed to deserialise portfolio allocation JSON: {}", e.getMessage());
        }
        return new PortfolioAllocationResponseDto(
                entity.getId(),
                entity.getCargoRequest() != null ? entity.getCargoRequest().getId() : null,
                entity.getRiskAversionLambda(),
                entity.getLambdaLabel(),
                entity.getSpotPct(),
                entity.getShortTermPct(),
                entity.getMediumTermPct(),
                entity.getTotalExpectedCostUsd(),
                entity.getPortfolioVariance(),
                entity.getObjectiveValue(),
                entity.getSolverUsed(),
                allocations != null ? allocations : List.of(),
                assumptions != null ? assumptions : Map.of(),
                entity.getDisclaimer(),
                provenance != null ? provenance : Map.of(),
                entity.getCreatedAt()
        );
    }

    private PortfolioAllocationResponseDto createFallbackPortfolioAllocation(
            CargoRequest cargoRequest,
            ForecastResponseDto forecastData,
            double lambda
    ) {
        // Analytical heuristic: higher lambda -> more medium-term allocation.
        // Conservative lambda=1.0 -> ~65% medium; Balanced 0.5 -> ~45%; Aggressive 0.1 -> ~20%
        double mediumPct = Math.min(80.0, Math.max(20.0, lambda * 45.0 + 20.0));
        double spotPct   = Math.max(5.0, 80.0 - mediumPct);
        double shortPct  = Math.max(5.0, 100.0 - spotPct - mediumPct);
        // Re-normalise
        double total = spotPct + shortPct + mediumPct;
        spotPct   = Math.round(spotPct / total * 10000.0) / 100.0;
        shortPct  = Math.round(shortPct / total * 10000.0) / 100.0;
        mediumPct = Math.round((100.0 - spotPct - shortPct) * 100.0) / 100.0;

        String lambdaLabel = lambda >= 1.0 ? "Conservative" : (lambda >= 0.5 ? "Balanced" : "Aggressive");
        double rate = forecastData.getExpectedValueUsdPerTon();
        double tonnage = cargoRequest.getTonnage();

        return new PortfolioAllocationResponseDto(
                null,
                cargoRequest.getId(),
                lambda,
                lambdaLabel,
                spotPct,
                shortPct,
                mediumPct,
                Math.round(rate * tonnage * 100.0) / 100.0,
                0.0,
                0.0,
                "analytical_fallback",
                List.of(
                        Map.of("contract_type", "SPOT", "weight_pct", spotPct,
                                "data_provenance", Map.of("basis", "SIMULATED synthetic scenario")),
                        Map.of("contract_type", "SHORT_TERM", "weight_pct", shortPct,
                                "data_provenance", Map.of("basis", "SIMULATED synthetic scenario")),
                        Map.of("contract_type", "MEDIUM_TERM", "weight_pct", mediumPct,
                                "data_provenance", Map.of("basis", "SIMULATED synthetic scenario"))
                ),
                Map.of(
                        "variance_model", "analytical_fallback",
                        "basis", "SIMULATED synthetic scenario"
                ),
                "ILLUSTRATIVE MVP: Fallback heuristic portfolio (ML service unavailable). " +
                        "All figures apply to SIMULATED synthetic scenario only. Not a real SAIL contract recommendation.",
                Map.of(
                        "allocations", "ASSUMPTION",
                        "basis", "SIMULATED synthetic scenario — not real SAIL contract data"
                ),
                OffsetDateTime.now()
        );
    }

    private void attachIdleEstimate(
            DecisionChainResponseDto response,
            CargoRequest cargoRequest,
            VesselClass vesselClass,
            PortConstraint portConstraint,
            boolean degraded
    ) {
        try {
            Optional<IdleEstimate> existing = idleEstimateRepository.findFirstByCargoRequestIdOrderByIdDesc(cargoRequest.getId());
            if (existing.isPresent()) {
                response.setIdleEstimate(mapToDto(existing.get()));
            } else {
                response.setIdleEstimate(computeAndSaveIdleEstimate(cargoRequest, vesselClass, portConstraint, degraded));
            }
        } catch (Exception e) {
            log.warn("Failed to attach idle estimate, using fallback: {}", e.getMessage());
            IdleRepositioningResponseDto fallbackResp = createFallbackIdleEstimate(new IdleRepositioningRequestDto(
                    cargoRequest.getDestinationPort().getId(),
                    cargoRequest.getDestinationPort().getName(),
                    vesselClass.getId(),
                    vesselClass.getName(),
                    cargoRequest.getTonnage(),
                    LocalDate.now().plusDays(14).toString(),
                    portConstraint != null ? portConstraint.getAvgTurnaroundDays() : 3.5,
                    portConstraint != null ? portConstraint.getHandlingRateTph() : 2500.0,
                    1.0
            ));
            response.setIdleEstimate(new IdleEstimateResponseDto(
                    null,
                    cargoRequest.getId(),
                    cargoRequest.getDestinationPort().getId(),
                    cargoRequest.getDestinationPort().getName(),
                    vesselClass.getId(),
                    vesselClass.getName(),
                    LocalDate.now().plusDays(14),
                    fallbackResp.getTurnaroundDays(),
                    fallbackResp.getHandlingDays(),
                    fallbackResp.getQueueDays(),
                    LocalDate.parse(fallbackResp.getAvailableDate()),
                    fallbackResp.getOpportunityLanes(),
                    fallbackResp.getDisclaimer(),
                    fallbackResp.getDataProvenance(),
                    OffsetDateTime.now()
            ));
        }
    }

    public IdleEstimateResponseDto computeAndSaveIdleEstimate(
            CargoRequest cargoRequest,
            VesselClass vesselClass,
            PortConstraint portConstraint,
            boolean degraded
    ) {
        LocalDate arrivalDate = LocalDate.now().plusDays(14);
        IdleRepositioningRequestDto req = new IdleRepositioningRequestDto(
                cargoRequest.getDestinationPort().getId(),
                cargoRequest.getDestinationPort().getName(),
                vesselClass.getId(),
                vesselClass.getName(),
                cargoRequest.getTonnage(),
                arrivalDate.toString(),
                portConstraint != null ? portConstraint.getAvgTurnaroundDays() : 3.5,
                portConstraint != null ? portConstraint.getHandlingRateTph() : 2500.0,
                1.0
        );

        IdleRepositioningResponseDto mlResp = null;
        if (!degraded) {
            try {
                mlResp = mlServiceClient.estimateIdleRepositioning(req);
            } catch (Exception e) {
                log.warn("ML service idle repositioning failed: {}", e.getMessage());
            }
        }
        if (mlResp == null) {
            mlResp = createFallbackIdleEstimate(req);
        }

        String lanesJson = toJson(mlResp.getOpportunityLanes());
        LocalDate availableDate = LocalDate.parse(mlResp.getAvailableDate());

        IdleEstimate saved = idleEstimateRepository.save(new IdleEstimate(
                null,
                cargoRequest,
                cargoRequest.getDestinationPort(),
                vesselClass,
                arrivalDate,
                mlResp.getTurnaroundDays(),
                availableDate,
                lanesJson,
                mlResp.getDisclaimer(),
                OffsetDateTime.now()
        ));

        return new IdleEstimateResponseDto(
                saved.getId(),
                cargoRequest.getId(),
                cargoRequest.getDestinationPort().getId(),
                cargoRequest.getDestinationPort().getName(),
                vesselClass.getId(),
                vesselClass.getName(),
                arrivalDate,
                mlResp.getTurnaroundDays(),
                mlResp.getHandlingDays(),
                mlResp.getQueueDays(),
                availableDate,
                mlResp.getOpportunityLanes(),
                mlResp.getDisclaimer(),
                mlResp.getDataProvenance(),
                saved.getCreatedAt()
        );
    }

    public IdleEstimateResponseDto mapToDto(IdleEstimate entity) {
        List<OpportunityLaneDto> lanes = null;
        try {
            lanes = objectMapper.readValue(
                    entity.getOpportunityLanesJson(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, OpportunityLaneDto.class)
            );
        } catch (Exception e) {
            log.warn("Failed to parse opportunity lanes JSON: {}", e.getMessage());
            lanes = List.of();
        }

        Map<String, String> prov = Map.of(
                "turnaround", "REAL_VERIFIED",
                "queue", "SIMULATED",
                "opportunity_lanes", "PUBLIC_PROXY",
                "disclaimer", "ASSUMPTION"
        );

        return new IdleEstimateResponseDto(
                entity.getId(),
                entity.getCargoRequest() != null ? entity.getCargoRequest().getId() : null,
                entity.getDischargePort().getId(),
                entity.getDischargePort().getName(),
                entity.getVesselClass().getId(),
                entity.getVesselClass().getName(),
                entity.getEstimatedArrivalDate(),
                entity.getTurnaroundDays(),
                1.25,
                Math.max(0.0, entity.getTurnaroundDays() - 1.25),
                entity.getAvailableDate(),
                lanes,
                entity.getDisclaimer(),
                prov,
                entity.getCreatedAt()
        );
    }

    private IdleRepositioningResponseDto createFallbackIdleEstimate(IdleRepositioningRequestDto req) {
        double handlingDays = Math.round((req.getCargoTonnage() / Math.max(500.0, req.getHandlingRateTph() != null ? req.getHandlingRateTph() : 2500.0) / 24.0) * 100.0) / 100.0;
        double queueDays = Math.round(((req.getAvgTurnaroundDays() != null ? req.getAvgTurnaroundDays() : 3.5) * (req.getCongestionRatio() != null ? req.getCongestionRatio() : 1.0)) * 100.0) / 100.0;
        double turnaroundDays = Math.round((handlingDays + queueDays) * 10.0) / 10.0;

        LocalDate arrival = LocalDate.parse(req.getEstimatedArrivalDate().substring(0, 10));
        LocalDate available = arrival.plusDays((long) Math.ceil(turnaroundDays));

        double dailyCost = 16500.0;
        if (req.getVesselClassName() != null) {
            String v = req.getVesselClassName().toUpperCase();
            if (v.contains("HANDY")) dailyCost = 13500.0;
            else if (v.contains("SUPRA")) dailyCost = 15000.0;
            else if (v.contains("PANAMAX")) dailyCost = 16500.0;
            else if (v.contains("CAPE")) dailyCost = 22000.0;
        }

        List<OpportunityLaneDto> lanes = List.of(
                new OpportunityLaneDto(
                        "IN-EAST-TO-AUS-EAST",
                        "AUSTRALIA_EAST_COAST",
                        "Gladstone / Newcastle / Hay Point",
                        "Coking Coal / Metallurgical Backhaul",
                        4500.0,
                        15.0,
                        (double) Math.round(15.0 * dailyCost * 1.0),
                        88.0,
                        "HIGH_CONTINUOUS",
                        "Major steelmaking coal backhaul corridor. High continuous volume for Indian blast furnace supply.",
                        Map.of(
                                "distance", "PUBLIC_PROXY",
                                "transit_days", "MODEL_OUTPUT",
                                "cost", "MODEL_OUTPUT",
                                "demand", "PUBLIC_PROXY",
                                "source", "BIMCO & UNCTAD Dry Bulk Trade Flow Statistics"
                        )
                ),
                new OpportunityLaneDto(
                        "IN-EAST-TO-IDN-KAL",
                        "INDONESIA_SOUTH_KALIMANTAN",
                        "Taboneo / Samarinda / Muara Pantai",
                        "Thermal Coal / Low-Ash PCI Backhaul",
                        2100.0,
                        7.0,
                        (double) Math.round(7.0 * (dailyCost * 0.95)),
                        76.0,
                        "MODERATE_HIGH",
                        "Short-sea ballast turnaround. High prompt fixture liquidity for captive thermal power blending.",
                        Map.of(
                                "distance", "PUBLIC_PROXY",
                                "transit_days", "MODEL_OUTPUT",
                                "cost", "MODEL_OUTPUT",
                                "demand", "PUBLIC_PROXY",
                                "source", "UNCTAD Review of Maritime Transport"
                        )
                ),
                new OpportunityLaneDto(
                        "IN-EAST-TO-ZAF-RB",
                        "SOUTH_AFRICA_EAST_COAST",
                        "Richards Bay / Durban",
                        "High-CV Coal / Manganese Ore",
                        4800.0,
                        16.0,
                        (double) Math.round(16.0 * (dailyCost * 1.05)),
                        64.0,
                        "MODERATE",
                        "Alternative long-range backhaul lane. Exploits Pacific-to-Atlantic basin freight rate differentials.",
                        Map.of(
                                "distance", "PUBLIC_PROXY",
                                "transit_days", "MODEL_OUTPUT",
                                "cost", "MODEL_OUTPUT",
                                "demand", "ASSUMPTION",
                                "source", "Industry Broker Fixture Reports"
                        )
                )
        );

        return new IdleRepositioningResponseDto(
                req.getDischargePortId(),
                req.getDischargePortName(),
                req.getVesselClassId(),
                req.getVesselClassName(),
                req.getCargoTonnage(),
                req.getEstimatedArrivalDate(),
                turnaroundDays,
                handlingDays,
                queueDays,
                available.toString(),
                lanes,
                "ILLUSTRATIVE MVP ONLY: Single-voyage heuristic based on public seasonal trade flows. Fleet-level deadheading optimization requires proprietary vessel schedule data.",
                Map.of(
                        "turnaround", "REAL_VERIFIED",
                        "queue", "SIMULATED",
                        "opportunity_lanes", "PUBLIC_PROXY",
                        "disclaimer", "ASSUMPTION"
                )
        );
    }
}
