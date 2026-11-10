import { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { deleteGadget } from '../../api/gadgetApi.js';
import { calculateItemTotalCost } from '../../utils/calculations.js';
import EditGadgetModal from './EditGadgetModal.jsx';
import MarkSoldModal from './MarkSoldModal.jsx';

export function InventoryTable({ gadgets = [], onRefresh }) {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals state
  const [editingGadget, setEditingGadget] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sellingGadget, setSellingGadget] = useState(null);
  const [isMarkSoldModalOpen, setIsMarkSoldModalOpen] = useState(false);

  // Status feedback
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  // Extract unique categories from gadgets
  const categories = useMemo(() => {
    const set = new Set();
    gadgets.forEach((g) => {
      if (g.category && g.category.trim()) {
        set.add(g.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [gadgets]);

  // Filtered gadgets based on search term, category filter, and status filter
  const filteredGadgets = useMemo(() => {
    return gadgets.filter((gadget) => {
      // Search filter by name or model
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (gadget.name && gadget.name.toLowerCase().includes(query)) ||
        (gadget.model && gadget.model.toLowerCase().includes(query));

      // Category filter
      const matchesCategory =
        selectedCategory === 'ALL' ||
        (gadget.category && gadget.category.toLowerCase() === selectedCategory.toLowerCase());

      // Status filter
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'AVAILABLE' && !gadget.isSold) ||
        (selectedStatus === 'SOLD' && gadget.isSold);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [gadgets, searchTerm, selectedCategory, selectedStatus]);

  // Handle Edit Action
  const handleOpenEdit = (gadget) => {
    setEditingGadget(gadget);
    setIsEditModalOpen(true);
  };

  // Handle Mark as Sold Action
  const handleOpenMarkSold = (gadget) => {
    setSellingGadget(gadget);
    setIsMarkSoldModalOpen(true);
  };

  // Handle Delete Action with confirmation
  const handleDelete = async (id) => {
    const confirmed = window.confirm(t('confirmDelete'));
    if (!confirmed) return;

    try {
      await deleteGadget(id);
      setActionMessage({ text: t('itemDeletedSuccess'), type: 'success' });
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      setActionMessage({ text: err.message || t('itemDeleteError'), type: 'error' });
    }
  };

  const handleModalSuccess = (msg) => {
    if (msg) {
      setActionMessage({ text: msg, type: 'success' });
    }
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <section className="inventory-section" aria-label="Detailed Inventory Management">
      <div className="section-header">
        <div>
          <h2 className="section-title">{t('inventoryTitle')}</h2>
          <p className="section-subtitle">{t('inventorySubtitle')}</p>
        </div>
      </div>

      {actionMessage.text && (
        <div className={`alert alert-${actionMessage.type}`} role="alert">
          {actionMessage.text}
          <button
            type="button"
            className="alert-dismiss"
            onClick={() => setActionMessage({ text: '', type: '' })}
          >
            ×
          </button>
        </div>
      )}

      {/* Filter Bar: Search, Category Filter Select, Status Filter Select */}
      <div className="inventory-filter-bar">
        {/* Search input */}
        <div className="filter-item filter-search">
          <input
            type="text"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label="Search items by name or model"
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>

        {/* Category filter select */}
        <div className="filter-item">
          <label htmlFor="category-select" className="filter-label">
            {t('filterByCategory')}:
          </label>
          <select
            id="category-select"
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">{t('allCategories')}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter select */}
        <div className="filter-item">
          <label htmlFor="status-select" className="filter-label">
            {t('filterByStatus')}:
          </label>
          <select
            id="status-select"
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">{t('statusAll')}</option>
            <option value="AVAILABLE">{t('statusAvailable')}</option>
            <option value="SOLD">{t('statusSold')}</option>
          </select>
        </div>
      </div>

      {/* Main Inventory Data Table */}
      {filteredGadgets.length === 0 ? (
        <div className="empty-state">
          <p>{t('noMatchingItems')}</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>{t('colId')}</th>
                <th>{t('colName')}</th>
                <th>{t('colModel')}</th>
                <th>{t('colCategory')}</th>
                <th>{t('colPrice')}</th>
                <th>{t('colRepairCost')}</th>
                <th>{t('colTotalCost')}</th>
                <th>{t('colListedPrice')}</th>
                <th>{t('colStatus')}</th>
                <th>{t('colComments')}</th>
                <th className="actions-header">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredGadgets.map((gadget) => {
                const totalCost = calculateItemTotalCost(gadget);
                return (
                  <tr key={gadget.id} className={gadget.isSold ? 'row-sold' : 'row-available'}>
                    <td className="cell-id">#{gadget.id}</td>
                    <td className="cell-strong">{gadget.name}</td>
                    <td>{gadget.model || '—'}</td>
                    <td>
                      <span className="category-pill">{gadget.category || '—'}</span>
                    </td>
                    <td>{formatCurrency(gadget.price)}</td>
                    <td>{formatCurrency(gadget.repairCost)}</td>
                    <td className="cell-highlight">{formatCurrency(totalCost)}</td>
                    <td>
                      {gadget.listedPrice !== null && gadget.listedPrice !== undefined
                        ? formatCurrency(gadget.listedPrice)
                        : '—'}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${gadget.isSold ? 'badge-sold' : 'badge-available'}`}
                      >
                        {gadget.isSold ? t('statusSold') : t('statusAvailable')}
                      </span>
                    </td>
                    <td className="cell-comments" title={gadget.comments || ''}>
                      {gadget.comments || '—'}
                    </td>
                    <td className="cell-actions">
                      <button
                        type="button"
                        className="btn-action btn-edit"
                        onClick={() => handleOpenEdit(gadget)}
                        title={t('btnEdit')}
                      >
                        {t('btnEdit')}
                      </button>

                      {!gadget.isSold && (
                        <button
                          type="button"
                          className="btn-action btn-sell"
                          onClick={() => handleOpenMarkSold(gadget)}
                          title={t('btnMarkSold')}
                        >
                          {t('btnMarkSold')}
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(gadget.id)}
                        title={t('btnDelete')}
                      >
                        {t('btnDelete')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Gadget Modal Dialog */}
      <EditGadgetModal
        gadget={editingGadget}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingGadget(null);
        }}
        onSuccess={() => handleModalSuccess(t('itemUpdatedSuccess'))}
      />

      {/* Mark Sold Modal Dialog */}
      <MarkSoldModal
        gadget={sellingGadget}
        isOpen={isMarkSoldModalOpen}
        onClose={() => {
          setIsMarkSoldModalOpen(false);
          setSellingGadget(null);
        }}
        onSuccess={() => handleModalSuccess(t('itemUpdatedSuccess'))}
      />
    </section>
  );
}

export default InventoryTable;
