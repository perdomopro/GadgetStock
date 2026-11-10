import { useState, useEffect, useCallback } from 'react';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { CurrencyProvider } from './context/CurrencyContext.jsx';
import Header from './components/Header.jsx';
import MetricCards from './components/Dashboard/MetricCards.jsx';
import QuickInventory from './components/Dashboard/QuickInventory.jsx';
import QuickAddForm from './components/Dashboard/QuickAddForm.jsx';
import InventoryTable from './components/Inventory/InventoryTable.jsx';
import FinancialSummaryCards from './components/Finances/FinancialSummaryCards.jsx';
import SoldItemsTable from './components/Finances/SoldItemsTable.jsx';
import { getAllGadgets, getSoldGadgets, getFinancialSummary } from './api/gadgetApi.js';
import './App.css';

function GadgetStockApp() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'inventory' | 'finances'
  const [gadgets, setGadgets] = useState([]);
  const [soldGadgets, setSoldGadgets] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({
    stockCapital: 0,
    netProfit: 0,
    roi: 0,
    soldItemsCount: 0,
    availableItemsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getAllGadgets(),
      getSoldGadgets(),
      getFinancialSummary(),
    ])
      .then(([allRes, soldRes, summaryRes]) => {
        if (!isMounted) return;
        setGadgets(allRes || []);
        setSoldGadgets(soldRes || []);
        if (summaryRes) {
          setFinancialSummary({
            stockCapital: summaryRes.stockCapital ?? 0,
            netProfit: summaryRes.netProfit ?? 0,
            roi: summaryRes.roi ?? 0,
            soldItemsCount: summaryRes.soldItemsCount ?? 0,
            availableItemsCount: summaryRes.availableItemsCount ?? 0,
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Error connecting to GadgetStock API');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setError(null);
      const [allRes, soldRes, summaryRes] = await Promise.all([
        getAllGadgets(),
        getSoldGadgets(),
        getFinancialSummary(),
      ]);

      setGadgets(allRes || []);
      setSoldGadgets(soldRes || []);
      if (summaryRes) {
        setFinancialSummary({
          stockCapital: summaryRes.stockCapital ?? 0,
          netProfit: summaryRes.netProfit ?? 0,
          roi: summaryRes.roi ?? 0,
          soldItemsCount: summaryRes.soldItemsCount ?? 0,
          availableItemsCount: summaryRes.availableItemsCount ?? 0,
        });
      }
    } catch (err) {
      setError(err.message || 'Error connecting to GadgetStock API');
    }
  }, []);

  return (
    <div className="gadgetstock-layout">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {error && (
          <div className="alert alert-error main-alert" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={refreshData}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading GadgetStock data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div className="tab-dashboard">
                <MetricCards summary={financialSummary} />

                <div className="dashboard-grid">
                  <div className="grid-col">
                    <QuickInventory
                      gadgets={gadgets}
                      onViewAll={() => setActiveTab('inventory')}
                    />
                  </div>
                  <div className="grid-col">
                    <QuickAddForm onSuccess={refreshData} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="tab-inventory">
                <InventoryTable gadgets={gadgets} onRefresh={refreshData} />
              </div>
            )}

            {activeTab === 'finances' && (
              <div className="tab-finances">
                <FinancialSummaryCards
                  summary={financialSummary}
                  soldGadgets={soldGadgets}
                />
                <SoldItemsTable soldGadgets={soldGadgets} />
              </div>
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>GadgetStock &copy; 2026 &bull; Secondhand Inventory & Resale Manager</p>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider initialLanguage="es">
      <CurrencyProvider initialCurrency="USD">
        <GadgetStockApp />
      </CurrencyProvider>
    </LanguageProvider>
  );
}

export default App;
