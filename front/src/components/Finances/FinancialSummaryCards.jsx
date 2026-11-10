import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { calculateItemTotalCost } from '../../utils/calculations.js';

export function FinancialSummaryCards({ summary, soldGadgets = [] }) {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  // Compute total sales revenue from sold gadgets
  const totalRevenue = soldGadgets.reduce(
    (sum, g) => sum + (Number(g.soldPrice) || 0),
    0
  );

  // Compute total acquisition and repair cost of sold items
  const totalCostSold = soldGadgets.reduce(
    (sum, g) => sum + calculateItemTotalCost(g),
    0
  );

  const netProfit = summary?.netProfit ?? (totalRevenue - totalCostSold);
  const roi = summary?.roi ?? (totalCostSold > 0 ? ((netProfit / totalCostSold) * 100) : 0);
  const stockCapital = summary?.stockCapital ?? 0;

  const isProfitPositive = Number(netProfit) >= 0;

  return (
    <section className="finance-summary-grid" aria-label="Financial Performance Overview">
      {/* Total Revenue */}
      <div className="metric-card">
        <div className="card-header">
          <span className="card-title">{t('totalRevenue')}</span>
          <span className="card-badge badge-neutral">
            {soldGadgets.length} {t('soldItemsCount')}
          </span>
        </div>
        <div className="card-value value-revenue">
          {formatCurrency(totalRevenue)}
        </div>
        <p className="card-desc">Gross proceeds realized from all completed sales</p>
      </div>

      {/* Total Cost Basis */}
      <div className="metric-card">
        <div className="card-header">
          <span className="card-title">{t('colTotalCostFin')}</span>
          <span className="card-badge badge-neutral">Investment Basis</span>
        </div>
        <div className="card-value value-cost">
          {formatCurrency(totalCostSold)}
        </div>
        <p className="card-desc">Acquisition price plus repair expenditures on sold goods</p>
      </div>

      {/* Realized Net Profit */}
      <div className="metric-card">
        <div className="card-header">
          <span className="card-title">{t('totalRealizedProfit')}</span>
          <span className={`card-badge ${isProfitPositive ? 'badge-positive' : 'badge-negative'}`}>
            {isProfitPositive ? 'Profitable' : 'Deficit'}
          </span>
        </div>
        <div className={`card-value ${isProfitPositive ? 'value-positive' : 'value-negative'}`}>
          {formatCurrency(netProfit)}
        </div>
        <p className="card-desc">{t('netProfitDesc')}</p>
      </div>

      {/* ROI */}
      <div className="metric-card">
        <div className="card-header">
          <span className="card-title">{t('averageRoi')}</span>
          <span className={`card-badge ${Number(roi) >= 0 ? 'badge-positive' : 'badge-negative'}`}>
            Return %
          </span>
        </div>
        <div className={`card-value ${Number(roi) >= 0 ? 'value-positive' : 'value-negative'}`}>
          {Number(roi) > 0 ? `+${Number(roi).toFixed(2)}%` : `${Number(roi).toFixed(2)}%`}
        </div>
        <p className="card-desc">Capital in stock: {formatCurrency(stockCapital)}</p>
      </div>
    </section>
  );
}

export default FinancialSummaryCards;
