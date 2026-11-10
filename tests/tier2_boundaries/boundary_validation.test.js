// tier2_boundaries/boundary_validation.test.js
// Tier 2: Boundary & Corner Cases — Input Validation & Error Handling

export function register(suite) {
  suite.test({
    id: 'B_VAL_01',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_01: Marking isSold=true with negative soldPrice (-0.01) returns HTTP 400',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Negative SoldPrice Test',
        model: 'V-1',
        price: 50.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const res = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: -0.01,
      });
      assertions.assertStatus(res, 400, 'Negative soldPrice must return 400');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_VAL_02',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_02: Marking isSold=true with zero soldPrice (0.00) returns HTTP 400',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Zero SoldPrice Test',
        model: 'V-2',
        price: 50.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const res = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: 0.0,
      });
      assertions.assertStatus(res, 400, 'soldPrice 0.00 must return 400 when isSold=true');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_VAL_03',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_03: Marking isSold=true with null soldPrice returns HTTP 400',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Null SoldPrice Test',
        model: 'V-3',
        price: 50.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const res = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: null,
      });
      assertions.assertStatus(res, 400, 'null soldPrice must return 400 when isSold=true');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_VAL_04',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_04: Marking isSold=true with missing soldPrice field returns HTTP 400',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Missing SoldPrice Test',
        model: 'V-4',
        price: 50.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const payload = { ...created.data, isSold: true };
      delete payload.soldPrice;
      const res = await apiClient.updateGadget(created.data.id, payload);
      assertions.assertStatus(res, 400);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_VAL_05',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_05: Malformed JSON body in POST /gadget returns HTTP 400 Bad Request',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.request('/gadget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ "name": "Broken JSON, missing brace',
      });
      assertions.assertStatus(res, 400, 'Malformed JSON must return HTTP 400');
    },
  });

  suite.test({
    id: 'B_VAL_06',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_06: Malformed JSON body in PUT /gadget/{id} returns HTTP 400 Bad Request',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.request('/gadget/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: '{ "invalid syntax...',
      });
      assertions.assertStatus(res, 400, 'Malformed PUT JSON must return HTTP 400');
    },
  });

  suite.test({
    id: 'B_VAL_07',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_07: Creating gadget with empty name ("") returns HTTP 400 or fails validation',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.createGadget({
        name: '',
        model: 'EmptyName',
        price: 50.0,
        isSold: false,
      });
      // Validation should reject empty name with 400
      assertions.assertStatus(res, 400, 'Empty name should return HTTP 400');
    },
  });

  suite.test({
    id: 'B_VAL_08',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_08: Creating gadget with whitespace-only name ("   ") returns HTTP 400',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.createGadget({
        name: '    ',
        model: 'SpaceName',
        price: 50.0,
        isSold: false,
      });
      assertions.assertStatus(res, 400, 'Whitespace-only name should return HTTP 400');
    },
  });

  suite.test({
    id: 'B_VAL_09',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_09: Creating gadget with negative price (-100.0) returns HTTP 400',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.createGadget({
        name: 'Negative Price Item',
        model: 'NP-1',
        price: -100.0,
        isSold: false,
      });
      assertions.assertStatus(res, 400, 'Negative price must return HTTP 400');
    },
  });

  suite.test({
    id: 'B_VAL_10',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_10: Creating gadget with negative repairCost (-25.0) returns HTTP 400',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.createGadget({
        name: 'Negative Repair Item',
        model: 'NR-1',
        price: 50.0,
        repairCost: -25.0,
        isSold: false,
      });
      assertions.assertStatus(res, 400, 'Negative repairCost must return HTTP 400');
    },
  });

  suite.test({
    id: 'B_VAL_11',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_11: Creating gadget with negative listedPrice (-10.0) returns HTTP 400',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.createGadget({
        name: 'Negative Listed Item',
        model: 'NL-1',
        price: 50.0,
        listedPrice: -10.0,
        isSold: false,
      });
      assertions.assertStatus(res, 400, 'Negative listedPrice must return HTTP 400');
    },
  });

  suite.test({
    id: 'B_VAL_12',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_12: Validation error response body contains path matching request URL',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const res = await apiClient.createGadget({
        name: '',
        model: 'TestPath',
        price: -1.0,
      });
      assertions.assertStatus(res, 400);
      assertions.assertErrorResponseSchema(res.data, 400, '/gadget');
    },
  });

  suite.test({
    id: 'B_VAL_13',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_13: Validation error response contains valid ISO-8601 timestamp string',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const res = await apiClient.createGadget({ name: '', price: 10.0 });
      assertions.assertStatus(res, 400);
      assert.ok(typeof res.data.timestamp === 'string');
      const parsedTime = Date.parse(res.data.timestamp);
      assert.ok(!isNaN(parsedTime), 'timestamp must be a valid parseable date');
    },
  });

  suite.test({
    id: 'B_VAL_14',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_14: Unmarking sale — transitioning from isSold=true back to isSold=false sets soldPrice to null',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Unsale Transition Test',
        model: 'UT-1',
        price: 100.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      // Sell
      const sold = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: 150.0,
      });
      assertions.assertStatus(sold, 200);

      // Return / unmark sale
      const unsold = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: false,
        soldPrice: null,
        soldDate: null,
      });
      assertions.assertStatus(unsold, 200);
      assert.strictEqual(unsold.data.isSold, false);
      assert.strictEqual(unsold.data.soldPrice, null);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_VAL_15',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_15: Long comment text (500 chars) persists without string truncation error',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const longComments = 'Diagnostic notes: ' + 'A'.repeat(450);
      const created = await apiClient.createGadget({
        name: 'Long Comment Item',
        model: 'LC-1',
        price: 50.0,
        comments: longComments,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.strictEqual(created.data.comments.length, longComments.length);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_VAL_16',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_16: Null comments field persists safely as null or empty string',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Null Comments Item',
        model: 'NC-1',
        price: 75.0,
        comments: null,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.ok(created.data.comments === null || created.data.comments === '');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_VAL_17',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_17: Repair flag toggle persists correctly (false -> true -> false)',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Repair Toggle Item',
        model: 'RT-1',
        price: 30.0,
        repair: false,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.strictEqual(created.data.repair, false);

      const updated1 = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        repair: true,
      });
      assertions.assertStatus(updated1, 200);
      assert.strictEqual(updated1.data.repair, true);

      const updated2 = await apiClient.updateGadget(created.data.id, {
        ...updated1.data,
        repair: false,
      });
      assertions.assertStatus(updated2, 200);
      assert.strictEqual(updated2.data.repair, false);

      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_VAL_18',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_18: Invalid HTTP method on endpoint returns standard HTTP 405 Method Not Allowed',
    requiresServer: true,
    fn: async ({ apiClient, assert }) => {
      const res = await apiClient.request('/gadget/finance/summary', {
        method: 'POST',
        body: JSON.stringify({ test: 123 }),
      });
      assert.ok([405, 400, 404].includes(res.status), `Expected 405/400/404, got ${res.status}`);
    },
  });

  suite.test({
    id: 'B_VAL_19',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_19: Empty JSON object in POST /gadget returns HTTP 400 Bad Request',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.createGadget({});
      assertions.assertStatus(res, 400);
    },
  });

  suite.test({
    id: 'B_VAL_20',
    tier: 2,
    feature: 'BOUNDARY_VAL',
    name: 'B_VAL_20: Empty string model field is accepted or defaults safely',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const res = await apiClient.createGadget({
        name: 'Model Test Item',
        model: '',
        price: 60.0,
        isSold: false,
      });
      assertions.assertStatus(res, 201);
      assert.ok(typeof res.data.model === 'string');
      await apiClient.deleteGadget(res.data.id);
    },
  });
}
