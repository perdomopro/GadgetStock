package com.perdomazo.firstproject.dto;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Data Transfer Object representing the financial summary of inventory and realized sales.
 * Conforms to GadgetStock Milestone 3 (Features 14-17) REST API contracts.
 *
 * @param stockCapital Sum of (price + repairCost) strictly for unsold items (isSold == false).
 * @param netProfit Sum of (soldPrice - (price + repairCost)) strictly for sold items (isSold == true).
 * @param roi Return on Investment (%) over sold cost basis, rounded to 2 decimal places.
 * @param soldItemsCount Count of items with isSold == true.
 * @param availableItemsCount Count of items with isSold == false (or null).
 */
public record FinancialSummaryDTO(
    BigDecimal stockCapital,
    BigDecimal netProfit,
    Double roi,
    Integer soldItemsCount,
    Integer availableItemsCount
) {
    /**
     * Compact constructor ensuring null-safety and standard 2-decimal scale.
     */
    public FinancialSummaryDTO {
        stockCapital = stockCapital != null 
                ? stockCapital.setScale(2, RoundingMode.HALF_UP) 
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        netProfit = netProfit != null 
                ? netProfit.setScale(2, RoundingMode.HALF_UP) 
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        roi = roi != null ? roi : 0.0;
        soldItemsCount = soldItemsCount != null ? soldItemsCount : 0;
        availableItemsCount = availableItemsCount != null ? availableItemsCount : 0;
    }

    /**
     * Factory method returning an empty financial summary.
     */
    public static FinancialSummaryDTO empty() {
        return new FinancialSummaryDTO(
            BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
            BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
            0.0,
            0,
            0
        );
    }
}
