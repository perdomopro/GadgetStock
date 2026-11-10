// helpers/api-client.js — REST API Client for GadgetStock E2E Test Suite
import { config } from '../test-config.js';

export class ApiClient {
  constructor(baseUrl = config.backendUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async isServerOnline() {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${this.baseUrl}/gadget`, {
        signal: controller.signal,
      });
      clearTimeout(id);
      return res.status >= 200 && res.status < 500;
    } catch {
      return false;
    }
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      ...(options.headers || {}),
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timer);

      const contentType = res.headers.get('content-type') || '';
      let data = null;
      let text = '';

      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      } else {
        text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      return {
        status: res.status,
        ok: res.ok,
        headers: res.headers,
        data,
        rawText: text,
      };
    } catch (err) {
      clearTimeout(timer);
      throw new Error(`API Request Failed: [${options.method || 'GET'}] ${url} - ${err.message}`);
    }
  }

  async getGadgets() {
    return this.request('/gadget');
  }

  async getGadgetById(id) {
    return this.request(`/gadget/${id}`);
  }

  async findGadgetsByName(name) {
    return this.request(`/gadget/find?name=${encodeURIComponent(name)}`);
  }

  async getSoldGadgets() {
    return this.request('/gadget/gadgets-sold');
  }

  async createGadget(payload) {
    return this.request('/gadget', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateGadget(id, payload) {
    return this.request(`/gadget/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteGadget(id) {
    return this.request(`/gadget/delete/${id}`, {
      method: 'DELETE',
    });
  }

  async getFinancialSummary() {
    return this.request('/gadget/finance/summary');
  }

  async getH2Console() {
    return this.request('/h2-console', {
      headers: { Accept: 'text/html,*/*' },
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
