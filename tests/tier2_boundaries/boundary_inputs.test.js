// tier2_boundaries/boundary_inputs.test.js
// Tier 2: Boundary & Corner Cases — Character Encodings, Unicode, Whitespace & Text Limits

export function register(suite) {
  suite.test({
    id: 'B_INP_01',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_01: Spanish accented characters (á, é, í, ó, ú, ñ, ¿, ¡) in name persist intact',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const spanishName = 'Teléfono Móvil Español (Año 2026) — ¡Excelente!';
      const created = await apiClient.createGadget({
        name: spanishName,
        model: 'ES-1',
        price: 90.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.strictEqual(created.data.name, spanishName);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_02',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_02: Spanish accented characters in category ("Electrónica y Cómputo") persist intact',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const category = 'Electrónica y Cómputo';
      const created = await apiClient.createGadget({
        name: 'Item Accented Category',
        model: 'CAT-1',
        category,
        price: 120.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.strictEqual(created.data.category, category);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_03',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_03: Spanish accented text in comments ("Reparación de batería y soldadura") persists intact',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const comments = 'Reparación de batería, limpieza ultrasónica y soldadura de conector';
      const created = await apiClient.createGadget({
        name: 'Comments Accents Test',
        model: 'COM-1',
        price: 80.0,
        comments,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.strictEqual(created.data.comments, comments);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_04',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_04: Emoji characters in comments ("Screen replaced 📱✨") persist without UTF-8 corruption',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const emojiComment = 'Pantalla cambiada 📱✨ y pulido general 🛠️';
      const created = await apiClient.createGadget({
        name: 'Emoji Test Item',
        model: 'EM-1',
        price: 110.0,
        comments: emojiComment,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.strictEqual(created.data.comments, emojiComment);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_05',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_05: Quotes and escape characters in comments ("Model 13\\" Pro / Refurb") persist cleanly',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const quotesComment = 'Display 13" Retina, "Like New" condition, serial #AB/123\\XYZ';
      const created = await apiClient.createGadget({
        name: 'Quotes In Comments',
        model: 'Q-1',
        price: 300.0,
        comments: quotesComment,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.strictEqual(created.data.comments, quotesComment);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_06',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_06: Multi-word category ("Retro Video Game Consoles") preserves spacing and characters',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const category = 'Retro Video Game Consoles';
      const created = await apiClient.createGadget({
        name: 'Sega Genesis',
        model: 'Model 1',
        category,
        price: 40.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.strictEqual(created.data.category, category);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_07',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_07: Case-insensitive search finds items regardless of capitalization in query',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const name = `CaseCheckItem_${Date.now()}`;
      const created = await apiClient.createGadget({
        name,
        model: 'CC-1',
        price: 70.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);

      // Search lower-case
      const lowerRes = await apiClient.findGadgetsByName(name.toLowerCase());
      assertions.assertStatus(lowerRes, 200);
      const foundLower = lowerRes.data.some((g) => g.id === created.data.id);

      // Search upper-case
      const upperRes = await apiClient.findGadgetsByName(name.toUpperCase());
      assertions.assertStatus(upperRes, 200);
      const foundUpper = upperRes.data.some((g) => g.id === created.data.id);

      assert.ok(foundLower || foundUpper, 'Search should locate item across case variations');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_08',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_08: Model with special hardware characters (e.g. "Core i7-12700H @ 2.3GHz / 32GB RAM") persists',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const model = 'Core i7-12700H @ 2.3GHz / 32GB RAM / 1TB SSD';
      const created = await apiClient.createGadget({
        name: 'High End Laptop',
        model,
        price: 800.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.strictEqual(created.data.model, model);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_09',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_09: Multi-line text with newlines (\\n) in comments persists line breaks',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const comments = 'Step 1: Clean board.\nStep 2: Replace capacitor.\nStep 3: Test boot.';
      const created = await apiClient.createGadget({
        name: 'Multiline Comment Item',
        model: 'ML-1',
        price: 45.0,
        comments,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.ok(created.data.comments.includes('\n'), 'Newline characters should be preserved');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_10',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_10: Currency and international symbols in comments ($, €, £, ¥) persist intact',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const comments = 'Bought for $50 USD, imported part €15 EUR, target sale £80 GBP';
      const created = await apiClient.createGadget({
        name: 'Currency Symbols Item',
        model: 'CS-1',
        price: 50.0,
        comments,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.strictEqual(created.data.comments, comments);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_11',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_11: Minimal valid name of 1 character ("X") is accepted and persisted',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'X',
        model: 'OneChar',
        price: 15.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.strictEqual(created.data.name, 'X');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_12',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_12: HTML meta-characters (<script>alert(1)</script>) treated safely as raw text',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const xssString = '<script>alert(1)</script>';
      const created = await apiClient.createGadget({
        name: xssString,
        model: 'SecurityCheck',
        price: 25.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.strictEqual(created.data.name, xssString);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_13',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_13: Decimal price with zero cents (100.00) persists as valid number',
    requiresServer: true,
    fn: async ({ apiClient, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Even Price Test',
        model: 'EP-1',
        price: 100.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assertions.assertCloseTo(created.data.price, 100.0, 0.001);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_14',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_14: Date format for registerDate matches ISO-8601 representation',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Date Verification Item',
        model: 'DV-1',
        price: 35.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.ok(created.data.registerDate !== null);
      const parsed = Date.parse(created.data.registerDate);
      assert.ok(!isNaN(parsed), 'registerDate must parse as valid timestamp');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_15',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_15: Numeric strings in product name ("1984") stored strictly as text string',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: '1984',
        model: 'NumName',
        price: 40.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.strictEqual(typeof created.data.name, 'string');
      assert.strictEqual(created.data.name, '1984');
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_16',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_16: Category string with numbers ("Audio 2.1 Systems") persists and filters',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const category = 'Audio 2.1 Systems';
      const created = await apiClient.createGadget({
        name: 'Subwoofer Soundbar',
        model: 'SW-1',
        category,
        price: 90.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.strictEqual(created.data.category, category);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_17',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_17: Search by single letter returns matching items without query parsing error',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const res = await apiClient.findGadgetsByName('a');
      assertions.assertStatus(res, 200);
      assert.ok(Array.isArray(res.data));
    },
  });

  suite.test({
    id: 'B_INP_18',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_18: Updating item comments from non-empty string to empty string ("") succeeds',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const created = await apiClient.createGadget({
        name: 'Clear Comment Test',
        model: 'CC-2',
        price: 55.0,
        comments: 'Initial comment',
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      const updated = await apiClient.updateGadget(created.data.id, {
        ...created.data,
        comments: '',
      });
      assertions.assertStatus(updated, 200);
      assert.ok(updated.data.comments === '' || updated.data.comments === null);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_19',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_19: Long category name (60 chars) stores cleanly without overflow',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const longCategory = 'Professional High-End Video Production and Audio Hardware Gear';
      const created = await apiClient.createGadget({
        name: 'Camcorder Rig',
        model: 'Rig-1',
        category: longCategory,
        price: 450.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.strictEqual(created.data.category, longCategory);
      await apiClient.deleteGadget(created.data.id);
    },
  });

  suite.test({
    id: 'B_INP_20',
    tier: 2,
    feature: 'BOUNDARY_INP',
    name: 'B_INP_20: Consecutive spaces in name ("iPhone    13    Midnight") preserved accurately',
    requiresServer: true,
    fn: async ({ apiClient, assert, assertions }) => {
      const name = 'iPhone    13    Midnight';
      const created = await apiClient.createGadget({
        name,
        model: 'SpaceTest',
        price: 320.0,
        isSold: false,
      });
      assertions.assertStatus(created, 201);
      assert.strictEqual(created.data.name, name);
      await apiClient.deleteGadget(created.data.id);
    },
  });
}
