# TEST_INFRA.md — GadgetStock E2E Test Suite Architecture

## 1. Overview & Testing Philosophy

The GadgetStock End-to-End (E2E) Test Suite is an opaque-box, requirement-driven verification harness designed to rigorously validate all 28 features specified in `PROJECT.md` and derived from `ORIGINAL_REQUEST.md`.

### Core Architectural Principles
1. **Opaque-Box Verification**: Tests interact strictly via public HTTP REST APIs, environment interfaces, file contracts, and observable outputs. Tests have zero access to private internal methods or in-memory reflection hacks.
2. **Zero External Dependencies**: The runner executes natively on Node.js (v18+, tested on v24.21.0) and PowerShell 7 (pwsh). It requires no external npm packages (`node_modules`), no third-party test runners, and no binary browser installations.
3. **Requirement-Driven Ground Truth**: Expected status codes, JSON payload schemas, validation responses, and financial formulas are grounded in `PROJECT.md` and `ORIGINAL_REQUEST.md`.
4. **Resilient Dual-Mode Execution**:
   - **Live Integration Mode**: Dispatches real HTTP requests (`POST`, `GET`, `PUT`, `DELETE`) to the running backend (`http://localhost:8080`) and asserts on live network responses.
   - **Offline / Static Verification Mode**: Verifies repository hygiene, database configuration files, credential sanitization, git repositories, Maven wrapper integrity, and frontend contract definitions even when services are offline. When live endpoints are unavailable, live assertions clearly indicate connection status without masking errors.

---

## 2. The 4-Tier Test Taxonomy

The test suite is structured into four progressive tiers:

| Tier | Focus | Minimum Target | Actual Target | Description |
|---|---|---|---|---|
| **Tier 1: Feature Coverage** | Per-Feature Isolation | $\ge 5$ tests per feature (28 features) | 140+ tests | Verifies happy paths, HTTP status codes, JSON schema compliance, default values, and contract fidelity for each of the 28 features in `PROJECT.md`. |
| **Tier 2: Boundary & Corner Cases** | Edge & Error Conditions | $\ge 5$ tests per boundary area | 75+ tests | Verifies boundary conditions: zero division in ROI, negative costs/prices, null fields on sale, 404 on missing entities, 400 validation format, extreme values, and Unicode. |
| **Tier 3: Cross-Feature Combinations** | Pairwise Interactions | $\ge 10$ interaction flows | 10+ tests | Verifies stateful workflows: buy item $\to$ repair $\to$ list $\to$ sell $\to$ check profit/ROI $\to$ check stock capital $\to$ delete. |
| **Tier 4: Real-World Scenarios** | End-to-End Business Workflows | $\ge 5$ realistic journeys | 5+ tests | Simulates multi-device secondhand shop lifecycles: batch purchasing, refurbishment cycles, mixed profit/loss portfolios, error recovery, and ledger reconciliation. |

**Total Test Count**: $\mathbf{230+}$ comprehensive test cases.

---

## 3. Authoritative Sources of Expected Outputs

Every test assertion is grounded in the following specifications:

### 3.1 Financial Formulas (R3, Features 14–17)
- **Net Profit**:
  $$\text{NetProfit} = \sum_{i \in \text{Sold}} \left(\text{soldPrice}_i - (\text{price}_i + \text{repairCost}_i)\right)$$
  *Strictly calculated over items where `isSold == true`.*
- **ROI % (Return on Investment)**:
  $$\text{ROI} = \begin{cases} \left(\frac{\text{NetProfit}}{\sum_{i \in \text{Sold}} (\text{price}_i + \text{repairCost}_i)}\right) \times 100 & \text{if } \sum_{\text{Sold}} (\text{price} + \text{repairCost}) > 0 \\ 0.00 & \text{if } \sum_{\text{Sold}} (\text{price} + \text{repairCost}) = 0 \end{cases}$$
  *Safe against division-by-zero.*
- **Stock Capital (Capital en Stock)**:
  $$\text{StockCapital} = \sum_{j \in \text{Unsold}} \left(\text{price}_j + \text{repairCost}_j\right)$$
  *Strictly calculated over available inventory where `isSold == false`.*

### 3.2 Data Models & JSON Contracts (`PROJECT.md` § Interface Contracts)
- **GadgetModel**:
  ```json
  {
    "id": 1,
    "name": "iPhone 13",
    "model": "128GB Midnight",
    "category": "Smartphones",
    "price": 300.00,
    "repairCost": 50.00,
    "listedPrice": 450.00,
    "comments": "Replaced battery, screen intact",
    "repair": true,
    "isSold": false,
    "soldPrice": null,
    "registerDate": "2026-11-06T12:00:00",
    "soldDate": null
  }
  ```
- **Financial Summary (`GET /gadget/finance/summary`)**:
  ```json
  {
    "stockCapital": 350.00,
    "netProfit": 120.00,
    "roi": 34.29,
    "soldItemsCount": 3,
    "availableItemsCount": 5
  }
  ```
- **Error Response (`GlobalExceptionHandler`)**:
  ```json
  {
    "timestamp": "2026-11-06T20:35:00",
    "status": 400,
    "error": "Bad Request",
    "message": "Sold price must be greater than 0 when item is marked as sold",
    "path": "/gadget/1"
  }
  ```

---

## 4. Test Suite Directory Structure

```
c:\adrian\gadgetstock\tests\
├── run-e2e.ps1                         # PowerShell 7 entry point script
├── runner.js                           # Zero-dependency Node.js test harness
├── test-config.js                      # Central test configuration (URLs, timeouts, flags)
├── helpers/
│   ├── api-client.js                   # HTTP client wrapping native fetch with assertions
│   ├── assertions.js                   # Schema, financial math, and status validators
│   └── repo-inspector.js               # Git, filesystem, and config file verification
├── tier1_features/                     # Tier 1: 28 features (>=5 tests each)
│   ├── f01_to_f05_repo_db.test.js      # Features 1-5 (Sanitization, H2, Console, Seeder, Env)
│   ├── f06_to_f08_model_fields.test.js # Features 6-8 (Category, RepairCost, ListedPrice)
│   ├── f09_to_f11_api_validation.test.js # Features 9-11 (PUT update, Null-safe sale, Exceptions)
│   ├── f12_to_f13_crud_endpoints.test.js # Features 12-13 (Query endpoints, Delete)
│   ├── f14_to_f17_financial_engine.test.js # Features 14-17 (Net Profit, ROI, Stock Capital, Summary)
│   ├── f18_to_f21_frontend_views.test.js # Features 18-21 (Dashboard, Inventory, Finances, Quick Add)
│   ├── f22_to_f23_i18n_currency.test.js # Features 22-23 (Language, Currency)
│   └── f24_to_f28_repo_cleanliness.test.js # Features 24-28 (Git init, Gitignore, Clutter, DIARIO, Maven)
├── tier2_boundaries/                   # Tier 2: Boundary & Corner Cases
│   ├── boundary_financial.test.js      # Zero division, negative numbers, extreme values
│   ├── boundary_validation.test.js     # Null sales, missing fields, 400 bad requests
│   ├── boundary_not_found.test.js      # Non-existent IDs (404), invalid IDs
│   └── boundary_inputs.test.js         # Unicode, empty strings, max length strings
├── tier3_interactions/                 # Tier 3: Cross-Feature Combinations
│   ├── lifecycle_combinations.test.js  # Buy -> Repair -> List -> Sell -> Audit
│   └── state_transitions.test.js       # Unsold <-> Sold transitions, deletion impacts
└── tier4_scenarios/                    # Tier 4: Real-World Secondhand Scenarios
    ├── resale_shop_lifecycle.test.js   # End-to-end multi-device retail workflow
    └── system_integrity_scenario.test.js # Full stack repo-to-API-to-finance audit
```

---

## 5. Execution Instructions

### Option A: Via PowerShell 7 (Recommended)
```powershell
pwsh -File c:\adrian\gadgetstock\tests\run-e2e.ps1
```

### Option B: Via Node.js
```bash
node c:\adrian\gadgetstock\tests\runner.js
```

### Advanced CLI Flags
- **Filter by Tier**:
  ```bash
  node tests/runner.js --tier=1
  node tests/runner.js --tier=2
  node tests/runner.js --tier=3
  node tests/runner.js --tier=4
  ```
- **Filter by Feature**:
  ```bash
  node tests/runner.js --feature=F14
  ```
- **Custom Backend URL**:
  ```bash
  node tests/runner.js --backend-url=http://localhost:8080
  ```
- **Offline / Static-Only Mode**:
  ```bash
  node tests/runner.js --offline
  ```

---

## 6. Output & Reporting Standard

The runner outputs:
1. Per-test status line: `[PASS]`, `[FAIL]`, or `[SKIP]` with execution duration.
2. Grouped summary by Tier and Feature.
3. Summary stats table: Total Tests, Passed, Failed, Skipped, Execution Time.
4. Clean exit code: `0` on success, `1` on test failures.
