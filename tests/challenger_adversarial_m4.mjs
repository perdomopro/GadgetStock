// tests/challenger_adversarial_m4.mjs
// Adversarial Empirical Stress Test Suite by challenger_m4_fix1

import assert from 'node:assert';
import { translations } from '../front/src/utils/translations.js';

console.log('===============================================================');
console.log('   CHALLENGER ADVERSARIAL STRESS TEST FOR M4 FIXES');
console.log('===============================================================\n');

let total = 0;
let passed = 0;
let failed = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failed++;
    console.log(`[FAIL] ${name}`);
    console.log(`       Error: ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// 1. Translations Parity and Bidirectional Integrity
// -----------------------------------------------------------------------------
console.log('>>> [1. Translations Dictionary Deep Stress] <<<');

runTest('Both Spanish and English have identical set of keys', () => {
  const esKeys = Object.keys(translations.es).sort();
  const enKeys = Object.keys(translations.en).sort();
  assert.strictEqual(esKeys.length, enKeys.length, `Key counts differ: ES=${esKeys.length}, EN=${enKeys.length}`);
  assert.deepStrictEqual(esKeys, enKeys, 'Key lists are not identical');
});

runTest('Total key count is 115', () => {
  assert.strictEqual(Object.keys(translations.es).length, 115);
  assert.strictEqual(Object.keys(translations.en).length, 115);
});

runTest('Core business terms bidirectional mapping', () => {
  // In ES mode:
  assert.strictEqual(translations.es['Capital en Stock'], 'Capital en Stock');
  assert.strictEqual(translations.es['Ganancia Neta'], 'Ganancia Neta');
  assert.strictEqual(translations.es['Inventario'], 'Inventario');
  assert.strictEqual(translations.es['Finanzas'], 'Finanzas');
  assert.strictEqual(translations.es['Stock Capital'], 'Capital en Stock');
  assert.strictEqual(translations.es['Net Profit'], 'Ganancia Neta');
  assert.strictEqual(translations.es['Inventory'], 'Inventario');
  assert.strictEqual(translations.es['Finances'], 'Finanzas');

  // In EN mode:
  assert.strictEqual(translations.en['Stock Capital'], 'Stock Capital');
  assert.strictEqual(translations.en['Net Profit'], 'Net Profit');
  assert.strictEqual(translations.en['Inventory'], 'Inventory');
  assert.strictEqual(translations.en['Finances'], 'Finances');
  assert.strictEqual(translations.en['Capital en Stock'], 'Stock Capital');
  assert.strictEqual(translations.en['Ganancia Neta'], 'Net Profit');
  assert.strictEqual(translations.en['Inventario'], 'Inventory');
  assert.strictEqual(translations.en['Finanzas'], 'Finances');
});

runTest('LanguageContext t() translation function resolution logic', () => {
  function createT(language) {
    return (key) => {
      if (!key) return '';
      const dict = translations[language] || translations.es;
      if (dict[key] !== undefined) return dict[key];

      const fallbackDict = language === 'es' ? translations.en : translations.es;
      if (fallbackDict && fallbackDict[key] !== undefined) return fallbackDict[key];

      return key;
    };
  }

  const tEs = createT('es');
  const tEn = createT('en');

  // Normal keys
  assert.strictEqual(tEs('appTitle'), 'GadgetStock');
  assert.strictEqual(tEn('appTitle'), 'GadgetStock');
  assert.strictEqual(tEs('tabDashboard'), 'Dashboard');
  assert.strictEqual(tEn('tabDashboard'), 'Dashboard');

  // Cross-lingual resolution
  assert.strictEqual(tEn('Capital en Stock'), 'Stock Capital');
  assert.strictEqual(tEs('Stock Capital'), 'Capital en Stock');

  // Missing / Unknown key returns key
  assert.strictEqual(tEs('NON_EXISTENT_KEY_123'), 'NON_EXISTENT_KEY_123');
  assert.strictEqual(tEn('NON_EXISTENT_KEY_123'), 'NON_EXISTENT_KEY_123');

  // Falsy keys return empty string
  assert.strictEqual(tEs(null), '');
  assert.strictEqual(tEs(undefined), '');
  assert.strictEqual(tEs(''), '');
  assert.strictEqual(tEn(null), '');
});

// -----------------------------------------------------------------------------
// 2. Currency Formatting Deep Adversarial Stress
// -----------------------------------------------------------------------------
console.log('\n>>> [2. Currency Formatting Deep Stress] <<<');

function formatCurrency(amount, currency = 'USD', options = {}, exchangeRate = 20.0, convertEnabled = false) {
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
    // MXN mode
    return `${sign}$${absFormatted} MXN`;
  }
}

runTest('Currency: Standard USD positive amounts', () => {
  assert.strictEqual(formatCurrency(0, 'USD'), '$0.00');
  assert.strictEqual(formatCurrency(0.5, 'USD'), '$0.50');
  assert.strictEqual(formatCurrency(19.99, 'USD'), '$19.99');
  assert.strictEqual(formatCurrency(1000, 'USD'), '$1,000.00');
  assert.strictEqual(formatCurrency(1234567.89, 'USD'), '$1,234,567.89');
});

runTest('Currency: Standard MXN positive amounts', () => {
  assert.strictEqual(formatCurrency(0, 'MXN'), '$0.00 MXN');
  assert.strictEqual(formatCurrency(500, 'MXN'), '$500.00 MXN');
  assert.strictEqual(formatCurrency(1500.5, 'MXN'), '$1,500.50 MXN');
});

runTest('Currency: Negative amounts sign placement in USD and MXN', () => {
  assert.strictEqual(formatCurrency(-0.01, 'USD'), '-$0.01');
  assert.strictEqual(formatCurrency(-0.01, 'MXN'), '-$0.01 MXN');
  assert.strictEqual(formatCurrency(-150.5, 'USD'), '-$150.50');
  assert.strictEqual(formatCurrency(-150.5, 'MXN'), '-$150.50 MXN');
  assert.strictEqual(formatCurrency(-999999.99, 'USD'), '-$999,999.99');
  assert.strictEqual(formatCurrency(-999999.99, 'MXN'), '-$999,999.99 MXN');
});

runTest('Currency: Sub-cent rounding behavior and -0.00 prevention', () => {
  // -0.004 rounds to 0.00 -> should NOT have minus sign (-$0.00 is invalid accounting)
  assert.strictEqual(formatCurrency(-0.004, 'USD'), '$0.00');
  assert.strictEqual(formatCurrency(-0.004, 'MXN'), '$0.00 MXN');
  assert.strictEqual(formatCurrency(-0.0001, 'USD'), '$0.00');

  // -0.005 rounds to -0.01 -> should have minus sign
  assert.strictEqual(formatCurrency(-0.005, 'USD'), '-$0.01');
  assert.strictEqual(formatCurrency(-0.005, 'MXN'), '-$0.01 MXN');

  // Positive sub-cents
  assert.strictEqual(formatCurrency(0.004, 'USD'), '$0.00');
  assert.strictEqual(formatCurrency(0.005, 'USD'), '$0.01');

  // Exact negative zero -0
  assert.strictEqual(formatCurrency(-0, 'USD'), '$0.00');
  assert.strictEqual(formatCurrency('-0', 'USD'), '$0.00');
  assert.strictEqual(formatCurrency('-0.00', 'USD'), '$0.00');
});

runTest('Currency: Extreme numbers and strings', () => {
  assert.strictEqual(formatCurrency('  42.50  ', 'USD'), '$42.50');
  assert.strictEqual(formatCurrency('-123.45', 'USD'), '-$123.45');
  assert.strictEqual(formatCurrency('1e4', 'USD'), '$10,000.00');
  assert.strictEqual(formatCurrency('-1e4', 'USD'), '-$10,000.00');
});

runTest('Currency: MXN conversion mode with negative numbers', () => {
  // -100 USD converted at 20.0 exchange rate -> -2000.00 MXN
  assert.strictEqual(formatCurrency(-100, 'MXN', { convert: true }, 20.0), '-$2,000.00 MXN');
  assert.strictEqual(formatCurrency(-100, 'MXN', { convert: false }, 20.0), '-$100.00 MXN');
  assert.strictEqual(formatCurrency(100, 'MXN', { convert: true }, 18.5), '$1,850.00 MXN');
  assert.strictEqual(formatCurrency(-100, 'MXN', { convert: true }, 18.5), '-$1,850.00 MXN');
});

runTest('Currency: Malformed, null, undefined, empty, NaN inputs gracefully return zero', () => {
  const inputs = [null, undefined, '', '   ', 'invalid', NaN, {}, []];
  for (const input of inputs) {
    assert.strictEqual(formatCurrency(input, 'USD'), '$0.00', `Failed for input: ${input}`);
    assert.strictEqual(formatCurrency(input, 'MXN'), '$0.00 MXN', `Failed for input: ${input}`);
  }
});

// -----------------------------------------------------------------------------
// 3. Test Runner Multi-Feature Filtering Logic Stress
// -----------------------------------------------------------------------------
console.log('\n>>> [3. Runner Multi-Feature Filter Stress] <<<');

const mockTests = [
  { id: 'F18_T1', feature: 'F18' },
  { id: 'F18_T2', feature: 'F18' },
  { id: 'F19_T1', feature: 'F19' },
  { id: 'F20_T1', feature: 'F20' },
  { id: 'F21_T1', feature: 'F21' },
  { id: 'F22_T1', feature: 'F22' },
  { id: 'F23_T1', feature: 'F23' },
  { id: 'F24_T1', feature: 'F24' },
];

function filterTests(tests, featureFilter) {
  return tests.filter((t) => {
    if (featureFilter && t.feature) {
      const requestedFeatures = featureFilter.split(',').map((f) => f.trim().toUpperCase());
      if (!requestedFeatures.some((f) => t.feature.toUpperCase().includes(f))) return false;
    }
    return true;
  });
}

runTest('Runner: Multi-feature comma separated without space', () => {
  const res = filterTests(mockTests, 'F18,F19,F20');
  assert.strictEqual(res.length, 4);
  assert.deepStrictEqual(res.map((t) => t.id), ['F18_T1', 'F18_T2', 'F19_T1', 'F20_T1']);
});

runTest('Runner: Multi-feature comma separated with spaces', () => {
  const res = filterTests(mockTests, 'F18, F22, F23');
  assert.strictEqual(res.length, 4);
  assert.deepStrictEqual(res.map((t) => t.id), ['F18_T1', 'F18_T2', 'F22_T1', 'F23_T1']);
});

runTest('Runner: Single feature backwards compatibility', () => {
  const res = filterTests(mockTests, 'F22');
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res.at(0).id, 'F22_T1');
});

runTest('Runner: Case insensitivity (lowercase input)', () => {
  const res = filterTests(mockTests, 'f18,f19');
  assert.strictEqual(res.length, 3);
});

runTest('Runner: Nonexistent feature returns empty array', () => {
  const res = filterTests(mockTests, 'F99,F100');
  assert.strictEqual(res.length, 0);
});

runTest('Runner: Empty feature filter returns all tests', () => {
  const res = filterTests(mockTests, '');
  assert.strictEqual(res.length, 8);
  const resNull = filterTests(mockTests, null);
  assert.strictEqual(resNull.length, 8);
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n===============================================================');
console.log(`SUMMARY: Ran ${total} tests. Passed: ${passed}, Failed: ${failed}`);
console.log('===============================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
