package com.perdomazo.firstproject.Services;

import com.perdomazo.firstproject.Models.GadgetModel;
import com.perdomazo.firstproject.Repositories.GadgetRepository;
import com.perdomazo.firstproject.dto.FinancialSummaryDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GadgetServiceTest {

    @Mock
    private GadgetRepository gadgetRepository;

    private GadgetService gadgetService;

    @BeforeEach
    void setUp() {
        gadgetService = new GadgetService(gadgetRepository);
    }

    private GadgetModel createGadget(String name, BigDecimal price, BigDecimal repairCost, Boolean isSold, BigDecimal soldPrice) {
        GadgetModel g = new GadgetModel();
        g.setName(name);
        g.setPrice(price);
        g.setRepairCost(repairCost);
        g.setIsSold(isSold);
        g.setSoldPrice(soldPrice);
        return g;
    }

    @Test
    @DisplayName("Empty gadget list returns all zero values with 2-decimal scale")
    void calculateFinancialSummary_EmptyList_ReturnsAllZeros() {
        FinancialSummaryDTO summary = gadgetService.calculateFinancialSummary(Collections.emptyList());

        assertNotNull(summary);
        assertEquals(new BigDecimal("0.00"), summary.stockCapital());
        assertEquals(new BigDecimal("0.00"), summary.netProfit());
        assertEquals(0.0, summary.roi());
        assertEquals(0, summary.soldItemsCount());
        assertEquals(0, summary.availableItemsCount());
    }

    @Test
    @DisplayName("Null gadget list safely returns all zero values")
    void calculateFinancialSummary_NullList_ReturnsAllZeros() {
        FinancialSummaryDTO summary = gadgetService.calculateFinancialSummary(null);

        assertNotNull(summary);
        assertEquals(new BigDecimal("0.00"), summary.stockCapital());
        assertEquals(new BigDecimal("0.00"), summary.netProfit());
        assertEquals(0.0, summary.roi());
        assertEquals(0, summary.soldItemsCount());
        assertEquals(0, summary.availableItemsCount());
    }

    @Test
    @DisplayName("Single unsold item increments stockCapital and availableItemsCount while realized metrics remain zero")
    void calculateFinancialSummary_SingleUnsoldItem_IncrementsStockCapitalOnly() {
        GadgetModel unsold = createGadget("iPhone 13", new BigDecimal("300.00"), new BigDecimal("45.00"), false, null);

        FinancialSummaryDTO summary = gadgetService.calculateFinancialSummary(List.of(unsold));

        assertEquals(new BigDecimal("345.00"), summary.stockCapital());
        assertEquals(new BigDecimal("0.00"), summary.netProfit());
        assertEquals(0.0, summary.roi());
        assertEquals(0, summary.soldItemsCount());
        assertEquals(1, summary.availableItemsCount());
    }

    @Test
    @DisplayName("Unsold item with null repairCost and null price defaults them to zero safely")
    void calculateFinancialSummary_NullCostComponents_DefaultsToZero() {
        GadgetModel unsold = createGadget("Mystery Item", null, null, false, null);

        FinancialSummaryDTO summary = gadgetService.calculateFinancialSummary(List.of(unsold));

        assertEquals(new BigDecimal("0.00"), summary.stockCapital());
        assertEquals(1, summary.availableItemsCount());
        assertEquals(0, summary.soldItemsCount());
    }

    @Test
    @DisplayName("Single sold item with profit calculates netProfit and ROI accurately")
    void calculateFinancialSummary_SingleSoldItem_Profitable() {
        // Cost: 100 + 20 = 120. Sold: 180. Profit: 60. ROI: 60 / 120 * 100 = 50.0%
        GadgetModel sold = createGadget("Pixel 6", new BigDecimal("100.00"), new BigDecimal("20.00"), true, new BigDecimal("180.00"));

        FinancialSummaryDTO summary = gadgetService.calculateFinancialSummary(List.of(sold));

        assertEquals(new BigDecimal("0.00"), summary.stockCapital());
        assertEquals(new BigDecimal("60.00"), summary.netProfit());
        assertEquals(50.0, summary.roi());
        assertEquals(1, summary.soldItemsCount());
        assertEquals(0, summary.availableItemsCount());
    }

    @Test
    @DisplayName("Single sold item with net loss produces negative profit and negative ROI")
    void calculateFinancialSummary_SingleSoldItem_Loss() {
        // Cost: 80 + 20 = 100. Sold: 10. Profit: -90. ROI: -90 / 100 * 100 = -90.0%
        GadgetModel soldAtLoss = createGadget("Broken Laptop", new BigDecimal("80.00"), new BigDecimal("20.00"), true, new BigDecimal("10.00"));

        FinancialSummaryDTO summary = gadgetService.calculateFinancialSummary(List.of(soldAtLoss));

        assertEquals(new BigDecimal("0.00"), summary.stockCapital());
        assertEquals(new BigDecimal("-90.00"), summary.netProfit());
        assertEquals(-90.0, summary.roi());
        assertEquals(1, summary.soldItemsCount());
        assertEquals(0, summary.availableItemsCount());
    }

    @Test
    @DisplayName("Break-even sale yields zero netProfit and zero ROI")
    void calculateFinancialSummary_BreakEvenSale() {
        // Cost: 75 + 25 = 100. Sold: 100. Profit: 0. ROI: 0 / 100 * 100 = 0.0%
        GadgetModel breakEven = createGadget("Switch", new BigDecimal("75.00"), new BigDecimal("25.00"), true, new BigDecimal("100.00"));

        FinancialSummaryDTO summary = gadgetService.calculateFinancialSummary(List.of(breakEven));

        assertEquals(new BigDecimal("0.00"), summary.stockCapital());
        assertEquals(new BigDecimal("0.00"), summary.netProfit());
        assertEquals(0.0, summary.roi());
        assertEquals(1, summary.soldItemsCount());
        assertEquals(0, summary.availableItemsCount());
    }

    @Test
    @DisplayName("Division by zero protection: zero total sold cost basis returns ROI of 0.0")
    void calculateFinancialSummary_ZeroDivisionProtection() {
        // Gifted item: price 0.00, repairCost 0.00, sold for 50.00 -> total sold cost basis = 0.00
        GadgetModel gifted = createGadget("Gifted Tablet", BigDecimal.ZERO, BigDecimal.ZERO, true, new BigDecimal("50.00"));

        FinancialSummaryDTO summary = gadgetService.calculateFinancialSummary(List.of(gifted));

        assertEquals(new BigDecimal("50.00"), summary.netProfit());
        assertEquals(0.0, summary.roi()); // Protected from division by zero
        assertFalse(Double.isNaN(summary.roi()));
        assertFalse(Double.isInfinite(summary.roi()));
    }

    @Test
    @DisplayName("Free acquisition with repair cost computes ROI based on repair cost basis")
    void calculateFinancialSummary_FreeAcquisitionWithRepairCost() {
        // Free item: price 0.00, repairCost 15.00, sold for 65.00 -> cost basis 15.00, profit 50.00 -> ROI = (50/15)*100 = 333.33%
        GadgetModel item = createGadget("Rescued Phone", BigDecimal.ZERO, new BigDecimal("15.00"), true, new BigDecimal("65.00"));

        FinancialSummaryDTO summary = gadgetService.calculateFinancialSummary(List.of(item));

        assertEquals(new BigDecimal("50.00"), summary.netProfit());
        assertEquals(333.33, summary.roi());
    }

    @Test
    @DisplayName("Adding expensive unsold stock strictly segregates inventory and does NOT alter netProfit or ROI")
    void calculateFinancialSummary_InventoryStockSegregation() {
        GadgetModel sold = createGadget("Sold Item", new BigDecimal("100.00"), new BigDecimal("20.00"), true, new BigDecimal("180.00"));
        GadgetModel expensiveUnsold = createGadget("High-End Server", new BigDecimal("2000.00"), new BigDecimal("500.00"), false, null);

        FinancialSummaryDTO summaryBefore = gadgetService.calculateFinancialSummary(List.of(sold));
        FinancialSummaryDTO summaryAfter = gadgetService.calculateFinancialSummary(List.of(sold, expensiveUnsold));

        // Realized metrics must remain 100% unchanged
        assertEquals(summaryBefore.netProfit(), summaryAfter.netProfit());
        assertEquals(summaryBefore.roi(), summaryAfter.roi());
        assertEquals(summaryBefore.soldItemsCount(), summaryAfter.soldItemsCount());

        // Stock capital must reflect the new unsold item
        assertEquals(new BigDecimal("2500.00"), summaryAfter.stockCapital());
        assertEquals(1, summaryAfter.availableItemsCount());
    }

    @Test
    @DisplayName("Ledger accounting identity: netProfit + totalSoldCostBasis == totalSoldRevenue")
    void calculateFinancialSummary_AccountingIdentity() {
        GadgetModel g1 = createGadget("G1", new BigDecimal("100.00"), new BigDecimal("10.00"), true, new BigDecimal("150.00"));
        GadgetModel g2 = createGadget("G2", new BigDecimal("200.00"), new BigDecimal("30.00"), true, new BigDecimal("310.00"));
        GadgetModel g3 = createGadget("G3", new BigDecimal("50.00"), new BigDecimal("10.00"), true, new BigDecimal("40.00")); // loss

        List<GadgetModel> soldList = List.of(g1, g2, g3);
        FinancialSummaryDTO summary = gadgetService.calculateFinancialSummary(soldList);

        BigDecimal totalCostBasis = new BigDecimal("110.00").add(new BigDecimal("230.00")).add(new BigDecimal("60.00")); // 400.00
        BigDecimal totalRevenue = new BigDecimal("150.00").add(new BigDecimal("310.00")).add(new BigDecimal("40.00")); // 500.00
        BigDecimal expectedProfit = totalRevenue.subtract(totalCostBasis); // 100.00

        assertEquals(expectedProfit.setScale(2), summary.netProfit());
        assertEquals(totalRevenue, summary.netProfit().add(totalCostBasis));
    }

    @Test
    @DisplayName("Decimal pennies summation maintains exact arithmetic without floating point drift")
    void calculateFinancialSummary_PenniesSummation() {
        List<GadgetModel> list = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            list.add(createGadget("Penny " + i, new BigDecimal("1.00"), BigDecimal.ZERO, true, new BigDecimal("1.01")));
        }

        FinancialSummaryDTO summary = gadgetService.calculateFinancialSummary(list);

        assertEquals(new BigDecimal("0.10"), summary.netProfit());
        assertEquals(10, summary.soldItemsCount());
    }

    @Test
    @DisplayName("Large values in millions maintain exact arithmetic and scale")
    void calculateFinancialSummary_MillionsValues() {
        GadgetModel unsold = createGadget("Supercomputer", new BigDecimal("5000000.00"), new BigDecimal("500000.00"), false, null);
        GadgetModel sold = createGadget("Enterprise SAN", new BigDecimal("1000000.00"), new BigDecimal("250000.00"), true, new BigDecimal("1500000.00"));

        FinancialSummaryDTO summary = gadgetService.calculateFinancialSummary(List.of(unsold, sold));

        assertEquals(new BigDecimal("5500000.00"), summary.stockCapital());
        assertEquals(new BigDecimal("250000.00"), summary.netProfit());
        // Cost: 1250000. Profit: 250000. ROI: 250000/1250000 * 100 = 20.0%
        assertEquals(20.0, summary.roi());
        assertEquals(1, summary.soldItemsCount());
        assertEquals(1, summary.availableItemsCount());
    }

    @Test
    @DisplayName("getFinancialSummary() delegates to gadgetRepository.findAll()")
    void getFinancialSummary_DelegatesToRepository() {
        GadgetModel unsold = createGadget("Phone", new BigDecimal("200.00"), new BigDecimal("20.00"), false, null);
        when(gadgetRepository.findAll()).thenReturn(List.of(unsold));

        FinancialSummaryDTO summary = gadgetService.getFinancialSummary();

        verify(gadgetRepository, times(1)).findAll();
        assertEquals(new BigDecimal("220.00"), summary.stockCapital());
        assertEquals(1, summary.availableItemsCount());
    }

    @Test
    @DisplayName("calculateMoneySpent returns 0.0f when repository returns null")
    void calculateMoneySpent_NullFromRepository_ReturnsZero() {
        when(gadgetRepository.getTotalSpent()).thenReturn(null);

        Float total = gadgetService.calculateMoneySpent();

        assertEquals(0.0f, total);
    }
}
