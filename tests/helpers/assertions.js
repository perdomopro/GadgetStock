// helpers/assertions.js — Assertion Utilities for GadgetStock E2E Test Suite
import assert from 'node:assert';

export function assertStatus(response, expectedStatus, context = '') {
  const actual = response.status;
  assert.strictEqual(
    actual,
    expectedStatus,
    `[HTTP Status Mismatch] Expected HTTP ${expectedStatus} but got ${actual}. Context: ${context}`
  );
}

export function assertCloseTo(actual, expected, delta = 0.01, message = '') {
  const diff = Math.abs(Number(actual) - Number(expected));
  assert.ok(
    diff <= delta,
    `[Number CloseTo Mismatch] ${message} Expected ${expected} +/- ${delta}, but received ${actual} (diff: ${diff})`
  );
}

export function assertGadgetModelSchema(gadget, context = 'GadgetModel') {
  assert.ok(gadget && typeof gadget === 'object', `${context}: Expected object, got ${typeof gadget}`);
  assert.ok(typeof gadget.id === 'number', `${context}: id must be a number, got ${typeof gadget.id}`);
  assert.ok(typeof gadget.name === 'string' && gadget.name.length > 0, `${context}: name must be non-empty string`);
  assert.ok(typeof gadget.model === 'string', `${context}: model must be string`);
  assert.ok(typeof gadget.category === 'string', `${context}: category must be string`);
  assert.ok(typeof gadget.price === 'number', `${context}: price must be number`);
  assert.ok(typeof gadget.repairCost === 'number', `${context}: repairCost must be number`);
  assert.ok(
    gadget.listedPrice === null || typeof gadget.listedPrice === 'number',
    `${context}: listedPrice must be null or number`
  );
  assert.ok(typeof gadget.comments === 'string' || gadget.comments === null, `${context}: comments must be string or null`);
  assert.ok(typeof gadget.repair === 'boolean', `${context}: repair must be boolean`);
  assert.ok(typeof gadget.isSold === 'boolean', `${context}: isSold must be boolean`);
  assert.ok(
    gadget.soldPrice === null || typeof gadget.soldPrice === 'number',
    `${context}: soldPrice must be null or number`
  );
  assert.ok(
    typeof gadget.registerDate === 'string' || gadget.registerDate === null,
    `${context}: registerDate must be string or null`
  );
  assert.ok(
    gadget.soldDate === null || typeof gadget.soldDate === 'string',
    `${context}: soldDate must be null or string`
  );
}

export function assertFinancialSummarySchema(summary, context = 'FinancialSummary') {
  assert.ok(summary && typeof summary === 'object', `${context}: Expected summary object`);
  assert.ok(typeof summary.stockCapital === 'number', `${context}: stockCapital must be number`);
  assert.ok(typeof summary.netProfit === 'number', `${context}: netProfit must be number`);
  assert.ok(typeof summary.roi === 'number', `${context}: roi must be number`);
  assert.ok(Number.isInteger(summary.soldItemsCount), `${context}: soldItemsCount must be integer`);
  assert.ok(Number.isInteger(summary.availableItemsCount), `${context}: availableItemsCount must be integer`);
}

export function assertErrorResponseSchema(errorObj, expectedStatus, expectedPath = null, context = 'ErrorResponse') {
  assert.ok(errorObj && typeof errorObj === 'object', `${context}: Expected error object`);
  assert.strictEqual(errorObj.status, expectedStatus, `${context}: Expected status ${expectedStatus}, got ${errorObj.status}`);
  assert.ok(typeof errorObj.timestamp === 'string', `${context}: timestamp must be string`);
  assert.ok(typeof errorObj.error === 'string', `${context}: error must be string`);
  assert.ok(typeof errorObj.message === 'string' && errorObj.message.length > 0, `${context}: message must be non-empty`);
  if (expectedPath) {
    assert.ok(
      typeof errorObj.path === 'string' && errorObj.path.includes(expectedPath),
      `${context}: expected path to include '${expectedPath}', got '${errorObj.path}'`
    );
  }
}

export function assertNoSecrets(content, forbiddenPatterns, filePath = '') {
  for (const pattern of forbiddenPatterns) {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
    const matched = regex.test(content);
    assert.strictEqual(
      matched,
      false,
      `[Security / Credential Leak] File '${filePath}' contains forbidden secret pattern: ${pattern}`
    );
  }
}

export default {
  assertStatus,
  assertCloseTo,
  assertGadgetModelSchema,
  assertFinancialSummarySchema,
  assertErrorResponseSchema,
  assertNoSecrets,
};
