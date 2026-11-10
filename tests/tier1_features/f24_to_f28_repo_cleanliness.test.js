// tier1_features/f24_to_f28_repo_cleanliness.test.js
// Tests for Features 24 through 28: Root Git Init, Unified .gitignore, Clutter Purge, DIARIO.md, Maven Wrapper

export function register(suite) {
  // =========================================================================
  // Feature 24: Root Git Initialization
  // =========================================================================
  suite.test({
    id: 'F24_T1',
    tier: 1,
    feature: 'F24',
    name: 'F24: Verifies .git directory exists at root c:\\adrian\\gadgetstock',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const isGit = repoInspector.isGitInitialized();
      assert.ok(isGit, 'Git repository must be initialized at project root (.git folder exists)');
    },
  });

  suite.test({
    id: 'F24_T2',
    tier: 1,
    feature: 'F24',
    name: 'F24: Verifies .git/HEAD reference file exists',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const exists = repoInspector.fileExists('.git/HEAD');
      assert.ok(exists, '.git/HEAD must exist');
    },
  });

  suite.test({
    id: 'F24_T3',
    tier: 1,
    feature: 'F24',
    name: 'F24: Verifies .git/config configuration file exists',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const exists = repoInspector.fileExists('.git/config');
      assert.ok(exists, '.git/config must exist');
    },
  });

  suite.test({
    id: 'F24_T4',
    tier: 1,
    feature: 'F24',
    name: 'F24: Verifies .git/objects directory exists',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const exists = repoInspector.fileExists('.git/objects');
      assert.ok(exists, '.git/objects must exist');
    },
  });

  suite.test({
    id: 'F24_T5',
    tier: 1,
    feature: 'F24',
    name: 'F24: Verifies .git/refs directory exists',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const exists = repoInspector.fileExists('.git/refs');
      assert.ok(exists, '.git/refs must exist');
    },
  });

  // =========================================================================
  // Feature 25: Unified .gitignore
  // =========================================================================
  suite.test({
    id: 'F25_T1',
    tier: 1,
    feature: 'F25',
    name: 'F25: Verifies unified .gitignore exists at project root',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const exists = repoInspector.fileExists('.gitignore');
      assert.ok(exists, '.gitignore must exist at project root');
    },
  });

  suite.test({
    id: 'F25_T2',
    tier: 1,
    feature: 'F25',
    name: 'F25: Verifies root .gitignore ignores Java Maven build targets',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const content = repoInspector.readFile('.gitignore') || '';
      assert.ok(/target\//i.test(content) || /target/i.test(content), '.gitignore must ignore target/');
      assert.ok(/\*\.class/i.test(content) || /target/i.test(content), '.gitignore should ignore compiled classes');
    },
  });

  suite.test({
    id: 'F25_T3',
    tier: 1,
    feature: 'F25',
    name: 'F25: Verifies root .gitignore ignores Node dependencies and build output',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const content = repoInspector.readFile('.gitignore') || '';
      assert.ok(/node_modules/i.test(content), '.gitignore must ignore node_modules/');
      assert.ok(/dist/i.test(content), '.gitignore must ignore dist/');
    },
  });

  suite.test({
    id: 'F25_T4',
    tier: 1,
    feature: 'F25',
    name: 'F25: Verifies root .gitignore ignores environment and secret files (.env)',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const content = repoInspector.readFile('.gitignore') || '';
      assert.ok(/\.env/i.test(content), '.gitignore must ignore .env files');
    },
  });

  suite.test({
    id: 'F25_T5',
    tier: 1,
    feature: 'F25',
    name: 'F25: Verifies root .gitignore ignores IDE and OS files (.idea, .vscode, .DS_Store)',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const content = repoInspector.readFile('.gitignore') || '';
      assert.ok(/\.vscode|\.idea|\.DS_Store/i.test(content), '.gitignore must ignore IDE and OS files');
    },
  });

  // =========================================================================
  // Feature 26: Residual Clutter Purge
  // =========================================================================
  suite.test({
    id: 'F26_T1',
    tier: 1,
    feature: 'F26',
    name: 'F26: Verifies absence of DIARIO.md.save* at project root',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const hasSave = repoInspector.fileExists('DIARIO.md.save');
      const hasSave1 = repoInspector.fileExists('DIARIO.md.save.1');
      const hasSave2 = repoInspector.fileExists('DIARIO.md.save.2');
      assert.strictEqual(hasSave, false, 'DIARIO.md.save must be deleted');
      assert.strictEqual(hasSave1, false, 'DIARIO.md.save.1 must be deleted');
      assert.strictEqual(hasSave2, false, 'DIARIO.md.save.2 must be deleted');
    },
  });

  suite.test({
    id: 'F26_T2',
    tier: 1,
    feature: 'F26',
    name: 'F26: Verifies absence of prueba.md at project root',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const exists = repoInspector.fileExists('prueba.md');
      assert.strictEqual(exists, false, 'prueba.md must be deleted');
    },
  });

  suite.test({
    id: 'F26_T3',
    tier: 1,
    feature: 'F26',
    name: 'F26: Verifies absence of back/hola.gitignore in backend folder',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const exists = repoInspector.fileExists('back/hola.gitignore');
      assert.strictEqual(exists, false, 'back/hola.gitignore must be deleted');
    },
  });

  suite.test({
    id: 'F26_T4',
    tier: 1,
    feature: 'F26',
    name: 'F26: Verifies absence of back/DIARIO.md.save* files in backend folder',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const hasBackSave = repoInspector.fileExists('back/DIARIO.md.save');
      const hasBackSave1 = repoInspector.fileExists('back/DIARIO.md.save.1');
      const hasBackSave2 = repoInspector.fileExists('back/DIARIO.md.save.2');
      assert.strictEqual(hasBackSave, false, 'back/DIARIO.md.save must be deleted');
      assert.strictEqual(hasBackSave1, false, 'back/DIARIO.md.save.1 must be deleted');
      assert.strictEqual(hasBackSave2, false, 'back/DIARIO.md.save.2 must be deleted');
    },
  });

  suite.test({
    id: 'F26_T5',
    tier: 1,
    feature: 'F26',
    name: 'F26: Verifies absence of front/.gitignore copy in frontend folder',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const exists = repoInspector.fileExists('front/.gitignore copy');
      assert.strictEqual(exists, false, 'front/.gitignore copy must be deleted');
    },
  });

  // =========================================================================
  // Feature 27: DIARIO.md Maintenance
  // =========================================================================
  suite.test({
    id: 'F27_T1',
    tier: 1,
    feature: 'F27',
    name: 'F27: Verifies authoritative DIARIO.md exists at project root',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const exists = repoInspector.fileExists('DIARIO.md');
      assert.ok(exists, 'Authoritative DIARIO.md must exist at project root');
    },
  });

  suite.test({
    id: 'F27_T2',
    tier: 1,
    feature: 'F27',
    name: 'F27: Verifies DIARIO.md contains project index and introductory summary',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const content = repoInspector.readFile('DIARIO.md') || '';
      assert.ok(content.length > 100, 'DIARIO.md must contain comprehensive documentation');
      assert.ok(/GadgetStock|Diario|Bit[aá]cora|Índice/i.test(content), 'DIARIO.md must have descriptive header');
    },
  });

  suite.test({
    id: 'F27_T3',
    tier: 1,
    feature: 'F27',
    name: 'F27: Verifies DIARIO.md documents R1 database and credential changes',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const content = repoInspector.readFile('DIARIO.md') || '';
      assert.ok(
        /H2|credential|saneamiento|DataSeeder|mem:gadgetdb/i.test(content),
        'DIARIO.md must record R1 database & credentials sanitization changes'
      );
    },
  });

  suite.test({
    id: 'F27_T4',
    tier: 1,
    feature: 'F27',
    name: 'F27: Verifies DIARIO.md documents R2 & R3 backend model and financial engine changes',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const content = repoInspector.readFile('DIARIO.md') || '';
      assert.ok(
        /category|repairCost|listedPrice|ROI|Capital.*Stock|Net.*Profit|Ganancia/i.test(content),
        'DIARIO.md must record R2 & R3 model and financial changes'
      );
    },
  });

  suite.test({
    id: 'F27_T5',
    tier: 1,
    feature: 'F27',
    name: 'F27: Verifies DIARIO.md documents R4 frontend features and R5 repo cleanup',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const content = repoInspector.readFile('DIARIO.md') || '';
      assert.ok(
        /React|Vite|Dashboard|idioma|moneda|limpieza|git/i.test(content),
        'DIARIO.md must record R4 frontend UI and R5 repo cleanup changes'
      );
    },
  });

  // =========================================================================
  // Feature 28: Maven Wrapper Alignment
  // =========================================================================
  suite.test({
    id: 'F28_T1',
    tier: 1,
    feature: 'F28',
    name: 'F28: Verifies back/mvnw.cmd script exists in backend root',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const exists = repoInspector.fileExists('back/mvnw.cmd');
      assert.ok(exists, 'back/mvnw.cmd must exist');
    },
  });

  suite.test({
    id: 'F28_T2',
    tier: 1,
    feature: 'F28',
    name: 'F28: Verifies back/mvnw Unix shell script exists in backend root',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const exists = repoInspector.fileExists('back/mvnw');
      assert.ok(exists, 'back/mvnw must exist');
    },
  });

  suite.test({
    id: 'F28_T3',
    tier: 1,
    feature: 'F28',
    name: 'F28: Verifies .mvn/wrapper/maven-wrapper.properties exists (accessible from backend or root)',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const atBack = repoInspector.fileExists('back/.mvn/wrapper/maven-wrapper.properties');
      const atRoot = repoInspector.fileExists('.mvn/wrapper/maven-wrapper.properties');
      assert.ok(atBack || atRoot, 'maven-wrapper.properties must exist under .mvn/wrapper/');
    },
  });

  suite.test({
    id: 'F28_T4',
    tier: 1,
    feature: 'F28',
    name: 'F28: Verifies maven-wrapper.properties specifies valid distributionUrl',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const contentBack = repoInspector.readFile('back/.mvn/wrapper/maven-wrapper.properties');
      const contentRoot = repoInspector.readFile('.mvn/wrapper/maven-wrapper.properties');
      const content = contentBack || contentRoot || '';
      assert.ok(
        /distributionUrl.*apache-maven.*\.zip/i.test(content),
        'maven-wrapper.properties must define valid distributionUrl'
      );
    },
  });

  suite.test({
    id: 'F28_T5',
    tier: 1,
    feature: 'F28',
    name: 'F28: Verifies back/pom.xml references Spring Boot starter parent and dependencies',
    requiresServer: false,
    fn: async ({ repoInspector, assert }) => {
      const pom = repoInspector.readFile('back/pom.xml') || '';
      assert.ok(pom.includes('spring-boot-starter-parent'), 'pom.xml must reference spring-boot-starter-parent');
      assert.ok(pom.includes('spring-boot-starter-web'), 'pom.xml must include spring-boot-starter-web');
      assert.ok(pom.includes('spring-boot-starter-data-jpa'), 'pom.xml must include spring-boot-starter-data-jpa');
    },
  });
}
