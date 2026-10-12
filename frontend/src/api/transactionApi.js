import api from './axios';

export const transactionApi = {
  add: (data) => api.post('/transactions', data),
  getByCustomer: (customerId) => api.get(`/transactions/customer/${customerId}`),
  getAll: (limit = 100) => api.get('/transactions', { params: { limit } }),
  getDashboardSummary: () => api.get('/transactions/dashboard-summary'),
  getMarketSplit: () => api.get('/transactions/market-split'),
};
