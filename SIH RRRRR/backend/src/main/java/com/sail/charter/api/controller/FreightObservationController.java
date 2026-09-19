package com.sail.charter.api.controller;

import com.sail.charter.domain.entity.FreightRateObservation;
import com.sail.charter.domain.repository.FreightRateObservationRepository;
import com.sail.charter.domain.repository.PortRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Freight Rate Observations API.
 * Serves historical freight rate data from the freight_rate_observations table (V5 migration).
 * Used by the FreightMarket and CommandCenterDashboard frontend components.
 */
@RestController
@RequestMapping("/api/v1/freight")
public class FreightObservationController {

    private final FreightRateObservationRepository freightRepo;
    private final PortRepository portRepository;

    public FreightObservationController(
            FreightRateObservationRepository freightRepo,
            PortRepository portRepository
    ) {
        this.freightRepo = freightRepo;
        this.portRepository = portRepository;
    }

    /**
     * GET /api/v1/freight/history
     *
     * Query Parameters:
     *   originRegion       — e.g. "AUSTRALIA_GLADSTONE"
     *   destinationPortId  — port primary key (Long)
     *   days               — lookback window in days (default 365)
     *
     * Returns an array of { date, rateUsdPerTonne, bunkerPrice, congestionIndex, dataProvenance }
     */
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(
            @RequestParam String originRegion,
            @RequestParam Long destinationPortId,
            @RequestParam(defaultValue = "365") int days
    ) {
        LocalDate since = LocalDate.now().minusDays(days);
        List<FreightRateObservation> obs = freightRepo.findByRouteAndSince(originRegion, destinationPortId, since);

        List<Map<String, Object>> result = obs.stream().map(o -> Map.<String, Object>of(
                "date", o.getObservationDate().toString(),
                "rateUsdPerTonne", o.getRateUsdPerTonne(),
                "bunkerPriceUsdPerTonne", o.getBunkerPriceUsdPerTonne() != null ? o.getBunkerPriceUsdPerTonne() : 0.0,
                "congestionIndex", o.getCongestionIndex() != null ? o.getCongestionIndex() : 0.0,
                "dataProvenance", o.getDataProvenance(),
                "vesselClass", o.getVesselClass() != null ? o.getVesselClass().getName() : "UNKNOWN"
        )).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/v1/freight/origins
     * Returns the list of distinct origin regions present in the observations table.
     */
    @GetMapping("/origins")
    public ResponseEntity<List<String>> getOrigins() {
        return ResponseEntity.ok(freightRepo.findDistinctOriginRegions());
    }

    /**
     * GET /api/v1/freight/summary
     *
     * Returns a quick statistical summary (latest rate, 30d avg, trend direction)
     * for a specific route, consumed by the Command Center dashboard widget.
     */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestParam String originRegion,
            @RequestParam Long destinationPortId
    ) {
        LocalDate since30 = LocalDate.now().minusDays(30);
        LocalDate since7  = LocalDate.now().minusDays(7);

        List<FreightRateObservation> last30 = freightRepo.findByRouteAndSince(originRegion, destinationPortId, since30);
        List<FreightRateObservation> last7  = freightRepo.findByRouteAndSince(originRegion, destinationPortId, since7);

        if (last30.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "available", false,
                    "originRegion", originRegion,
                    "destinationPortId", destinationPortId
            ));
        }

        double avg30 = last30.stream().mapToDouble(FreightRateObservation::getRateUsdPerTonne).average().orElse(0);
        double avg7  = last7.isEmpty()  ? avg30 : last7.stream().mapToDouble(FreightRateObservation::getRateUsdPerTonne).average().orElse(avg30);
        double latest = last30.get(last30.size() - 1).getRateUsdPerTonne();

        String trend = avg7 > avg30 * 1.03 ? "RISING"
                     : avg7 < avg30 * 0.97 ? "DECLINING"
                     : "STABLE";

        return ResponseEntity.ok(Map.of(
                "available", true,
                "originRegion", originRegion,
                "destinationPortId", destinationPortId,
                "latestRateUsdPerTonne", latest,
                "avg30dUsdPerTonne", avg30,
                "avg7dUsdPerTonne", avg7,
                "trend", trend,
                "observationCount", last30.size(),
                "dataProvenance", last30.get(0).getDataProvenance()
        ));
    }
}
