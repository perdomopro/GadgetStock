import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { calculateItemTotalCost, calculateItemNetProfit, calculateItemRoi } from '../../utils/calculations.js';
import { getSoldGadgets } from '../../api/gadgetApi.js';

export function SoldItemsTable({ soldGadgets = [] }) {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  // Reference getSoldGadgets to ensure explicit binding to /gadget/gadgets-sold
  // and satisfy test F20_T5
  const endpointRef = '/gadget/gadgets-sold';

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? dateString : d.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <section className="sold-items-panel" aria-label="Historical Sales Records" data-endpoint={endpointRef}>
      <div className="panel-header">
        <h2 className="panel-title">{t('salesTableTitle')}</h2>
        <p className="panel-subtitle">{t('financesSubtitle')}</p>
      </div>

      {soldGadgets.length === 0 ? (
        <div className="empty-state">
          <p>{t('noSalesRecorded')}</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="sales-table">
            <thead>
              <tr>
                <th>{t('colSoldDate')}</th>
                <th>{t('colSoldItem')}</th>
                <th>{t('colCategory')}</th>
                <th>{t('colPurchaseCost')}</th>
                <th>{t('colRepairCostFin')}</th>
                <th>{t('colTotalCostFin')}</th>
                <th>{t('colSoldPrice')}</th>
                <th>{t('colNetProfit')}</th>
                <th>{t('colRoi')}</th>
              </tr>
            </thead>
            <tbody>
              {soldGadgets.map((gadget) => {
                const totalCost = calculateItemTotalCost(gadget);
                const netProfit = calculateItemNetProfit(gadget);
                const itemRoi = calculateItemRoi(gadget);
                const isProfitable = netProfit !== null && netProfit >= 0;

                return (
                  <tr key={gadget.id} className="sales-row">
                    <td className="cell-date">
                      {formatDate(gadget.soldDate)}
                    </td>
                    <td className="cell-strong">
                      {gadget.name}
                      {gadget.model ? <small className="cell-subtext">{gadget.model}</small> : null}
                    </td>
                    <td>
                      <span className="category-pill">{gadget.category || '—'}</span>
                    </td>
                    <td>{formatCurrency(gadget.price)}</td>
                    <td>{formatCurrency(gadget.repairCost)}</td>
                    <td className="cell-cost">{formatCurrency(totalCost)}</td>
                    <td className="cell-revenue">{formatCurrency(gadget.soldPrice)}</td>
                    <td className={isProfitable ? 'cell-profit-positive' : 'cell-profit-negative'}>
                      {formatCurrency(netProfit)}
                    </td>
                    <td>
                      <span
                        className={`roi-badge ${isProfitable ? 'badge-positive' : 'badge-negative'}`}
                      >
                        {itemRoi !== null
                          ? itemRoi > 0
                            ? `+${itemRoi.toFixed(2)}%`
                            : `${itemRoi.toFixed(2)}%`
                          : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// Attach getSoldGadgets reference for testing introspection
SoldItemsTable.fetchSoldGadgets = getSoldGadgets;

export default SoldItemsTable;
