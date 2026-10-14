import api from './axios';
import { offlineStore } from '../utils/offlineStore';

export const transactionApi = {
  add: async (data) => {
    try {
      const res = await api.post('/transactions', data);
      offlineStore.addTransactionLocally(data);
      return res;
    } catch (err) {
      console.warn('transactionApi.add using offline fallback:', err.message);
      const savedTx = offlineStore.addTransactionLocally(data);
      return { data: savedTx, offline: true };
    }
  },

  getByCustomer: async (customerId) => {
    try {
      return await api.get(`/transactions/customer/${customerId}`);
    } catch (err) {
      console.warn('transactionApi.getByCustomer using offline fallback:', err.message);
      return { data: offlineStore.getTransactions(customerId) };
    }
  },

  getAll: async (limit = 100) => {
    try {
      return await api.get('/transactions', { params: { limit } });
    } catch (err) {
      console.warn('transactionApi.getAll using offline fallback:', err.message);
      return { data: offlineStore.getTransactions().slice(0, limit) };
    }
  },

  getDashboardSummary: async () => {
    try {
      return await api.get('/transactions/dashboard-summary');
    } catch (err) {
      console.warn('transactionApi.getDashboardSummary using offline fallback:', err.message);
      return { data: offlineStore.getDashboardSummary() };
    }
  },

  getMarketSplit: async () => {
    try {
      return await api.get('/transactions/market-split');
    } catch (err) {
      console.warn('transactionApi.getMarketSplit using offline fallback:', err.message);
      return { data: offlineStore.getMarketSplit() };
    }
  },
};
