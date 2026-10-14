import api from './axios';
import { offlineStore } from '../utils/offlineStore';

export const customerApi = {
  getAll: async (search = '') => {
    try {
      const res = await api.get('/customers', { params: { search } });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        offlineStore.syncCustomers(res.data);
        return res;
      }
      return { data: offlineStore.getCustomers(search) };
    } catch (err) {
      console.warn('customerApi.getAll using offline fallback:', err.message);
      return { data: offlineStore.getCustomers(search) };
    }
  },

  getById: async (id) => {
    try {
      return await api.get(`/customers/${id}`);
    } catch (err) {
      console.warn('customerApi.getById using offline fallback:', err.message);
      const cust = offlineStore.getCustomerById(id);
      if (cust) return { data: cust };
      throw err;
    }
  },

  lookupByPhone: async (phone) => {
    try {
      return await api.get('/customers/lookup', { params: { phone } });
    } catch (err) {
      console.warn('customerApi.lookupByPhone using offline fallback:', err.message);
      const cust = offlineStore.getCustomerByPhone(phone);
      if (cust) {
        return {
          data: {
            exists: true,
            customer: cust,
            recentTransactions: offlineStore.getTransactions(cust.id),
          },
        };
      }
      return {
        data: {
          exists: false,
          phone,
          message: 'No existing Khata found for this number.',
        },
      };
    }
  },

  quickLookupOrCreate: async (data) => {
    try {
      const res = await api.post('/customers/quick-lookup-or-create', data);
      return res;
    } catch (err) {
      console.warn('customerApi.quickLookupOrCreate using offline fallback:', err.message);
      let cust = offlineStore.getCustomerByPhone(data.phone);
      let isNew = false;
      if (!cust) {
        cust = offlineStore.addCustomerLocally(data);
        isNew = true;
      }
      return { data: { success: true, isNew, customer: cust } };
    }
  },

  create: async (data) => {
    try {
      const res = await api.post('/customers', data);
      offlineStore.addCustomerLocally(res.data);
      return res;
    } catch (err) {
      console.warn('customerApi.create using offline fallback:', err.message);
      const newCust = offlineStore.addCustomerLocally(data);
      return { data: newCust };
    }
  },

  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};
