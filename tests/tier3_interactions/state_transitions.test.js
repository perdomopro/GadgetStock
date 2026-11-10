// tier3_interactions/state_transitions.test.js
// Tier 3: Cross-Feature Combinations — State Transitions & Consistency

export function register(suite) {
  suite.test({
    id: 'C_TRANS_01',
    tier: 3,
    feature: 'INTERACTION_TRANS',
    name: 'C_TRANS_01: Unsold -> Sold transition decrements availableItemsCount and increments soldItemsCount',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const sumBefore = await apiClient.getFinancialSummary();
      assertions.assertStatus(sumBefore, 200);

      const created = await apiClient.createGadget({
        name: 'Transition Count Test',
        model: 'TC-1',
        price: 50.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const sold = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: 80.0,
      });
      assertions.assertStatus(sold, 200);

      const sumAfter = await apiClient.getFinancialSummary();
      assertions.assertStatus(sumAfter, 200);
      assert.strictEqual(sumAfter.data.availableItemsCount, sumBefore.data.availableItemsCount);
      assert.strictEqual(sumAfter.data.soldItemsCount, sumBefore.data.soldItemsCount + 1);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'C_TRANS_02',
    tier: 3,
    feature: 'INTERACTION_TRANS',
    name: 'C_TRANS_02: Sold -> Unsold return workflow clears soldPrice, restores Stock Capital, and reverts Net Profit',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const initial = await apiClient.getFinancialSummary();
      assertions.assertStatus(initial, 200);

      // Buy & sell
      const created = await apiClient.createGadget({
        name: 'Returned Item Test',
        model: 'RET-1',
        price: 100.0,
        repairCost: 20.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const sold = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: 160.0,
      });
      assertions.assertStatus(sold, 200);

      // Customer return: revert back to isSold=false
      const returned = await apiClient.updateGadget(created.data.id, {
        ...sold.data,
        isSold: false,
        soldPrice: null,
        soldDate: null,
      });
      assertions.assertStatus(returned, 200);
      assert.strictEqual(returned.data.isSold, false);
      assert.strictEqual(returned.data.soldPrice, null);

      const finalSummary = await apiClient.getFinancialSummary();
      // Net Profit should revert to initial
      assertions.assertCloseTo(finalSummary.data.netProfit, initial.data.netProfit, 0.05);
      // Stock Capital should have the returned item (+120)
      assertions.assertCloseTo(finalSummary.data.stockCapital, initial.data.stockCapital + 120.0, 0.05);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'C_TRANS_03',
    tier: 3,
    feature: 'INTERACTION_TRANS',
    name: 'C_TRANS_03: Deleting available item decrements availableItemsCount with zero effect on sold metrics',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const sumBefore = await apiClient.getFinancialSummary();
      assertions.assertStatus(sumBefore, 200);

      const created = await apiClient.createGadget({
        name: 'Avail Delete Test',
        model: 'AD-1',
        price: 45.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      await apiClient.deleteGadget(created.data.id);

      const sumAfter = await apiClient.getFinancialSummary();
      assertions.assertStatus(sumAfter, 200);
      assert.strictEqual(sumAfter.data.soldItemsCount, sumBefore.data.soldItemsCount);
      assertions.assertCloseTo(sumAfter.data.netProfit, sumBefore.data.netProfit, 0.01);
      assertions.assertCloseTo(sumAfter.data.roi, sumBefore.data.roi, 0.01);
    },
  });

  suite.test({
    id: 'C_TRANS_04',
    tier: 3,
    feature: 'INTERACTION_TRANS',
    name: 'C_TRANS_04: Deleting sold item decrements soldItemsCount with zero effect on available stock capital',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const sumBefore = await apiClient.getFinancialSummary();
      assertions.assertStatus(sumBefore, 200);

      const created = await apiClient.createGadget({
        name: 'Sold Delete Test',
        model: 'SD-1',
        price: 50.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: 85.0,
      });

      await apiClient.deleteGadget(created.data.id);

      const sumAfter = await apiClient.getFinancialSummary();
      assertions.assertStatus(sumAfter, 200);
      assertions.assertCloseTo(sumAfter.data.stockCapital, sumBefore.data.stockCapital, 0.05);
      assert.strictEqual(sumAfter.data.availableItemsCount, sumBefore.data.availableItemsCount);
    },
  });

  suite.test({
    id: 'C_TRANS_05',
    tier: 3,
    feature: 'INTERACTION_TRANS',
    name: 'C_TRANS_05: Price adjustment on unsold item immediately updates Stock Capital by price delta',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Price Adjust Test',
        model: 'PA-1',
        price: 100.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const sum1 = await apiClient.getFinancialSummary();
      assertions.assertStatus(sum1, 200);

      // Increase price to 135 (+35)
      await apiClient.updateGadget(created.data.id, {
        ...created.data,
        price: 135.0,
      });

      const sum2 = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(sum2.data.stockCapital, sum1.data.stockCapital + 35.0, 0.05);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'C_TRANS_06',
    tier: 3,
    feature: 'INTERACTION_TRANS',
    name: 'C_TRANS_06: Retroactive cost adjustment on sold item updates Net Profit inversely',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      // Create and sell item: bought for 100, sold for 150 (profit 50)
      const created = await apiClient.createGadget({
        name: 'Retro Cost Test',
        model: 'RC-1',
        price: 100.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const sold = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: 150.0,
      });
      assertions.assertStatus(sold, 200);

      const sum1 = await apiClient.getFinancialSummary();
      assertions.assertStatus(sum1, 200);

      // Discovered additional repair invoice of $20 -> profit should drop from 50 to 30
      await apiClient.updateGadget(created.data.id, {
        ...sold.data,
        repairCost: 20.0,
      });

      const sum2 = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(sum2.data.netProfit, sum1.data.netProfit - 20.0, 0.05);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'C_TRANS_07',
    tier: 3,
    feature: 'INTERACTION_TRANS',
    name: 'C_TRANS_07: Sold price correction on sold item updates Net Profit proportionally',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Sold Price Correction Test',
        model: 'SPC-1',
        price: 100.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const sold = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: 140.0,
      });
      assertions.assertStatus(sold, 200);

      const sum1 = await apiClient.getFinancialSummary();
      assertions.assertStatus(sum1, 200);

      // Correct soldPrice from 140 to 160 (+20 revenue)
      await apiClient.updateGadget(created.data.id, {
        ...sold.data,
        soldPrice: 160.0,
      });

      const sum2 = await apiClient.getFinancialSummary();
      assertions.assertCloseTo(sum2.data.netProfit, sum1.data.netProfit + 20.0, 0.05);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'C_TRANS_08',
    tier: 3,
    feature: 'INTERACTION_TRANS',
    name: 'C_TRANS_08: Instant search consistency — Search immediately finds created gadget',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const uniqueName = `InstantSearch_${Date.now()}`;
      const created = await apiClient.createGadget({
        name: uniqueName,
        model: 'IS-1',
        price: 25.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const searchRes = await apiClient.findGadgetsByName(uniqueName);
      assertions.assertStatus(searchRes, 200);
      assert.ok(searchRes.data.some((g) => g.id === created.data.id));

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'C_TRANS_09',
    tier: 3,
    feature: 'INTERACTION_TRANS',
    name: 'C_TRANS_09: Instant delete consistency — Search immediately ceases returning deleted gadget',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const uniqueName = `DeleteSearch_${Date.now()}`;
      const created = await apiClient.createGadget({
        name: uniqueName,
        model: 'DS-1',
        price: 25.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      await apiClient.deleteGadget(created.data.id);

      const searchRes = await apiClient.findGadgetsByName(uniqueName);
      assertions.assertStatus(searchRes, 200);
      assert.strictEqual(searchRes.data.some((g) => g.id === created.data.id), false);
    },
  });

  suite.test({
    id: 'C_TRANS_10',
    tier: 3,
    feature: 'INTERACTION_TRANS',
    name: 'C_TRANS_10: Sequential update pipelining — 5 rapid updates on same entity maintain data integrity',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Pipeline Item',
        model: 'P0',
        price: 50.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      let current = created.data;
      for (let i = 1; i <= 5; i++) {
        const updateRes = await apiClient.updateGadget(created.data.id, {
          ...current,
          model: `P${i}`,
          price: 50.0 + i * 10,
        });
        assertions.assertStatus(updateRes, 200);
        current = updateRes.data;
      }

      assert.strictEqual(current.model, 'P5');
      assertions.assertCloseTo(current.price, 100.0, 0.001);

      await apiClient.deleteGadget(created.data.id);
    },
  });
}
