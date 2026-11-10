// tier1_features/f12_to_f13_crud_endpoints.test.js
// Tests for Features 12 and 13: Inventory Query Endpoints & Gadget Deletion Endpoint

export function register(suite) {
  // =========================================================================
  // Feature 12: Inventory Query Endpoints
  // =========================================================================
  suite.test({
    id: 'F12_T1',
    tier: 1,
    feature: 'F12',
    name: 'F12: Verifies GET /gadget returns array conforming to GadgetModel schema',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const res = await apiClient.getGadgets();
      assertions.assertStatus(res, 200);
      assert.ok(Array.isArray(res.data), 'Expected array response from GET /gadget');
      if (res.data.length > 0) {
        assertions.assertGadgetModelSchema(res.data[0], 'GET /gadget[0]');
      }
    },
  });

  suite.test({
    id: 'F12_T2',
    tier: 1,
    feature: 'F12',
    name: 'F12: Verifies GET /gadget/{id} fetches single gadget matching exact ID',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Single Query Test',
        model: 'SQ-1',
        price: 95.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const res = await apiClient.getGadgetById(created.data.id);
      assertions.assertStatus(res, 200);
      assert.strictEqual(res.data.id, created.data.id);
      assert.strictEqual(res.data.name, 'Single Query Test');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F12_T3',
    tier: 1,
    feature: 'F12',
    name: 'F12: Verifies GET /gadget/find?name= searches inventory by name substring',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const uniqueName = `UniqueSearchItem_${Date.now()}`;
      const created = await apiClient.createGadget({
        name: uniqueName,
        model: 'SearchModel',
        price: 130.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      const res = await apiClient.findGadgetsByName(uniqueName.substring(0, 12));
      assertions.assertStatus(res, 200);
      assert.ok(Array.isArray(res.data), 'Search should return array');
      const found = res.data.some((g) => g.id === created.data.id);
      assert.ok(found, `Expected to find item with name containing '${uniqueName.substring(0, 12)}'`);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F12_T4',
    tier: 1,
    feature: 'F12',
    name: 'F12: Verifies GET /gadget/gadgets-sold returns only items with isSold=true',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const res = await apiClient.getSoldGadgets();
      assertions.assertStatus(res, 200);
      assert.ok(Array.isArray(res.data), 'GET /gadget/gadgets-sold must return array');
      for (const item of res.data) {
        assert.strictEqual(item.isSold, true, `Item ID ${item.id} in gadgets-sold has isSold != true`);
      }
    },
  });

  suite.test({
    id: 'F12_T5',
    tier: 1,
    feature: 'F12',
    name: 'F12: Verifies inventory query handles special characters and URL encoding in search term',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const name = `Special & Cool + Gadget #${Date.now() % 1000}`;
      const created = await apiClient.createGadget({
        name,
        model: 'EncodingCheck',
        price: 45.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const searchRes = await apiClient.findGadgetsByName('Special & Cool');
      assertions.assertStatus(searchRes, 200);
      assert.ok(Array.isArray(searchRes.data));
      await apiClient.deleteGadget(created.data.id);
    },
  });

  // =========================================================================
  // Feature 13: Gadget Deletion Endpoint
  // =========================================================================
  suite.test({
    id: 'F13_T1',
    tier: 1,
    feature: 'F13',
    name: 'F13: Verifies DELETE /gadget/delete/{id} successfully deletes existing item',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'To Delete',
        model: 'Temp',
        price: 25.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const delRes = await apiClient.deleteGadget(created.data.id);
      assert.ok([200, 204].includes(delRes.status), `Expected 200 or 204 on delete, got ${delRes.status}`);
    },
  });

  suite.test({
    id: 'F13_T2',
    tier: 1,
    feature: 'F13',
    name: 'F13: Verifies subsequent GET /gadget/{id} for deleted item returns HTTP 404',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Delete Verify',
        model: 'Check404',
        price: 30.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      await apiClient.deleteGadget(created.data.id);
      const getRes = await apiClient.getGadgetById(created.data.id);
      assertions.assertStatus(getRes, 404, 'Deleted item must return 404');
    },
  });

  suite.test({
    id: 'F13_T3',
    tier: 1,
    feature: 'F13',
    name: 'F13: Verifies deleted item is removed from GET /gadget general inventory',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'List Removal Check',
        model: 'Removal',
        price: 60.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      await apiClient.deleteGadget(created.data.id);
      const listRes = await apiClient.getGadgets();
      assertions.assertStatus(listRes, 200);
      const found = listRes.data.some((g) => g.id === created.data.id);
      assert.strictEqual(found, false, 'Deleted item should not appear in GET /gadget list');
    },
  });

  suite.test({
    id: 'F13_T4',
    tier: 1,
    feature: 'F13',
    name: 'F13: Verifies deleting a sold gadget removes it from GET /gadget/gadgets-sold',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Sold Delete Check',
        model: 'SoldDel',
        price: 50.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const sold = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: 100.0,
      });
      assertions.assertStatus(sold, 200);

      await apiClient.deleteGadget(created.data.id);
      const soldList = await apiClient.getSoldGadgets();
      assertions.assertStatus(soldList, 200);
      const found = soldList.data.some((g) => g.id === created.data.id);
      assert.strictEqual(found, false, 'Deleted sold item should not appear in gadgets-sold list');
    },
  });

  suite.test({
    id: 'F13_T5',
    tier: 1,
    feature: 'F13',
    name: 'F13: Verifies deleting an already deleted ID returns HTTP 404 Not Found',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Double Delete Check',
        model: 'DD-1',
        price: 40.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      await apiClient.deleteGadget(created.data.id);
      // Second deletion attempt
      const secondDel = await apiClient.deleteGadget(created.data.id);
      assertions.assertStatus(secondDel, 404, 'Deleting already deleted entity should return 404');
    },
  });
}
