// tests/challenger_m4_fix2_stress.mjs
// Adversarial Empirical Stress Test Suite for Milestone 4 Remediation
// Focus: Finding A (i18n translation parity & bidirectional t lookups)
//        Finding B (CurrencyContext boundary formatting & exchange rates)

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Import translations directly from frontend source
import { translations } from '../front/src/utils/translations.js';

console.log('===============================================================');
console.log('   CHALLENGER M4-FIX2 ADVERSARIAL EMPIRICAL HARNESS');
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

// ---------------------------------------------------------------------------
// FACTORY: Dynamically extract and instantiate LanguageContext t() implementation
// ---------------------------------------------------------------------------
function getLanguageContextTranslator() {
  const langContextPath = path.join(projectRoot, 'front/src/context/LanguageContext.jsx');
  const source = fs.readFileSync(langContextPath, 'utf-8');
  const match = source.match(/const t = useCallback\(\((.*?)\) => \{([\s\S]*?)\}, \[.*?\]\);/);
  if (!match) {
    throw new Error('Unable to extract `t` implementation from LanguageContext.jsx');
  }
  const fnBody = match[2];
  return function makeT(language, customTranslations = translations) {
    return new Function(
      'translations',
      'language',
      `return function(key) { ${fnBody} };`
    )(customTranslations, language);
  };
}

// ---------------------------------------------------------------------------
// FACTORY: Dynamically extract and instantiate CurrencyContext formatCurrency() implementation
// ---------------------------------------------------------------------------
function getCurrencyFormatterFactory() {
  const currContextPath = path.join(projectRoot, 'front/src/context/CurrencyContext.jsx');
  const source = fs.readFileSync(currContextPath, 'utf-8');
  const match = source.match(/const formatCurrency = useCallback\(\((.*?)\) => \{([\s\S]*?)\}, \[.*?\]\);/);
  if (!match) {
    throw new Error('Unable to extract `formatCurrency` implementation from CurrencyContext.jsx');
  }
  const fnBody = match[2];
  return function makeFormatter({
    currency = 'USD',
    exchangeRate = 20.0,
    convertEnabled = false,
  } = {}) {
    return new Function(
      'currency',
      'exchangeRate',
      'convertEnabled',
      `return function(amount, options = {}) { ${fnBody} };`
    )(currency, exchangeRate, convertEnabled);
  };
}

const makeTranslator = getLanguageContextTranslator();
const makeCurrencyFormatter = getCurrencyFormatterFactory();

// ===========================================================================
// SECTION 1: Finding A - Translations Key Parity & Bidirectional Resolution
// ===========================================================================
console.log('>>> [1. Translations Key Parity & Bidirectional Lookups] <<<');

test('Translations: Dictionary objects exist and are non-empty', () => {
  assert.ok(translations.es && typeof translations.es === 'object', 'translations.es must exist');
  assert.ok(translations.en && typeof translations.en === 'object', 'translations.en must exist');
  assert.ok(Object.keys(translations.es).length > 50, 'translations.es must have substantive entries');
  assert.ok(Object.keys(translations.en).length > 50, 'translations.en must have substantive entries');
});

test('Translations: Strict 100% key parity between ES and EN (0 missing in either)', () => {
  const esKeys = Object.keys(translations.es);
  const enKeys = Object.keys(translations.en);

  const missingInEs = enKeys.filter((k) => !(k in translations.es));
  const missingInEn = esKeys.filter((k) => !(k in translations.en));

  assert.strictEqual(
    missingInEs.length,
    0,
    `Keys present in EN but missing in ES: ${JSON.stringify(missingInEs)}`
  );
  assert.strictEqual(
    missingInEn.length,
    0,
    `Keys present in ES but missing in EN: ${JSON.stringify(missingInEn)}`
  );
  assert.strictEqual(esKeys.length, enKeys.length, 'Key counts must be identical');
});

test('Translations: Every translation value in ES and EN is a non-empty string', () => {
  for (const [key, val] of Object.entries(translations.es)) {
    assert.strictEqual(typeof val, 'string', `ES key "${key}" must be a string, got ${typeof val}`);
    assert.ok(val.trim().length > 0, `ES key "${key}" must not be empty or whitespace only`);
  }
  for (const [key, val] of Object.entries(translations.en)) {
    assert.strictEqual(typeof val, 'string', `EN key "${key}" must be a string, got ${typeof val}`);
    assert.ok(val.trim().length > 0, `EN key "${key}" must not be empty or whitespace only`);
  }
});

test('Finding A Verification: Bidirectional resolution for Core Business Terms in ES mode', () => {
  const tEs = makeTranslator('es');

  // Both verbatim Spanish terms and English cross-keys must resolve to Spanish terms in ES mode
  assert.strictEqual(tEs('Capital en Stock'), 'Capital en Stock');
  assert.strictEqual(tEs('Stock Capital'), 'Capital en Stock');

  assert.strictEqual(tEs('Ganancia Neta'), 'Ganancia Neta');
  assert.strictEqual(tEs('Net Profit'), 'Ganancia Neta');

  assert.strictEqual(tEs('Inventario'), 'Inventario');
  assert.strictEqual(tEs('Inventory'), 'Inventario');

  assert.strictEqual(tEs('Finanzas'), 'Finanzas');
  assert.strictEqual(tEs('Finances'), 'Finanzas');
});

test('Finding A Verification: Bidirectional resolution for Core Business Terms in EN mode', () => {
  const tEn = makeTranslator('en');

  // Both verbatim English terms and Spanish cross-keys must resolve to English terms in EN mode
  assert.strictEqual(tEn('Stock Capital'), 'Stock Capital');
  assert.strictEqual(tEn('Capital en Stock'), 'Stock Capital');

  assert.strictEqual(tEn('Net Profit'), 'Net Profit');
  assert.strictEqual(tEn('Ganancia Neta'), 'Net Profit');

  assert.strictEqual(tEn('Inventory'), 'Inventory');
  assert.strictEqual(tEn('Inventario'), 'Inventory');

  assert.strictEqual(tEn('Finances'), 'Finances');
  assert.strictEqual(tEn('Finanzas'), 'Finances');
});

test('Translations: Exhaustive lookup check across all 115 keys in both ES and EN', () => {
  const tEs = makeTranslator('es');
  const tEn = makeTranslator('en');
  const allKeys = Object.keys(translations.es);

  for (const key of allKeys) {
    const resEs = tEs(key);
    assert.ok(typeof resEs === 'string' && resEs.length > 0, `tEs('${key}') returned invalid value`);
    const resEn = tEn(key);
    assert.ok(typeof resEn === 'string' && resEn.length > 0, `tEn('${key}') returned invalid value`);
  }
});

test('Translations: Symmetric fallback mechanism when key exists only in alternate dictionary', () => {
  const customDict = {
    es: { onlyInEs: 'Texto Español' },
    en: { onlyInEn: 'English Text' },
  };

  const tEs = makeTranslator('es', customDict);
  const tEn = makeTranslator('en', customDict);

  // In ES mode: key only in EN should fall back to EN dictionary
  assert.strictEqual(tEs('onlyInEn'), 'English Text', 'ES mode should fall back to EN if missing in ES');
  assert.strictEqual(tEs('onlyInEs'), 'Texto Español');

  // In EN mode: key only in ES should fall back to ES dictionary
  assert.strictEqual(tEn('onlyInEs'), 'Texto Español', 'EN mode should fall back to ES if missing in EN');
  assert.strictEqual(tEn('onlyInEn'), 'English Text');
});

test('Translations: Unknown language and missing dictionary resilience', () => {
  const tUnknown = makeTranslator('fr'); // Not in translations
  // Should default to translations.es
  assert.strictEqual(tUnknown('Capital en Stock'), 'Capital en Stock');
  assert.strictEqual(tUnknown('appTitle'), 'GadgetStock');

  const tNull = makeTranslator(null);
  assert.strictEqual(tNull('Capital en Stock'), 'Capital en Stock');
});

test('Translations: Edge cases and falsy keys handling in t()', () => {
  const tEs = makeTranslator('es');
  const tEn = makeTranslator('en');

  assert.strictEqual(tEs(''), '');
  assert.strictEqual(tEn(''), '');
  assert.strictEqual(tEs(null), '');
  assert.strictEqual(tEn(null), '');
  assert.strictEqual(tEs(undefined), '');
  assert.strictEqual(tEn(undefined), '');
  assert.strictEqual(tEs(0), '');
  assert.strictEqual(tEn(false), '');
  assert.strictEqual(tEs(NaN), '');

  // Non-existent keys return the key verbatim
  assert.strictEqual(tEs('nonExistentKey.12345'), 'nonExistentKey.12345');
  assert.strictEqual(tEn('nonExistentKey.12345'), 'nonExistentKey.12345');
});

test('Translations: All component source code t(...) keys exist in translations', () => {
  function scanDir(dir) {
    let files = [];
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files = files.concat(scanDir(fullPath));
      } else if (/\.(jsx|js)$/.test(item.name)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const srcFiles = scanDir(path.join(projectRoot, 'front/src'));
  const keyRegex = /\bt\(\s*['"]([a-zA-Z0-9_.-]+)['"]\s*\)/g;
  const missingInDicts = new Set();

  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = keyRegex.exec(content)) !== null) {
      const key = match[1];
      if (!(key in translations.es) || !(key in translations.en)) {
        missingInDicts.add(`${key} (found in ${path.relative(projectRoot, file)})`);
      }
    }
  }

  assert.strictEqual(
    missingInDicts.size,
    0,
    `Component t() keys missing from translations: ${Array.from(missingInDicts).join(', ')}`
  );
});

// ===========================================================================
// SECTION 2: Finding B - CurrencyContext Boundary & Negative Sign Placement
// ===========================================================================
console.log('\n>>> [2. CurrencyContext Boundary & Negative Sign Stress Tests] <<<');

test('Finding B Verification: Standard negative numbers (-150.5, -0.01) in USD mode', () => {
  const formatUsd = makeCurrencyFormatter({ currency: 'USD' });

  assert.strictEqual(formatUsd(-150.5), '-$150.50', 'Negative USD must have minus sign BEFORE dollar sign');
  assert.strictEqual(formatUsd(-0.01), '-$0.01', 'Negative cent must be -$0.01');
  assert.strictEqual(formatUsd(-1.0), '-$1.00');
  assert.strictEqual(formatUsd(-99.99), '-$99.99');
  assert.strictEqual(formatUsd(-1234.56), '-$1,234.56');
});

test('Finding B Verification: Standard negative numbers (-150.5, -0.01) in MXN mode (no conversion)', () => {
  const formatMxn = makeCurrencyFormatter({ currency: 'MXN', convertEnabled: false });

  assert.strictEqual(formatMxn(-150.5), '-$150.50 MXN', 'Negative MXN must have minus sign BEFORE dollar sign');
  assert.strictEqual(formatMxn(-0.01), '-$0.01 MXN');
  assert.strictEqual(formatMxn(-100.0), '-$100.00 MXN');
  assert.strictEqual(formatMxn(-54321.75), '-$54,321.75 MXN');
});

test('Finding B Verification: Sub-cent negative numbers (-0.001, -0.0001, -0.0049)', () => {
  const formatUsd = makeCurrencyFormatter({ currency: 'USD' });
  const formatMxn = makeCurrencyFormatter({ currency: 'MXN', convertEnabled: false });

  // Sub-cent amounts that round to 0.00 MUST NOT display negative zero (-$0.00)
  assert.strictEqual(formatUsd(-0.001), '$0.00', 'Sub-cent negative (-0.001) must format as $0.00 without negative sign');
  assert.strictEqual(formatUsd(-0.0001), '$0.00', 'Sub-cent negative (-0.0001) must format as $0.00');
  assert.strictEqual(formatUsd(-0.0049), '$0.00', 'Sub-cent negative (-0.0049) must round to $0.00');

  assert.strictEqual(formatMxn(-0.001), '$0.00 MXN', 'Sub-cent negative in MXN must format as $0.00 MXN');
  assert.strictEqual(formatMxn(-0.0001), '$0.00 MXN');
  assert.strictEqual(formatMxn(-0.0049), '$0.00 MXN');

  // Sub-cent amount that rounds up to 1 cent (-0.005) must preserve negative sign
  assert.strictEqual(formatUsd(-0.005), '-$0.01', '-0.005 rounds to -0.01 and should show -$0.01');
  assert.strictEqual(formatMxn(-0.005), '-$0.01 MXN');
});

test('Finding B Verification: Sub-cent positive numbers (0.001, 0.0001, 0.0049, 0.005)', () => {
  const formatUsd = makeCurrencyFormatter({ currency: 'USD' });
  const formatMxn = makeCurrencyFormatter({ currency: 'MXN', convertEnabled: false });

  assert.strictEqual(formatUsd(0.001), '$0.00');
  assert.strictEqual(formatUsd(0.0001), '$0.00');
  assert.strictEqual(formatUsd(0.0049), '$0.00');
  assert.strictEqual(formatUsd(0.005), '$0.01');

  assert.strictEqual(formatMxn(0.001), '$0.00 MXN');
  assert.strictEqual(formatMxn(0.0001), '$0.00 MXN');
  assert.strictEqual(formatMxn(0.0049), '$0.00 MXN');
  assert.strictEqual(formatMxn(0.005), '$0.01 MXN');
});

test('Finding B Verification: Exact Zero and Negative Zero (0, -0, "0", "-0")', () => {
  const formatUsd = makeCurrencyFormatter({ currency: 'USD' });
  const formatMxn = makeCurrencyFormatter({ currency: 'MXN', convertEnabled: false });

  assert.strictEqual(formatUsd(0), '$0.00');
  assert.strictEqual(formatMxn(0), '$0.00 MXN');

  // Negative zero (-0) in IEEE 754 must format as clean positive zero ($0.00)
  assert.strictEqual(formatUsd(-0), '$0.00', '-0 must not produce -$0.00');
  assert.strictEqual(formatMxn(-0), '$0.00 MXN', '-0 must not produce -$0.00 MXN');

  assert.strictEqual(formatUsd('0'), '$0.00');
  assert.strictEqual(formatMxn('0'), '$0.00 MXN');
  assert.strictEqual(formatUsd('-0'), '$0.00');
  assert.strictEqual(formatMxn('-0'), '$0.00 MXN');
  assert.strictEqual(formatUsd('0.00'), '$0.00');
  assert.strictEqual(formatMxn('0.00'), '$0.00 MXN');
  assert.strictEqual(formatUsd('-0.00'), '$0.00');
  assert.strictEqual(formatMxn('-0.00'), '$0.00 MXN');
});

test('Finding B Verification: Standard positive numbers in USD and MXN', () => {
  const formatUsd = makeCurrencyFormatter({ currency: 'USD' });
  const formatMxn = makeCurrencyFormatter({ currency: 'MXN', convertEnabled: false });

  assert.strictEqual(formatUsd(0.01), '$0.01');
  assert.strictEqual(formatUsd(1.0), '$1.00');
  assert.strictEqual(formatUsd(150.5), '$150.50');
  assert.strictEqual(formatUsd(999.99), '$999.99');
  assert.strictEqual(formatUsd(1234.56), '$1,234.56');

  assert.strictEqual(formatMxn(0.01), '$0.01 MXN');
  assert.strictEqual(formatMxn(1.0), '$1.00 MXN');
  assert.strictEqual(formatMxn(150.5), '$150.50 MXN');
  assert.strictEqual(formatMxn(1234.56), '$1,234.56 MXN');
});

test('Finding B Verification: Huge numbers and thousands separators', () => {
  const formatUsd = makeCurrencyFormatter({ currency: 'USD' });
  const formatMxn = makeCurrencyFormatter({ currency: 'MXN', convertEnabled: false });

  assert.strictEqual(formatUsd(1000000), '$1,000,000.00');
  assert.strictEqual(formatUsd(1000000.99), '$1,000,000.99');
  assert.strictEqual(formatUsd(123456789.5), '$123,456,789.50');
  assert.strictEqual(formatUsd(1e12), '$1,000,000,000,000.00');
  assert.strictEqual(formatUsd(-1e12), '-$1,000,000,000,000.00');

  assert.strictEqual(formatMxn(1000000), '$1,000,000.00 MXN');
  assert.strictEqual(formatMxn(123456789.5), '$123,456,789.50 MXN');
  assert.strictEqual(formatMxn(-1000000000), '-$1,000,000,000.00 MXN');

  // Max Safe Integer
  assert.strictEqual(formatUsd(Number.MAX_SAFE_INTEGER), '$9,007,199,254,740,991.00');
  assert.strictEqual(formatUsd(-Number.MAX_SAFE_INTEGER), '-$9,007,199,254,740,991.00');
});

test('Finding B Verification: Falsy, null, undefined, empty, and non-numeric inputs', () => {
  const formatUsd = makeCurrencyFormatter({ currency: 'USD' });
  const formatMxn = makeCurrencyFormatter({ currency: 'MXN', convertEnabled: false });

  assert.strictEqual(formatUsd(null), '$0.00');
  assert.strictEqual(formatMxn(null), '$0.00 MXN');
  assert.strictEqual(formatUsd(undefined), '$0.00');
  assert.strictEqual(formatMxn(undefined), '$0.00 MXN');
  assert.strictEqual(formatUsd(''), '$0.00');
  assert.strictEqual(formatMxn(''), '$0.00 MXN');
  assert.strictEqual(formatUsd('   '), '$0.00');
  assert.strictEqual(formatMxn('   '), '$0.00 MXN');

  // Non-numeric strings
  assert.strictEqual(formatUsd('abc'), '$0.00');
  assert.strictEqual(formatMxn('abc'), '$0.00 MXN');
  assert.strictEqual(formatUsd('NaN'), '$0.00');
  assert.strictEqual(formatMxn('NaN'), '$0.00 MXN');
  assert.strictEqual(formatUsd(NaN), '$0.00');
  assert.strictEqual(formatMxn(NaN), '$0.00 MXN');
  assert.strictEqual(formatUsd('$150.00'), '$0.00');
  assert.strictEqual(formatUsd('--50'), '$0.00');
  assert.strictEqual(formatUsd('150 USD'), '$0.00');
  assert.strictEqual(formatUsd({}), '$0.00');
});

test('Finding B Verification: String numeric inputs parse correctly', () => {
  const formatUsd = makeCurrencyFormatter({ currency: 'USD' });
  const formatMxn = makeCurrencyFormatter({ currency: 'MXN', convertEnabled: false });

  assert.strictEqual(formatUsd('150.5'), '$150.50');
  assert.strictEqual(formatUsd('-150.5'), '-$150.50');
  assert.strictEqual(formatUsd('-0.01'), '-$0.01');
  assert.strictEqual(formatUsd('1000.99'), '$1,000.99');
  assert.strictEqual(formatUsd('  25.50  '), '$25.50');
  assert.strictEqual(formatUsd('  -42.00  '), '-$42.00');

  assert.strictEqual(formatMxn('150.5'), '$150.50 MXN');
  assert.strictEqual(formatMxn('-150.5'), '-$150.50 MXN');
});

test('Finding B Verification: Currency conversion at custom exchange rates', () => {
  // Test with standard 20.0 rate
  const formatMxn20 = makeCurrencyFormatter({
    currency: 'MXN',
    exchangeRate: 20.0,
    convertEnabled: true,
  });
  assert.strictEqual(formatMxn20(100), '$2,000.00 MXN');
  assert.strictEqual(formatMxn20(-150.5), '-$3,010.00 MXN');
  assert.strictEqual(formatMxn20(-0.01), '-$0.20 MXN');
  assert.strictEqual(formatMxn20(0), '$0.00 MXN');

  // Sub-cent converted: -0.001 * 20 = -0.02 -> -$0.02 MXN
  assert.strictEqual(formatMxn20(-0.001), '-$0.02 MXN');
  // Sub-sub-cent: -0.0001 * 20 = -0.002 -> rounds to 0.00 -> $0.00 MXN
  assert.strictEqual(formatMxn20(-0.0001), '$0.00 MXN');

  // Custom rate: 17.50 MXN/USD
  const formatMxn17_5 = makeCurrencyFormatter({
    currency: 'MXN',
    exchangeRate: 17.5,
    convertEnabled: true,
  });
  assert.strictEqual(formatMxn17_5(100), '$1,750.00 MXN');
  assert.strictEqual(formatMxn17_5(-50), '-$875.00 MXN');
  assert.strictEqual(formatMxn17_5(12.34), '$215.95 MXN');

  // Custom rate: 22.35 MXN/USD
  const formatMxn22_35 = makeCurrencyFormatter({
    currency: 'MXN',
    exchangeRate: 22.35,
    convertEnabled: true,
  });
  assert.strictEqual(formatMxn22_35(100), '$2,235.00 MXN');
  assert.strictEqual(formatMxn22_35(-100), '-$2,235.00 MXN');

  // Rate = 1.0 (parity)
  const formatMxn1 = makeCurrencyFormatter({
    currency: 'MXN',
    exchangeRate: 1.0,
    convertEnabled: true,
  });
  assert.strictEqual(formatMxn1(50.25), '$50.25 MXN');
  assert.strictEqual(formatMxn1(-50.25), '-$50.25 MXN');

  // Rate = 0.5 (fractional rate)
  const formatMxnHalf = makeCurrencyFormatter({
    currency: 'MXN',
    exchangeRate: 0.5,
    convertEnabled: true,
  });
  assert.strictEqual(formatMxnHalf(100), '$50.00 MXN');
  assert.strictEqual(formatMxnHalf(-100), '-$50.00 MXN');

  // Rate = 0.0
  const formatMxnZero = makeCurrencyFormatter({
    currency: 'MXN',
    exchangeRate: 0.0,
    convertEnabled: true,
  });
  assert.strictEqual(formatMxnZero(100), '$0.00 MXN');
  assert.strictEqual(formatMxnZero(-100), '$0.00 MXN');
});

test('Finding B Verification: Options override { convert: boolean } precedence', () => {
  // Provider has convertEnabled: false, but caller passes options: { convert: true }
  const formatMxnOff = makeCurrencyFormatter({
    currency: 'MXN',
    exchangeRate: 20.0,
    convertEnabled: false,
  });
  assert.strictEqual(formatMxnOff(10), '$10.00 MXN', 'Default when disabled should not convert');
  assert.strictEqual(formatMxnOff(10, { convert: true }), '$200.00 MXN', 'options.convert=true should override');
  assert.strictEqual(formatMxnOff(-10, { convert: true }), '-$200.00 MXN', 'options.convert=true should override with negative');

  // Provider has convertEnabled: true, but caller passes options: { convert: false }
  const formatMxnOn = makeCurrencyFormatter({
    currency: 'MXN',
    exchangeRate: 20.0,
    convertEnabled: true,
  });
  assert.strictEqual(formatMxnOn(10), '$200.00 MXN', 'Default when enabled should convert');
  assert.strictEqual(formatMxnOn(10, { convert: false }), '$10.00 MXN', 'options.convert=false should override');
  assert.strictEqual(formatMxnOn(-10, { convert: false }), '-$10.00 MXN');

  // USD mode ignores convert flag (base currency is USD)
  const formatUsd = makeCurrencyFormatter({
    currency: 'USD',
    exchangeRate: 20.0,
    convertEnabled: true,
  });
  assert.strictEqual(formatUsd(10), '$10.00', 'USD mode does not apply MXN exchange rate');
  assert.strictEqual(formatUsd(10, { convert: true }), '$10.00', 'USD mode ignores convert override');
  assert.strictEqual(formatUsd(-10, { convert: true }), '-$10.00');
});

// ===========================================================================
// SECTION 3: E2E Runner Multi-Feature Filter Verification
// ===========================================================================
console.log('\n>>> [3. Runner Multi-Feature Filter Verification] <<<');

test('Runner: Split comma-separated feature lists correctly', () => {
  const runnerPath = path.join(projectRoot, 'tests/runner.js');
  const runnerSource = fs.readFileSync(runnerPath, 'utf-8');
  assert.ok(
    /config\.featureFilter\.split\(','\)/.test(runnerSource),
    'runner.js must split featureFilter by comma'
  );
  assert.ok(
    /requestedFeatures\.some\(/.test(runnerSource),
    'runner.js must test requested features with .some()'
  );
});

// ===========================================================================
// SUMMARY
// ===========================================================================
console.log('\n===============================================================');
console.log(`SUMMARY: Ran ${totalTests} adversarial stress tests.`);
console.log(`Passed: ${passedTests}, Failed: ${failedTests}`);
console.log('===============================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
