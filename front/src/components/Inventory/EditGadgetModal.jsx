import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { updateGadget } from '../../api/gadgetApi.js';

function EditGadgetModalContent({ gadget, onClose, onSuccess }) {
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    name: gadget.name || '',
    model: gadget.model || '',
    category: gadget.category || '',
    price: gadget.price !== undefined && gadget.price !== null ? String(gadget.price) : '',
    repairCost: gadget.repairCost !== undefined && gadget.repairCost !== null ? String(gadget.repairCost) : '0.00',
    listedPrice: gadget.listedPrice !== undefined && gadget.listedPrice !== null ? String(gadget.listedPrice) : '',
    comments: gadget.comments || '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setErrorMessage(t('valNameRequired'));
      return;
    }

    const numPrice = Number(formData.price);
    if (formData.price === '' || isNaN(numPrice) || numPrice < 0) {
      setErrorMessage(t('valPriceNegative'));
      return;
    }

    const numRepairCost = formData.repairCost ? Number(formData.repairCost) : 0;
    if (isNaN(numRepairCost) || numRepairCost < 0) {
      setErrorMessage(t('valRepairCostNegative'));
      return;
    }

    let numListedPrice = null;
    if (formData.listedPrice !== '' && formData.listedPrice !== undefined) {
      numListedPrice = Number(formData.listedPrice);
      if (isNaN(numListedPrice) || numListedPrice < 0) {
        setErrorMessage(t('valListedPriceNegative'));
        return;
      }
    }

    const payload = {
      ...gadget,
      name: trimmedName,
      model: formData.model.trim() || null,
      category: formData.category.trim() || null,
      price: numPrice,
      repairCost: numRepairCost,
      listedPrice: numListedPrice,
      comments: formData.comments.trim() || null,
      repair: numRepairCost > 0,
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
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('editModalTitle')} #{gadget.id}</h3>
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
          <div className="modal-body form-grid">
            <div className="form-group">
              <label htmlFor="edit-name">{t('name')} *</label>
              <input
                id="edit-name"
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-model">{t('model')}</label>
              <input
                id="edit-model"
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-category">{t('category')}</label>
              <input
                id="edit-category"
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-price">{t('price')} *</label>
              <input
                id="edit-price"
                type="number"
                name="price"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-repair-cost">{t('repairCost')}</label>
              <input
                id="edit-repair-cost"
                type="number"
                name="repairCost"
                step="0.01"
                min="0"
                value={formData.repairCost}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-listed-price">{t('listedPrice')}</label>
              <input
                id="edit-listed-price"
                type="number"
                name="listedPrice"
                step="0.01"
                min="0"
                value={formData.listedPrice}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="edit-comments">{t('comments')}</label>
              <input
                id="edit-comments"
                type="text"
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                disabled={loading}
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
              {loading ? t('btnSavingChanges') : t('btnSaveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditGadgetModal({ gadget, isOpen, onClose, onSuccess }) {
  if (!isOpen || !gadget) return null;
  return (
    <EditGadgetModalContent
      gadget={gadget}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

export default EditGadgetModal;
