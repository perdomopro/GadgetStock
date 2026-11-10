package com.perdomazo.firstproject.config;

import com.perdomazo.firstproject.Models.GadgetModel;
import com.perdomazo.firstproject.Repositories.GadgetRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
class DataSeederIntegrationTest {

    @Autowired
    private GadgetRepository gadgetRepository;

    @Autowired
    private DataSeeder dataSeeder;

    @Test
    void testInitialSeedCountAndDistribution() {
        // Assert initial seed populated 8 records
        assertEquals(8, gadgetRepository.count(), "DataSeeder should seed exactly 8 gadgets on startup");

        // Assert sold items count
        List<GadgetModel> soldItems = gadgetRepository.findByIsSoldTrue();
        assertEquals(4, soldItems.size(), "There should be 4 sold items in the seed dataset");

        // Assert available items
        List<GadgetModel> allItems = gadgetRepository.findAll();
        long availableCount = allItems.stream().filter(g -> Boolean.FALSE.equals(g.getIsSold())).count();
        assertEquals(4, availableCount, "There should be 4 available items in the seed dataset");
    }

    @Test
    void testIdempotencyOnSubsequentRun() throws Exception {
        long countBefore = gadgetRepository.count();
        assertTrue(countBefore > 0, "Database should already contain seed data");

        // Run dataSeeder again
        dataSeeder.run();

        // Assert count did not change
        long countAfter = gadgetRepository.count();
        assertEquals(countBefore, countAfter, "Re-running DataSeeder on non-empty DB must not create duplicates");
    }

    @Test
    void testSeededM2Fields() {
        List<GadgetModel> allItems = gadgetRepository.findAll();
        GadgetModel iphone = allItems.stream()
                .filter(g -> "iPhone 13".equals(g.getName()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("iPhone 13 not found in seeded data"));

        assertEquals("Smartphones", iphone.getCategory(), "Category should be populated on seeded items");
        assertEquals(0, new BigDecimal("45.00").compareTo(iphone.getRepairCost()), "RepairCost should be populated on seeded items");
        assertEquals(0, new BigDecimal("450.00").compareTo(iphone.getListedPrice()), "ListedPrice should be populated on seeded items");

        GadgetModel macbook = allItems.stream()
                .filter(g -> "MacBook Air M1".equals(g.getName()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("MacBook Air M1 not found in seeded data"));

        assertEquals("Laptops", macbook.getCategory());
        assertEquals(0, BigDecimal.ZERO.compareTo(macbook.getRepairCost()));
        assertEquals(0, new BigDecimal("680.00").compareTo(macbook.getListedPrice()));
    }
}
