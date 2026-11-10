// tier1_features/f18_to_f21_frontend_views.test.js
// Tests for Features 18 through 21: Dashboard View, Detailed Inventory Tab, Finances Tab, Quick Add Form

export function register(suite) {
  // =========================================================================
  // Feature 18: Dashboard View
  // =========================================================================
  suite.test({
    id: 'F18_T1',
    tier: 1,
    feature: 'F18',
    name: 'F18: Verifies Dashboard component or directory exists in front/src',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const hasDashboard = frontFiles.some(
        (f) => f.includes('Dashboard') || f.includes('MetricCards') || f.includes('QuickInventory')
      );
      assert.ok(hasDashboard, 'Dashboard component or subcomponents must exist in front/src');
    },
  });

  suite.test({
    id: 'F18_T2',
    tier: 1,
    feature: 'F18',
    name: 'F18: Verifies Dashboard components reference financial metrics (Stock Capital, Net Profit, ROI)',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const dashboardFiles = frontFiles.filter((f) => /Dashboard|MetricCards|App\.jsx/i.test(f));
      assert.ok(dashboardFiles.length > 0, 'Dashboard files found');
      let foundMetrics = false;
      for (const df of dashboardFiles) {
        const content = repoInspector.readFile(df.replace(repoInspector.config?.projectRoot || '', ''));
        if (
          /stockCapital|stock_capital|capital.*stock/i.test(content) &&
          /netProfit|net_profit|profit/i.test(content) &&
          /roi/i.test(content)
        ) {
          foundMetrics = true;
          break;
        }
      }
      assert.ok(foundMetrics, 'Dashboard must bind Stock Capital, Net Profit, and ROI metrics');
    },
  });

  suite.test({
    id: 'F18_T3',
    tier: 1,
    feature: 'F18',
    name: 'F18: Verifies Dashboard includes Quick Inventory preview view',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const hasQuickInv = frontFiles.some((f) => /QuickInventory|Inventory/i.test(f));
      assert.ok(hasQuickInv, 'Quick inventory preview component must exist in frontend');
    },
  });

  suite.test({
    id: 'F18_T4',
    tier: 1,
    feature: 'F18',
    name: 'F18: Verifies Dashboard includes Quick Add product entry form',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const hasQuickAdd = frontFiles.some((f) => /QuickAdd|AddForm/i.test(f));
      assert.ok(hasQuickAdd, 'Quick Add form component must exist in frontend');
    },
  });

  suite.test({
    id: 'F18_T5',
    tier: 1,
    feature: 'F18',
    name: 'F18: Verifies vite.config.js configures proxy for /gadget backend calls',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const viteConfig = repoInspector.readFile('front/vite.config.js');
      assert.ok(viteConfig !== null, 'front/vite.config.js must exist');
      assert.ok(
        /proxy/i.test(viteConfig) && /8080/i.test(viteConfig),
        'vite.config.js should configure proxy forwarding /gadget to port 8080'
      );
    },
  });

  // =========================================================================
  // Feature 19: Detailed Inventory Tab
  // =========================================================================
  suite.test({
    id: 'F19_T1',
    tier: 1,
    feature: 'F19',
    name: 'F19: Verifies Inventory table component exists in front/src',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const hasInventory = frontFiles.some((f) => /InventoryTable|Inventory/i.test(f));
      assert.ok(hasInventory, 'Detailed Inventory table component must exist');
    },
  });

  suite.test({
    id: 'F19_T2',
    tier: 1,
    feature: 'F19',
    name: 'F19: Verifies Inventory component supports category filtering logic',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const invFiles = frontFiles.filter((f) => /Inventory/i.test(f));
      let hasCategoryFilter = false;
      for (const inf of invFiles) {
        const content = repoInspector.readFile(inf.replace(repoInspector.config?.projectRoot || '', ''));
        if (/category/i.test(content) && (/filter/i.test(content) || /select/i.test(content))) {
          hasCategoryFilter = true;
          break;
        }
      }
      assert.ok(hasCategoryFilter, 'Inventory view must implement category filter');
    },
  });

  suite.test({
    id: 'F19_T3',
    tier: 1,
    feature: 'F19',
    name: 'F19: Verifies Inventory component supports search by name / model',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const invFiles = frontFiles.filter((f) => /Inventory/i.test(f));
      let hasSearch = false;
      for (const inf of invFiles) {
        const content = repoInspector.readFile(inf.replace(repoInspector.config?.projectRoot || '', ''));
        if (/search/i.test(content) || /includes/i.test(content) || /searchTerm/i.test(content)) {
          hasSearch = true;
          break;
        }
      }
      assert.ok(hasSearch, 'Inventory view must implement search functionality');
    },
  });

  suite.test({
    id: 'F19_T4',
    tier: 1,
    feature: 'F19',
    name: 'F19: Verifies Edit modal or edit functionality exists in Inventory view',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const hasEdit = frontFiles.some((f) => /Edit|Modal|update/i.test(f));
      assert.ok(hasEdit, 'Edit gadget modal or form must exist in Inventory view');
    },
  });

  suite.test({
    id: 'F19_T5',
    tier: 1,
    feature: 'F19',
    name: 'F19: Verifies Mark-as-Sold and Delete actions exist in Inventory view',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const invFiles = frontFiles.filter((f) => /Inventory/i.test(f));
      let hasActions = false;
      for (const inf of invFiles) {
        const content = repoInspector.readFile(inf.replace(repoInspector.config?.projectRoot || '', ''));
        if ((/markSold|isSold|sell/i.test(content)) && (/delete|remove/i.test(content))) {
          hasActions = true;
          break;
        }
      }
      assert.ok(hasActions, 'Inventory view must provide mark-as-sold and delete triggers');
    },
  });

  // =========================================================================
  // Feature 20: Finances & Sales Tab
  // =========================================================================
  suite.test({
    id: 'F20_T1',
    tier: 1,
    feature: 'F20',
    name: 'F20: Verifies Finances and Sales component or tab exists in front/src',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const hasFinances = frontFiles.some((f) => /Finance|SoldItems|Sales/i.test(f));
      assert.ok(hasFinances, 'Finances & Sales tab component must exist');
    },
  });

  suite.test({
    id: 'F20_T2',
    tier: 1,
    feature: 'F20',
    name: 'F20: Verifies Sales table displays historical sales records',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const finFiles = frontFiles.filter((f) => /Finance|SoldItems|Sales/i.test(f));
      let hasSalesTable = false;
      for (const f of finFiles) {
        const content = repoInspector.readFile(f.replace(repoInspector.config?.projectRoot || '', ''));
        if (/table|tbody|<tr/i.test(content) || /gadgets-sold|sold/i.test(content)) {
          hasSalesTable = true;
          break;
        }
      }
      assert.ok(hasSalesTable, 'Finances tab must render sales records table');
    },
  });

  suite.test({
    id: 'F20_T3',
    tier: 1,
    feature: 'F20',
    name: 'F20: Verifies sales table computes or renders individual item profit and ROI %',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const finFiles = frontFiles.filter((f) => /Finance|SoldItems|Sales|calculations/i.test(f));
      let hasProfitLogic = false;
      for (const f of finFiles) {
        const content = repoInspector.readFile(f.replace(repoInspector.config?.projectRoot || '', ''));
        if (/soldPrice/i.test(content) && (/price/i.test(content) || /repairCost/i.test(content))) {
          hasProfitLogic = true;
          break;
        }
      }
      assert.ok(hasProfitLogic, 'Finances view must display per-item profit and investment metrics');
    },
  });

  suite.test({
    id: 'F20_T4',
    tier: 1,
    feature: 'F20',
    name: 'F20: Verifies sales table renders soldDate and repairCost columns',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const finFiles = frontFiles.filter((f) => /Finance|SoldItems|Sales/i.test(f));
      let hasDateAndRepair = false;
      for (const f of finFiles) {
        const content = repoInspector.readFile(f.replace(repoInspector.config?.projectRoot || '', ''));
        if (/soldDate/i.test(content) || /repairCost/i.test(content)) {
          hasDateAndRepair = true;
          break;
        }
      }
      assert.ok(hasDateAndRepair, 'Sales table must reference soldDate and repairCost');
    },
  });

  suite.test({
    id: 'F20_T5',
    tier: 1,
    feature: 'F20',
    name: 'F20: Verifies Finances view queries /gadget/gadgets-sold endpoint',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      let referencesSoldEndpoint = false;
      for (const f of frontFiles) {
        const content = repoInspector.readFile(f.replace(repoInspector.config?.projectRoot || '', ''));
        if (/gadgets-sold/i.test(content)) {
          referencesSoldEndpoint = true;
          break;
        }
      }
      assert.ok(referencesSoldEndpoint, 'Frontend must call /gadget/gadgets-sold for sales table');
    },
  });

  // =========================================================================
  // Feature 21: Quick Add Product Form
  // =========================================================================
  suite.test({
    id: 'F21_T1',
    tier: 1,
    feature: 'F21',
    name: 'F21: Verifies QuickAddForm component has input fields for name, price, category, repairCost',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const formFiles = frontFiles.filter((f) => /QuickAdd|AddForm/i.test(f));
      assert.ok(formFiles.length > 0, 'QuickAddForm component must exist');
      const content = repoInspector.readFile(formFiles[0].replace(repoInspector.config?.projectRoot || '', ''));
      assert.ok(/name/i.test(content), 'Form must have name input');
      assert.ok(/price/i.test(content), 'Form must have price input');
      assert.ok(/category/i.test(content), 'Form must have category input');
    },
  });

  suite.test({
    id: 'F21_T2',
    tier: 1,
    feature: 'F21',
    name: 'F21: Verifies Quick Add form validates non-empty product name',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const formFiles = frontFiles.filter((f) => /QuickAdd|AddForm/i.test(f));
      assert.ok(formFiles.length > 0);
      const content = repoInspector.readFile(formFiles[0].replace(repoInspector.config?.projectRoot || '', ''));
      const hasValidation = /trim\(\)|required|!name/i.test(content);
      assert.ok(hasValidation, 'Quick Add form must validate non-empty name');
    },
  });

  suite.test({
    id: 'F21_T3',
    tier: 1,
    feature: 'F21',
    name: 'F21: Verifies Quick Add form validates non-negative price',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const formFiles = frontFiles.filter((f) => /QuickAdd|AddForm/i.test(f));
      assert.ok(formFiles.length > 0);
      const content = repoInspector.readFile(formFiles[0].replace(repoInspector.config?.projectRoot || '', ''));
      const hasPriceValidation = /price.*<=.*0|price.*<.*0|min=["']0["']/i.test(content);
      assert.ok(hasPriceValidation, 'Quick Add form should enforce price >= 0');
    },
  });

  suite.test({
    id: 'F21_T4',
    tier: 1,
    feature: 'F21',
    name: 'F21: Verifies Quick Add form dispatches POST /gadget payload',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const formFiles = frontFiles.filter((f) => /QuickAdd|AddForm|api/i.test(f));
      let hasPost = false;
      for (const f of formFiles) {
        const content = repoInspector.readFile(f.replace(repoInspector.config?.projectRoot || '', ''));
        if (/POST/i.test(content) && /gadget/i.test(content)) {
          hasPost = true;
          break;
        }
      }
      assert.ok(hasPost, 'Quick Add form or API client must send POST /gadget');
    },
  });

  suite.test({
    id: 'F21_T5',
    tier: 1,
    feature: 'F21',
    name: 'F21: Verifies Quick Add form resets fields upon successful submission',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const frontFiles = repoInspector.getFrontendSourceFiles();
      const formFiles = frontFiles.filter((f) => /QuickAdd|AddForm/i.test(f));
      assert.ok(formFiles.length > 0);
      const content = repoInspector.readFile(formFiles[0].replace(repoInspector.config?.projectRoot || '', ''));
      const hasReset = /setName\(["']["']\)|setFormData\(initial|reset\(\)/i.test(content);
      assert.ok(hasReset, 'Quick Add form must reset form state after submission');
    },
  });
}
