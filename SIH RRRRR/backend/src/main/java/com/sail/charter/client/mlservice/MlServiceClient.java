package com.sail.charter.client.mlservice;

import com.sail.charter.client.mlservice.dto.*;

public interface MlServiceClient {
    ForecastResponseDto getForecast(ForecastRequestDto request);
    VesselRankResponseDto rankVessels(VesselRankRequestDto request);
    EntryTimingResponseDto optimizeEntryTiming(EntryTimingRequestDto request);
    RiskScoreResponseDto scoreRisk(RiskScoreRequestDto request);
    IdleRepositioningResponseDto estimateIdleRepositioning(IdleRepositioningRequestDto request);
    PortfolioResponseDto optimizePortfolio(PortfolioRequestDto request);
}
