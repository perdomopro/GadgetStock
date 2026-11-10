// tier1_features/f14_to_f17_financial_engine.test.js
// Tests for Features 14 through 17: Net Profit, ROI %, Stock Capital, Financial Summary Endpoint

export function register(suite) {
  // =========================================================================
  // Feature 14: Net Profit Calculation
  // =========================================================================
  suite.test({
    id: 'F14_T1',
    tier: 1,
    feature: 'F14',
    name: 'F14: Verifies Net Profit calculation formula strictly includes only sold items',
    requiresServer: false,
    fn: async ({ assert, assertions }) => {
      // Unit math contract verification:
      // Item 1 (Sold): price 100, repairCost 20, soldPrice 180 => profit = 60
      // Item 2 (Sold): price 50, repairCost 10, soldPrice 40 => profit = -20
      // Item 3 (Unsold): price 500, repairCost 100, soldPrice null => MUST NOT BE INCLUDED!
      const items = [
        { isSold: true, price: 100.0, repairCost: 20.0, soldPrice: 180.0 },
        { isSold: true, price: 50.0, repairCost: 10.0, soldPrice: 40.0 },
        { isSold: false, price: 500.0, repairCost: 100.0, soldPrice: null },
      ];
      const netProfit = items
        .filter((i) => i.isSold)
        .reduce((acc, i) => acc + (i.soldPrice - (i.price + i.repairCost)), 0);
      assertions.assertCloseTo(netProfit, 40.0, 0.001);
    },
  });

  suite.test({
    id: 'F14_T2',
    tier: 1,
    feature: 'F14',
    name: 'F14: Verifies live Net Profit increases when profitable item is sold',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const initialSummary = await apiClient.getFinancialSummary();
      assertions.assertStatus(initialSummary, 200);
      const initialProfit = initialSummary.data.netProfit;

      const created = await apiClient.createGadget({
        name: 'Profit Delta Test',
        model: 'F14',
        price: 100.0,
        repairCost: 30.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      // Sell for 200. Profit delta should be 200 - (100 + 30) = +70
      const sold = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: 200.0,
      });
      assertions.assertStatus(sold, 200);

      const updatedSummary = await apiClient.getFinancialSummary();
      assertions.assertStatus(updatedSummary, 200);
      assertions.assertCloseTo(updatedSummary.data.netProfit, initialProfit + 70.0, 0.05);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F14_T3',
    tier: 1,
    feature: 'F14',
    name: 'F14: Verifies adding expensive unsold stock does NOT decrease Net Profit',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const beforeSummary = await apiClient.getFinancialSummary();
      assertions.assertStatus(beforeSummary, 200);

      const expensive = await apiClient.createGadget({
        name: 'Expensive Unsold Drone',
        model: 'Phantom',
        price: 2000.0,
        repairCost: 500.0,
        isSold: false,
      });
      assertions.assertStatus(expensive, 201);

      const afterSummary = await apiClient.getFinancialSummary();
      assertions.assertStatus(afterSummary, 200);
      assertions.assertCloseTo(afterSummary.data.netProfit, beforeSummary.data.netProfit, 0.01);

      await apiClient.deleteGadget(expensive.data.id);
    },
  });

  suite.test({
    id: 'F14_T4',
    tier: 1,
    feature: 'F14',
    name: 'F14: Verifies sale at loss correctly accounts for negative profit delta',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const initialSummary = await apiClient.getFinancialSummary();
      assertions.assertStatus(initialSummary, 200);

      // Buy for 100, repair for 50 = total cost 150. Sell for 110 => loss of 40
      const created = await apiClient.createGadget({
        name: 'Loss Item Test',
        model: 'Loss-1',
        price: 100.0,
        repairCost: 50.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const sold = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: 110.0,
      });
      assertions.assertStatus(sold, 200);

      const afterSummary = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(afterSummary.data.netProfit, initialSummary.data.netProfit - 40.0, 0.05);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F14_T5',
    tier: 1,
    feature: 'F14',
    name: 'F14: Verifies break-even sale leaves Net Profit completely unchanged',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const initialSummary = await apiClient.getFinancialSummary();
      assertions.assertStatus(initialSummary, 200);

      // Cost 75 + repair 25 = 100. Sold for 100 => profit delta 0.0
      const created = await apiClient.createGadget({
        name: 'Break-Even Test',
        model: 'BE-1',
        price: 75.0,
        repairCost: 25.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const sold = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: 100.0,
      });
      assertions.assertStatus(sold, 200);

      const afterSummary = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(afterSummary.data.netProfit, initialSummary.data.netProfit, 0.02);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  // =========================================================================
  // Feature 15: ROI % Calculation
  // =========================================================================
  suite.test({
    id: 'F15_T1',
    tier: 1,
    feature: 'F15',
    name: 'F15: Verifies ROI formula division-by-zero protection returns 0.0 when sold investment is 0',
    requiresServer: false,
    fn: async ({ assert, assertions }) => {
      const soldInvestment = 0.0;
      const netProfit = 0.0;
      const roi = soldInvestment > 0 ? (netProfit / soldInvestment) * 100 : 0.0;
      assert.strictEqual(roi, 0.0, 'ROI must be 0.0 when soldInvestment is 0');
    },
  });

  suite.test({
    id: 'F15_T2',
    tier: 1,
    feature: 'F15',
    name: 'F15: Verifies ROI calculation yields 100.0% when item sold at double total cost',
    requiresServer: false,
    fn: async ({ assertions }) => {
      const price = 50.0;
      const repairCost = 50.0;
      const totalCost = price + repairCost; // 100.0
      const soldPrice = 200.0;
      const profit = soldPrice - totalCost; // 100.0
      const roi = (profit / totalCost) * 100.0;
      assertions.assertCloseTo(roi, 100.0, 0.001);
    },
  });

  suite.test({
    id: 'F15_T3',
    tier: 1,
    feature: 'F15',
    name: 'F15: Verifies ROI calculation accurately accounts for repairCost in denominator',
    requiresServer: false,
    fn: async ({ assertions }) => {
      // Without repairCost: profit = 150 - 100 = 50, ROI = 50%
      // With repairCost of 25: totalCost = 125, profit = 150 - 125 = 25, ROI = 25/125 = 20%
      const price = 100.0;
      const repairCost = 25.0;
      const totalCost = price + repairCost;
      const soldPrice = 150.0;
      const profit = soldPrice - totalCost;
      const roi = (profit / totalCost) * 100.0;
      assertions.assertCloseTo(roi, 20.0, 0.001);
    },
  });

  suite.test({
    id: 'F15_T4',
    tier: 1,
    feature: 'F15',
    name: 'F15: Verifies live GET /gadget/finance/summary returns numeric ROI formatted to 2 decimals',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const res = await apiClient.getFinancialSummary();
      assertions.assertStatus(res, 200);
      assert.ok(typeof res.data.roi === 'number', 'roi must be a number');
      const roiStr = res.data.roi.toString();
      const decimals = roiStr.includes('.') ? roiStr.split('.')[1].length : 0;
      assert.ok(decimals <= 2, `ROI decimal places should be <= 2, got ${decimals} (${res.data.roi})`);
    },
  });

  suite.test({
    id: 'F15_T5',
    tier: 1,
    feature: 'F15',
    name: 'F15: Verifies negative ROI when total sales operate at net loss',
    requiresServer: false,
    fn: async ({ assertions }) => {
      const totalCost = 200.0;
      const soldPrice = 150.0;
      const netProfit = soldPrice - totalCost; // -50.0
      const roi = (netProfit / totalCost) * 100.0; // -25.0%
      assertions.assertCloseTo(roi, -25.0, 0.001);
    },
  });

  // =========================================================================
  // Feature 16: Stock Capital Calculation
  // =========================================================================
  suite.test({
    id: 'F16_T1',
    tier: 1,
    feature: 'F16',
    name: 'F16: Verifies Stock Capital formula sums (price + repairCost) strictly for unsold items',
    requiresServer: false,
    fn: async ({ assertions }) => {
      const items = [
        { isSold: false, price: 100.0, repairCost: 20.0 },
        { isSold: false, price: 200.0, repairCost: 50.0 },
        { isSold: true, price: 300.0, repairCost: 80.0, soldPrice: 500.0 },
      ];
      const stockCapital = items
        .filter((i) => !i.isSold)
        .reduce((sum, i) => sum + (i.price + i.repairCost), 0);
      assertions.assertCloseTo(stockCapital, 370.0, 0.001);
    },
  });

  suite.test({
    id: 'F16_T2',
    tier: 1,
    feature: 'F16',
    name: 'F16: Verifies live Stock Capital increases by price + repairCost when new item is added',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const initialSummary = await apiClient.getFinancialSummary();
      assertions.assertStatus(initialSummary, 200);
      const initialCap = initialSummary.data.stockCapital;

      const created = await apiClient.createGadget({
        name: 'Stock Capital Add Test',
        model: 'SC-Add',
        price: 150.0,
        repairCost: 35.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const updatedSummary = await apiClient.getFinancialSummary();
      assertions.assertStatus(updatedSummary, 200);
      assertions.assertCloseTo(updatedSummary.data.stockCapital, initialCap + 185.0, 0.05);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F16_T3',
    tier: 1,
    feature: 'F16',
    name: 'F16: Verifies live Stock Capital decreases when available item is marked as sold',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Stock Capital Sell Test',
        model: 'SC-Sell',
        price: 80.0,
        repairCost: 20.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const beforeSale = await apiClient.getFinancialSummary();
      assertions.assertStatus(beforeSale, 200);

      // Sell item
      const sold = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: 150.0,
      });
      assertions.assertStatus(sold, 200);

      const afterSale = await apiClient.getFinancialSummary();
      assertions.assertStatus(afterSale, 200);
      // Stock Capital should drop by 80 + 20 = 100
      assertions.assertCloseTo(afterSale.data.stockCapital, beforeSale.data.stockCapital - 100.0, 0.05);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F16_T4',
    tier: 1,
    feature: 'F16',
    name: 'F16: Verifies live Stock Capital updates when repairCost is added to an unsold item',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Repair Added Test',
        model: 'SC-Repair',
        price: 100.0,
        repairCost: 0.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const beforeRepair = await apiClient.getFinancialSummary();
      assertions.assertStatus(beforeRepair, 200);

      // Add $40 repair
      const updated = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        repairCost: 40.0,
        repair: true,
      });
      assertions.assertStatus(updated, 200);

      const afterRepair = await apiClient.getFinancialSummary();
      assertions.assertStatus(afterRepair, 200);
      assertions.assertCloseTo(afterRepair.data.stockCapital, beforeRepair.data.stockCapital + 40.0, 0.05);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F16_T5',
    tier: 1,
    feature: 'F16',
    name: 'F16: Verifies live Stock Capital decreases when unsold item is deleted',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Stock Capital Delete Test',
        model: 'SC-Del',
        price: 60.0,
        repairCost: 15.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const beforeDelete = await apiClient.getFinancialSummary();
      assertions.assertStatus(beforeDelete, 200);

      await apiClient.deleteGadget(created.data.id);

      const afterDelete = await apiClient.getFinancialSummary();
      assertions.assertStatus(afterDelete, 200);
      assertions.assertCloseTo(afterDelete.data.stockCapital, beforeDelete.data.stockCapital - 75.0, 0.05);
    },
  });

  // =========================================================================
  // Feature 17: Financial Summary Endpoint
  // =========================================================================
  suite.test({
    id: 'F17_T1',
    tier: 1,
    feature: 'F17',
    name: 'F17: Verifies GET /gadget/finance/summary returns HTTP 200 OK',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.getFinancialSummary();
      assertions.assertStatus(res, 200, 'GET /gadget/finance/summary must return 200');
    },
  });

  suite.test({
    id: 'F17_T2',
    tier: 1,
    feature: 'F17',
    name: 'F17: Verifies GET /gadget/finance/summary JSON response matches FinancialSummary schema',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.getFinancialSummary();
      assertions.assertStatus(res, 200);
      assertions.assertFinancialSummarySchema(res.data, 'GET /gadget/finance/summary');
    },
  });

  suite.test({
    id: 'F17_T3',
    tier: 1,
    feature: 'F17',
    name: 'F17: Verifies soldItemsCount matches count of items with isSold=true',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const summaryRes = await apiClient.getFinancialSummary();
      assertions.assertStatus(summaryRes, 200);
      const soldRes = await apiClient.getSoldGadgets();
      assertions.assertStatus(soldRes, 200);
      assert.strictEqual(
        summaryRes.data.soldItemsCount,
        soldRes.data.length,
        'soldItemsCount in summary must match count from /gadget/gadgets-sold'
      );
    },
  });

  suite.test({
    id: 'F17_T4',
    tier: 1,
    feature: 'F17',
    name: 'F17: Verifies availableItemsCount matches count of items with isSold=false',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const summaryRes = await apiClient.getFinancialSummary();
      assertions.assertStatus(summaryRes, 200);
      const allRes = await apiClient.getGadgets();
      assertions.assertStatus(allRes, 200);
      const unsoldList = allRes.data.filter((g) => !g.isSold);
      assert.strictEqual(
        summaryRes.data.availableItemsCount,
        unsoldList.length,
        'availableItemsCount must match count of unsold gadgets'
      );
    },
  });

  suite.test({
    id: 'F17_T5',
    tier: 1,
    feature: 'F17',
    name: 'F17: Verifies total inventory count equals soldItemsCount + availableItemsCount',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const summaryRes = await apiClient.getFinancialSummary();
      assertions.assertStatus(summaryRes, 200);
      const allRes = await apiClient.getGadgets();
      assertions.assertStatus(allRes, 200);
      const sumCounts = summaryRes.data.soldItemsCount + summaryRes.data.availableItemsCount;
      assert.strictEqual(allRes.data.length, sumCounts, 'Total gadgets must equal soldItemsCount + availableItemsCount');
    },
  });
}
