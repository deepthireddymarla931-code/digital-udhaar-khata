import api from './axios';

export const aiApi = {
  parseNlp: (prompt) => api.post('/ai/parse-nlp', { prompt }),
  generateReminder: (customerId, tone = 'POLITE') => 
    api.post('/ai/generate-reminder', { customerId, tone }),
  getRiskAssessment: (customerId) => api.get(`/ai/risk-assessment/${customerId}`),
  getCashflowInsights: () => api.get('/ai/cashflow-insights'),
  downloadPdfStatement: (customerId) => api.get(`/statements/customer/${customerId}/pdf`, { responseType: 'blob' }),
};
