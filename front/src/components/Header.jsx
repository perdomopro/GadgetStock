import { useLanguage } from '../context/LanguageContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';

export function Header({ activeTab, setActiveTab }) {
  const { language, toggleLanguage, t } = useLanguage();
  const { currency, toggleCurrency } = useCurrency();

  return (
    <header className="app-header">
      <div className="header-brand">
        <h1 className="brand-title">{t('appTitle')}</h1>
        <p className="brand-subtitle">{t('appSubtitle')}</p>
      </div>

      <nav className="header-nav" aria-label="Main Navigation">
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          {t('tabDashboard')}
        </button>
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          {t('tabInventory')}
        </button>
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'finances' ? 'active' : ''}`}
          onClick={() => setActiveTab('finances')}
        >
          {t('tabFinances')}
        </button>
      </nav>

      <div className="header-controls">
        <button
          type="button"
          className="toggle-pill lang-toggle"
          onClick={toggleLanguage}
          title={t('langSelector')}
          aria-label="Toggle Language between ES and EN"
        >
          <span className="toggle-label">{t('langSelector')}:</span>
          <span className="toggle-value">{language === 'es' ? 'ES' : 'EN'}</span>
        </button>

        <button
          type="button"
          className="toggle-pill curr-toggle"
          onClick={toggleCurrency}
          title={t('currSelector')}
          aria-label="Toggle Currency between USD and MXN"
        >
          <span className="toggle-label">{t('currSelector')}:</span>
          <span className="toggle-value">{currency === 'USD' ? 'USD' : 'MXN'}</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
