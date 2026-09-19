package com.sail.charter.client.mlservice;

import com.sail.charter.client.mlservice.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class HttpMlServiceClient implements MlServiceClient {

    private static final Logger log = LoggerFactory.getLogger(HttpMlServiceClient.class);

    private final RestClient restClient;
    private final String internalToken;

    public HttpMlServiceClient(
            @Value("${ml-service.base-url:http://localhost:8000}") String baseUrl,
            @Value("${ml-service.internal-token:charter-internal-service-secret-token-2026}") String internalToken
    ) {
        this.internalToken = internalToken;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(3000); // 3 seconds connect timeout
        requestFactory.setReadTimeout(5000);    // 5 seconds read timeout

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .defaultHeader("X-Internal-Service-Token", internalToken)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public ForecastResponseDto getForecast(ForecastRequestDto request) {
        try {
            log.info("Calling FastAPI /internal/v1/forecast for origin={} dest={} vessel={}",
                    request.getOriginRegion(), request.getDestinationPort(), request.getVesselClass());
            return restClient.post()
                    .uri("/internal/v1/forecast")
                    .body(request)
                    .retrieve()
                    .body(ForecastResponseDto.class);
        } catch (Exception e) {
            log.warn("FastAPI forecast call failed: {}", e.getMessage());
            throw new MlServiceUnavailableException("Failed to fetch forecast from ML service: " + e.getMessage(), e);
        }
    }

    @Override
    public VesselRankResponseDto rankVessels(VesselRankRequestDto request) {
        try {
            log.info("Calling FastAPI /internal/v1/optimize/vessel-rank for portId={} candidates={}",
                    request.getPortId(), request.getCandidates() != null ? request.getCandidates().size() : 0);
            return restClient.post()
                    .uri("/internal/v1/optimize/vessel-rank")
                    .body(request)
                    .retrieve()
                    .body(VesselRankResponseDto.class);
        } catch (Exception e) {
            log.warn("FastAPI vessel-rank call failed: {}", e.getMessage());
            throw new MlServiceUnavailableException("Failed to rank vessels via ML service: " + e.getMessage(), e);
        }
    }

    @Override
    public EntryTimingResponseDto optimizeEntryTiming(EntryTimingRequestDto request) {
        try {
            log.info("Calling FastAPI /internal/v1/optimize/entry-timing for cargo={} spot={}",
                    request.getCargoQuantityMt(), request.getCurrentSpotRate());
            return restClient.post()
                    .uri("/internal/v1/optimize/entry-timing")
                    .body(request)
                    .retrieve()
                    .body(EntryTimingResponseDto.class);
        } catch (Exception e) {
            log.warn("FastAPI entry-timing call failed: {}", e.getMessage());
            throw new MlServiceUnavailableException("Failed to optimize entry timing via ML service: " + e.getMessage(), e);
        }
    }

    @Override
    public RiskScoreResponseDto scoreRisk(RiskScoreRequestDto request) {
        try {
            log.info("Calling FastAPI /internal/v1/risk/score with splitPct={}", request.getSplitPct());
            return restClient.post()
                    .uri("/internal/v1/risk/score")
                    .body(request)
                    .retrieve()
                    .body(RiskScoreResponseDto.class);
        } catch (Exception e) {
            log.warn("FastAPI risk-score call failed: {}", e.getMessage());
            throw new MlServiceUnavailableException("Failed to compute risk score via ML service: " + e.getMessage(), e);
        }
    }

    @Override
    public IdleRepositioningResponseDto estimateIdleRepositioning(IdleRepositioningRequestDto request) {
        try {
            log.info("Calling FastAPI /internal/v1/optimize/idle-repositioning for port={} vessel={}",
                    request.getDischargePortName(), request.getVesselClassName());
            return restClient.post()
                    .uri("/internal/v1/optimize/idle-repositioning")
                    .body(request)
                    .retrieve()
                    .body(IdleRepositioningResponseDto.class);
        } catch (Exception e) {
            log.warn("FastAPI idle-repositioning call failed: {}", e.getMessage());
            throw new MlServiceUnavailableException("Failed to estimate idle repositioning via ML service: " + e.getMessage(), e);
        }
    }

    @Override
    public PortfolioResponseDto optimizePortfolio(PortfolioRequestDto request) {
        try {
            log.info("Calling FastAPI /internal/v1/optimize/portfolio for tonnage={} lambda={}",
                    request.getTonnageMt(), request.getRiskAversionLambda());
            return restClient.post()
                    .uri("/internal/v1/optimize/portfolio")
                    .body(request)
                    .retrieve()
                    .body(PortfolioResponseDto.class);
        } catch (Exception e) {
            log.warn("FastAPI portfolio optimisation call failed: {}", e.getMessage());
            throw new MlServiceUnavailableException("Failed to optimise portfolio via ML service: " + e.getMessage(), e);
        }
    }
}
