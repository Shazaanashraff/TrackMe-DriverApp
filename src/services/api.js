import { API_URL } from '../config';
import { markBackendOffline, markBackendOnline, isBackendConnectionError } from './backendStatus';

const requestJson = async (url, options) => {
  try {
    const response = await fetch(url, options);
    markBackendOnline();
    return response;
  } catch (error) {
    if (isBackendConnectionError(error)) {
      markBackendOffline();
      const offlineError = new Error('Backend connection unavailable');
      offlineError.isBackendConnectionError = true;
      throw offlineError;
    }

    throw error;
  }
};

const parseResponse = async (response) => {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = { message: 'Invalid server response' };
  }
  
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    throw error;
  }
  return data;
};

const api = {
  async login(email, password) {
    const response = await requestJson(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return parseResponse(response);
  },

  async register(name, email, password, role = 'driver') {
    const response = await requestJson(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    return parseResponse(response);
  },

  async refreshToken(refreshToken) {
    const response = await requestJson(`${API_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    return parseResponse(response);
  },

  async logout(token) {
    const response = await requestJson(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    return parseResponse(response);
  },

  async getMyBus(token) {
    const response = await requestJson(`${API_URL}/api/bus/my-bus`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return parseResponse(response);
  },

  async registerBus(busData, token) {
    const response = await requestJson(`${API_URL}/api/bus/register`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(busData)
    });
    return parseResponse(response);
  },

  async getRoutes(token) {
    const response = await requestJson(`${API_URL}/api/bus/routes`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return parseResponse(response);
  },

  async getRoutesManagementList() {
    const response = await requestJson(`${API_URL}/api/routes`);
    return parseResponse(response);
  },

  async updateBus(token, busId, updateData) {
    const response = await requestJson(`${API_URL}/api/bus/${busId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    return parseResponse(response);
  },

  async createRoute(token, routeData) {
    const response = await requestJson(`${API_URL}/api/routes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(routeData)
    });
    return parseResponse(response);
  },

  async getDriverEarningsStats(token) {
    const response = await requestJson(`${API_URL}/api/driver-earnings/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return parseResponse(response);
  },

  async getDriverEarningsHistory(token, { page = 1, limit = 10 } = {}) {
    const response = await requestJson(
      `${API_URL}/api/driver-earnings/history?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return parseResponse(response);
  },

  async getDriverDailyBreakdown(token) {
    const response = await requestJson(`${API_URL}/api/driver-earnings/daily-breakdown`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return parseResponse(response);
  },

  async requestDriverPayout(token, earningId, bankAccount) {
    const response = await requestJson(`${API_URL}/api/driver-earnings/${earningId}/request-payout`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bankAccount })
    });
    return parseResponse(response);
  }
};

export default api;
