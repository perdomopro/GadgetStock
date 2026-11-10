// tier1_features/f09_to_f11_api_validation.test.js
// Tests for Features 9 through 11: Full Entity Update PUT, Null-Safe Sale Validation, Global Exception Handler

export function register(suite) {
  // =========================================================================
  // Feature 9: Full Entity Update PUT
  // =========================================================================
  suite.test({
    id: 'F09_T1',
    tier: 1,
    feature: 'F09',
    name: 'F09: Verifies PUT /gadget/{id} updates core attributes (name, model, price)',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Initial Name',
        model: 'Base Model',
        price: 100.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const updatePayload = {
        ...created.data,
        name: 'Updated Name',
        model: 'Pro Model',
        price: 140.0,
      };
      const updated = await apiClient.updateGadget(created.data.id, updatePayload);
      assertions.assertStatus(updated, 200);
      assert.strictEqual(updated.data.name, 'Updated Name');
      assert.strictEqual(updated.data.model, 'Pro Model');
      assertions.assertCloseTo(updated.data.price, 140.0);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F09_T2',
    tier: 1,
    feature: 'F09',
    name: 'F09: Verifies PUT /gadget/{id} correctly updates isSold, soldPrice, and soldDate',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Sale Persistence Test',
        model: 'ToSell',
        price: 80.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const saleDate = new Date().toISOString();
      const updatePayload = {
        ...created.data,
        isSold: true,
        soldPrice: 150.0,
        soldDate: saleDate,
      };
      const updated = await apiClient.updateGadget(created.data.id, updatePayload);
      assertions.assertStatus(updated, 200);
      assert.strictEqual(updated.data.isSold, true);
      assertions.assertCloseTo(updated.data.soldPrice, 150.0);
      assert.ok(updated.data.soldDate !== null);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F09_T3',
    tier: 1,
    feature: 'F09',
    name: 'F09: Verifies PUT /gadget/{id} persists category, repairCost, and listedPrice together',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Multi Field PUT',
        model: 'V1',
        price: 50.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const updatePayload = {
        ...created.data,
        category: 'Wearables',
        repairCost: 15.0,
        listedPrice: 85.0,
      };
      const updated = await apiClient.updateGadget(created.data.id, updatePayload);
      assertions.assertStatus(updated, 200);
      assert.strictEqual(updated.data.category, 'Wearables');
      assertions.assertCloseTo(updated.data.repairCost, 15.0);
      assertions.assertCloseTo(updated.data.listedPrice, 85.0);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F09_T4',
    tier: 1,
    feature: 'F09',
    name: 'F09: Verifies PUT /gadget/{id} updates repair status and comments notes',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Repair Status PUT',
        model: 'Defective',
        price: 70.0,
        repair: false,
        comments: 'Needs diagnostic',
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const updatePayload = {
        ...created.data,
        repair: true,
        comments: 'Diagnostics finished, motherboard cleaned',
      };
      const updated = await apiClient.updateGadget(created.data.id, updatePayload);
      assertions.assertStatus(updated, 200);
      assert.strictEqual(updated.data.repair, true);
      assert.strictEqual(updated.data.comments, 'Diagnostics finished, motherboard cleaned');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F09_T5',
    tier: 1,
    feature: 'F09',
    name: 'F09: Verifies PUT response conforms to GadgetModel JSON schema',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Schema Verification PUT',
        model: 'FullSchema',
        price: 110.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const updated = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        comments: 'Schema checked',
      });
      assertions.assertStatus(updated, 200);
      assertions.assertGadgetModelSchema(updated.data, 'PUT /gadget/{id}');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  // =========================================================================
  // Feature 10: Null-Safe Sale Validation
  // =========================================================================
  suite.test({
    id: 'F10_T1',
    tier: 1,
    feature: 'F10',
    name: 'F10: Verifies marking item as sold with soldPrice <= 0 returns HTTP 400',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Zero SoldPrice Test',
        model: 'ZeroCheck',
        price: 90.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const invalidUpdate = {
        ...created.data,
        isSold: true,
        soldPrice: 0.0,
      };
      const res = await apiClient.updateGadget(created.data.id, invalidUpdate);
      assertions.assertStatus(res, 400, 'soldPrice <= 0 when isSold=true must return HTTP 400');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F10_T2',
    tier: 1,
    feature: 'F10',
    name: 'F10: Verifies marking item as sold with null soldPrice returns HTTP 400',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Null SoldPrice Test',
        model: 'NullCheck',
        price: 90.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const invalidUpdate = {
        ...created.data,
        isSold: true,
        soldPrice: null,
      };
      const res = await apiClient.updateGadget(created.data.id, invalidUpdate);
      assertions.assertStatus(res, 400, 'null soldPrice when isSold=true must return HTTP 400');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F10_T3',
    tier: 1,
    feature: 'F10',
    name: 'F10: Verifies marking item as sold without soldDate automatically assigns timestamp',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Auto SoldDate Test',
        model: 'AutoDate',
        price: 80.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const validSale = {
        ...created.data,
        isSold: true,
        soldPrice: 130.0,
        soldDate: null, // Should be auto-set by backend
      };
      const updated = await apiClient.updateGadget(created.data.id, validSale);
      assertions.assertStatus(updated, 200);
      assert.strictEqual(updated.data.isSold, true);
      assert.ok(updated.data.soldDate !== null, 'soldDate should be auto-set when omitted on sale');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F10_T4',
    tier: 1,
    feature: 'F10',
    name: 'F10: Verifies updating unsold item (isSold=false) succeeds with null soldPrice',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Unsold Null Price Test',
        model: 'Normal',
        price: 50.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const updated = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        name: 'Renamed Still Unsold',
        soldPrice: null,
      });
      assertions.assertStatus(updated, 200);
      assert.strictEqual(updated.data.isSold, false);
      assert.strictEqual(updated.data.soldPrice, null);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'F10_T5',
    tier: 1,
    feature: 'F10',
    name: 'F10: Verifies HTTP 400 error body gives descriptive message for invalid sale',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Validation Msg Test',
        model: 'MsgCheck',
        price: 100.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const res = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        isSold: true,
        soldPrice: -50.0,
      });
      assertions.assertStatus(res, 400);
      assertions.assertErrorResponseSchema(res.data, 400, `/gadget/${created.data.id}`);
      assert.ok(
        /sold\s*price|greater than 0|invalid/i.test(res.data.message),
        `Error message should explain soldPrice requirement, got: ${res.data.message}`
      );
      await apiClient.deleteGadget(created.data.id);
    },
  });

  // =========================================================================
  // Feature 11: Global Exception Handler
  // =========================================================================
  suite.test({
    id: 'F11_T1',
    tier: 1,
    feature: 'F11',
    name: 'F11: Verifies GlobalExceptionHandler Java class exists with RestControllerAdvice annotation',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const sources = repoInspector.getBackendSourceFiles();
      const handlerPath = sources.find((f) => f.includes('GlobalExceptionHandler.java'));
      assert.ok(handlerPath, 'GlobalExceptionHandler.java must exist');
      const content = repoInspector.readFile(handlerPath.replace(repoInspector.config?.projectRoot || '', ''));
      assert.ok(
        /@RestControllerAdvice|@ControllerAdvice/i.test(content || ''),
        'GlobalExceptionHandler must be annotated with @RestControllerAdvice or @ControllerAdvice'
      );
    },
  });

  suite.test({
    id: 'F11_T2',
    tier: 1,
    feature: 'F11',
    name: 'F11: Verifies GET /gadget/{id} for non-existent ID returns HTTP 404 Not Found',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.getGadgetById(9999999);
      assertions.assertStatus(res, 404, 'Non-existent ID must return HTTP 404');
      assertions.assertErrorResponseSchema(res.data, 404, '/gadget/9999999');
    },
  });

  suite.test({
    id: 'F11_T3',
    tier: 1,
    feature: 'F11',
    name: 'F11: Verifies PUT /gadget/{id} for non-existent ID returns HTTP 404 Not Found',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.updateGadget(9999999, {
        name: 'Ghost Item',
        model: 'None',
        price: 100.0,
        isSold: false,
      });
      assertions.assertStatus(res, 404, 'PUT on non-existent ID must return HTTP 404');
      assertions.assertErrorResponseSchema(res.data, 404, '/gadget/9999999');
    },
  });

  suite.test({
    id: 'F11_T4',
    tier: 1,
    feature: 'F11',
    name: 'F11: Verifies DELETE /gadget/delete/{id} for non-existent ID returns HTTP 404 Not Found',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const res = await apiClient.deleteGadget(9999999);
      assertions.assertStatus(res, 404, 'DELETE on non-existent ID must return HTTP 404');
      assertions.assertErrorResponseSchema(res.data, 404, '/gadget/delete/9999999');
    },
  });

  suite.test({
    id: 'F11_T5',
    tier: 1,
    feature: 'F11',
    name: 'F11: Verifies error response contract fields (timestamp, status, error, message, path)',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const res = await apiClient.getGadgetById(8888888);
      assertions.assertStatus(res, 404);
      const err = res.data;
      assert.ok(typeof err.timestamp === 'string');
      assert.strictEqual(err.status, 404);
      assert.ok(typeof err.error === 'string');
      assert.ok(typeof err.message === 'string' && err.message.length > 0);
      assert.ok(typeof err.path === 'string' && err.path.includes('8888888'));
    },
  });
}
