// tier4_scenarios/resale_shop_lifecycle.test.js
// Tier 4: Real-World Scenarios — Secondhand Resale Business Workflows

export function register(suite) {
  suite.test({
    id: 'S_RESALE_01',
    tier: 4,
    feature: 'SCENARIO_RESALE',
    name: 'S_RESALE_01: Smartphone Refurbisher Journey — Batch purchase (3 iPhones), repair, list, tiered sales & ROI audit',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const initialSummary = await apiClient.getFinancialSummary();
      assertions.assertStatus(initialSummary, 200);

      // 1. Dealer buys 3 phones
      const phone1 = await apiClient.createGadget({
        name: 'iPhone 11 64GB',
        model: 'Black',
        category: 'Smartphones',
        price: 120.0,
        repairCost: 0.0,
        isSold: false,
      });
      const phone2 = await apiClient.createGadget({
        name: 'iPhone 12 128GB',
        model: 'Blue',
        category: 'Smartphones',
        price: 200.0,
        repairCost: 0.0,
        isSold: false,
      });
      const phone3 = await apiClient.createGadget({
        name: 'iPhone 13 128GB',
        model: 'Midnight',
        category: 'Smartphones',
        price: 320.0,
        repairCost: 0.0,
        isSold: false,
      });

      // 2. Refurbish phones (screens and batteries)
      await apiClient.updateGadget(phone1.data.id, {
        ...phone1.data,
        repairCost: 30.0, // total cost: 150
        listedPrice: 220.0,
        repair: true,
      });
      await apiClient.updateGadget(phone2.data.id, {
        ...phone2.data,
        repairCost: 50.0, // total cost: 250
        listedPrice: 350.0,
        repair: true,
      });
      await apiClient.updateGadget(phone3.data.id, {
        ...phone3.data,
        repairCost: 40.0, // total cost: 360
        listedPrice: 480.0,
        repair: true,
      });

      // Stock Capital should have increased by 150 + 250 + 360 = 760
      const midSummary = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(midSummary.data.stockCapital, initialSummary.data.stockCapital + 760.0, 0.05);

      // 3. Sell Phone 1 for $210 (Profit = 210 - 150 = +60)
      await apiClient.updateGadget(phone1.data.id, {
        ...phone1.data,
        repairCost: 30.0,
        isSold: true,
        soldPrice: 210.0,
      });

      // 4. Sell Phone 2 for $340 (Profit = 340 - 250 = +90)
      await apiClient.updateGadget(phone2.data.id, {
        ...phone2.data,
        repairCost: 50.0,
        isSold: true,
        soldPrice: 340.0,
      });

      // Phone 3 remains unsold in stock!
      // Realized profit should be +60 + 90 = +150
      // Stock Capital should be initial + Phone 3 cost (360)
      const auditSummary = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(auditSummary.data.netProfit, initialSummary.data.netProfit + 150.0, 0.05);
      assertions.assertCloseTo(auditSummary.data.stockCapital, initialSummary.data.stockCapital + 360.0, 0.05);

      // Cleanup
      await apiClient.deleteGadget(phone1.data.id);
      await apiClient.deleteGadget(phone2.data.id);
      await apiClient.deleteGadget(phone3.data.id);
    },
  });

  suite.test({
    id: 'S_RESALE_02',
    tier: 4,
    feature: 'SCENARIO_RESALE',
    name: 'S_RESALE_02: Vintage Console Collector — Stock Capital segregation prevents inventory purchases from distorting realized gains',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const initial = await apiClient.getFinancialSummary();
      assertions.assertStatus(initial, 200);

      // Sell one item to establish a baseline profit of $40
      const quickSale = await apiClient.createGadget({
        name: 'Game Boy Color',
        model: 'Atomic Purple',
        category: 'Gaming Consoles',
        price: 50.0,
        repairCost: 10.0,
        isSold: false,
      });
      await apiClient.updateGadget(quickSale.data.id, {
        ...quickSale.data,
        isSold: true,
        soldPrice: 100.0, // Profit: 100 - 60 = 40
      });

      const afterSale = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(afterSale.data.netProfit, initial.data.netProfit + 40.0, 0.05);

      // Now buy 3 expensive rare unsold consoles ($1500 total)
      const rare1 = await apiClient.createGadget({
        name: 'Sega Saturn CIB',
        model: 'JP Model',
        category: 'Gaming Consoles',
        price: 500.0,
        repairCost: 50.0,
        isSold: false,
      });
      const rare2 = await apiClient.createGadget({
        name: 'Neo Geo AES',
        model: 'Gold System',
        category: 'Gaming Consoles',
        price: 900.0,
        repairCost: 50.0,
        isSold: false,
      });

      // CRITICAL R3 REQUIREMENT CHECK:
      // Buying new stock MUST NOT decrease or distort realized Net Profit!
      const afterBuys = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(afterBuys.data.netProfit, afterSale.data.netProfit, 0.01);
      // Stock capital should reflect new inventory ($550 + $950 = $1500)
      assertions.assertCloseTo(afterBuys.data.stockCapital, initial.data.stockCapital + 1500.0, 0.05);

      await apiClient.deleteGadget(quickSale.data.id);
      await apiClient.deleteGadget(rare1.data.id);
      await apiClient.deleteGadget(rare2.data.id);
    },
  });

  suite.test({
    id: 'S_RESALE_03',
    tier: 4,
    feature: 'SCENARIO_RESALE',
    name: 'S_RESALE_03: Mixed Liquidation Lot — Portfolio with 1 profitable item and 1 loss-making item reconciles ledger',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const initial = await apiClient.getFinancialSummary();
      assertions.assertStatus(initial, 200);

      // Item 1: Great flip (Cost 100, sold for 220 => +120)
      const goodFlip = await apiClient.createGadget({
        name: 'ThinkPad T480 Refurb',
        model: 'i7 16GB',
        category: 'Laptops',
        price: 80.0,
        repairCost: 20.0,
        isSold: false,
      });
      await apiClient.updateGadget(goodFlip.data.id, {
        ...goodFlip.data,
        isSold: true,
        soldPrice: 220.0,
      });

      // Item 2: Defective laptop sold for scrap at loss (Cost 150, sold for 50 => -100)
      const badFlip = await apiClient.createGadget({
        name: 'Water Damaged XPS 13',
        model: 'For Parts Only',
        category: 'Laptops',
        price: 150.0,
        repairCost: 0.0,
        isSold: false,
      });
      await apiClient.updateGadget(badFlip.data.id, {
        ...badFlip.data,
        isSold: true,
        soldPrice: 50.0,
      });

      // Net portfolio result: +120 - 100 = +20 net profit
      const finalSummary = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(finalSummary.data.netProfit, initial.data.netProfit + 20.0, 0.05);

      await apiClient.deleteGadget(goodFlip.data.id);
      await apiClient.deleteGadget(badFlip.data.id);
    },
  });

  suite.test({
    id: 'S_RESALE_04',
    tier: 4,
    feature: 'SCENARIO_RESALE',
    name: 'S_RESALE_04: Customer Trade-In & Return Exchange Flow — Return un-marks sale and restores ledger symmetry',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const initial = await apiClient.getFinancialSummary();
      assertions.assertStatus(initial, 200);

      // Customer buys Audio Receiver
      const receiver = await apiClient.createGadget({
        name: 'Yamaha RX-V685',
        model: '7.2 Channel',
        category: 'Audio',
        price: 180.0,
        repairCost: 20.0,
        isSold: false,
      });
      await apiClient.updateGadget(receiver.data.id, {
        ...receiver.data,
        isSold: true,
        soldPrice: 300.0, // +100 profit
      });

      const soldSummary = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(soldSummary.data.netProfit, initial.data.netProfit + 100.0, 0.05);

      // Customer brings it back (e.g. spouse didn't like size). Dealer reverses sale!
      await apiClient.updateGadget(receiver.data.id, {
        ...receiver.data,
        isSold: false,
        soldPrice: null,
        soldDate: null,
      });

      const reversedSummary = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(reversedSummary.data.netProfit, initial.data.netProfit, 0.05);
      assertions.assertCloseTo(reversedSummary.data.stockCapital, initial.data.stockCapital + 200.0, 0.05);

      await apiClient.deleteGadget(receiver.data.id);
    },
  });

  suite.test({
    id: 'S_RESALE_05',
    tier: 4,
    feature: 'SCENARIO_RESALE',
    name: 'S_RESALE_05: End of Day Resale Shop Settlement — Multi-category stock reconciliation and inventory balance',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const items = await apiClient.getGadgets();
      assertions.assertStatus(items, 200);

      const summary = await apiClient.getFinancialSummary();
      assertions.assertStatus(summary, 200);

      // Manual recalculation of all database items
      const unsoldItems = items.data.filter((i) => !i.isSold);
      const soldItems = items.data.filter((i) => i.isSold);

      const computedStockCapital = unsoldItems.reduce((acc, i) => acc + (i.price + (i.repairCost || 0)), 0);
      const computedNetProfit = soldItems.reduce((acc, i) => acc + (i.soldPrice - (i.price + (i.repairCost || 0))), 0);

      assertions.assertCloseTo(summary.data.stockCapital, computedStockCapital, 0.05, 'Stock capital ledger audit');
      assertions.assertCloseTo(summary.data.netProfit, computedNetProfit, 0.05, 'Net profit ledger audit');
      assert.strictEqual(summary.data.availableItemsCount, unsoldItems.length);
      assert.strictEqual(summary.data.soldItemsCount, soldItems.length);
    },
  });
}
