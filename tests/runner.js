// runner.js — Zero-Dependency E2E Test Suite Runner for GadgetStock
import { config } from './test-config.js';
import { apiClient } from './helpers/api-client.js';
import { repoInspector } from './helpers/repo-inspector.js';
import * as assertions from './helpers/assertions.js';
import assert from 'node:assert';

class TestHarness {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    };
    this.failures = [];
    this.isServerOnline = false;
  }

  test(testDef) {
    this.tests.push(testDef);
  }

  async run() {
    const startTime = Date.now();
    console.log('===============================================================');
    console.log('   GadgetStock Opaque-Box E2E Test Suite Runner');
    console.log('===============================================================');
    console.log(`Backend Target URL : ${config.backendUrl}`);
    console.log(`Frontend Target URL: ${config.frontendUrl}`);
    console.log(`Working Directory  : ${config.projectRoot}`);
    console.log(`Offline Mode Flag  : ${config.isOffline}`);
    if (config.tierFilter) console.log(`Tier Filter Applied: Tier ${config.tierFilter}`);
    if (config.featureFilter) console.log(`Feature Filter     : ${config.featureFilter}`);
    console.log('---------------------------------------------------------------');

    // Check server status
    if (config.isOffline) {
      this.isServerOnline = false;
      console.log('Status: Offline mode forced via CLI flag (--offline).');
    } else {
      process.stdout.write('Checking backend server availability at ' + config.backendUrl + '... ');
      this.isServerOnline = await apiClient.isServerOnline();
      if (this.isServerOnline) {
        console.log('ONLINE (200 OK)');
      } else {
        console.log('OFFLINE (server not running)');
        console.log('Note: Tests marked requiresServer will be cleanly SKIPPED.');
      }
    }
    console.log('===============================================================\n');

    // Filter tests
    const runnableTests = this.tests.filter((t) => {
      if (config.tierFilter && t.tier !== config.tierFilter) return false;
      if (config.featureFilter && t.feature) {
        const requestedFeatures = config.featureFilter.split(',').map((f) => f.trim().toUpperCase());
        if (!requestedFeatures.some((f) => t.feature.toUpperCase().includes(f))) return false;
      }
      return true;
    });

    this.results.total = runnableTests.length;
    console.log(`Executing ${runnableTests.length} tests...\n`);

    let currentTier = null;
    let currentFeature = null;

    for (const t of runnableTests) {
      if (t.tier !== currentTier) {
        currentTier = t.tier;
        console.log(`\n>>> [TIER ${currentTier}] <<<`);
      }
      if (t.feature && t.feature !== currentFeature) {
        currentFeature = t.feature;
        if (config.isVerbose) {
          console.log(`  -- Feature ${currentFeature} --`);
        }
      }

      if (t.requiresServer && !this.isServerOnline) {
        this.results.skipped++;
        console.log(`[SKIP] [Tier ${t.tier}] [${t.id}] ${t.name} (Requires backend server)`);
        continue;
      }

      const tStart = Date.now();
      try {
        await t.fn({
          apiClient,
          repoInspector,
          assert,
          assertions,
          config,
        });
        const duration = Date.now() - tStart;
        this.results.passed++;
        console.log(`[PASS] [Tier ${t.tier}] [${t.id}] ${t.name} (${duration}ms)`);
      } catch (err) {
        const duration = Date.now() - tStart;
        this.results.failed++;
        console.error(`[FAIL] [Tier ${t.tier}] [${t.id}] ${t.name} (${duration}ms)`);
        console.error(`       Error: ${err.message}`);
        this.failures.push({
          test: t,
          error: err,
        });
      }
    }

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n===============================================================');
    console.log('                      TEST EXECUTION SUMMARY');
    console.log('===============================================================');
    console.log(`Total Tests Run : ${this.results.total}`);
    console.log(`Passed          : ${this.results.passed}`);
    console.log(`Failed          : ${this.results.failed}`);
    console.log(`Skipped         : ${this.results.skipped}`);
    console.log(`Total Time      : ${totalDuration}s`);
    console.log('===============================================================');

    if (this.failures.length > 0) {
      console.log('\nFAILURE DETAILS:');
      this.failures.forEach((f, idx) => {
        console.log(`\n${idx + 1}) [Tier ${f.test.tier}] [${f.test.id}] ${f.test.name}`);
        console.log(`   Message: ${f.error.message}`);
        if (f.error.stack && config.isVerbose) {
          console.log(`   Stack: ${f.error.stack}`);
        }
      });
      process.exit(1);
    } else {
      console.log('\nALL RUNNABLE TESTS PASSED SUCCESSFULLY.');
      process.exit(0);
    }
  }
}

const harness = new TestHarness();

// Dynamic imports of test suites
async function loadSuites() {
  const suites = [
    // Tier 1
    './tier1_features/f01_to_f05_repo_db.test.js',
    './tier1_features/f06_to_f08_model_fields.test.js',
    './tier1_features/f09_to_f11_api_validation.test.js',
    './tier1_features/f12_to_f13_crud_endpoints.test.js',
    './tier1_features/f14_to_f17_financial_engine.test.js',
    './tier1_features/f18_to_f21_frontend_views.test.js',
    './tier1_features/f22_to_f23_i18n_currency.test.js',
    './tier1_features/f24_to_f28_repo_cleanliness.test.js',
    // Tier 2
    './tier2_boundaries/boundary_financial.test.js',
    './tier2_boundaries/boundary_validation.test.js',
    './tier2_boundaries/boundary_not_found.test.js',
    './tier2_boundaries/boundary_inputs.test.js',
    // Tier 3
    './tier3_interactions/lifecycle_combinations.test.js',
    './tier3_interactions/state_transitions.test.js',
    // Tier 4
    './tier4_scenarios/resale_shop_lifecycle.test.js',
    './tier4_scenarios/system_integrity_scenario.test.js',
  ];

  for (const suitePath of suites) {
    try {
      const module = await import(suitePath);
      if (typeof module.register === 'function') {
        module.register(harness);
      }
    } catch (err) {
      console.error(`Failed to load suite ${suitePath}:`, err);
    }
  }

  await harness.run();
}

loadSuites().catch((err) => {
  console.error('Fatal Runner Error:', err);
  process.exit(1);
});
