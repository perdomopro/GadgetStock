/**
 * REST API Client for GadgetStock backend service.
 * Communicates with Spring Boot backend via Vite dev proxy (/gadget -> http://localhost:8080).
 * Handles Spring Boot ErrorResponse payload parsing with standard status, error, and message extraction.
 */

const BASE_URL = '/gadget';

/**
 * Internal helper for issuing HTTP requests and parsing Spring Boot responses.
 * Parses Spring Boot ErrorResponse { timestamp, status, error, message, path } when response is not OK.
 */
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') || endpoint.startsWith('/gadget')
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        status: response.status,
        error: response.statusText,
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const message = errorData?.message || errorData?.error || `Request failed with HTTP status ${response.status}`;
    const err = new Error(message);
    err.status = errorData?.status || response.status;
    err.error = errorData?.error || response.statusText;
    err.timestamp = errorData?.timestamp;
    err.path = errorData?.path;
    err.data = errorData;
    throw err;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Fetches all inventory items (unsold and sold).
 * @returns {Promise<Array<Object>>}
 */
export async function getAllGadgets() {
  return request('/gadget', { method: 'GET' });
}

/**
 * Fetches a single gadget by its primary key ID.
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export async function getGadgetById(id) {
  return request(`/gadget/${id}`, { method: 'GET' });
}

/**
 * Fetches financial summary statistics computed strictly according to business logic.
 * Returns { stockCapital, netProfit, roi, soldItemsCount, availableItemsCount }.
 * @returns {Promise<Object>}
 */
export async function getFinancialSummary() {
  return request('/gadget/finance/summary', { method: 'GET' });
}

/**
 * Fetches all historical sold gadgets (isSold == true).
 * Endpoint: /gadget/gadgets-sold
 * @returns {Promise<Array<Object>>}
 */
export async function getSoldGadgets() {
  return request('/gadget/gadgets-sold', { method: 'GET' });
}

/**
 * Creates a new gadget in inventory by dispatching POST /gadget.
 * @param {Object} data - Gadget payload (name, model, category, price, repairCost, listedPrice, comments)
 * @returns {Promise<Object>} Newly created gadget with assigned ID
 */
export async function createGadget(data) {
  return request('/gadget', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Updates all fields of an existing gadget via PUT /gadget/{id}.
 * When marking as sold, data must contain isSold: true, soldPrice > 0, soldDate.
 * @param {number|string} id
 * @param {Object} data - Full updated gadget payload
 * @returns {Promise<Object>} Updated gadget
 */
export async function updateGadget(id, data) {
  return request(`/gadget/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Deletes a gadget by ID via DELETE /gadget/delete/{id}.
 * @param {number|string} id
 * @returns {Promise<void>}
 */
export async function deleteGadget(id) {
  return request(`/gadget/delete/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Searches gadgets matching name parameter.
 * @param {string} name
 * @returns {Promise<Array<Object>>}
 */
export async function searchGadgets(name) {
  const query = name ? `?name=${encodeURIComponent(name)}` : '';
  return request(`/gadget/find${query}`, { method: 'GET' });
}

const gadgetApi = {
  getAllGadgets,
  getGadgetById,
  getFinancialSummary,
  getSoldGadgets,
  createGadget,
  updateGadget,
  deleteGadget,
  searchGadgets,
};

export default gadgetApi;
