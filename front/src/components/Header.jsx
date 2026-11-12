import { useLanguage } from '../context/LanguageContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';

const TABS = [
  { id: 'dashboard', labelKey: 'tabDashboard' },
  { id: 'inventory', labelKey: 'tabInventory' },
  { id: 'finances', labelKey: 'tabFinances' },
];

export function Header({ activeTab, setActiveTab }) {
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();

  return (
    <header className="app-header">
      <div className="header-brand" title={t('appSubtitle')}>
        <span className="brand-glyph" aria-hidden="true">&gt;_</span>
        <h1 className="brand-title">{t('appTitle')}</h1>
        <span className="brand-cursor" aria-hidden="true" />
      </div>

      <nav className="header-nav" aria-label="Main Navigation">
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            type="button"
            className={`nav-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="nav-key" aria-hidden="true">[{i + 1}]</span>
            {t(tab.labelKey)}
          </button>
        ))}
      </nav>

      <div className="header-controls">
        <div className="toggle-group lang-toggle" role="group" aria-label={t('langSelector')}>
          <span className="toggle-label">lang</span>
          <div className="toggle-seg">
            {['es', 'en'].map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={language === code}
                onClick={() => setLanguage(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="toggle-group curr-toggle" role="group" aria-label={t('currSelector')}>
          <span className="toggle-label">cur</span>
          <div className="toggle-seg">
            {['USD', 'MXN'].map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={currency === code}
                onClick={() => setCurrency(code)}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
