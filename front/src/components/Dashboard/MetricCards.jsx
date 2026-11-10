import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCurrency } from '../../context/CurrencyContext.jsx';

export function MetricCards({ summary }) {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  const stockCapital = summary?.stockCapital ?? 0;
  const netProfit = summary?.netProfit ?? 0;
  const roi = summary?.roi ?? 0;
  const soldItemsCount = summary?.soldItemsCount ?? 0;
  const availableItemsCount = summary?.availableItemsCount ?? 0;

  const isProfitPositive = Number(netProfit) >= 0;
  const isRoiPositive = Number(roi) >= 0;

  return (
    <section className="metric-cards-container" aria-label="Financial Metrics Overview">
      {/* Metric 1: Stock Capital */}
      <div className="metric-card card-stock-capital">
        <div className="card-header">
          <span className="card-title">{t('stockCapital')}</span>
          <span className="card-badge badge-neutral">
            {availableItemsCount} {t('availableItemsCount')}
          </span>
        </div>
        <div className="card-value value-stock-capital">
          {formatCurrency(stockCapital)}
        </div>
        <p className="card-desc">{t('stockCapitalDesc')}</p>
      </div>

      {/* Metric 2: Net Profit */}
      <div className="metric-card card-net-profit">
        <div className="card-header">
          <span className="card-title">{t('netProfit')}</span>
          <span className="card-badge badge-neutral">
            {soldItemsCount} {t('soldItemsCount')}
          </span>
        </div>
        <div className={`card-value ${isProfitPositive ? 'value-positive' : 'value-negative'}`}>
          {formatCurrency(netProfit)}
        </div>
        <p className="card-desc">{t('netProfitDesc')}</p>
      </div>

      {/* Metric 3: Return on Investment (ROI %) */}
      <div className="metric-card card-roi">
        <div className="card-header">
          <span className="card-title">{t('roi')}</span>
          <span className={`card-badge ${isRoiPositive ? 'badge-positive' : 'badge-negative'}`}>
            {isRoiPositive ? '▲ Gain' : '▼ Loss'}
          </span>
        </div>
        <div className={`card-value ${isRoiPositive ? 'value-positive' : 'value-negative'}`}>
          {Number(roi) > 0 ? `+${Number(roi).toFixed(2)}%` : `${Number(roi).toFixed(2)}%`}
        </div>
        <p className="card-desc">{t('roiDesc')}</p>
      </div>
    </section>
  );
}

export default MetricCards;
