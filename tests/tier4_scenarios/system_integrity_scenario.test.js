// tier4_scenarios/system_integrity_scenario.test.js
// Tier 4: Real-World Scenarios — System Integrity, Security & Architecture Audit

export function register(suite) {
  suite.test({
    id: 'S_SYS_01',
    tier: 4,
    feature: 'SCENARIO_SYS',
    name: 'S_SYS_01: Full Repository & Configuration Hygiene Audit — No credentials, clean git, no clutter',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      // 1. Verify Git is initialized
      assert.ok(repoInspector.isGitInitialized(), 'Git must be initialized at project root');

      // 2. Verify no residual clutter
      const clutter = repoInspector.getResidualClutterFiles();
      assert.strictEqual(
        clutter.length,
        0,
        `Residual clutter files must be cleaned up! Found: ${clutter.join(', ')}`
      );

      // 3. Verify .gitignore exists
      assert.ok(repoInspector.fileExists('.gitignore'), 'Unified .gitignore must exist');

      // 4. Verify no Supabase credentials in properties
      const appProps = repoInspector.readFile('back/src/main/resources/application.properties') || '';
      assert.strictEqual(
        /aws-0-[a-z0-9.-]+\.pooler\.supabase\.com/i.test(appProps),
        false,
        'Found exposed Supabase host in application.properties'
      );
    },
  });

  suite.test({
    id: 'S_SYS_02',
    tier: 4,
    feature: 'SCENARIO_SYS',
    name: 'S_SYS_02: Database Profile Architecture Segregation Audit — H2 for dev vs PostgreSQL for prod',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      // Dev profile: in-memory H2
      const devProps = repoInspector.getProperties('back/src/main/resources/application-dev.properties');
      const mainProps = repoInspector.getProperties('back/src/main/resources/application.properties');
      const devUrl = devProps['spring.datasource.url'] || mainProps['spring.datasource.url'] || '';
      assert.ok(devUrl.includes('jdbc:h2:mem:'), `Dev profile must use in-memory H2 DB, got ${devUrl}`);

      // Prod profile: env variables
      const prodContent = repoInspector.readFile('back/src/main/resources/application-prod.properties');
      assert.ok(prodContent !== null, 'application-prod.properties must exist');
      assert.ok(prodContent.includes('${DB_URL'), 'Prod profile must bind ${DB_URL}');
      assert.ok(prodContent.includes('${DB_USERNAME'), 'Prod profile must bind ${DB_USERNAME}');
      assert.ok(prodContent.includes('${DB_PASSWORD'), 'Prod profile must bind ${DB_PASSWORD}');
    },
  });

  suite.test({
    id: 'S_SYS_03',
    tier: 4,
    feature: 'SCENARIO_SYS',
    name: 'S_SYS_03: Domain Model & REST Contract Schema Validation — 100% adherence to PROJECT.md contracts',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      // Test GadgetModel contract
      const item = await apiClient.createGadget({
        name: 'Contract Audit Gadget',
        model: 'Audit-1',
        category: 'Smartphones',
        price: 200.0,
        repairCost: 30.0,
        listedPrice: 300.0,
        comments: 'Audit test notes',
        repair: true,
        isSold: false,
      });
      assertions.assertStatus(item, 201);
      assertions.assertGadgetModelSchema(item.data, 'GadgetModel Contract');

      // Test Financial Summary contract
      const summary = await apiClient.getFinancialSummary();
      assertions.assertStatus(summary, 200);
      assertions.assertFinancialSummarySchema(summary.data, 'FinancialSummaryDTO Contract');

      // Test Error Response contract
      const errorRes = await apiClient.getGadgetById(9999997);
      assertions.assertStatus(errorRes, 404);
      assertions.assertErrorResponseSchema(errorRes.data, 404, '/gadget/9999997');

      await apiClient.deleteGadget(item.data.id);
    },
  });

  suite.test({
    id: 'S_SYS_04',
    tier: 4,
    feature: 'SCENARIO_SYS',
    name: 'S_SYS_04: Frontend Architecture Audit — LanguageContext, CurrencyContext, translations and Vite proxy',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      // Check Context files
      const hasLangCtx =
        repoInspector.fileExists('front/src/context/LanguageContext.jsx') ||
        repoInspector.fileExists('front/src/context/LanguageContext.js');
      const hasCurrCtx =
        repoInspector.fileExists('front/src/context/CurrencyContext.jsx') ||
        repoInspector.fileExists('front/src/context/CurrencyContext.js');
      assert.ok(hasLangCtx, 'LanguageContext must exist in front/src/context');
      assert.ok(hasCurrCtx, 'CurrencyContext must exist in front/src/context');

      // Check Vite proxy
      const viteConfig = repoInspector.readFile('front/vite.config.js') || '';
      assert.ok(/proxy/i.test(viteConfig) && /8080/i.test(viteConfig), 'vite.config.js must proxy to backend');
    },
  });

  suite.test({
    id: 'S_SYS_05',
    tier: 4,
    feature: 'SCENARIO_SYS',
    name: 'S_SYS_05: Authoritative DIARIO.md Audit Trail — Documents all requirements R1 through R5',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const diario = repoInspector.readFile('DIARIO.md');
      assert.ok(diario !== null, 'Root DIARIO.md must exist');
      assert.ok(diario.length > 200, 'DIARIO.md must be populated with project change logs');

      // Verify requirement coverage
      assert.ok(/R1|Base de datos|credenciales|H2/i.test(diario), 'DIARIO.md must reference R1');
      assert.ok(/R2|Modelo|GadgetModel|category|repairCost/i.test(diario), 'DIARIO.md must reference R2');
      assert.ok(/R3|Financier|ROI|Ganancia|Capital.*Stock/i.test(diario), 'DIARIO.md must reference R3');
      assert.ok(/R4|React|Vite|Dashboard|idioma|moneda/i.test(diario), 'DIARIO.md must reference R4');
      assert.ok(/R5|Limpieza|Git|gitignore/i.test(diario), 'DIARIO.md must reference R5');
    },
  });
}
