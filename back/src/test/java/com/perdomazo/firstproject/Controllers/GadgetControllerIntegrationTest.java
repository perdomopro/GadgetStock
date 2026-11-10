package com.perdomazo.firstproject.Controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perdomazo.firstproject.Models.GadgetModel;
import org.junit.jupiter.api.BeforeEach;
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

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("dev")
public class GadgetControllerIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    @Test
    void testGetAllGadgets_Success() throws Exception {
        mockMvc.perform(get("/gadget"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", isA(java.util.List.class)))
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(8)))
                .andExpect(jsonPath("$[0].category", notNullValue()))
                .andExpect(jsonPath("$[0].repairCost", notNullValue()));
    }

    @Test
    void testGetGadgetById_Success() throws Exception {
        mockMvc.perform(get("/gadget/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.name", is("iPhone 13")))
                .andExpect(jsonPath("$.category", is("Smartphones")))
                .andExpect(jsonPath("$.repairCost", is(45.0)))
                .andExpect(jsonPath("$.listedPrice", is(450.0)));
    }

    @Test
    void testGetGadgetById_NotFound() throws Exception {
        mockMvc.perform(get("/gadget/9999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.message", containsString("9999999")))
                .andExpect(jsonPath("$.path", is("/gadget/9999999")))
                .andExpect(jsonPath("$.timestamp", notNullValue()));
    }

    @Test
    void testPostGadget_Success() throws Exception {
        GadgetModel gadget = new GadgetModel();
        gadget.setName("Test Pixel 7");
        gadget.setModel("128GB Obsidian");
        gadget.setCategory("Smartphones");
        gadget.setPrice(new BigDecimal("220.00"));
        gadget.setRepairCost(new BigDecimal("15.00"));
        gadget.setListedPrice(new BigDecimal("310.00"));
        gadget.setComments("Minor scratch on frame");
        gadget.setRepair(true);

        MvcResult result = mockMvc.perform(post("/gadget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(gadget)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name", is("Test Pixel 7")))
                .andExpect(jsonPath("$.category", is("Smartphones")))
                .andExpect(jsonPath("$.repairCost", is(15.0)))
                .andExpect(jsonPath("$.listedPrice", is(310.0)))
                .andReturn();

        GadgetModel created = objectMapper.readValue(result.getResponse().getContentAsString(), GadgetModel.class);
        assertNotNull(created.getId());

        // Cleanup
        mockMvc.perform(delete("/gadget/delete/" + created.getId()))
                .andExpect(status().isOk());
    }

    @Test
    void testPostGadget_DefaultRepairCostAndCategory() throws Exception {
        GadgetModel gadget = new GadgetModel();
        gadget.setName("Unlisted Gadget Without Defaults");
        gadget.setPrice(new BigDecimal("99.99"));

        MvcResult result = mockMvc.perform(post("/gadget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(gadget)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category", is("")))
                .andExpect(jsonPath("$.repairCost", either(is(0)).or(is(0.0))))
                .andExpect(jsonPath("$.listedPrice", nullValue()))
                .andReturn();

        GadgetModel created = objectMapper.readValue(result.getResponse().getContentAsString(), GadgetModel.class);

        // Cleanup
        mockMvc.perform(delete("/gadget/delete/" + created.getId()))
                .andExpect(status().isOk());
    }

    @Test
    void testPostGadget_ValidationFailure_BlankName() throws Exception {
        GadgetModel gadget = new GadgetModel();
        gadget.setName("");
        gadget.setPrice(new BigDecimal("50.00"));

        mockMvc.perform(post("/gadget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(gadget)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")))
                .andExpect(jsonPath("$.message", containsStringIgnoringCase("blank")))
                .andExpect(jsonPath("$.path", is("/gadget")));
    }

    @Test
    void testPostGadget_ValidationFailure_NegativePrice() throws Exception {
        GadgetModel gadget = new GadgetModel();
        gadget.setName("Negative Price Test");
        gadget.setPrice(new BigDecimal("-50.00"));

        mockMvc.perform(post("/gadget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(gadget)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")));
    }

    @Test
    void testPostGadget_ValidationFailure_NegativeRepairCost() throws Exception {
        GadgetModel gadget = new GadgetModel();
        gadget.setName("Negative Repair Test");
        gadget.setPrice(new BigDecimal("50.00"));
        gadget.setRepairCost(new BigDecimal("-10.00"));

        mockMvc.perform(post("/gadget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(gadget)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")));
    }

    @Test
    void testPostGadget_ValidationFailure_NegativeListedPrice() throws Exception {
        GadgetModel gadget = new GadgetModel();
        gadget.setName("Negative Listed Price Test");
        gadget.setPrice(new BigDecimal("50.00"));
        gadget.setListedPrice(new BigDecimal("-15.00"));

        mockMvc.perform(post("/gadget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(gadget)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")));
    }

    @Test
    void testPutGadget_FullUpdateSuccess() throws Exception {
        // Create an item to update
        GadgetModel gadget = new GadgetModel();
        gadget.setName("Pre-Update Item");
        gadget.setModel("Old Model");
        gadget.setCategory("Old Category");
        gadget.setPrice(new BigDecimal("100.00"));
        gadget.setRepairCost(new BigDecimal("10.00"));
        gadget.setListedPrice(new BigDecimal("150.00"));

        MvcResult createResult = mockMvc.perform(post("/gadget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(gadget)))
                .andExpect(status().isCreated())
                .andReturn();

        GadgetModel created = objectMapper.readValue(createResult.getResponse().getContentAsString(), GadgetModel.class);
        Long id = created.getId();

        // Perform full PUT update
        created.setName("Post-Update Item");
        created.setModel("New Model");
        created.setCategory("Smartphones");
        created.setPrice(new BigDecimal("120.00"));
        created.setRepairCost(new BigDecimal("25.00"));
        created.setListedPrice(new BigDecimal("190.00"));
        created.setComments("Updated comments");
        created.setRepair(true);

        mockMvc.perform(put("/gadget/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(created)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Post-Update Item")))
                .andExpect(jsonPath("$.model", is("New Model")))
                .andExpect(jsonPath("$.category", is("Smartphones")))
                .andExpect(jsonPath("$.price", is(120.0)))
                .andExpect(jsonPath("$.repairCost", is(25.0)))
                .andExpect(jsonPath("$.listedPrice", is(190.0)))
                .andExpect(jsonPath("$.comments", is("Updated comments")))
                .andExpect(jsonPath("$.repair", is(true)));

        // Cleanup
        mockMvc.perform(delete("/gadget/delete/" + id))
                .andExpect(status().isOk());
    }

    @Test
    void testPutGadget_MarkSoldAndAutoSetSoldDate() throws Exception {
        GadgetModel gadget = new GadgetModel();
        gadget.setName("Sale Item");
        gadget.setPrice(new BigDecimal("80.00"));

        MvcResult createResult = mockMvc.perform(post("/gadget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(gadget)))
                .andExpect(status().isCreated())
                .andReturn();

        GadgetModel created = objectMapper.readValue(createResult.getResponse().getContentAsString(), GadgetModel.class);
        Long id = created.getId();

        // Mark as sold without specifying soldDate
        created.setIsSold(true);
        created.setSoldPrice(new BigDecimal("120.00"));
        created.setSoldDate(null);

        mockMvc.perform(put("/gadget/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(created)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isSold", is(true)))
                .andExpect(jsonPath("$.soldPrice", is(120.0)))
                .andExpect(jsonPath("$.soldDate", notNullValue()));

        // Unmark sale: transition back to unsold
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

        // Cleanup
        mockMvc.perform(delete("/gadget/delete/" + id))
                .andExpect(status().isOk());
    }

    @Test
    void testPutGadget_SoldWithoutSoldPrice_ReturnsBadRequest() throws Exception {
        GadgetModel update = new GadgetModel();
        update.setName("iPhone 13");
        update.setPrice(new BigDecimal("300.00"));
        update.setIsSold(true);
        update.setSoldPrice(null);

        mockMvc.perform(put("/gadget/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")))
                .andExpect(jsonPath("$.message", containsStringIgnoringCase("sold price")));
    }

    @Test
    void testPutGadget_SoldWithZeroSoldPrice_ReturnsBadRequest() throws Exception {
        GadgetModel update = new GadgetModel();
        update.setName("iPhone 13");
        update.setPrice(new BigDecimal("300.00"));
        update.setIsSold(true);
        update.setSoldPrice(BigDecimal.ZERO);

        mockMvc.perform(put("/gadget/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsStringIgnoringCase("sold price")));
    }

    @Test
    void testPutGadget_NotFound() throws Exception {
        GadgetModel update = new GadgetModel();
        update.setName("Ghost Item");
        update.setPrice(new BigDecimal("50.00"));

        mockMvc.perform(put("/gadget/9999999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.path", is("/gadget/9999999")));
    }

    @Test
    void testDeleteGadget_NotFound() throws Exception {
        mockMvc.perform(delete("/gadget/delete/9999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.path", is("/gadget/delete/9999999")));
    }

    @Test
    void testFindByName_SubstringAndCaseInsensitive() throws Exception {
        mockMvc.perform(get("/gadget/find").param("name", "iphone"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)))
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$[0].name", containsStringIgnoringCase("iPhone")));
    }

    @Test
    void testFindByName_WithoutParam() throws Exception {
        mockMvc.perform(get("/gadget/find"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)));
    }

    @Test
    void testFindByName_NoMatchReturnsEmptyArray() throws Exception {
        mockMvc.perform(get("/gadget/find").param("name", "NonExistentTermXYZ12345"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", empty()));
    }

    @Test
    void testMalformedJson_ReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/gadget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"name\": \"unclosed json string"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")));
    }

    @Test
    void testTypeMismatch_ReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/gadget/not-a-number"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")));
    }

    @Test
    void testUnknownSubRoute_ReturnsNotFound() throws Exception {
        mockMvc.perform(get("/gadget/nonexistent/subpath"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")));
    }

    @Test
    void testGetFinancialSummary_Success() throws Exception {
        mockMvc.perform(get("/gadget/finance/summary"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.stockCapital", is(1155.0)))
                .andExpect(jsonPath("$.netProfit", is(235.0)))
                .andExpect(jsonPath("$.roi", is(34.56)))
                .andExpect(jsonPath("$.soldItemsCount", is(4)))
                .andExpect(jsonPath("$.availableItemsCount", is(4)));
    }

    @Test
    void testGetFinancialSummary_AddingUnsoldItem_IncrementsStockCapitalAndCount_LeavesProfitAndRoiUnchanged() throws Exception {
        // Step 1: Add new unsold item ($200 price + $50 repairCost = $250 addition)
        GadgetModel newGadget = new GadgetModel();
        newGadget.setName("Temporary Inventory Addition");
        newGadget.setPrice(new BigDecimal("200.00"));
        newGadget.setRepairCost(new BigDecimal("50.00"));
        newGadget.setIsSold(false);

        MvcResult postResult = mockMvc.perform(post("/gadget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newGadget)))
                .andExpect(status().isCreated())
                .andReturn();

        GadgetModel created = objectMapper.readValue(postResult.getResponse().getContentAsString(), GadgetModel.class);
        Long id = created.getId();

        try {
            // Step 2: Verify stockCapital increased by 250, available count by 1, profit and roi 100% unchanged
            mockMvc.perform(get("/gadget/finance/summary"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.stockCapital", is(1405.0)))
                    .andExpect(jsonPath("$.netProfit", is(235.0)))
                    .andExpect(jsonPath("$.roi", is(34.56)))
                    .andExpect(jsonPath("$.soldItemsCount", is(4)))
                    .andExpect(jsonPath("$.availableItemsCount", is(5)));
        } finally {
            // Step 3: Cleanup and verify restoration of original ledger
            mockMvc.perform(delete("/gadget/delete/" + id))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/gadget/finance/summary"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.stockCapital", is(1155.0)))
                    .andExpect(jsonPath("$.availableItemsCount", is(4)));
        }
    }

    @Test
    void testGetFinancialSummary_MarkingItemSold_DecrementsStockCapital_UpdatesProfitAndRoi() throws Exception {
        // Step 1: Create an unsold gadget ($100 price + $20 repair = $120 cost)
        GadgetModel gadget = new GadgetModel();
        gadget.setName("Transition Test Gadget");
        gadget.setPrice(new BigDecimal("100.00"));
        gadget.setRepairCost(new BigDecimal("20.00"));
        gadget.setIsSold(false);

        MvcResult postResult = mockMvc.perform(post("/gadget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(gadget)))
                .andExpect(status().isCreated())
                .andReturn();

        GadgetModel created = objectMapper.readValue(postResult.getResponse().getContentAsString(), GadgetModel.class);
        Long id = created.getId();

        try {
            // Step 2: Mark as sold for $180.00 (profit = 180 - 120 = $60.00)
            created.setIsSold(true);
            created.setSoldPrice(new BigDecimal("180.00"));

            mockMvc.perform(put("/gadget/" + id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(created)))
                    .andExpect(status().isOk());

            // Baseline profit was 235.0 -> new profit = 235.0 + 60.0 = 295.0
            // Baseline sold cost was 680.0 -> new sold cost = 680.0 + 120.0 = 800.0
            // New ROI = (295.0 * 100) / 800.0 = 36.875 -> 36.88%
            // Stock capital drops back to baseline 1155.0
            mockMvc.perform(get("/gadget/finance/summary"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.stockCapital", is(1155.0)))
                    .andExpect(jsonPath("$.netProfit", is(295.0)))
                    .andExpect(jsonPath("$.roi", is(36.88)))
                    .andExpect(jsonPath("$.soldItemsCount", is(5)))
                    .andExpect(jsonPath("$.availableItemsCount", is(4)));
        } finally {
            // Cleanup
            mockMvc.perform(delete("/gadget/delete/" + id))
                    .andExpect(status().isOk());
        }
    }

    @Test
    void testGetFinancialSummary_MethodNotAllowed_Post() throws Exception {
        mockMvc.perform(post("/gadget/finance/summary"))
                .andExpect(status().isMethodNotAllowed());
    }
}
