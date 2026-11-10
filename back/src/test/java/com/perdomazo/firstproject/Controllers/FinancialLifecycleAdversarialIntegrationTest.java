package com.perdomazo.firstproject.Controllers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.perdomazo.firstproject.Models.GadgetModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Adversarial Empirical Lifecycle and Financial REST API Stress Test Harness.
 * Executed by Challenger M3-2 to verify R3, Features 14-17, and state transition invariants.
 */
@SpringBootTest
@ActiveProfiles("dev")
public class FinancialLifecycleAdversarialIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    private JsonNode getSummary() throws Exception {
        MvcResult res = mockMvc.perform(get("/gadget/finance/summary"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("Challenge 1: Verify GET /gadget/finance/summary schema and baseline consistency")
    void testSummarySchemaAndBaselineConsistency() throws Exception {
        JsonNode summary = getSummary();

        assertTrue(summary.hasNonNull("stockCapital"), "stockCapital must be present and non-null");
        assertTrue(summary.hasNonNull("netProfit"), "netProfit must be present and non-null");
        assertTrue(summary.hasNonNull("roi"), "roi must be present and non-null");
        assertTrue(summary.hasNonNull("soldItemsCount"), "soldItemsCount must be present and non-null");
        assertTrue(summary.hasNonNull("availableItemsCount"), "availableItemsCount must be present and non-null");

        assertTrue(summary.get("stockCapital").isNumber(), "stockCapital must be numeric");
        assertTrue(summary.get("netProfit").isNumber(), "netProfit must be numeric");
        assertTrue(summary.get("roi").isNumber(), "roi must be numeric");
        assertTrue(summary.get("soldItemsCount").isInt(), "soldItemsCount must be integer");
        assertTrue(summary.get("availableItemsCount").isInt(), "availableItemsCount must be integer");

        // Verify counts match /gadget inventory
        MvcResult allRes = mockMvc.perform(get("/gadget"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode allGadgets = objectMapper.readTree(allRes.getResponse().getContentAsString());
        assertTrue(allGadgets.isArray());

        int soldCount = 0;
        int availCount = 0;
        for (JsonNode g : allGadgets) {
            if (g.has("isSold") && g.get("isSold").asBoolean()) {
                soldCount++;
            } else {
                availCount++;
            }
        }

        assertEquals(soldCount, summary.get("soldItemsCount").asInt(), "soldItemsCount must match total sold in inventory");
        assertEquals(availCount, summary.get("availableItemsCount").asInt(), "availableItemsCount must match total unsold in inventory");
        assertEquals(allGadgets.size(), soldCount + availCount, "Total items must equal sold + available");
    }

    @Test
    @DisplayName("Challenge 2: Full Lifecycle Roundtrip — Add Unsold -> Sell -> Customer Return (Reversal) -> Delete")
    void testFullLifecycleRoundtrip_Add_Sell_Return_Delete() throws Exception {
        JsonNode baseline = getSummary();
        BigDecimal baseStock = BigDecimal.valueOf(baseline.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal baseProfit = BigDecimal.valueOf(baseline.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP);
        double baseRoi = baseline.get("roi").asDouble();
        int baseSold = baseline.get("soldItemsCount").asInt();
        int baseAvail = baseline.get("availableItemsCount").asInt();

        // 1. Add new unsold item: price = $250.00, repairCost = $50.00 -> total cost = $300.00
        GadgetModel gadget = new GadgetModel();
        gadget.setName("Adversarial Lifecycle Item");
        gadget.setModel("ADV-01");
        gadget.setPrice(new BigDecimal("250.00"));
        gadget.setRepairCost(new BigDecimal("50.00"));
        gadget.setIsSold(false);

        MvcResult postRes = mockMvc.perform(post("/gadget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(gadget)))
                .andExpect(status().isCreated())
                .andReturn();

        GadgetModel created = objectMapper.readValue(postRes.getResponse().getContentAsString(), GadgetModel.class);
        Long id = created.getId();
        assertNotNull(id);

        try {
            // VERIFICATION 1: stockCapital increases by price + repairCost ($300.00), netProfit & roi 100% UNCHANGED
            JsonNode afterAdd = getSummary();
            assertEquals(baseStock.add(new BigDecimal("300.00")),
                    BigDecimal.valueOf(afterAdd.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP));
            assertEquals(baseProfit,
                    BigDecimal.valueOf(afterAdd.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP),
                    "netProfit MUST remain 100% unchanged upon adding unsold stock");
            assertEquals(baseRoi, afterAdd.get("roi").asDouble(), 0.001,
                    "roi MUST remain 100% unchanged upon adding unsold stock");
            assertEquals(baseSold, afterAdd.get("soldItemsCount").asInt());
            assertEquals(baseAvail + 1, afterAdd.get("availableItemsCount").asInt());

            // 2. Mark item sold: soldPrice = $480.00 (profit = 480 - 300 = +180.00)
            created.setIsSold(true);
            created.setSoldPrice(new BigDecimal("480.00"));

            mockMvc.perform(put("/gadget/" + id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(created)))
                    .andExpect(status().isOk());

            // VERIFICATION 2: stockCapital decreases by $300.00, netProfit increases by $180.00
            JsonNode afterSale = getSummary();
            assertEquals(baseStock,
                    BigDecimal.valueOf(afterSale.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP),
                    "stockCapital must drop back to baseline when item leaves available inventory");
            assertEquals(baseProfit.add(new BigDecimal("180.00")),
                    BigDecimal.valueOf(afterSale.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP),
                    "netProfit must increase by exact realized profit");
            assertEquals(baseSold + 1, afterSale.get("soldItemsCount").asInt());
            assertEquals(baseAvail, afterSale.get("availableItemsCount").asInt());
            assertTrue(afterSale.get("roi").asDouble() > 0.0, "roi must be strictly positive");

            // 3. Customer Return / Sale Reversal: transition from isSold=true back to isSold=false
            created.setIsSold(false);
            created.setSoldPrice(null);
            created.setSoldDate(null);

            mockMvc.perform(put("/gadget/" + id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(created)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.isSold", is(false)))
                    .andExpect(jsonPath("$.soldPrice", nullValue()))
                    .andExpect(jsonPath("$.soldDate", nullValue()));

            // VERIFICATION 3: Symmetry — counts and profit revert back exactly to afterAdd state
            JsonNode afterReturn = getSummary();
            assertEquals(baseStock.add(new BigDecimal("300.00")),
                    BigDecimal.valueOf(afterReturn.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP),
                    "Returned item must restore stockCapital");
            assertEquals(baseProfit,
                    BigDecimal.valueOf(afterReturn.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP),
                    "Customer return must cleanly revert netProfit to baseline");
            assertEquals(baseRoi, afterReturn.get("roi").asDouble(), 0.001,
                    "Customer return must cleanly revert roi to baseline");
            assertEquals(baseSold, afterReturn.get("soldItemsCount").asInt(),
                    "soldItemsCount must decrement upon customer return");
            assertEquals(baseAvail + 1, afterReturn.get("availableItemsCount").asInt(),
                    "availableItemsCount must increment upon customer return");

        } finally {
            // 4. Deleting unsold item decrements stockCapital with 0 impact on netProfit
            mockMvc.perform(delete("/gadget/delete/" + id))
                    .andExpect(status().isOk());

            JsonNode afterDelete = getSummary();
            assertEquals(baseStock,
                    BigDecimal.valueOf(afterDelete.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP),
                    "Deleting unsold item must decrement stockCapital back to baseline");
            assertEquals(baseProfit,
                    BigDecimal.valueOf(afterDelete.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP),
                    "Deleting unsold item must have ZERO impact on netProfit");
            assertEquals(baseRoi, afterDelete.get("roi").asDouble(), 0.001,
                    "Deleting unsold item must have ZERO impact on roi");
            assertEquals(baseSold, afterDelete.get("soldItemsCount").asInt());
            assertEquals(baseAvail, afterDelete.get("availableItemsCount").asInt());
        }
    }

    @Test
    @DisplayName("Challenge 3: Sale at Loss and Reversal Symmetry")
    void testSaleAtLossAndReversalSymmetry() throws Exception {
        JsonNode baseline = getSummary();
        BigDecimal baseStock = BigDecimal.valueOf(baseline.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal baseProfit = BigDecimal.valueOf(baseline.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP);
        double baseRoi = baseline.get("roi").asDouble();

        // Create item: price = 120.00, repairCost = 30.00 (cost = 150.00)
        GadgetModel gadget = new GadgetModel();
        gadget.setName("Loss Reversal Item");
        gadget.setPrice(new BigDecimal("120.00"));
        gadget.setRepairCost(new BigDecimal("30.00"));
        gadget.setIsSold(false);

        MvcResult postRes = mockMvc.perform(post("/gadget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(gadget)))
                .andExpect(status().isCreated())
                .andReturn();

        GadgetModel created = objectMapper.readValue(postRes.getResponse().getContentAsString(), GadgetModel.class);
        Long id = created.getId();

        try {
            // Sell at loss: soldPrice = 80.00 -> loss of 70.00
            created.setIsSold(true);
            created.setSoldPrice(new BigDecimal("80.00"));

            mockMvc.perform(put("/gadget/" + id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(created)))
                    .andExpect(status().isOk());

            JsonNode afterLoss = getSummary();
            assertEquals(baseProfit.subtract(new BigDecimal("70.00")),
                    BigDecimal.valueOf(afterLoss.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP));

            // Reverse sale (return item to inventory)
            created.setIsSold(false);
            created.setSoldPrice(null);
            created.setSoldDate(null);

            mockMvc.perform(put("/gadget/" + id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(created)))
                    .andExpect(status().isOk());

            JsonNode afterReturn = getSummary();
            // Net profit must recover by 70.00 back to baseline
            assertEquals(baseProfit,
                    BigDecimal.valueOf(afterReturn.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP));
            assertEquals(baseStock.add(new BigDecimal("150.00")),
                    BigDecimal.valueOf(afterReturn.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP));
            assertEquals(baseRoi, afterReturn.get("roi").asDouble(), 0.001);

        } finally {
            mockMvc.perform(delete("/gadget/delete/" + id))
                    .andExpect(status().isOk());
        }
    }

    @Test
    @DisplayName("Challenge 4: HTTP 405 Method Not Allowed on non-GET /gadget/finance/summary")
    void testFinanceSummary_NonGetMethods_ReturnMethodNotAllowed() throws Exception {
        // POST
        mockMvc.perform(post("/gadget/finance/summary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"stockCapital\": 999}"))
                .andExpect(status().isMethodNotAllowed());

        // PUT
        mockMvc.perform(put("/gadget/finance/summary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"stockCapital\": 999}"))
                .andExpect(status().isMethodNotAllowed());

        // DELETE
        mockMvc.perform(delete("/gadget/finance/summary"))
                .andExpect(status().isMethodNotAllowed());

        // PATCH
        mockMvc.perform(patch("/gadget/finance/summary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"stockCapital\": 999}"))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    @DisplayName("Challenge 5: Multi-Item Interleaved Transitions Stress Test")
    void testMultiItemInterleavedTransitionsStress() throws Exception {
        JsonNode baseline = getSummary();
        BigDecimal baseStock = BigDecimal.valueOf(baseline.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal baseProfit = BigDecimal.valueOf(baseline.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP);
        int baseSold = baseline.get("soldItemsCount").asInt();
        int baseAvail = baseline.get("availableItemsCount").asInt();

        // Create 3 items:
        // Item A: price 100, repair 10 (cost 110)
        // Item B: price 200, repair 20 (cost 220)
        // Item C: price 300, repair 30 (cost 330)
        GadgetModel a = createAndSave("Item A", new BigDecimal("100.00"), new BigDecimal("10.00"));
        GadgetModel b = createAndSave("Item B", new BigDecimal("200.00"), new BigDecimal("20.00"));
        GadgetModel c = createAndSave("Item C", new BigDecimal("300.00"), new BigDecimal("30.00"));

        try {
            // Added 3 items: stockCapital += 110 + 220 + 330 = 660.00
            JsonNode s1 = getSummary();
            assertEquals(baseStock.add(new BigDecimal("660.00")),
                    BigDecimal.valueOf(s1.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP));
            assertEquals(baseProfit,
                    BigDecimal.valueOf(s1.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP));
            assertEquals(baseAvail + 3, s1.get("availableItemsCount").asInt());

            // Sell Item A for 160 (profit = +50, cost basis +110)
            a.setIsSold(true);
            a.setSoldPrice(new BigDecimal("160.00"));
            updateGadget(a);

            // Sell Item B for 200 (loss = -20, cost basis +220)
            b.setIsSold(true);
            b.setSoldPrice(new BigDecimal("200.00"));
            updateGadget(b);

            // Item C remains unsold (stockCapital = baseStock + 330)
            // Total profit delta = +50 - 20 = +30
            JsonNode s2 = getSummary();
            assertEquals(baseStock.add(new BigDecimal("330.00")),
                    BigDecimal.valueOf(s2.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP));
            assertEquals(baseProfit.add(new BigDecimal("30.00")),
                    BigDecimal.valueOf(s2.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP));
            assertEquals(baseSold + 2, s2.get("soldItemsCount").asInt());
            assertEquals(baseAvail + 1, s2.get("availableItemsCount").asInt());

            // Reverse Item B sale (customer return)
            b.setIsSold(false);
            b.setSoldPrice(null);
            b.setSoldDate(null);
            updateGadget(b);

            // Profit delta is now just +50 (from Item A)
            // Stock capital is baseStock + 330 (C) + 220 (B) = baseStock + 550
            JsonNode s3 = getSummary();
            assertEquals(baseStock.add(new BigDecimal("550.00")),
                    BigDecimal.valueOf(s3.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP));
            assertEquals(baseProfit.add(new BigDecimal("50.00")),
                    BigDecimal.valueOf(s3.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP));
            assertEquals(baseSold + 1, s3.get("soldItemsCount").asInt());
            assertEquals(baseAvail + 2, s3.get("availableItemsCount").asInt());

        } finally {
            // Delete all 3
            deleteGadget(a.getId());
            deleteGadget(b.getId());
            deleteGadget(c.getId());

            // Verify clean return to baseline
            JsonNode finalSummary = getSummary();
            assertEquals(baseStock,
                    BigDecimal.valueOf(finalSummary.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP));
            assertEquals(baseProfit,
                    BigDecimal.valueOf(finalSummary.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP));
            assertEquals(baseSold, finalSummary.get("soldItemsCount").asInt());
            assertEquals(baseAvail, finalSummary.get("availableItemsCount").asInt());
        }
    }

    @Test
    @DisplayName("Challenge 6: Direct Creation as Sold via POST /gadget")
    void testDirectCreationAsSold() throws Exception {
        JsonNode baseline = getSummary();
        BigDecimal baseStock = BigDecimal.valueOf(baseline.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal baseProfit = BigDecimal.valueOf(baseline.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP);
        int baseSold = baseline.get("soldItemsCount").asInt();
        int baseAvail = baseline.get("availableItemsCount").asInt();

        GadgetModel soldGadget = new GadgetModel();
        soldGadget.setName("Direct Sold Item");
        soldGadget.setPrice(new BigDecimal("70.00"));
        soldGadget.setRepairCost(new BigDecimal("30.00")); // total cost 100.00
        soldGadget.setIsSold(true);
        soldGadget.setSoldPrice(new BigDecimal("150.00")); // profit = 50.00

        MvcResult res = mockMvc.perform(post("/gadget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(soldGadget)))
                .andExpect(status().isCreated())
                .andReturn();

        GadgetModel created = objectMapper.readValue(res.getResponse().getContentAsString(), GadgetModel.class);
        Long id = created.getId();

        try {
            JsonNode afterCreate = getSummary();
            // stockCapital must NOT increase because item was created sold
            assertEquals(baseStock,
                    BigDecimal.valueOf(afterCreate.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP));
            // netProfit increases by 50.00
            assertEquals(baseProfit.add(new BigDecimal("50.00")),
                    BigDecimal.valueOf(afterCreate.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP));
            assertEquals(baseSold + 1, afterCreate.get("soldItemsCount").asInt());
            assertEquals(baseAvail, afterCreate.get("availableItemsCount").asInt());
        } finally {
            deleteGadget(id);
        }
    }

    @Test
    @DisplayName("Challenge 7: Post-Sale Price Adjustment via PUT /gadget/{id}")
    void testPostSalePriceAdjustment() throws Exception {
        JsonNode baseline = getSummary();
        BigDecimal baseProfit = BigDecimal.valueOf(baseline.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP);

        GadgetModel item = createAndSave("Adjustment Item", new BigDecimal("100.00"), new BigDecimal("0.00"));
        Long id = item.getId();

        try {
            // Sell for 150 (profit 50)
            item.setIsSold(true);
            item.setSoldPrice(new BigDecimal("150.00"));
            updateGadget(item);

            JsonNode s1 = getSummary();
            assertEquals(baseProfit.add(new BigDecimal("50.00")),
                    BigDecimal.valueOf(s1.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP));

            // Retroactive adjustment: customer was given a partial refund of 20, so soldPrice is now 130 (profit 30)
            item.setSoldPrice(new BigDecimal("130.00"));
            updateGadget(item);

            JsonNode s2 = getSummary();
            assertEquals(baseProfit.add(new BigDecimal("30.00")),
                    BigDecimal.valueOf(s2.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP));

        } finally {
            deleteGadget(id);
        }
    }

    @Test
    @DisplayName("Challenge 8: Late Repair Cost Incurred on Already-Sold Item")
    void testLateRepairCostOnSoldItem() throws Exception {
        JsonNode baseline = getSummary();
        BigDecimal baseProfit = BigDecimal.valueOf(baseline.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP);

        GadgetModel item = createAndSave("Warranty Repair Item", new BigDecimal("100.00"), new BigDecimal("0.00"));
        Long id = item.getId();

        try {
            // Sell for 160 (profit 60)
            item.setIsSold(true);
            item.setSoldPrice(new BigDecimal("160.00"));
            updateGadget(item);

            JsonNode s1 = getSummary();
            assertEquals(baseProfit.add(new BigDecimal("60.00")),
                    BigDecimal.valueOf(s1.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP));

            // Seller pays $25 for warranty repair on already sold item: repairCost becomes 25
            item.setRepairCost(new BigDecimal("25.00"));
            updateGadget(item);

            JsonNode s2 = getSummary();
            // Profit is now 160 - (100 + 25) = 35. Delta is +35 from baseline
            assertEquals(baseProfit.add(new BigDecimal("35.00")),
                    BigDecimal.valueOf(s2.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP));

        } finally {
            deleteGadget(id);
        }
    }

    @Test
    @DisplayName("Challenge 9: Repair Cost Increase on Unsold Item Updates Stock Capital With Zero Profit Impact")
    void testRepairCostIncreaseOnUnsoldItem() throws Exception {
        JsonNode baseline = getSummary();
        BigDecimal baseStock = BigDecimal.valueOf(baseline.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal baseProfit = BigDecimal.valueOf(baseline.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP);
        double baseRoi = baseline.get("roi").asDouble();

        GadgetModel item = createAndSave("Refurbishing Item", new BigDecimal("200.00"), new BigDecimal("10.00"));
        Long id = item.getId();

        try {
            JsonNode s1 = getSummary();
            assertEquals(baseStock.add(new BigDecimal("210.00")),
                    BigDecimal.valueOf(s1.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP));
            assertEquals(baseProfit,
                    BigDecimal.valueOf(s1.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP));
            assertEquals(baseRoi, s1.get("roi").asDouble(), 0.001);

            // Additional refurbishment parts added: repairCost goes from 10 to 60 (+50)
            item.setRepairCost(new BigDecimal("60.00"));
            updateGadget(item);

            JsonNode s2 = getSummary();
            assertEquals(baseStock.add(new BigDecimal("260.00")),
                    BigDecimal.valueOf(s2.get("stockCapital").asDouble()).setScale(2, RoundingMode.HALF_UP));
            assertEquals(baseProfit,
                    BigDecimal.valueOf(s2.get("netProfit").asDouble()).setScale(2, RoundingMode.HALF_UP),
                    "Refurbishment expense on unsold inventory must NOT decrease realized profit");
            assertEquals(baseRoi, s2.get("roi").asDouble(), 0.001,
                    "Refurbishment expense on unsold inventory must NOT alter realized ROI");

        } finally {
            deleteGadget(id);
        }
    }

    private GadgetModel createAndSave(String name, BigDecimal price, BigDecimal repairCost) throws Exception {
        GadgetModel gadget = new GadgetModel();
        gadget.setName(name);
        gadget.setPrice(price);
        gadget.setRepairCost(repairCost);
        gadget.setIsSold(false);

        MvcResult res = mockMvc.perform(post("/gadget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(gadget)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readValue(res.getResponse().getContentAsString(), GadgetModel.class);
    }

    private void updateGadget(GadgetModel gadget) throws Exception {
        mockMvc.perform(put("/gadget/" + gadget.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(gadget)))
                .andExpect(status().isOk());
    }

    private void deleteGadget(Long id) throws Exception {
        if (id != null) {
            mockMvc.perform(delete("/gadget/delete/" + id))
                    .andExpect(status().isOk());
        }
    }
}
