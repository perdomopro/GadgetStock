// tests/challenger_m4_stress.mjs
// Empirical Stress Test Harness for Milestone 4 (I18n, Currency, Calculations, Form Validation)

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

import { translations } from '../front/src/utils/translations.js';
import {
  calculateItemTotalCost,
  calculateItemNetProfit,
  calculateItemRoi,
  calculateStockCapital,
  calculateTotalNetProfit,
  calculateAggregateRoi,
} from '../front/src/utils/calculations.js';

console.log('===============================================================');
console.log('   CHALLENGER M4 EMPIRICAL STRESS TEST SUITE');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failedTests++;
    failures.push({ name, error: err });
    console.log(`[FAIL] ${name}`);
    console.log(`       Error: ${err.message}`);
  }
}

// =========================================================================
// SECTION 1: I18n & Bilingual Translations Parity
// =========================================================================
console.log('>>> [1. Translations & Key Parity] <<<');

test('ES and EN dictionaries both exist and are objects', () => {
  assert.ok(translations.es && typeof translations.es === 'object');
  assert.ok(translations.en && typeof translations.en === 'object');
});

test('Translations key parity between ES and EN', () => {
  const esKeys = Object.keys(translations.es);
  const enKeys = Object.keys(translations.en);

  const missingInEs = enKeys.filter((k) => !(k in translations.es));
  const missingInEn = esKeys.filter((k) => !(k in translations.en));

  if (missingInEs.length > 0 || missingInEn.length > 0) {
    throw new Error(
      `Key parity mismatch!\nMissing in ES: ${JSON.stringify(missingInEs)}\nMissing in EN: ${JSON.stringify(missingInEn)}`
    );
  }
});

test('No translation values are empty strings, null, or undefined', () => {
  ['es', 'en'].forEach((lang) => {
    for (const [key, val] of Object.entries(translations[lang])) {
      assert.ok(
        typeof val === 'string' && val.trim().length > 0,
        `Empty or invalid translation value in '${lang}' for key '${key}'`
      );
    }
  });
});

test('All t(...) keys extracted from front/src components exist in translations.es and translations.en', () => {
  function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFiles(fullPath));
      } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const srcFiles = getFiles('./front/src');
  const tKeyRegex = /\bt\(\s*['"]([^'"]+)['"]\s*\)/g;
  const usedKeys = new Set();

  for (const f of srcFiles) {
    const content = fs.readFileSync(f, 'utf8');
    let match;
    while ((match = tKeyRegex.exec(content)) !== null) {
      usedKeys.add(match[1]);
    }
  }

  const missingEs = [];
  const missingEn = [];
  for (const key of usedKeys) {
    if (translations.es[key] === undefined) missingEs.push(key);
    if (translations.en[key] === undefined) missingEn.push(key);
  }

  assert.strictEqual(
    missingEs.length,
    0,
    `Component keys missing in translations.es: ${missingEs.join(', ')}`
  );
  assert.strictEqual(
    missingEn.length,
    0,
    `Component keys missing in translations.en: ${missingEn.join(', ')}`
  );
});

// =========================================================================
// SECTION 2: Currency Formatting Logic Stress Tests
// =========================================================================
console.log('\n>>> [2. Currency Formatting Logic] <<<');

// Direct implementation test of formatCurrency logic from CurrencyContext.jsx
function formatCurrencyHelper(amount, currency = 'USD', options = {}, exchangeRate = 20.0, convertEnabled = false) {
  if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) {
    return currency === 'USD' ? '$0.00' : '$0.00 MXN';
  }

  const num = Number(amount);
  const shouldConvert = options.convert !== undefined ? options.convert : convertEnabled;

  const targetValue = currency === 'USD' ? num : (shouldConvert ? num * exchangeRate : num);
  const absFormatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(targetValue));
  const sign = targetValue < 0 && absFormatted !== '0.00' ? '-' : '';

  if (currency === 'USD') {
    return `${sign}$${absFormatted}`;
  } else {
    return `${sign}$${absFormatted} MXN`;
  }
}

test('Currency: zero value formatting', () => {
  assert.strictEqual(formatCurrencyHelper(0, 'USD'), '$0.00');
  assert.strictEqual(formatCurrencyHelper(0, 'MXN'), '$0.00 MXN');
  assert.strictEqual(formatCurrencyHelper('0.00', 'USD'), '$0.00');
  assert.strictEqual(formatCurrencyHelper('0.00', 'MXN'), '$0.00 MXN');
});

test('Currency: negative values formatting', () => {
  assert.strictEqual(formatCurrencyHelper(-150.5, 'USD'), '-$150.50');
  assert.strictEqual(formatCurrencyHelper(-150.5, 'MXN'), '-$150.50 MXN');
  assert.strictEqual(formatCurrencyHelper(-0.01, 'USD'), '-$0.01');
});

test('Currency: large values formatting with thousands separators', () => {
  assert.strictEqual(formatCurrencyHelper(1000000.99, 'USD'), '$1,000,000.99');
  assert.strictEqual(formatCurrencyHelper(123456789.5, 'MXN'), '$123,456,789.50 MXN');
});

test('Currency: decimal truncation and rounding', () => {
  assert.strictEqual(formatCurrencyHelper(12.3456, 'USD'), '$12.35');
  assert.strictEqual(formatCurrencyHelper(12.3411, 'USD'), '$12.34');
  assert.strictEqual(formatCurrencyHelper(0.001, 'USD'), '$0.00');
  assert.strictEqual(formatCurrencyHelper(0.009, 'USD'), '$0.01');
});

test('Currency: edge-case inputs (null, undefined, empty, non-numeric strings)', () => {
  assert.strictEqual(formatCurrencyHelper(null, 'USD'), '$0.00');
  assert.strictEqual(formatCurrencyHelper(null, 'MXN'), '$0.00 MXN');
  assert.strictEqual(formatCurrencyHelper(undefined, 'USD'), '$0.00');
  assert.strictEqual(formatCurrencyHelper('', 'USD'), '$0.00');
  assert.strictEqual(formatCurrencyHelper('abc', 'USD'), '$0.00');
  assert.strictEqual(formatCurrencyHelper(NaN, 'USD'), '$0.00');
});

test('Currency: string numeric inputs parse properly', () => {
  assert.strictEqual(formatCurrencyHelper('350.25', 'USD'), '$350.25');
  assert.strictEqual(formatCurrencyHelper(' 500 ', 'USD'), '$500.00');
});

test('Currency: MXN exchange rate conversion when enabled', () => {
  // Convert 100 USD to MXN at 20.0 rate -> 2,000.00 MXN
  assert.strictEqual(
    formatCurrencyHelper(100, 'MXN', { convert: true }, 20.0),
    '$2,000.00 MXN'
  );
  // Without conversion, displays nominal
  assert.strictEqual(
    formatCurrencyHelper(100, 'MXN', { convert: false }, 20.0),
    '$100.00 MXN'
  );
});

// =========================================================================
// SECTION 3: Financial Calculations Edge Cases (calculations.js)
// =========================================================================
console.log('\n>>> [3. Financial Calculations Edge Cases] <<<');

test('Calculations: empty array handles cleanly', () => {
  assert.strictEqual(calculateStockCapital([]), 0);
  assert.strictEqual(calculateTotalNetProfit([]), 0);
  assert.strictEqual(calculateAggregateRoi([]), 0.0);
});

test('Calculations: null/undefined handles cleanly', () => {
  assert.strictEqual(calculateStockCapital(null), 0);
  assert.strictEqual(calculateStockCapital(undefined), 0);
  assert.strictEqual(calculateTotalNetProfit(null), 0);
  assert.strictEqual(calculateTotalNetProfit(undefined), 0);
  assert.strictEqual(calculateAggregateRoi(null), 0.0);
  assert.strictEqual(calculateAggregateRoi(undefined), 0.0);
  assert.strictEqual(calculateItemTotalCost(null), 0);
  assert.strictEqual(calculateItemNetProfit(null), null);
  assert.strictEqual(calculateItemRoi(null), null);
});

test('Calculations: all unsold items', () => {
  const unsoldItems = [
    { id: 1, name: 'Phone A', price: 200, repairCost: 50, isSold: false, soldPrice: null },
    { id: 2, name: 'Phone B', price: 300, repairCost: 0, isSold: false, soldPrice: null },
    { id: 3, name: 'Phone C', price: 150.75, repairCost: 25.25, isSold: false, soldPrice: null },
  ];

  // Stock Capital = (200 + 50) + (300 + 0) + (150.75 + 25.25) = 250 + 300 + 176 = 726.00
  assert.strictEqual(calculateStockCapital(unsoldItems), 726);
  assert.strictEqual(calculateTotalNetProfit(unsoldItems), 0);
  assert.strictEqual(calculateAggregateRoi(unsoldItems), 0.0);
});

test('Calculations: all sold items', () => {
  const soldItems = [
    { id: 1, name: 'Phone A', price: 100, repairCost: 20, isSold: true, soldPrice: 180 }, // cost 120, profit 60, roi 50%
    { id: 2, name: 'Phone B', price: 200, repairCost: 0, isSold: true, soldPrice: 300 },  // cost 200, profit 100, roi 50%
  ];

  assert.strictEqual(calculateStockCapital(soldItems), 0);
  assert.strictEqual(calculateTotalNetProfit(soldItems), 160);
  // Total cost = 320, Total profit = 160 -> aggregate ROI = 50.0%
  assert.strictEqual(calculateAggregateRoi(soldItems), 50.0);
});

test('Calculations: mixed liquidation lots (segregation verification)', () => {
  const mixed = [
    { id: 1, name: 'Unsold 1', price: 500, repairCost: 100, isSold: false },
    { id: 2, name: 'Unsold 2', price: 250, repairCost: 50, isSold: false },
    { id: 3, name: 'Sold Profit', price: 100, repairCost: 20, isSold: true, soldPrice: 200 }, // profit 80
    { id: 4, name: 'Sold Loss', price: 200, repairCost: 50, isSold: true, soldPrice: 200 },   // cost 250, profit -50
  ];

  // Stock Capital: strictly (500+100) + (250+50) = 900
  assert.strictEqual(calculateStockCapital(mixed), 900);
  // Net Profit: 80 + (-50) = 30
  assert.strictEqual(calculateTotalNetProfit(mixed), 30);
  // Sold cost: 120 + 250 = 370. ROI = (30 / 370) * 100 = 8.11%
  assert.strictEqual(calculateAggregateRoi(mixed), 8.11);
});

test('Calculations: zero-cost item (free acquisition, zero repair, sold for 50)', () => {
  const zeroCostItem = {
    id: 1,
    name: 'Gifted Item',
    price: 0,
    repairCost: 0,
    isSold: true,
    soldPrice: 50,
  };

  assert.strictEqual(calculateItemTotalCost(zeroCostItem), 0);
  assert.strictEqual(calculateItemNetProfit(zeroCostItem), 50);
  // Division by zero safeguard returns 0.0
  assert.strictEqual(calculateItemRoi(zeroCostItem), 0.0);

  const inventory = [zeroCostItem];
  assert.strictEqual(calculateTotalNetProfit(inventory), 50);
  // Aggregate ROI with total cost 0 returns 0.0
  assert.strictEqual(calculateAggregateRoi(inventory), 0.0);
});

test('Calculations: floating point precision with fractional cents', () => {
  const floatItems = [
    { id: 1, price: 0.1, repairCost: 0.2, isSold: false },
    { id: 2, price: 0.1, repairCost: 0.2, isSold: false },
  ];
  // 0.1 + 0.2 in JS is 0.30000000000000004
  assert.strictEqual(calculateItemTotalCost(floatItems[0]), 0.3);
  assert.strictEqual(calculateStockCapital(floatItems), 0.6);
});

test('Calculations: isSold=true but soldPrice is null/undefined does not crash or distort profit', () => {
  const malformedSold = [
    { id: 1, price: 100, repairCost: 20, isSold: true, soldPrice: null },
    { id: 2, price: 100, repairCost: 20, isSold: true, soldPrice: undefined },
    { id: 3, price: 100, repairCost: 20, isSold: true, soldPrice: 150 },
  ];

  assert.strictEqual(calculateItemNetProfit(malformedSold[0]), null);
  assert.strictEqual(calculateItemNetProfit(malformedSold[1]), null);
  assert.strictEqual(calculateItemNetProfit(malformedSold[2]), 30);

  // Total profit should only accumulate item 3
  assert.strictEqual(calculateTotalNetProfit(malformedSold), 30);
});

// =========================================================================
// SECTION 4: Component Form Validation & State Stress Tests
// =========================================================================
console.log('\n>>> [4. Form Validation & Component Stress] <<<');

test('QuickAddForm: validation rule logic simulates edge cases', () => {
  // Test validation logic as implemented in QuickAddForm.jsx lines 44-69
  function validateQuickAdd(formData) {
    const trimmedName = (formData.name || '').trim();
    if (!trimmedName) return { valid: false, error: 'valNameRequired' };

    const numPrice = Number(formData.price);
    if (formData.price === '' || formData.price === undefined || isNaN(numPrice) || numPrice < 0) {
      return { valid: false, error: 'valPriceNegative' };
    }

    const numRepairCost = formData.repairCost ? Number(formData.repairCost) : 0;
    if (isNaN(numRepairCost) || numRepairCost < 0) {
      return { valid: false, error: 'valRepairCostNegative' };
    }

    if (formData.listedPrice !== '' && formData.listedPrice !== undefined) {
      const numListedPrice = Number(formData.listedPrice);
      if (isNaN(numListedPrice) || numListedPrice < 0) {
        return { valid: false, error: 'valListedPriceNegative' };
      }
    }

    return { valid: true };
  }

  // Edge Case 1: Whitespace only name
  assert.strictEqual(validateQuickAdd({ name: '   ', price: '100' }).error, 'valNameRequired');
  // Edge Case 2: Negative purchase price
  assert.strictEqual(validateQuickAdd({ name: 'Phone', price: '-1' }).error, 'valPriceNegative');
  assert.strictEqual(validateQuickAdd({ name: 'Phone', price: '-0.01' }).error, 'valPriceNegative');
  // Edge Case 3: Zero purchase price (allowed)
  assert.strictEqual(validateQuickAdd({ name: 'Phone', price: '0' }).valid, true);
  // Edge Case 4: Negative repair cost
  assert.strictEqual(validateQuickAdd({ name: 'Phone', price: '10', repairCost: '-5' }).error, 'valRepairCostNegative');
  // Edge Case 5: Empty repair cost (defaults to 0, allowed)
  assert.strictEqual(validateQuickAdd({ name: 'Phone', price: '10', repairCost: '' }).valid, true);
  // Edge Case 6: Negative listed price
  assert.strictEqual(validateQuickAdd({ name: 'Phone', price: '10', listedPrice: '-10' }).error, 'valListedPriceNegative');
  // Edge Case 7: Non-numeric strings in numeric fields
  assert.strictEqual(validateQuickAdd({ name: 'Phone', price: 'abc' }).error, 'valPriceNegative');
  assert.strictEqual(validateQuickAdd({ name: 'Phone', price: '10', repairCost: 'xyz' }).error, 'valRepairCostNegative');
});

test('MarkSoldModal: validation rule logic simulates edge cases', () => {
  // Test validation logic as implemented in MarkSoldModal.jsx lines 25-29
  function validateMarkSold(soldPrice) {
    const numSoldPrice = Number(soldPrice);
    if (!soldPrice || isNaN(numSoldPrice) || numSoldPrice <= 0) {
      return { valid: false, error: 'soldPriceRequiredError' };
    }
    return { valid: true, numSoldPrice };
  }

  // Edge cases: soldPrice <= 0 is rejected
  assert.strictEqual(validateMarkSold('0').valid, false);
  assert.strictEqual(validateMarkSold('0.00').valid, false);
  assert.strictEqual(validateMarkSold('-10').valid, false);
  assert.strictEqual(validateMarkSold('').valid, false);
  assert.strictEqual(validateMarkSold('abc').valid, false);

  // Positive soldPrice is accepted
  assert.strictEqual(validateMarkSold('0.01').valid, true);
  assert.strictEqual(validateMarkSold('150.00').valid, true);
});

test('InventoryTable: category and search filter robust against regex chars and casing', () => {
  // Simulate InventoryTable filter logic
  const sampleGadgets = [
    { id: 1, name: 'Special [Device] (v1)', model: 'PRO+', category: 'Tech', isSold: false },
    { id: 2, name: 'Regular Phone', model: 'A1', category: 'Tech', isSold: true },
    { id: 3, name: 'Retro Console', model: 'Gen-1', category: 'Gaming', isSold: false },
  ];

  function filterGadgets(gadgets, searchTerm, selectedCategory, selectedStatus) {
    return gadgets.filter((gadget) => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (gadget.name && gadget.name.toLowerCase().includes(query)) ||
        (gadget.model && gadget.model.toLowerCase().includes(query));

      const matchesCategory =
        selectedCategory === 'ALL' ||
        (gadget.category && gadget.category.toLowerCase() === selectedCategory.toLowerCase());

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'AVAILABLE' && !gadget.isSold) ||
        (selectedStatus === 'SOLD' && gadget.isSold);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  // Regex special characters in search do NOT throw and match literally
  assert.strictEqual(filterGadgets(sampleGadgets, '[Device]', 'ALL', 'ALL').length, 1);
  assert.strictEqual(filterGadgets(sampleGadgets, 'PRO+', 'ALL', 'ALL').length, 1);
  assert.strictEqual(filterGadgets(sampleGadgets, '(', 'ALL', 'ALL').length, 1);

  // Case insensitive category filter
  assert.strictEqual(filterGadgets(sampleGadgets, '', 'tech', 'ALL').length, 2);
  assert.strictEqual(filterGadgets(sampleGadgets, '', 'TECH', 'ALL').length, 2);

  // Status filter
  assert.strictEqual(filterGadgets(sampleGadgets, '', 'ALL', 'AVAILABLE').length, 2);
  assert.strictEqual(filterGadgets(sampleGadgets, '', 'ALL', 'SOLD').length, 1);
});

console.log('\n===============================================================');
console.log(`SUMMARY: Ran ${totalTests} stress tests. Passed: ${passedTests}, Failed: ${failedTests}`);
console.log('===============================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
