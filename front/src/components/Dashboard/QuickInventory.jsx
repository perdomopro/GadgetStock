import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCurrency } from '../../context/CurrencyContext.jsx';

export function QuickInventory({ gadgets = [], onViewAll }) {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  // Filter only unsold active inventory items, take top 5
  const unsoldGadgets = gadgets
    .filter((g) => !g.isSold)
    .slice(0, 5);

  return (
    <section className="quick-inventory-panel" aria-label="Quick Inventory Preview">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{t('quickInventoryTitle')}</h2>
          <p className="panel-subtitle">{t('quickInventorySubtitle')}</p>
        </div>
        {onViewAll && (
          <button
            type="button"
            className="btn-link"
            onClick={onViewAll}
          >
            {t('viewAllInventory')} →
          </button>
        )}
      </div>

      {unsoldGadgets.length === 0 ? (
        <div className="empty-state">
          <p>{t('noItemsInInventory')}</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="compact-table">
            <thead>
              <tr>
                <th>{t('colName')}</th>
                <th>{t('colModel')}</th>
                <th>{t('colCategory')}</th>
                <th>{t('colPrice')}</th>
                <th>{t('colListedPrice')}</th>
                <th>{t('colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {unsoldGadgets.map((gadget) => (
                <tr key={gadget.id}>
                  <td className="cell-strong">{gadget.name}</td>
                  <td>{gadget.model || '—'}</td>
                  <td>
                    <span className="category-pill">{gadget.category || '—'}</span>
                  </td>
                  <td>{formatCurrency(gadget.price)}</td>
                  <td>
                    {gadget.listedPrice !== null && gadget.listedPrice !== undefined
                      ? formatCurrency(gadget.listedPrice)
                      : '—'}
                  </td>
                  <td>
                    <span className="status-badge badge-available">
                      {t('statusAvailable')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default QuickInventory;
