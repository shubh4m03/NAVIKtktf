package com.sail.charter.api.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public class DecisionChainResponseDto {

    private Long id;
    private Long userId;
    private Double tonnage;
    private String originRegion;
    private Long destinationPortId;
    private String destinationPortName;
    private LocalDate deadline;
    private String contractPreference;
    private OffsetDateTime createdAt;
    private String status;
    private Boolean degraded;
    private Long scenarioId;
    private Boolean isScenario;
    private Map<String, Object> inputPerturbation;
    private ForecastSummaryDto forecast;
    private List<VesselRankingSummaryDto> vesselRankings;
    private RiskSummaryDto risk;
    private RecommendationSummaryDto recommendation;
    private IdleEstimateResponseDto idleEstimate;
    private PortfolioAllocationResponseDto portfolioAllocation;

    public DecisionChainResponseDto() {}

    public DecisionChainResponseDto(Long id, Long userId, Double tonnage, String originRegion,
                                    Long destinationPortId, String destinationPortName, LocalDate deadline,
                                    String contractPreference, OffsetDateTime createdAt, String status,
                                    Boolean degraded, ForecastSummaryDto forecast,
                                    List<VesselRankingSummaryDto> vesselRankings, RiskSummaryDto risk,
                                    RecommendationSummaryDto recommendation) {
        this(id, userId, tonnage, originRegion, destinationPortId, destinationPortName, deadline,
                contractPreference, createdAt, status, degraded, null, false, null,
                forecast, vesselRankings, risk, recommendation);
    }

    public DecisionChainResponseDto(Long id, Long userId, Double tonnage, String originRegion,
                                    Long destinationPortId, String destinationPortName, LocalDate deadline,
                                    String contractPreference, OffsetDateTime createdAt, String status,
                                    Boolean degraded, Long scenarioId, Boolean isScenario,
                                    Map<String, Object> inputPerturbation,
                                    ForecastSummaryDto forecast,
                                    List<VesselRankingSummaryDto> vesselRankings, RiskSummaryDto risk,
                                    RecommendationSummaryDto recommendation) {
        this.id = id;
        this.userId = userId;
        this.tonnage = tonnage;
        this.originRegion = originRegion;
        this.destinationPortId = destinationPortId;
        this.destinationPortName = destinationPortName;
        this.deadline = deadline;
        this.contractPreference = contractPreference;
        this.createdAt = createdAt;
        this.status = status;
        this.degraded = degraded;
        this.scenarioId = scenarioId;
        this.isScenario = isScenario;
        this.inputPerturbation = inputPerturbation;
        this.forecast = forecast;
        this.vesselRankings = vesselRankings;
        this.risk = risk;
        this.recommendation = recommendation;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Double getTonnage() { return tonnage; }
    public void setTonnage(Double tonnage) { this.tonnage = tonnage; }

    public String getOriginRegion() { return originRegion; }
    public void setOriginRegion(String originRegion) { this.originRegion = originRegion; }

    public Long getDestinationPortId() { return destinationPortId; }
    public void setDestinationPortId(Long destinationPortId) { this.destinationPortId = destinationPortId; }

    public String getDestinationPortName() { return destinationPortName; }
    public void setDestinationPortName(String destinationPortName) { this.destinationPortName = destinationPortName; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

    public String getContractPreference() { return contractPreference; }
    public void setContractPreference(String contractPreference) { this.contractPreference = contractPreference; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getDegraded() { return degraded; }
    public void setDegraded(Boolean degraded) { this.degraded = degraded; }

    public Long getScenarioId() { return scenarioId; }
    public void setScenarioId(Long scenarioId) { this.scenarioId = scenarioId; }

    public Boolean getIsScenario() { return isScenario; }
    public void setIsScenario(Boolean isScenario) { this.isScenario = isScenario; }

    public Map<String, Object> getInputPerturbation() { return inputPerturbation; }
    public void setInputPerturbation(Map<String, Object> inputPerturbation) { this.inputPerturbation = inputPerturbation; }

    public ForecastSummaryDto getForecast() { return forecast; }
    public void setForecast(ForecastSummaryDto forecast) { this.forecast = forecast; }

    public List<VesselRankingSummaryDto> getVesselRankings() { return vesselRankings; }
    public void setVesselRankings(List<VesselRankingSummaryDto> vesselRankings) { this.vesselRankings = vesselRankings; }

    public RiskSummaryDto getRisk() { return risk; }
    public void setRisk(RiskSummaryDto risk) { this.risk = risk; }

    public RecommendationSummaryDto getRecommendation() { return recommendation; }
    public void setRecommendation(RecommendationSummaryDto recommendation) { this.recommendation = recommendation; }

    public IdleEstimateResponseDto getIdleEstimate() { return idleEstimate; }
    public void setIdleEstimate(IdleEstimateResponseDto idleEstimate) { this.idleEstimate = idleEstimate; }

    public PortfolioAllocationResponseDto getPortfolioAllocation() { return portfolioAllocation; }
    public void setPortfolioAllocation(PortfolioAllocationResponseDto portfolioAllocation) { this.portfolioAllocation = portfolioAllocation; }

    public static class ForecastSummaryDto {
        private Long forecastRunId;
        private Double expectedValueUsdPerTon;
        private Double interval50Low;
        private Double interval50High;
        private Double interval90Low;
        private Double interval90High;
        private Double probIncreasePct;
        private Double confidenceScore;
        private String modelUsed;
        private Map<String, String> dataProvenance;
        private String generatedAt;

        public ForecastSummaryDto() {}

        public ForecastSummaryDto(Long forecastRunId, Double expectedValueUsdPerTon, Double interval50Low,
                                  Double interval50High, Double interval90Low, Double interval90High,
                                  Double probIncreasePct, Double confidenceScore, String modelUsed,
                                  Map<String, String> dataProvenance, String generatedAt) {
            this.forecastRunId = forecastRunId;
            this.expectedValueUsdPerTon = expectedValueUsdPerTon;
            this.interval50Low = interval50Low;
            this.interval50High = interval50High;
            this.interval90Low = interval90Low;
            this.interval90High = interval90High;
            this.probIncreasePct = probIncreasePct;
            this.confidenceScore = confidenceScore;
            this.modelUsed = modelUsed;
            this.dataProvenance = dataProvenance;
            this.generatedAt = generatedAt;
        }

        public Long getForecastRunId() { return forecastRunId; }
        public void setForecastRunId(Long forecastRunId) { this.forecastRunId = forecastRunId; }

        public Double getExpectedValueUsdPerTon() { return expectedValueUsdPerTon; }
        public void setExpectedValueUsdPerTon(Double expectedValueUsdPerTon) { this.expectedValueUsdPerTon = expectedValueUsdPerTon; }

        public Double getInterval50Low() { return interval50Low; }
        public void setInterval50Low(Double interval50Low) { this.interval50Low = interval50Low; }

        public Double getInterval50High() { return interval50High; }
        public void setInterval50High(Double interval50High) { this.interval50High = interval50High; }

        public Double getInterval90Low() { return interval90Low; }
        public void setInterval90Low(Double interval90Low) { this.interval90Low = interval90Low; }

        public Double getInterval90High() { return interval90High; }
        public void setInterval90High(Double interval90High) { this.interval90High = interval90High; }

        public Double getProbIncreasePct() { return probIncreasePct; }
        public void setProbIncreasePct(Double probIncreasePct) { this.probIncreasePct = probIncreasePct; }

        public Double getConfidenceScore() { return confidenceScore; }
        public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }

        public String getModelUsed() { return modelUsed; }
        public void setModelUsed(String modelUsed) { this.modelUsed = modelUsed; }

        public Map<String, String> getDataProvenance() { return dataProvenance; }
        public void setDataProvenance(Map<String, String> dataProvenance) { this.dataProvenance = dataProvenance; }

        public String getGeneratedAt() { return generatedAt; }
        public void setGeneratedAt(String generatedAt) { this.generatedAt = generatedAt; }
    }

    public static class VesselRankingSummaryDto {
        private Long vesselClassId;
        private String vesselClassName;
        private Double score;
        private Integer rank;
        private Boolean feasible;
        private String infeasibilityReason;
        private Double estimatedLandedCost;
        private Double expectedDelayDays;

        public VesselRankingSummaryDto() {}

        public VesselRankingSummaryDto(Long vesselClassId, String vesselClassName, Double score,
                                       Integer rank, Boolean feasible, String infeasibilityReason,
                                       Double estimatedLandedCost, Double expectedDelayDays) {
            this.vesselClassId = vesselClassId;
            this.vesselClassName = vesselClassName;
            this.score = score;
            this.rank = rank;
            this.feasible = feasible;
            this.infeasibilityReason = infeasibilityReason;
            this.estimatedLandedCost = estimatedLandedCost;
            this.expectedDelayDays = expectedDelayDays;
        }

        public Long getVesselClassId() { return vesselClassId; }
        public void setVesselClassId(Long vesselClassId) { this.vesselClassId = vesselClassId; }

        public String getVesselClassName() { return vesselClassName; }
        public void setVesselClassName(String vesselClassName) { this.vesselClassName = vesselClassName; }

        public Double getScore() { return score; }
        public void setScore(Double score) { this.score = score; }

        public Integer getRank() { return rank; }
        public void setRank(Integer rank) { this.rank = rank; }

        public Boolean getFeasible() { return feasible; }
        public void setFeasible(Boolean feasible) { this.feasible = feasible; }

        public String getInfeasibilityReason() { return infeasibilityReason; }
        public void setInfeasibilityReason(String infeasibilityReason) { this.infeasibilityReason = infeasibilityReason; }

        public Double getEstimatedLandedCost() { return estimatedLandedCost; }
        public void setEstimatedLandedCost(Double estimatedLandedCost) { this.estimatedLandedCost = estimatedLandedCost; }

        public Double getExpectedDelayDays() { return expectedDelayDays; }
        public void setExpectedDelayDays(Double expectedDelayDays) { this.expectedDelayDays = expectedDelayDays; }
    }

    public static class RiskSummaryDto {
        private Long riskEventId;
        private Double riskScore;
        private String category;
        private List<Map<String, Object>> topDrivers;
        private String mitigationSuggestion;
        private OffsetDateTime computedAt;

        public RiskSummaryDto() {}

        public RiskSummaryDto(Long riskEventId, Double riskScore, String category,
                              List<Map<String, Object>> topDrivers, String mitigationSuggestion,
                              OffsetDateTime computedAt) {
            this.riskEventId = riskEventId;
            this.riskScore = riskScore;
            this.category = category;
            this.topDrivers = topDrivers;
            this.mitigationSuggestion = mitigationSuggestion;
            this.computedAt = computedAt;
        }

        public Long getRiskEventId() { return riskEventId; }
        public void setRiskEventId(Long riskEventId) { this.riskEventId = riskEventId; }

        public Double getRiskScore() { return riskScore; }
        public void setRiskScore(Double riskScore) { this.riskScore = riskScore; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public List<Map<String, Object>> getTopDrivers() { return topDrivers; }
        public void setTopDrivers(List<Map<String, Object>> topDrivers) { this.topDrivers = topDrivers; }

        public String getMitigationSuggestion() { return mitigationSuggestion; }
        public void setMitigationSuggestion(String mitigationSuggestion) { this.mitigationSuggestion = mitigationSuggestion; }

        public OffsetDateTime getComputedAt() { return computedAt; }
        public void setComputedAt(OffsetDateTime computedAt) { this.computedAt = computedAt; }
    }

    public static class RecommendationSummaryDto {
        private Long recommendationId;
        private String action;
        private Double splitPct;
        private String rationaleJson;
        private OffsetDateTime createdAt;

        public RecommendationSummaryDto() {}

        public RecommendationSummaryDto(Long recommendationId, String action, Double splitPct,
                                        String rationaleJson, OffsetDateTime createdAt) {
            this.recommendationId = recommendationId;
            this.action = action;
            this.splitPct = splitPct;
            this.rationaleJson = rationaleJson;
            this.createdAt = createdAt;
        }

        public Long getRecommendationId() { return recommendationId; }
        public void setRecommendationId(Long recommendationId) { this.recommendationId = recommendationId; }

        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }

        public Double getSplitPct() { return splitPct; }
        public void setSplitPct(Double splitPct) { this.splitPct = splitPct; }

        public String getRationaleJson() { return rationaleJson; }
        public void setRationaleJson(String rationaleJson) { this.rationaleJson = rationaleJson; }

        public OffsetDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    }
}
