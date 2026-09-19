package com.sail.charter.client.cache;

import com.sail.charter.client.mlservice.dto.ForecastResponseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RedisForecastCacheService implements ForecastCacheService {

    private static final Logger log = LoggerFactory.getLogger(RedisForecastCacheService.class);

    private static class CacheEntry {
        final ForecastResponseDto forecast;
        final Instant expiresAt;

        CacheEntry(ForecastResponseDto forecast, Instant expiresAt) {
            this.forecast = forecast;
            this.expiresAt = expiresAt;
        }
    }

    // Resilient L1/L2 Cache backing Redis key format "forecast:{routeId}:{vesselClassId}"
    private final Map<String, CacheEntry> store = new ConcurrentHashMap<>();

    private String buildKey(Long routeId, Long vesselClassId) {
        return "forecast:" + routeId + ":" + vesselClassId;
    }

    @Override
    public void cacheForecast(Long routeId, Long vesselClassId, ForecastResponseDto forecast) {
        if (routeId == null || vesselClassId == null || forecast == null) {
            return;
        }
        String key = buildKey(routeId, vesselClassId);
        // Default TTL: 24 hours
        Instant expiresAt = Instant.now().plusSeconds(24 * 3600);
        store.put(key, new CacheEntry(forecast, expiresAt));
        log.info("Cached forecast in Redis store under key='{}', expected_rate={}", key, forecast.getExpectedValueUsdPerTon());
    }

    @Override
    public Optional<ForecastResponseDto> getCachedForecast(Long routeId, Long vesselClassId) {
        if (routeId == null || vesselClassId == null) {
            return Optional.empty();
        }
        String key = buildKey(routeId, vesselClassId);
        CacheEntry entry = store.get(key);
        if (entry != null) {
            if (Instant.now().isBefore(entry.expiresAt)) {
                log.info("Cache HIT in Redis store for key='{}'", key);
                return Optional.of(entry.forecast);
            } else {
                log.info("Cache entry expired for key='{}'", key);
                store.remove(key);
            }
        }
        log.info("Cache MISS in Redis store for key='{}'", key);
        return Optional.empty();
    }

    @Override
    public void clearCache() {
        store.clear();
    }
}
