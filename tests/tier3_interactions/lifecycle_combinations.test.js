// tier3_interactions/lifecycle_combinations.test.js
// Tier 3: Cross-Feature Combinations — Pairwise Interactions & Lifecycle Workflows

export function register(suite) {
  suite.test({
    id: 'C_LIFE_01',
    tier: 3,
    feature: 'INTERACTION',
    name: 'C_LIFE_01: Purchase (F21) -> Repair (F7/F9) -> Stock Capital increases by price + repairCost (F16/F17)',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const initialSummary = await apiClient.getFinancialSummary();
      assertions.assertStatus(initialSummary, 200);

      // 1. Purchase broken console
      const created = await apiClient.createGadget({
        name: 'Nintendo Switch Broken',
        model: 'OLED',
        category: 'Gaming Consoles',
        price: 150.0,
        repairCost: 0.0,
        repair: false,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      // Verify intermediate stock capital
      const midSummary = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(midSummary.data.stockCapital, initialSummary.data.stockCapital + 150.0, 0.05);

      // 2. Add repair parts ($50)
      const repaired = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        repairCost: 50.0,
        repair: true,
        comments: 'Replaced rail slider and charging port',
      });
      assertions.assertStatus(repaired, 200);

      // 3. Verify total stock capital is now +200
      const finalSummary = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(finalSummary.data.stockCapital, initialSummary.data.stockCapital + 200.0, 0.05);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'C_LIFE_02',
    tier: 3,
    feature: 'INTERACTION',
    name: 'C_LIFE_02: Set listedPrice (F8) -> Sell (F9/F10) -> Stock Capital decreases, Net Profit & ROI increase (F14-F17)',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const initial = await apiClient.getFinancialSummary();
      assertions.assertStatus(initial, 200);

      // 1. Buy & repair
      const created = await apiClient.createGadget({
        name: 'MacBook Air M1',
        model: '256GB Gold',
        category: 'Laptops',
        price: 400.0,
        repairCost: 100.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      // 2. List item
      const listed = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        listedPrice: 650.0,
      });
      assertions.assertStatus(listed, 200);

      // 3. Complete sale for 600. Cost = 500. Profit = +100. ROI = 100/500 = 20%
      const sold = await apiClient.updateGadget(created.data.id, {
        ...listed.data,
        isSold: true,
        soldPrice: 600.0,
      });
      assertions.assertStatus(sold, 200);

      // 4. Verify financial metrics
      const updated = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(updated.data.stockCapital, initial.data.stockCapital, 0.05);
      assertions.assertCloseTo(updated.data.netProfit, initial.data.netProfit + 100.0, 0.05);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'C_LIFE_03',
    tier: 3,
    feature: 'INTERACTION',
    name: 'C_LIFE_03: Multi-item portfolio: 1 sold at profit, 1 sold at loss -> Blended profit and ROI reconcile',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const sum0 = await apiClient.getFinancialSummary();
      assertions.assertStatus(sum0, 200);

      // Item A: Cost 100, sold for 150 => Profit +50
      const itemA = await apiClient.createGadget({
        name: 'Item A Profit',
        model: 'A',
        price: 80.0,
        repairCost: 20.0,
        isSold: false,
      });
      assertions.assertStatus(itemA, 201);

      // Item B: Cost 200, sold for 170 => Loss -30
      const itemB = await apiClient.createGadget({
        name: 'Item B Loss',
        model: 'B',
        price: 150.0,
        repairCost: 50.0,
        isSold: false,
      });
      assertions.assertStatus(itemB, 201);

      // Sell both
      await apiClient.updateGadget(itemA.data.id, { ...itemA.data, isSold: true, soldPrice: 150.0 });
      await apiClient.updateGadget(itemB.data.id, { ...itemB.data, isSold: true, soldPrice: 170.0 });

      // Total new profit should be 50 - 30 = +20
      const sumFinal = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(sumFinal.data.netProfit, sum0.data.netProfit + 20.0, 0.05);

      await apiClient.deleteGadget(itemA.data.id);
      await apiClient.deleteGadget(itemB.data.id);
    },
  });

  suite.test({
    id: 'C_LIFE_04',
    tier: 3,
    feature: 'INTERACTION',
    name: 'C_LIFE_04: Delete sold item removes realized profit and restores summary ledger accurately',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const sumBefore = await apiClient.getFinancialSummary();
      assertions.assertStatus(sumBefore, 200);

      const created = await apiClient.createGadget({
        name: 'Temporary Sale Item',
        model: 'TSI',
        price: 50.0,
        repairCost: 0.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      // Sell for 90 (+40 profit)
      await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: 90.0,
      });

      const sumSold = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(sumSold.data.netProfit, sumBefore.data.netProfit + 40.0, 0.05);

      // Delete sold item
      await apiClient.deleteGadget(created.data.id);

      const sumAfter = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(sumAfter.data.netProfit, sumBefore.data.netProfit, 0.05);
      assertions.assertCloseTo(sumAfter.data.stockCapital, sumBefore.data.stockCapital, 0.05);
    },
  });

  suite.test({
    id: 'C_LIFE_05',
    tier: 3,
    feature: 'INTERACTION',
    name: 'C_LIFE_05: Sale rejection (400) leaves financial metrics and stock status completely unchanged',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Failed Sale Gadget',
        model: 'FSG',
        price: 100.0,
        repairCost: 20.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const sumBefore = await apiClient.getFinancialSummary();
      assertions.assertStatus(sumBefore, 200);

      // Attempt invalid sale with soldPrice = -50
      const badSale = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: -50.0,
      });
      assertions.assertStatus(badSale, 400);

      // Check item remains unsold
      const checkItem = await apiClient.getGadgetById(created.data.id);
      assertions.assertStatus(checkItem, 200);
      assert.strictEqual(checkItem.data.isSold, false);

      // Check financial summary untouched
      const sumAfter = await apiClient.getFinancialSummary();
      assertions.assertStatus(sumAfter, 200);
      assertions.assertCloseTo(sumAfter.data.stockCapital, sumBefore.data.stockCapital, 0.01);
      assertions.assertCloseTo(sumAfter.data.netProfit, sumBefore.data.netProfit, 0.01);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'C_LIFE_06',
    tier: 3,
    feature: 'INTERACTION',
    name: 'C_LIFE_06: Category update (F6) -> Search by category -> Item matches updated category',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Multi-Category Switcher',
        model: 'MCS-1',
        category: 'Accessories',
        price: 30.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      // Update category to Wearables
      const updated = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        category: 'Wearables',
      });
      assertions.assertStatus(updated, 200);

      const fetched = await apiClient.getGadgetById(created.data.id);
      assertions.assertStatus(fetched, 200);
      assert.strictEqual(fetched.data.category, 'Wearables');

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'C_LIFE_07',
    tier: 3,
    feature: 'INTERACTION',
    name: 'C_LIFE_07: Baseline seeder audit (F4) -> Add new item -> Summary delta exactly matches new item',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const base = await apiClient.getFinancialSummary();
      assertions.assertStatus(base, 200);

      const price = 222.0;
      const repairCost = 33.0;
      const created = await apiClient.createGadget({
        name: 'Delta Audit Item',
        model: 'DAI',
        price,
        repairCost,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const after = await apiClient.getFinancialSummary();
      assertions.assertStatus(after, 200);
      assertions.assertCloseTo(after.data.stockCapital, base.data.stockCapital + price + repairCost, 0.05);
      assert.strictEqual(after.data.availableItemsCount, base.data.availableItemsCount + 1);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'C_LIFE_08',
    tier: 3,
    feature: 'INTERACTION',
    name: 'C_LIFE_08: Zero repair cost baseline -> Subsequent repair update increases Stock Capital incrementally',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Incremental Repair Item',
        model: 'IRI',
        price: 80.0,
        repairCost: 0.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const sum1 = await apiClient.getFinancialSummary();
      assertions.assertStatus(sum1, 200);

      // Repair #1: +$20
      const rep1 = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        repairCost: 20.0,
      });
      assertions.assertStatus(rep1, 200);

      const sum2 = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(sum2.data.stockCapital, sum1.data.stockCapital + 20.0, 0.05);

      // Repair #2: additional +$15 => total repair 35
      const rep2 = await apiClient.updateGadget(created.data.id, {
        ...rep1.data,
        repairCost: 35.0,
      });
      assertions.assertStatus(rep2, 200);

      const sum3 = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(sum3.data.stockCapital, sum1.data.stockCapital + 35.0, 0.05);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'C_LIFE_09',
    tier: 3,
    feature: 'INTERACTION',
    name: 'C_LIFE_09: Sold item appears in /gadget/gadgets-sold and remains in /gadget with isSold=true',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Dual Query Visibility Item',
        model: 'DQVI',
        price: 70.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const sold = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: 120.0,
      });
      assertions.assertStatus(sold, 200);

      // Query sold list
      const soldList = await apiClient.getSoldGadgets();
      assertions.assertStatus(soldList, 200);
      assert.ok(soldList.data.some((g) => g.id === created.data.id));

      // Query all list
      const allList = await apiClient.getGadgets();
      assertions.assertStatus(allList, 200);
      const foundInAll = allList.data.find((g) => g.id === created.data.id);
      assert.ok(foundInAll);
      assert.strictEqual(foundInAll.isSold, true);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'C_LIFE_10',
    tier: 3,
    feature: 'INTERACTION',
    name: 'C_LIFE_10: End-to-end refurbishment lifecycle: Buy iPad ($120) -> Repair ($60) -> List ($280) -> Sell ($250) -> Audit ($70 profit, 38.89% ROI)',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const initial = await apiClient.getFinancialSummary();
      assertions.assertStatus(initial, 200);

      // Step 1: Buy
      const ipad = await apiClient.createGadget({
        name: 'iPad Pro 11"',
        model: '128GB Wi-Fi Space Gray',
        category: 'Tablets',
        price: 120.0,
        repairCost: 0.0,
        comments: 'Cracked glass, logic board functional',
        repair: false,
        isSold: false,
      });
      assertions.assertStatus(ipad, 201);

      // Step 2: Repair
      const repairedIpad = await apiClient.updateGadget(ipad.data.id, {
        ...ipad.data,
        repairCost: 60.0,
        repair: true,
        comments: 'New digitizer and tempered glass installed',
      });
      assertions.assertStatus(repairedIpad, 200);

      // Step 3: List
      const listedIpad = await apiClient.updateGadget(ipad.data.id, {
        ...repairedIpad.data,
        listedPrice: 280.0,
      });
      assertions.assertStatus(listedIpad, 200);

      // Step 4: Sell
      const soldIpad = await apiClient.updateGadget(ipad.data.id, {
        ...listedIpad.data,
        isSold: true,
        soldPrice: 250.0,
      });
      assertions.assertStatus(soldIpad, 200);

      // Step 5: Audit metrics
      // Realized profit: 250 - (120 + 60) = 70.0
      // Investment: 180.0
      const finalSummary = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(finalSummary.data.netProfit, initial.data.netProfit + 70.0, 0.05);
      assertions.assertCloseTo(finalSummary.data.stockCapital, initial.data.stockCapital, 0.05);

      await apiClient.deleteGadget(ipad.data.id);
    },
  });
}
