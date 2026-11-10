// tier1_features/f06_to_f08_model_fields.test.js
// Tests for Features 6 through 8: Category, Repair Cost, Listed Price fields

export function register(suite) {
  // =========================================================================
  // Feature 6: Category Field
  // =========================================================================
  suite.test({
    id: 'F06_T1',
    tier: 1,
    feature: 'F06',
    name: 'F06: Verifies GadgetModel source declares category field',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const sources = repoInspector.getBackendSourceFiles();
      const modelPath = sources.find((f) => f.includes('GadgetModel.java'));
      assert.ok(modelPath, 'GadgetModel.java must exist');
      const content = repoInspector.readFile(modelPath.replace(repoInspector.config?.projectRoot || '', ''));
      assert.ok(
        /String\s+category/i.test(content || ''),
        'GadgetModel must declare String category field'
      );
    },
  });

  suite.test({
    id: 'F06_T2',
    tier: 1,
    feature: 'F06',
    name: 'F06: Verifies POST /gadget accepts and echoes category field',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const payload = {
        name: 'Test Gadget F06',
        model: 'Alpha',
        category: 'Smartphones',
        price: 150.0,
        repairCost: 20.0,
        repair: false,
        isSold: false,
      };
      const res = await apiClient.createGadget(payload);
      assertions.assertStatus(res, 201, 'POST /gadget should return 201 Created');
      assert.strictEqual(res.data.category, 'Smartphones');
      // Cleanup
      if (res.data?.id) await apiClient.deleteGadget(res.data.id);
    },
  });

  suite.test({
    id: 'F06_T3',
    tier: 1,
    feature: 'F06',
    name: 'F06: Verifies GET /gadget/{id} includes category in JSON response',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const payload = {
        name: 'Category Query Test',
        model: 'Beta',
        category: 'Audio',
        price: 80.0,
        repair: false,
        isSold: false,
      };
      const created = await apiClient.createGadget(payload);
      assertions.assertStatus(created, 201);
      const res = await apiClient.getGadgetById(created.data.id);
      assertions.assertStatus(res, 200);
      assert.strictEqual(res.data.category, 'Audio');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F06_T4',
    tier: 1,
    feature: 'F06',
    name: 'F06: Verifies PUT /gadget/{id} persists updated category string',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Category Update Test',
        model: 'Gamma',
        category: 'OldCategory',
        price: 100.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const updatePayload = {
        ...created.data,
        category: 'Consoles',
      };
      const updated = await apiClient.updateGadget(created.data.id, updatePayload);
      assertions.assertStatus(updated, 200);
      assert.strictEqual(updated.data.category, 'Consoles');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F06_T5',
    tier: 1,
    feature: 'F06',
    name: 'F06: Verifies category supports various industry secondhand classifications',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const categories = ['Laptops', 'Tablets', 'Gaming Consoles', 'Smartwatches'];
      for (const cat of categories) {
        const res = await apiClient.createGadget({
          name: `Category Test ${cat}`,
          model: 'Generic',
          category: cat,
          price: 50.0,
          isSold: false,
        });
        assertions.assertStatus(res, 201);
        assert.strictEqual(res.data.category, cat);
        await apiClient.deleteGadget(res.data.id);
      }
    },
  });

  // =========================================================================
  // Feature 7: Repair Cost Field
  // =========================================================================
  suite.test({
    id: 'F07_T1',
    tier: 1,
    feature: 'F07',
    name: 'F07: Verifies GadgetModel source declares repairCost numeric field with default 0',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const sources = repoInspector.getBackendSourceFiles();
      const modelPath = sources.find((f) => f.includes('GadgetModel.java'));
      assert.ok(modelPath, 'GadgetModel.java must exist');
      const content = repoInspector.readFile(modelPath.replace(repoInspector.config?.projectRoot || '', ''));
      assert.ok(
        /(BigDecimal|Double|double)\s+repairCost/i.test(content || ''),
        'GadgetModel must declare numeric repairCost field'
      );
    },
  });

  suite.test({
    id: 'F07_T2',
    tier: 1,
    feature: 'F07',
    name: 'F07: Verifies POST /gadget defaults repairCost to 0.0 when omitted or null',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const payload = {
        name: 'RepairCost Default Test',
        model: 'ZeroCheck',
        category: 'Accessories',
        price: 40.0,
        isSold: false,
      };
      const res = await apiClient.createGadget(payload);
      assertions.assertStatus(res, 201);
      assert.ok(typeof res.data.repairCost === 'number', 'repairCost must be number');
      assert.strictEqual(Number(res.data.repairCost), 0.0, 'Omitted repairCost should default to 0.0');
      await apiClient.deleteGadget(res.data.id);
    },
  });

  suite.test({
    id: 'F07_T3',
    tier: 1,
    feature: 'F07',
    name: 'F07: Verifies POST /gadget persists explicit decimal repairCost (e.g. 45.50)',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const payload = {
        name: 'RepairCost Explicit Test',
        model: 'ScreenFix',
        category: 'Smartphones',
        price: 120.0,
        repairCost: 45.5,
        repair: true,
        isSold: false,
      };
      const res = await apiClient.createGadget(payload);
      assertions.assertStatus(res, 201);
      assertions.assertCloseTo(res.data.repairCost, 45.5, 0.001);
      await apiClient.deleteGadget(res.data.id);
    },
  });

  suite.test({
    id: 'F07_T4',
    tier: 1,
    feature: 'F07',
    name: 'F07: Verifies PUT /gadget/{id} updates repairCost independently',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'RepairCost Update Test',
        model: 'BatteryMod',
        price: 200.0,
        repairCost: 10.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const updatePayload = {
        ...created.data,
        repairCost: 65.25,
        repair: true,
      };
      const updated = await apiClient.updateGadget(created.data.id, updatePayload);
      assertions.assertStatus(updated, 200);
      assertions.assertCloseTo(updated.data.repairCost, 65.25, 0.001);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F07_T5',
    tier: 1,
    feature: 'F07',
    name: 'F07: Verifies repairCost is serialized as JSON number rather than string',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const res = await apiClient.createGadget({
        name: 'RepairCost Type Test',
        model: 'TypeCheck',
        price: 90.0,
        repairCost: 35.0,
        isSold: false,
      });
      assertions.assertStatus(res, 201);
      assert.strictEqual(typeof res.data.repairCost, 'number', 'repairCost must serialize as JSON number');
      await apiClient.deleteGadget(res.data.id);
    },
  });

  // =========================================================================
  // Feature 8: Listed Price Field
  // =========================================================================
  suite.test({
    id: 'F08_T1',
    tier: 1,
    feature: 'F08',
    name: 'F08: Verifies GadgetModel source declares listedPrice field',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const sources = repoInspector.getBackendSourceFiles();
      const modelPath = sources.find((f) => f.includes('GadgetModel.java'));
      assert.ok(modelPath, 'GadgetModel.java must exist');
      const content = repoInspector.readFile(modelPath.replace(repoInspector.config?.projectRoot || '', ''));
      assert.ok(
        /(BigDecimal|Double|double)\s+listedPrice/i.test(content || ''),
        'GadgetModel must declare numeric listedPrice field'
      );
    },
  });

  suite.test({
    id: 'F08_T2',
    tier: 1,
    feature: 'F08',
    name: 'F08: Verifies POST /gadget allows null listedPrice when item is unlisted',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const payload = {
        name: 'Unlisted Gadget Test',
        model: 'Draft',
        price: 150.0,
        listedPrice: null,
        isSold: false,
      };
      const res = await apiClient.createGadget(payload);
      assertions.assertStatus(res, 201);
      assert.strictEqual(res.data.listedPrice, null);
      await apiClient.deleteGadget(res.data.id);
    },
  });

  suite.test({
    id: 'F08_T3',
    tier: 1,
    feature: 'F08',
    name: 'F08: Verifies POST /gadget persists explicit asking listedPrice (e.g. 299.99)',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const payload = {
        name: 'Listed Gadget Test',
        model: 'MarketReady',
        price: 150.0,
        listedPrice: 299.99,
        isSold: false,
      };
      const res = await apiClient.createGadget(payload);
      assertions.assertStatus(res, 201);
      assertions.assertCloseTo(res.data.listedPrice, 299.99, 0.001);
      await apiClient.deleteGadget(res.data.id);
    },
  });

  suite.test({
    id: 'F08_T4',
    tier: 1,
    feature: 'F08',
    name: 'F08: Verifies PUT /gadget/{id} updates listedPrice when asking price changes',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Price Drop Test',
        model: 'MarketEdit',
        price: 100.0,
        listedPrice: 200.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const updatePayload = {
        ...created.data,
        listedPrice: 179.99,
      };
      const updated = await apiClient.updateGadget(created.data.id, updatePayload);
      assertions.assertStatus(updated, 200);
      assertions.assertCloseTo(updated.data.listedPrice, 179.99, 0.001);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F08_T5',
    tier: 1,
    feature: 'F08',
    name: 'F08: Verifies listedPrice is present in GET /gadget inventory queries',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'List Query Test',
        model: 'CheckPresence',
        price: 80.0,
        listedPrice: 120.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const list = await apiClient.getGadgets();
      assertions.assertStatus(list, 200);
      const found = list.data.find((g) => g.id === created.data.id);
      assert.ok(found, 'Created gadget must be in inventory list');
      assertions.assertCloseTo(found.listedPrice, 120.0, 0.001);
      await apiClient.deleteGadget(created.data.id);
    },
  });
}
