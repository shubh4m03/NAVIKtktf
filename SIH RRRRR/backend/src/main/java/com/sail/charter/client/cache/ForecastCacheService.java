package com.sail.charter.client.cache;

import com.sail.charter.client.mlservice.dto.ForecastResponseDto;

import java.util.Optional;

public interface ForecastCacheService {
    void cacheForecast(Long routeId, Long vesselClassId, ForecastResponseDto forecast);
    Optional<ForecastResponseDto> getCachedForecast(Long routeId, Long vesselClassId);
    void clearCache();
}
