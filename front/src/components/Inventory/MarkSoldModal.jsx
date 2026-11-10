import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { updateGadget } from '../../api/gadgetApi.js';
import { calculateItemTotalCost } from '../../utils/calculations.js';

function MarkSoldModalContent({ gadget, onClose, onSuccess }) {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  const [soldPrice, setSoldPrice] = useState(
    gadget.listedPrice !== null && gadget.listedPrice !== undefined
      ? String(gadget.listedPrice)
      : ''
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const totalCost = calculateItemTotalCost(gadget);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const numSoldPrice = Number(soldPrice);
    if (!soldPrice || isNaN(numSoldPrice) || numSoldPrice <= 0) {
      setErrorMessage(t('soldPriceRequiredError'));
      return;
    }

    const payload = {
      ...gadget,
      isSold: true,
      soldPrice: numSoldPrice,
      soldDate: new Date().toISOString(),
    };

    setLoading(true);
    try {
      await updateGadget(gadget.id, payload);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || t('itemUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card modal-compact" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('markSoldModalTitle')}</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {errorMessage && (
          <div className="alert alert-error" role="alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div className="item-summary-box">
              <p className="summary-item-name">
                <strong>{gadget.name}</strong> {gadget.model ? `(${gadget.model})` : ''}
              </p>
              <div className="summary-cost-details">
                <span>{t('colPurchaseCost')}: {formatCurrency(gadget.price)}</span>
                <span>{t('colRepairCost')}: {formatCurrency(gadget.repairCost)}</span>
                <span className="summary-total-cost">
                  {t('colTotalCost')}: <strong>{formatCurrency(totalCost)}</strong>
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="mark-sold-price">{t('soldPrice')} *</label>
              <input
                id="mark-sold-price"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={soldPrice}
                onChange={(e) => setSoldPrice(e.target.value)}
                placeholder={t('soldPricePlaceholder')}
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {t('btnCancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? t('btnSavingChanges') : t('btnMarkSold')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MarkSoldModal({ gadget, isOpen, onClose, onSuccess }) {
  if (!isOpen || !gadget) return null;
  return (
    <MarkSoldModalContent
      gadget={gadget}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

export default MarkSoldModal;
