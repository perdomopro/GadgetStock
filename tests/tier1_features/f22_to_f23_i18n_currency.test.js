// tier1_features/f22_to_f23_i18n_currency.test.js
// Tests for Features 22 and 23: Language Selector (ES/EN) & Currency Selector (USD/MXN)

export function register(suite) {
  // =========================================================================
  // Feature 22: Language Selector (ES/EN)
  // =========================================================================
  suite.test({
    id: 'F22_T1',
    tier: 1,
    feature: 'F22',
    name: 'F22: Verifies LanguageContext.jsx exists in front/src/context',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const exists =
        repoInspector.fileExists('front/src/context/LanguageContext.jsx') ||
        repoInspector.fileExists('front/src/context/LanguageContext.js');
      assert.ok(exists, 'front/src/context/LanguageContext.jsx must exist');
    },
  });

  suite.test({
    id: 'F22_T2',
    tier: 1,
    feature: 'F22',
    name: 'F22: Verifies translations dictionary contains Spanish (es) and English (en) dictionaries',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const transFile = frontFiles.find((f) => /translations|i18n/i.test(f));
      assert.ok(transFile, 'translations.js file must exist in frontend');
      const content = repoInspector.readFile(transFile.replace(repoInspector.config?.projectRoot || '', ''));
      assert.ok(/es\s*:/i.test(content) || /es\s*=\s*\{/i.test(content), 'Translations must include Spanish dictionary');
      assert.ok(/en\s*:/i.test(content) || /en\s*=\s*\{/i.test(content), 'Translations must include English dictionary');
    },
  });

  suite.test({
    id: 'F22_T3',
    tier: 1,
    feature: 'F22',
    name: 'F22: Verifies Spanish translations cover core business terms',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const transFile = frontFiles.find((f) => /translations|i18n/i.test(f));
      assert.ok(transFile);
      const content = repoInspector.readFile(transFile.replace(repoInspector.config?.projectRoot || '', ''));
      const requiredTerms = ['Capital en Stock', 'Ganancia Neta', 'Inventario', 'Finanzas'];
      for (const term of requiredTerms) {
        assert.ok(content.includes(term), `Spanish dictionary must include '${term}'`);
      }
    },
  });

  suite.test({
    id: 'F22_T4',
    tier: 1,
    feature: 'F22',
    name: 'F22: Verifies English translations cover core business terms',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const transFile = frontFiles.find((f) => /translations|i18n/i.test(f));
      assert.ok(transFile);
      const content = repoInspector.readFile(transFile.replace(repoInspector.config?.projectRoot || '', ''));
      const requiredTerms = ['Stock Capital', 'Net Profit', 'Inventory', 'Finances'];
      for (const term of requiredTerms) {
        assert.ok(content.includes(term), `English dictionary must include '${term}'`);
      }
    },
  });

  suite.test({
    id: 'F22_T5',
    tier: 1,
    feature: 'F22',
    name: 'F22: Verifies Header or Navigation component contains language toggle control',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const headerFiles = frontFiles.filter((f) => /Header|Navbar|App\.jsx/i.test(f));
      assert.ok(headerFiles.length > 0, 'Header/Navigation component must exist');
      let hasLangToggle = false;
      for (const f of headerFiles) {
        const content = repoInspector.readFile(f.replace(repoInspector.config?.projectRoot || '', ''));
        if (/LanguageContext|setLanguage|toggleLanguage|ES|EN/i.test(content)) {
          hasLangToggle = true;
          break;
        }
      }
      assert.ok(hasLangToggle, 'Header must render language toggle control (ES/EN)');
    },
  });

  // =========================================================================
  // Feature 23: Currency Selector (USD/MXN)
  // =========================================================================
  suite.test({
    id: 'F23_T1',
    tier: 1,
    feature: 'F23',
    name: 'F23: Verifies CurrencyContext.jsx exists in front/src/context',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const exists =
        repoInspector.fileExists('front/src/context/CurrencyContext.jsx') ||
        repoInspector.fileExists('front/src/context/CurrencyContext.js');
      assert.ok(exists, 'front/src/context/CurrencyContext.jsx must exist');
    },
  });

  suite.test({
    id: 'F23_T2',
    tier: 1,
    feature: 'F23',
    name: 'F23: Verifies CurrencyContext defines USD and MXN currency modes',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const currFile = frontFiles.find((f) => /CurrencyContext/i.test(f));
      assert.ok(currFile, 'CurrencyContext must exist');
      const content = repoInspector.readFile(currFile.replace(repoInspector.config?.projectRoot || '', ''));
      assert.ok(/USD/i.test(content), 'Currency context must support USD');
      assert.ok(/MXN/i.test(content), 'Currency context must support MXN');
    },
  });

  suite.test({
    id: 'F23_T3',
    tier: 1,
    feature: 'F23',
    name: 'F23: Verifies currency formatter handles USD formatting with dollar symbol',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const currFile = frontFiles.find((f) => /CurrencyContext|formatCurrency/i.test(f));
      assert.ok(currFile);
      const content = repoInspector.readFile(currFile.replace(repoInspector.config?.projectRoot || '', ''));
      assert.ok(/formatCurrency|\$|Intl\.NumberFormat/i.test(content), 'Must provide currency formatting helper');
    },
  });

  suite.test({
    id: 'F23_T4',
    tier: 1,
    feature: 'F23',
    name: 'F23: Verifies currency formatter handles MXN formatting with MXN indicator',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const currFile = frontFiles.find((f) => /CurrencyContext|formatCurrency/i.test(f));
      assert.ok(currFile);
      const content = repoInspector.readFile(currFile.replace(repoInspector.config?.projectRoot || '', ''));
      assert.ok(/MXN/i.test(content), 'Must support MXN currency format');
    },
  });

  suite.test({
    id: 'F23_T5',
    tier: 1,
    feature: 'F23',
    name: 'F23: Verifies Header or Navigation component contains currency toggle control',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const headerFiles = frontFiles.filter((f) => /Header|Navbar|App\.jsx/i.test(f));
      assert.ok(headerFiles.length > 0);
      let hasCurrencyToggle = false;
      for (const f of headerFiles) {
        const content = repoInspector.readFile(f.replace(repoInspector.config?.projectRoot || '', ''));
        if (/CurrencyContext|setCurrency|toggleCurrency|USD|MXN/i.test(content)) {
          hasCurrencyToggle = true;
          break;
        }
      }
      assert.ok(hasCurrencyToggle, 'Header must render currency toggle control (USD/MXN)');
    },
  });
}
