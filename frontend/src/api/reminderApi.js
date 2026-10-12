import api from './axios';

export const reminderApi = {
  getDue: () => api.get('/reminders/due'),
  getLogs: () => api.get('/reminders/logs'),
  triggerManual: (data) => api.post('/reminders/trigger-manual', data),
  triggerCronNow: () => api.post('/reminders/trigger-cron-now'),
};
