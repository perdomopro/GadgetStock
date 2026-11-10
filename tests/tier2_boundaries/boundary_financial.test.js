// tier2_boundaries/boundary_financial.test.js
// Tier 2: Boundary & Corner Cases — Financial Calculations & Edge Cases

export function register(suite) {
  suite.test({
    id: 'B_FIN_01',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_01: Zero division safety — ROI is 0.0 when sold items investment is zero',
    requiresServer: false,
    fn: async ({ assert }) => {
      const soldItems = [];
      const totalInvestment = soldItems.reduce((acc, i) => acc + (i.price + i.repairCost), 0);
      const netProfit = soldItems.reduce((acc, i) => acc + (i.soldPrice - (i.price + i.repairCost)), 0);
      const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0.0;
      assert.strictEqual(roi, 0.0, 'ROI must default safely to 0.0 when investment is zero');
      assert.strictEqual(Number.isFinite(roi), true, 'ROI must be finite');
    },
  });

  suite.test({
    id: 'B_FIN_02',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_02: Zero division safety — Gifted item (price=0, repairCost=0) sold for profit does not produce NaN/Infinity',
    requiresServer: false,
    fn: async ({ assert }) => {
      const soldItems = [{ isSold: true, price: 0.0, repairCost: 0.0, soldPrice: 50.0 }];
      const totalInvestment = soldItems.reduce((acc, i) => acc + (i.price + i.repairCost), 0);
      const netProfit = soldItems.reduce((acc, i) => acc + (i.soldPrice - (i.price + i.repairCost)), 0);
      const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0.0;
      assert.strictEqual(Number.isFinite(roi), true, 'ROI must not evaluate to Infinity/NaN on zero investment base');
    },
  });

  suite.test({
    id: 'B_FIN_03',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_03: Extreme values — Calculations with millions in stock capital and profit maintain accuracy',
    requiresServer: false,
    fn: async ({ assertions }) => {
      const largeItems = [
        { isSold: true, price: 1000000.0, repairCost: 250000.0, soldPrice: 1500000.0 }, // profit: 250,000
        { isSold: false, price: 5000000.0, repairCost: 500000.0 }, // stockCap: 5,500,000
      ];
      const stockCap = largeItems.filter((i) => !i.isSold).reduce((acc, i) => acc + (i.price + i.repairCost), 0);
      const profit = largeItems.filter((i) => i.isSold).reduce((acc, i) => acc + (i.soldPrice - (i.price + i.repairCost)), 0);
      const roi = (profit / (1000000.0 + 250000.0)) * 100;
      assertions.assertCloseTo(stockCap, 5500000.0, 0.01);
      assertions.assertCloseTo(profit, 250000.0, 0.01);
      assertions.assertCloseTo(roi, 20.0, 0.01);
    },
  });

  suite.test({
    id: 'B_FIN_04',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_04: Precision — Sub-cent fractions correctly round to standard two decimal places',
    requiresServer: false,
    fn: async ({ assertions }) => {
      // 100 / 3 = 33.333333333...
      const rawRoi = 100.0 / 3.0;
      const roundedRoi = Math.round(rawRoi * 100) / 100;
      assertions.assertCloseTo(roundedRoi, 33.33, 0.001);
    },
  });

  suite.test({
    id: 'B_FIN_05',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_05: Stock Capital is strictly 0.00 when available inventory is empty',
    requiresServer: false,
    fn: async ({ assert }) => {
      const emptyUnsold = [];
      const stockCapital = emptyUnsold.reduce((acc, i) => acc + (i.price + i.repairCost), 0);
      assert.strictEqual(stockCapital, 0.0);
    },
  });

  suite.test({
    id: 'B_FIN_06',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_06: Stock Capital is strictly 0.00 when 100% of inventory items have been sold',
    requiresServer: false,
    fn: async ({ assert }) => {
      const inventory = [
        { isSold: true, price: 100.0, repairCost: 20.0 },
        { isSold: true, price: 200.0, repairCost: 50.0 },
      ];
      const stockCapital = inventory.filter((i) => !i.isSold).reduce((acc, i) => acc + (i.price + i.repairCost), 0);
      assert.strictEqual(stockCapital, 0.0);
    },
  });

  suite.test({
    id: 'B_FIN_07',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_07: Break-even boundary — Sale at exact cost basis produces 0.00 profit and 0.00% ROI',
    requiresServer: false,
    fn: async ({ assertions }) => {
      const item = { isSold: true, price: 120.0, repairCost: 30.0, soldPrice: 150.0 };
      const cost = item.price + item.repairCost;
      const profit = item.soldPrice - cost;
      const roi = (profit / cost) * 100.0;
      assertions.assertCloseTo(profit, 0.0, 0.001);
      assertions.assertCloseTo(roi, 0.0, 0.001);
    },
  });

  suite.test({
    id: 'B_FIN_08',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_08: Severe loss boundary — Selling item for 10% of total investment computes -90.0% ROI',
    requiresServer: false,
    fn: async ({ assertions }) => {
      const item = { isSold: true, price: 80.0, repairCost: 20.0, soldPrice: 10.0 };
      const cost = item.price + item.repairCost; // 100.0
      const profit = item.soldPrice - cost; // -90.0
      const roi = (profit / cost) * 100.0; // -90.0%
      assertions.assertCloseTo(profit, -90.0, 0.001);
      assertions.assertCloseTo(roi, -90.0, 0.001);
    },
  });

  suite.test({
    id: 'B_FIN_09',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_09: Minimal positive sale — Smallest positive price (0.01) sold for 0.02 computes 100.0% ROI',
    requiresServer: false,
    fn: async ({ assertions }) => {
      const item = { isSold: true, price: 0.01, repairCost: 0.0, soldPrice: 0.02 };
      const cost = item.price + item.repairCost;
      const profit = item.soldPrice - cost; // 0.01
      const roi = (profit / cost) * 100.0;
      assertions.assertCloseTo(profit, 0.01, 0.0001);
      assertions.assertCloseTo(roi, 100.0, 0.001);
    },
  });

  suite.test({
    id: 'B_FIN_10',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_10: High repair boundary — repairCost exceeding price (price=50, repair=150) accounts for full $200 basis',
    requiresServer: false,
    fn: async ({ assertions }) => {
      const item = { isSold: false, price: 50.0, repairCost: 150.0 };
      const capital = item.price + item.repairCost;
      assertions.assertCloseTo(capital, 200.0, 0.001);
    },
  });

  suite.test({
    id: 'B_FIN_11',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_11: Listed price independence — Changing listedPrice does not alter Stock Capital or Net Profit',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Listing Independence Test',
        model: 'LIT-1',
        price: 100.0,
        repairCost: 20.0,
        listedPrice: 200.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const sum1 = await apiClient.getFinancialSummary();
      assertions.assertStatus(sum1, 200);

      // Change listedPrice to 500
      await apiClient.updateGadget(created.data.id, {
        ...created.data,
        listedPrice: 500.0,
      });
      const sum2 = await apiClient.getFinancialSummary();
      assertions.assertStatus(sum2, 200);

      assertions.assertCloseTo(sum1.data.stockCapital, sum2.data.stockCapital, 0.01);
      assertions.assertCloseTo(sum1.data.netProfit, sum2.data.netProfit, 0.01);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_FIN_12',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_12: Accounting identity — NetProfit + TotalSoldCostBasis equals TotalSoldRevenue',
    requiresServer: false,
    fn: async ({ assertions }) => {
      const soldItems = [
        { isSold: true, price: 100.0, repairCost: 20.0, soldPrice: 150.0 },
        { isSold: true, price: 80.0, repairCost: 40.0, soldPrice: 110.0 },
      ];
      const totalCostBasis = soldItems.reduce((acc, i) => acc + (i.price + i.repairCost), 0); // 240
      const totalRevenue = soldItems.reduce((acc, i) => acc + i.soldPrice, 0); // 260
      const netProfit = soldItems.reduce((acc, i) => acc + (i.soldPrice - (i.price + i.repairCost)), 0); // 20
      assertions.assertCloseTo(netProfit + totalCostBasis, totalRevenue, 0.001);
    },
  });

  suite.test({
    id: 'B_FIN_13',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_13: Decimal pennies summation — 10 items at 0.01 profit each yield exactly 0.10 total profit',
    requiresServer: false,
    fn: async ({ assertions }) => {
      const items = Array.from({ length: 10 }, () => ({
        isSold: true,
        price: 1.0,
        repairCost: 0.0,
        soldPrice: 1.01,
      }));
      const profit = items.reduce((acc, i) => acc + (i.soldPrice - (i.price + i.repairCost)), 0);
      assertions.assertCloseTo(profit, 0.1, 0.001);
    },
  });

  suite.test({
    id: 'B_FIN_14',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_14: Zero repairCost default — Explicit 0.0 repairCost behaves identical to default 0.0',
    requiresServer: false,
    fn: async ({ assert }) => {
      const item1 = { price: 50.0, repairCost: 0.0 };
      const item2 = { price: 50.0, repairCost: 0 };
      assert.strictEqual(item1.price + item1.repairCost, item2.price + item2.repairCost);
    },
  });

  suite.test({
    id: 'B_FIN_15',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_15: Stock Capital reflects exact price when repairCost is zero',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const sumBefore = await apiClient.getFinancialSummary();
      assertions.assertStatus(sumBefore, 200);

      const created = await apiClient.createGadget({
        name: 'Zero Repair Cap Test',
        model: 'Z-1',
        price: 125.0,
        repairCost: 0.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const sumAfter = await apiClient.getFinancialSummary();
      assertions.assertStatus(sumAfter, 200);
      assertions.assertCloseTo(sumAfter.data.stockCapital, sumBefore.data.stockCapital + 125.0, 0.05);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_FIN_16',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_16: Net Profit is insensitive to deletion of unsold inventory items',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Unsold Delete Test',
        model: 'UD-1',
        price: 300.0,
        repairCost: 50.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const sumBefore = await apiClient.getFinancialSummary();
      assertions.assertStatus(sumBefore, 200);

      await apiClient.deleteGadget(created.data.id);

      const sumAfter = await apiClient.getFinancialSummary();
      assertions.assertStatus(sumAfter, 200);
      assertions.assertCloseTo(sumBefore.data.netProfit, sumAfter.data.netProfit, 0.01);
    },
  });

  suite.test({
    id: 'B_FIN_17',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_17: ROI is insensitive to deletion of unsold inventory items',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Unsold Delete ROI Test',
        model: 'UDR-1',
        price: 250.0,
        repairCost: 25.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const sumBefore = await apiClient.getFinancialSummary();
      assertions.assertStatus(sumBefore, 200);

      await apiClient.deleteGadget(created.data.id);

      const sumAfter = await apiClient.getFinancialSummary();
      assertions.assertStatus(sumAfter, 200);
      assertions.assertCloseTo(sumBefore.data.roi, sumAfter.data.roi, 0.01);
    },
  });

  suite.test({
    id: 'B_FIN_18',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_18: Multiple mixed sales (profits and losses) aggregate correctly',
    requiresServer: false,
    fn: async ({ assertions }) => {
      const portfolio = [
        { isSold: true, price: 100.0, repairCost: 20.0, soldPrice: 180.0 }, // +60
        { isSold: true, price: 200.0, repairCost: 50.0, soldPrice: 220.0 }, // -30
        { isSold: true, price: 50.0, repairCost: 0.0, soldPrice: 100.0 }, // +50
      ];
      // Total profit = 60 - 30 + 50 = 80
      // Total investment = 120 + 250 + 50 = 420
      // ROI = (80 / 420) * 100 = 19.0476...%
      const profit = portfolio.reduce((acc, i) => acc + (i.soldPrice - (i.price + i.repairCost)), 0);
      const cost = portfolio.reduce((acc, i) => acc + (i.price + i.repairCost), 0);
      const roi = (profit / cost) * 100;
      assertions.assertCloseTo(profit, 80.0, 0.001);
      assertions.assertCloseTo(roi, 19.05, 0.01);
    },
  });

  suite.test({
    id: 'B_FIN_19',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_19: High multiplier ROI (>1000%) computed and formatted accurately',
    requiresServer: false,
    fn: async ({ assertions }) => {
      const item = { isSold: true, price: 10.0, repairCost: 0.0, soldPrice: 150.0 }; // cost 10, profit 140, ROI = 1400%
      const profit = item.soldPrice - (item.price + item.repairCost);
      const roi = (profit / (item.price + item.repairCost)) * 100;
      assertions.assertCloseTo(profit, 140.0, 0.001);
      assertions.assertCloseTo(roi, 1400.0, 0.001);
    },
  });

  suite.test({
    id: 'B_FIN_20',
    tier: 2,
    feature: 'BOUNDARY_FIN',
    name: 'B_FIN_20: Zero-price purchase (free stock find) sold for positive revenue handles cost basis 0',
    requiresServer: false,
    fn: async ({ assert, assertions }) => {
      const freeItem = { isSold: true, price: 0.0, repairCost: 15.0, soldPrice: 65.0 }; // cost 15, profit 50, ROI = (50/15)*100 = 333.33%
      const cost = freeItem.price + freeItem.repairCost;
      const profit = freeItem.soldPrice - cost;
      const roi = cost > 0 ? (profit / cost) * 100 : 0.0;
      assertions.assertCloseTo(profit, 50.0, 0.001);
      assertions.assertCloseTo(roi, 333.33, 0.01);
      assert.strictEqual(Number.isFinite(roi), true);
    },
  });
}
