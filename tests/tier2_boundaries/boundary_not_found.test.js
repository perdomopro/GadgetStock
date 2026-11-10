// tier2_boundaries/boundary_not_found.test.js
// Tier 2: Boundary & Corner Cases — Entity Not Found (404) & Non-Existent Resources

export function register(suite) {
  suite.test({
    id: 'B_NF_01',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_01: GET /gadget/0 returns HTTP 404 Not Found',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.getGadgetById(0);
      assertions.assertStatus(res, 404);
      assertions.assertErrorResponseSchema(res.data, 404, '/gadget/0');
    },
  });

  suite.test({
    id: 'B_NF_02',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_02: GET /gadget/-1 with negative ID returns HTTP 404 or 400',
    requiresServer: true,
    fn: async ({ apiClient, assert }) => {
      const res = await apiClient.getGadgetById(-1);
      assert.ok([404, 400].includes(res.status), `Expected 404 or 400, got ${res.status}`);
    },
  });

  suite.test({
    id: 'B_NF_03',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_03: GET /gadget/2147483647 (Integer.MAX_VALUE) returns HTTP 404 Not Found',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.getGadgetById(2147483647);
      assertions.assertStatus(res, 404);
      assertions.assertErrorResponseSchema(res.data, 404, '/gadget/2147483647');
    },
  });

  suite.test({
    id: 'B_NF_04',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_04: GET /gadget/non-numeric-id returns HTTP 400 or 404 (type mismatch)',
    requiresServer: true,
    fn: async ({ apiClient, assert }) => {
      const res = await apiClient.request('/gadget/not-a-number');
      assert.ok([400, 404].includes(res.status), `Expected 400 or 404 for non-numeric ID, got ${res.status}`);
    },
  });

  suite.test({
    id: 'B_NF_05',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_05: PUT /gadget/0 returns HTTP 404 Not Found',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.updateGadget(0, {
        name: 'Ghost Item',
        model: 'None',
        price: 50.0,
        isSold: false,
      });
      assertions.assertStatus(res, 404);
      assertions.assertErrorResponseSchema(res.data, 404, '/gadget/0');
    },
  });

  suite.test({
    id: 'B_NF_06',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_06: PUT /gadget/-99 with negative ID returns HTTP 404 or 400',
    requiresServer: true,
    fn: async ({ apiClient, assert }) => {
      const res = await apiClient.updateGadget(-99, {
        name: 'Negative ID Update',
        model: 'None',
        price: 50.0,
        isSold: false,
      });
      assert.ok([404, 400].includes(res.status));
    },
  });

  suite.test({
    id: 'B_NF_07',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_07: PUT /gadget/999999999 returns HTTP 404 Not Found',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.updateGadget(999999999, {
        name: 'Large Ghost ID',
        model: 'None',
        price: 50.0,
        isSold: false,
      });
      assertions.assertStatus(res, 404);
      assertions.assertErrorResponseSchema(res.data, 404, '/gadget/999999999');
    },
  });

  suite.test({
    id: 'B_NF_08',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_08: DELETE /gadget/delete/0 returns HTTP 404 Not Found',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.deleteGadget(0);
      assertions.assertStatus(res, 404);
      assertions.assertErrorResponseSchema(res.data, 404, '/gadget/delete/0');
    },
  });

  suite.test({
    id: 'B_NF_09',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_09: DELETE /gadget/delete/-5 returns HTTP 404 or 400',
    requiresServer: true,
    fn: async ({ apiClient, assert }) => {
      const res = await apiClient.deleteGadget(-5);
      assert.ok([404, 400].includes(res.status));
    },
  });

  suite.test({
    id: 'B_NF_10',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_10: DELETE /gadget/delete/2147483647 returns HTTP 404 Not Found',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.deleteGadget(2147483647);
      assertions.assertStatus(res, 404);
      assertions.assertErrorResponseSchema(res.data, 404, '/gadget/delete/2147483647');
    },
  });

  suite.test({
    id: 'B_NF_11',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_11: DELETE /gadget/delete/invalid-string returns HTTP 400 or 404',
    requiresServer: true,
    fn: async ({ apiClient, assert }) => {
      const res = await apiClient.request('/gadget/delete/string-id', { method: 'DELETE' });
      assert.ok([400, 404].includes(res.status));
    },
  });

  suite.test({
    id: 'B_NF_12',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_12: GET /gadget/find?name=NonExistentGadgetNameXYZ returns empty array []',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const res = await apiClient.findGadgetsByName('NonExistentGadgetNameXYZ_987654');
      assertions.assertStatus(res, 200, 'Search with no matches must return 200 with empty array');
      assert.ok(Array.isArray(res.data), 'Result must be an array');
      assert.strictEqual(res.data.length, 0, 'Array must be empty');
    },
  });

  suite.test({
    id: 'B_NF_13',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_13: GET /gadget/find without query parameter does not trigger 500 server error',
    requiresServer: true,
    fn: async ({ apiClient, assert }) => {
      const res = await apiClient.request('/gadget/find');
      assert.ok([200, 400].includes(res.status), `Expected 200 or 400, got ${res.status}`);
    },
  });

  suite.test({
    id: 'B_NF_14',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_14: Unknown root sub-route /gadget/nonexistent/subpath returns HTTP 404',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.request('/gadget/nonexistent/subpath');
      assertions.assertStatus(res, 404);
    },
  });

  suite.test({
    id: 'B_NF_15',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_15: 404 response payload includes error field with "Not Found"',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const res = await apiClient.getGadgetById(7777777);
      assertions.assertStatus(res, 404);
      assert.ok(/Not Found/i.test(res.data.error || ''));
    },
  });

  suite.test({
    id: 'B_NF_16',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_16: Repeated 404 lookups do not perturb subsequent valid queries',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      // Multiple 404 requests
      for (let i = 0; i < 5; i++) {
        const res = await apiClient.getGadgetById(900000 + i);
        assertions.assertStatus(res, 404);
      }
      // Followed by valid request
      const listRes = await apiClient.getGadgets();
      assertions.assertStatus(listRes, 200);
    },
  });

  suite.test({
    id: 'B_NF_17',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_17: Searching for deleted item name does not return deleted record',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const name = `TransientSearchItem_${Date.now()}`;
      const created = await apiClient.createGadget({
        name,
        model: 'TS-1',
        price: 45.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      await apiClient.deleteGadget(created.data.id);

      const searchRes = await apiClient.findGadgetsByName(name);
      assertions.assertStatus(searchRes, 200);
      const found = searchRes.data.some((g) => g.id === created.data.id);
      assert.strictEqual(found, false, 'Deleted item should not be found by search');
    },
  });

  suite.test({
    id: 'B_NF_18',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_18: 404 response body has JSON Content-Type header',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const res = await apiClient.getGadgetById(9999991);
      assertions.assertStatus(res, 404);
      const contentType = res.headers.get('content-type') || '';
      assert.ok(contentType.includes('application/json'), `Expected application/json header, got ${contentType}`);
    },
  });

  suite.test({
    id: 'B_NF_19',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_19: Deleting item removes it from financial summary availableItemsCount without 404',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const before = await apiClient.getFinancialSummary();
      assertions.assertStatus(before, 200);

      const created = await apiClient.createGadget({
        name: 'Count Drop Test',
        model: 'CD-1',
        price: 20.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      await apiClient.deleteGadget(created.data.id);

      const after = await apiClient.getFinancialSummary();
      assertions.assertStatus(after, 200);
      assert.strictEqual(after.data.availableItemsCount, before.data.availableItemsCount);
    },
  });

  suite.test({
    id: 'B_NF_20',
    tier: 2,
    feature: 'BOUNDARY_NF',
    name: 'B_NF_20: Updating non-existent entity with valid body returns 404 rather than creating entity',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.updateGadget(9898989, {
        name: 'Should Not Upsert',
        model: 'UpsertCheck',
        price: 100.0,
        isSold: false,
      });
      assertions.assertStatus(res, 404, 'PUT on unknown ID must not blindly upsert; must return 404');
    },
  });
}
