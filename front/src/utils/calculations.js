/**
 * Financial calculations utility for GadgetStock secondhand inventory.
 * Mirrors backend calculation rules for client-side rendering and table calculations.
 */

/**
 * Computes total acquisition and repair cost basis for an item.
 * @param {Object} gadget
 * @returns {number} price + repairCost
 */
export function calculateItemTotalCost(gadget) {
  if (!gadget) return 0;
  const price = Number(gadget.price) || 0;
  const repairCost = Number(gadget.repairCost) || 0;
  return Number((price + repairCost).toFixed(2));
}

/**
 * Computes net profit realized on an individual sold gadget.
 * Profit = soldPrice - (price + repairCost)
 * @param {Object} gadget
 * @returns {number|null} Net profit, or null if not sold
 */
export function calculateItemNetProfit(gadget) {
  if (!gadget || !gadget.isSold || gadget.soldPrice === null || gadget.soldPrice === undefined) {
    return null;
  }
  const soldPrice = Number(gadget.soldPrice) || 0;
  const totalCost = calculateItemTotalCost(gadget);
  return Number((soldPrice - totalCost).toFixed(2));
}

/**
 * Computes individual item Return on Investment percentage (ROI %).
 * ROI % = ((soldPrice - (price + repairCost)) / (price + repairCost)) * 100
 * Safe from division-by-zero (returns 0.0 if cost basis is 0).
 * @param {Object} gadget
 * @returns {number|null} ROI percentage rounded to 2 decimals, or null if not sold
 */
export function calculateItemRoi(gadget) {
  const profit = calculateItemNetProfit(gadget);
  if (profit === null) return null;
  const totalCost = calculateItemTotalCost(gadget);
  if (totalCost === 0) return 0.0;
  return Number(((profit / totalCost) * 100).toFixed(2));
}

/**
 * Computes Stock Capital for an array of gadgets.
 * Strictly sums (price + repairCost) for unsold items (isSold == false or null).
 * @param {Array<Object>} gadgets
 * @returns {number}
 */
export function calculateStockCapital(gadgets = []) {
  if (!Array.isArray(gadgets)) return 0;
  const total = gadgets
    .filter((g) => !g.isSold)
    .reduce((sum, g) => sum + calculateItemTotalCost(g), 0);
  return Number(total.toFixed(2));
}

/**
 * Computes Net Profit for an array of gadgets.
 * Strictly sums (soldPrice - (price + repairCost)) for sold items (isSold == true).
 * @param {Array<Object>} gadgets
 * @returns {number}
 */
export function calculateTotalNetProfit(gadgets = []) {
  if (!Array.isArray(gadgets)) return 0;
  const total = gadgets
    .filter((g) => g.isSold && g.soldPrice != null)
    .reduce((sum, g) => sum + (calculateItemNetProfit(g) || 0), 0);
  return Number(total.toFixed(2));
}

/**
 * Computes aggregate ROI % over sold items.
 * (Total Net Profit / Total Cost of Sold Items) * 100
 * @param {Array<Object>} gadgets
 * @returns {number}
 */
export function calculateAggregateRoi(gadgets = []) {
  if (!Array.isArray(gadgets)) return 0.0;
  const soldGadgets = gadgets.filter((g) => g.isSold && g.soldPrice != null);
  const totalCostSold = soldGadgets.reduce((sum, g) => sum + calculateItemTotalCost(g), 0);
  if (totalCostSold === 0) return 0.0;
  const totalProfit = calculateTotalNetProfit(gadgets);
  return Number(((totalProfit / totalCostSold) * 100).toFixed(2));
}

const calculations = {
  calculateItemTotalCost,
  calculateItemNetProfit,
  calculateItemRoi,
  calculateStockCapital,
  calculateTotalNetProfit,
  calculateAggregateRoi,
};

export default calculations;
