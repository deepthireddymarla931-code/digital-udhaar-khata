import api from './axios';

export const customerApi = {
  getAll: (search = '') => api.get('/customers', { params: { search } }),
  getById: (id) => api.get(`/customers/${id}`),
  lookupByPhone: (phone) => api.get('/customers/lookup', { params: { phone } }),
  quickLookupOrCreate: (data) => api.post('/customers/quick-lookup-or-create', data),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};
