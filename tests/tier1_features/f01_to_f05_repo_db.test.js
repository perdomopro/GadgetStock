// tier1_features/f01_to_f05_repo_db.test.js
// Tests for Features 1 through 5: Sanitization, H2 DB, Web Console, Data Seeder, Environment Decoupling

export function register(suite) {
  // =========================================================================
  // Feature 1: Credential Sanitization
  // =========================================================================
  suite.test({
    id: 'F01_T1',
    tier: 1,
    feature: 'F01',
    name: 'F01: Verifies application.properties does not contain plaintext Supabase URL or host',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const content = repoInspector.readFile('back/src/main/resources/application.properties');
      assert.ok(content !== null, 'application.properties must exist');
      const hasSupabaseUrl = /aws-0-[a-z0-9.-]+\.pooler\.supabase\.com/i.test(content) || /supabase\.co/i.test(content);
      assert.strictEqual(hasSupabaseUrl, false, 'Plaintext Supabase database URL found in application.properties');
    },
  });

  suite.test({
    id: 'F01_T2',
    tier: 1,
    feature: 'F01',
    name: 'F01: Verifies application.properties does not contain plaintext database passwords',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const content = repoInspector.readFile('back/src/main/resources/application.properties');
      assert.ok(content !== null, 'application.properties must exist');
      const hasHardcodedPassword = /spring\.datasource\.password\s*=\s*(?!(\$\{.*\}|\s*$))[^\r\n]+/i.test(content);
      assert.strictEqual(hasHardcodedPassword, false, 'Plaintext password found in application.properties');
    },
  });

  suite.test({
    id: 'F01_T3',
    tier: 1,
    feature: 'F01',
    name: 'F01: Verifies application-dev.properties contains no external production credentials',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const devContent = repoInspector.readFile('back/src/main/resources/application-dev.properties');
      if (devContent) {
        const hasExternalHost = /supabase|postgres:\/\/|jdbc:postgresql:\/\/(?!localhost)[^\r\n]+/i.test(devContent);
        assert.strictEqual(hasExternalHost, false, 'External cloud DB credentials detected in application-dev.properties');
      }
    },
  });

  suite.test({
    id: 'F01_T4',
    tier: 1,
    feature: 'F01',
    name: 'F01: Verifies main application.properties delegates or defines default dev profile',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const props = repoInspector.getProperties('back/src/main/resources/application.properties');
      const activeProfile = props['spring.profiles.active'] || props['spring.profiles.default'];
      const content = repoInspector.readFile('back/src/main/resources/application.properties') || '';
      const hasDevOrH2 = activeProfile === 'dev' || /h2:mem/i.test(content) || /dev/i.test(content);
      assert.ok(hasDevOrH2, 'application.properties should reference dev profile or H2 local database');
    },
  });

  suite.test({
    id: 'F01_T5',
    tier: 1,
    feature: 'F01',
    name: 'F01: Verifies absence of hardcoded tokens or API keys in backend configuration resources',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const files = ['application.properties', 'application-dev.properties', 'application-prod.properties'];
      for (const f of files) {
        const content = repoInspector.readFile(`back/src/main/resources/${f}`);
        if (content) {
          assert.strictEqual(/eyJhbGciOi/i.test(content), false, `JWT secret/token found in ${f}`);
          assert.strictEqual(/apikey\s*=\s*[a-zA-Z0-9_\-]{20,}/i.test(content), false, `API key found in ${f}`);
        }
      }
    },
  });

  // =========================================================================
  // Feature 2: In-Memory H2 Database
  // =========================================================================
  suite.test({
    id: 'F02_T1',
    tier: 1,
    feature: 'F02',
    name: 'F02: Verifies H2 in-memory URL jdbc:h2:mem:gadgetdb configured in dev profile',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const devProps = repoInspector.getProperties('back/src/main/resources/application-dev.properties');
      const mainProps = repoInspector.getProperties('back/src/main/resources/application.properties');
      const url = devProps['spring.datasource.url'] || mainProps['spring.datasource.url'];
      assert.ok(url && url.includes('jdbc:h2:mem:'), `Expected H2 in-memory URL jdbc:h2:mem:..., got '${url}'`);
    },
  });

  suite.test({
    id: 'F02_T2',
    tier: 1,
    feature: 'F02',
    name: 'F02: Verifies H2 Driver class org.h2.Driver configured',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const devProps = repoInspector.getProperties('back/src/main/resources/application-dev.properties');
      const mainProps = repoInspector.getProperties('back/src/main/resources/application.properties');
      const driver = devProps['spring.datasource.driver-class-name'] || mainProps['spring.datasource.driver-class-name'];
      assert.ok(driver && driver.includes('h2.Driver'), `Expected driver org.h2.Driver, got '${driver}'`);
    },
  });

  suite.test({
    id: 'F02_T3',
    tier: 1,
    feature: 'F02',
    name: 'F02: Verifies pom.xml includes com.h2database dependency',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const pom = repoInspector.readFile('back/pom.xml');
      assert.ok(pom !== null, 'pom.xml must exist in back/');
      assert.ok(pom.includes('com.h2database') || pom.includes('<artifactId>h2</artifactId>'), 'pom.xml must declare H2 dependency');
    },
  });

  suite.test({
    id: 'F02_T4',
    tier: 1,
    feature: 'F02',
    name: 'F02: Verifies JPA ddl-auto is configured for in-memory lifecycle (update or create-drop)',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const devProps = repoInspector.getProperties('back/src/main/resources/application-dev.properties');
      const mainProps = repoInspector.getProperties('back/src/main/resources/application.properties');
      const ddl = devProps['spring.jpa.hibernate.ddl-auto'] || mainProps['spring.jpa.hibernate.ddl-auto'];
      assert.ok(ddl && ['update', 'create-drop', 'create'].includes(ddl), `Expected ddl-auto update/create-drop, got '${ddl}'`);
    },
  });

  suite.test({
    id: 'F02_T5',
    tier: 1,
    feature: 'F02',
    name: 'F02: Verifies in-memory DB boots and handles live query without external network dependency',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const res = await apiClient.getGadgets();
      assertions.assertStatus(res, 200, 'GET /gadget should return 200 using local H2');
      assert.ok(Array.isArray(res.data), 'GET /gadget should return an array from H2');
    },
  });

  // =========================================================================
  // Feature 3: H2 Web Console
  // =========================================================================
  suite.test({
    id: 'F03_T1',
    tier: 1,
    feature: 'F03',
    name: 'F03: Verifies spring.h2.console.enabled is set to true in dev properties',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const devProps = repoInspector.getProperties('back/src/main/resources/application-dev.properties');
      const mainProps = repoInspector.getProperties('back/src/main/resources/application.properties');
      const enabled = devProps['spring.h2.console.enabled'] || mainProps['spring.h2.console.enabled'];
      assert.strictEqual(enabled, 'true', "Expected 'spring.h2.console.enabled=true'");
    },
  });

  suite.test({
    id: 'F03_T2',
    tier: 1,
    feature: 'F03',
    name: 'F03: Verifies H2 console path defaults or configures /h2-console',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const devProps = repoInspector.getProperties('back/src/main/resources/application-dev.properties');
      const mainProps = repoInspector.getProperties('back/src/main/resources/application.properties');
      const pathVal = devProps['spring.h2.console.path'] || mainProps['spring.h2.console.path'] || '/h2-console';
      assert.strictEqual(pathVal, '/h2-console', "Expected H2 console path to be '/h2-console'");
    },
  });

  suite.test({
    id: 'F03_T3',
    tier: 1,
    feature: 'F03',
    name: 'F03: Verifies HTTP GET /h2-console endpoint responds with 200 or redirect',
    requiresServer: true,
    fn: async ({ apiClient, assert }) => {
      const res = await apiClient.getH2Console();
      assert.ok(
        [200, 302, 301].includes(res.status),
        `Expected HTTP 200/302 for /h2-console, got ${res.status}`
      );
    },
  });

  suite.test({
    id: 'F03_T4',
    tier: 1,
    feature: 'F03',
    name: 'F03: Verifies H2 console returns HTML page mentioning H2 Console',
    requiresServer: true,
    fn: async ({ apiClient, assert }) => {
      const res = await apiClient.getH2Console();
      if (res.status === 200 && res.rawText) {
        assert.ok(
          /H2 Console|h2/i.test(res.rawText),
          'Expected /h2-console HTML response to reference H2 Console'
        );
      }
    },
  });

  suite.test({
    id: 'F03_T5',
    tier: 1,
    feature: 'F03',
    name: 'F03: Verifies H2 console settings do not expose production profile',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const prodProps = repoInspector.getProperties('back/src/main/resources/application-prod.properties');
      const prodH2 = prodProps['spring.h2.console.enabled'];
      assert.ok(prodH2 !== 'true', 'H2 Console must NOT be enabled in production profile');
    },
  });

  // =========================================================================
  // Feature 4: Automated Data Seeder
  // =========================================================================
  suite.test({
    id: 'F04_T1',
    tier: 1,
    feature: 'F04',
    name: 'F04: Verifies DataSeeder Java class exists in backend source tree',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const sources = repoInspector.getBackendSourceFiles();
      const hasSeeder = sources.some((f) => f.includes('DataSeeder.java'));
      assert.ok(hasSeeder, 'DataSeeder.java must exist under back/src/main/java/');
    },
  });

  suite.test({
    id: 'F04_T2',
    tier: 1,
    feature: 'F04',
    name: 'F04: Verifies DataSeeder implements Spring startup runner (CommandLineRunner or ApplicationRunner)',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const sources = repoInspector.getBackendSourceFiles();
      const seederPath = sources.find((f) => f.includes('DataSeeder.java'));
      assert.ok(seederPath, 'DataSeeder.java path found');
      const content = repoInspector.readFile(seederPath.replace(repoInspector.config?.projectRoot || '', ''));
      assert.ok(
        /CommandLineRunner|ApplicationRunner|@EventListener|@PostConstruct/i.test(content || ''),
        'DataSeeder must hook into application startup lifecycle'
      );
    },
  });

  suite.test({
    id: 'F04_T3',
    tier: 1,
    feature: 'F04',
    name: 'F04: Verifies seeded items include unsold gadgets with positive stock values',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const res = await apiClient.getGadgets();
      assertions.assertStatus(res, 200, 'GET /gadget should succeed');
      const unsold = res.data.filter((g) => !g.isSold);
      assert.ok(unsold.length > 0, 'DataSeeder should prepopulate at least one unsold gadget');
      assert.ok(unsold[0].price > 0, 'Unsold gadget must have positive price');
    },
  });

  suite.test({
    id: 'F04_T4',
    tier: 1,
    feature: 'F04',
    name: 'F04: Verifies seeded items include sold gadgets with soldPrice and soldDate',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const res = await apiClient.getSoldGadgets();
      assertions.assertStatus(res, 200, 'GET /gadget/gadgets-sold should succeed');
      assert.ok(res.data.length > 0, 'DataSeeder should prepopulate at least one sold gadget');
      const soldItem = res.data[0];
      assert.strictEqual(soldItem.isSold, true, 'Seeded sold gadget must have isSold=true');
      assert.ok(soldItem.soldPrice > 0, 'Seeded sold gadget must have soldPrice > 0');
      assert.ok(soldItem.soldDate !== null, 'Seeded sold gadget must have soldDate set');
    },
  });

  suite.test({
    id: 'F04_T5',
    tier: 1,
    feature: 'F04',
    name: 'F04: Verifies seeded gadgets contain realistic categories and repair costs',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const res = await apiClient.getGadgets();
      assertions.assertStatus(res, 200, 'GET /gadget should succeed');
      const withCategory = res.data.filter((g) => g.category && g.category.trim().length > 0);
      assert.ok(withCategory.length > 0, 'Seeded items must populate category field');
      const hasRepairCost = res.data.some((g) => typeof g.repairCost === 'number');
      assert.ok(hasRepairCost, 'Seeded items must have repairCost defined');
    },
  });

  // =========================================================================
  // Feature 5: Environment Decoupling
  // =========================================================================
  suite.test({
    id: 'F05_T1',
    tier: 1,
    feature: 'F05',
    name: 'F05: Verifies application-prod.properties file exists',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const exists = repoInspector.fileExists('back/src/main/resources/application-prod.properties');
      assert.ok(exists, 'back/src/main/resources/application-prod.properties must exist');
    },
  });

  suite.test({
    id: 'F05_T2',
    tier: 1,
    feature: 'F05',
    name: 'F05: Verifies application-prod.properties binds DB_URL environment variable',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const content = repoInspector.readFile('back/src/main/resources/application-prod.properties');
      assert.ok(content !== null, 'application-prod.properties must exist');
      assert.ok(
        /spring\.datasource\.url\s*=\s*\$\{DB_URL/i.test(content),
        'Expected spring.datasource.url=${DB_URL...} in application-prod.properties'
      );
    },
  });

  suite.test({
    id: 'F05_T3',
    tier: 1,
    feature: 'F05',
    name: 'F05: Verifies application-prod.properties binds DB_USERNAME environment variable',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const content = repoInspector.readFile('back/src/main/resources/application-prod.properties');
      assert.ok(content !== null, 'application-prod.properties must exist');
      assert.ok(
        /spring\.datasource\.username\s*=\s*\$\{DB_USERNAME/i.test(content),
        'Expected spring.datasource.username=${DB_USERNAME...} in application-prod.properties'
      );
    },
  });

  suite.test({
    id: 'F05_T4',
    tier: 1,
    feature: 'F05',
    name: 'F05: Verifies application-prod.properties binds DB_PASSWORD environment variable',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const content = repoInspector.readFile('back/src/main/resources/application-prod.properties');
      assert.ok(content !== null, 'application-prod.properties must exist');
      assert.ok(
        /spring\.datasource\.password\s*=\s*\$\{DB_PASSWORD/i.test(content),
        'Expected spring.datasource.password=${DB_PASSWORD...} in application-prod.properties'
      );
    },
  });

  suite.test({
    id: 'F05_T5',
    tier: 1,
    feature: 'F05',
    name: 'F05: Verifies production profile disables or avoids in-memory H2 flags',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const content = repoInspector.readFile('back/src/main/resources/application-prod.properties') || '';
      assert.strictEqual(/jdbc:h2:mem/i.test(content), false, 'Production profile must not default to in-memory H2');
    },
  });
}
