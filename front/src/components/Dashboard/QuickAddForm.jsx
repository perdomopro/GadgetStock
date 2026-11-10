import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { createGadget } from '../../api/gadgetApi.js';

const initialFormState = {
  name: '',
  model: '',
  category: '',
  price: '',
  repairCost: '0.00',
  listedPrice: '',
  comments: '',
};

export function QuickAddForm({ onSuccess }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error on input change
    if (errorMessage) setErrorMessage('');
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Client-side validations
    const trimmedName = formData.name.trim();
    if (!trimmedName || !formData.name.trim()) {
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
      name: trimmedName,
      model: formData.model.trim() || null,
      category: formData.category.trim() || null,
      price: numPrice,
      repairCost: numRepairCost,
      listedPrice: numListedPrice,
      comments: formData.comments.trim() || null,
      repair: numRepairCost > 0,
      isSold: false,
    };

    setLoading(true);
    try {
      // Dispatches POST /gadget via createGadget
      await createGadget(payload);
      setSuccessMessage(t('productAddedSuccess'));
      setFormData(initialFormState);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setErrorMessage(err.message || t('productAddError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="quick-add-panel" aria-label="Quick Add Product Form">
      <div className="panel-header">
        <h2 className="panel-title">{t('quickAddTitle')}</h2>
        <p className="panel-subtitle">{t('quickAddSubtitle')}</p>
      </div>

      {errorMessage && (
        <div className="alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      <form className="quick-add-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          {/* Product Name */}
          <div className="form-group">
            <label htmlFor="quick-add-name">{t('name')} *</label>
            <input
              id="quick-add-name"
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder={t('namePlaceholder')}
              disabled={loading}
            />
          </div>

          {/* Model */}
          <div className="form-group">
            <label htmlFor="quick-add-model">{t('model')}</label>
            <input
              id="quick-add-model"
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder={t('modelPlaceholder')}
              disabled={loading}
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="quick-add-category">{t('category')}</label>
            <input
              id="quick-add-category"
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder={t('categoryPlaceholder')}
              disabled={loading}
            />
          </div>

          {/* Purchase Price */}
          <div className="form-group">
            <label htmlFor="quick-add-price">{t('price')} *</label>
            <input
              id="quick-add-price"
              type="number"
              name="price"
              step="0.01"
              min="0"
              required
              value={formData.price}
              onChange={handleChange}
              placeholder={t('pricePlaceholder')}
              disabled={loading}
            />
          </div>

          {/* Repair Cost */}
          <div className="form-group">
            <label htmlFor="quick-add-repair-cost">{t('repairCost')}</label>
            <input
              id="quick-add-repair-cost"
              type="number"
              name="repairCost"
              step="0.01"
              min="0"
              value={formData.repairCost}
              onChange={handleChange}
              placeholder={t('repairCostPlaceholder')}
              disabled={loading}
            />
          </div>

          {/* Listed Price */}
          <div className="form-group">
            <label htmlFor="quick-add-listed-price">{t('listedPrice')}</label>
            <input
              id="quick-add-listed-price"
              type="number"
              name="listedPrice"
              step="0.01"
              min="0"
              value={formData.listedPrice}
              onChange={handleChange}
              placeholder={t('listedPricePlaceholder')}
              disabled={loading}
            />
          </div>

          {/* Comments */}
          <div className="form-group form-group-full">
            <label htmlFor="quick-add-comments">{t('comments')}</label>
            <input
              id="quick-add-comments"
              type="text"
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              placeholder={t('commentsPlaceholder')}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? t('btnAddingProduct') : t('btnAddProduct')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={loading}
          >
            {t('btnReset')}
          </button>
        </div>
      </form>
    </section>
  );
}

export default QuickAddForm;
