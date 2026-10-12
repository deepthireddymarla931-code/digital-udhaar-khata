const cron = require('node-cron');
const transactionModel = require('../models/transactionModel');
const reminderModel = require('../models/reminderModel');
const merchantModel = require('../models/merchantModel');
const smsService = require('./smsService');
const socketService = require('./socketService');

let cronTask = null;
let isProcessing = false;

async function checkAndTriggerDueReminders() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const dueEntries = await transactionModel.getDuePending();
    if (dueEntries.length > 0) {
      console.log(`⏰ [CRON SCHEDULER] Found ${dueEntries.length} due transactions ready for automated reminder dispatch.`);
      const defaultMerchant = await merchantModel.getDefault();

      for (const entry of dueEntries) {
        const custName = entry.custLiveName || entry.customerName || 'Customer';
        const custPhone = entry.custLivePhone || entry.customerPhone || '';

        console.log(`🔔 [TRIGGERING DUE REMINDER] Tx #${entry.id} | Customer: ${custName} | Due: ${entry.dueDate} | Amount: ₹${entry.amount}`);

        // Dispatch SMS / WhatsApp reminder
        const smsResult = await smsService.sendReminderNotification({
          toPhone: custPhone,
          customerName: custName,
          amount: entry.amount,
          dueDate: entry.dueDate,
          shopName: defaultMerchant.shop_name || 'Sharma General Store',
          channel: entry.reminderChannel || 'SMS',
          customNote: entry.reminderNote || entry.note || '',
        });

        // Update transaction status to SENT
        await transactionModel.markReminderSent(entry.id, 'SENT');

        // Record audit log in reminder_logs
        const logId = await reminderModel.logReminder({
          transactionId: entry.id,
          customerId: entry.customerId,
          customerName: custName,
          customerPhone: custPhone,
          amount: entry.amount,
          dueDate: entry.dueDate,
          channel: entry.reminderChannel || 'SMS',
          status: 'SENT',
          responseMessage: smsResult.text || 'SMS reminder automatically dispatched upon due date.',
        });

        // Broadcast real-time alert to all connected dashboards via WebSocket
        socketService.emitEvent('reminder:triggered', {
          transactionId: entry.id,
          customerId: entry.customerId,
          customerName: custName,
          customerPhone: custPhone,
          amount: entry.amount,
          dueDate: entry.dueDate,
          channel: entry.reminderChannel || 'SMS',
          smsResult,
          triggeredAt: new Date().toISOString(),
          logId,
        });
      }

      // Sync updated summary across devices
      const updatedSummary = await transactionModel.getDashboardSummary();
      socketService.emitEvent('ledger:updated', {
        type: 'REMINDER_BATCH_PROCESSED',
        summary: updatedSummary,
      });
    }
  } catch (err) {
    console.error('❌ [CRON SCHEDULER ERROR]:', err.message);
  } finally {
    isProcessing = false;
  }
}

function startReminderScheduler() {
  console.log('⏰ [CRON SCHEDULER] Initializing automated due-date reminder cron job (every minute: * * * * *)...');
  
  // Run immediately on start to catch any overdue entries while server was offline
  checkAndTriggerDueReminders();

  // Run every minute
  cronTask = cron.schedule('* * * * *', () => {
    checkAndTriggerDueReminders();
  });

  return cronTask;
}

function stopReminderScheduler() {
  if (cronTask) {
    cronTask.stop();
    console.log('⏰ [CRON SCHEDULER] Stopped.');
  }
}

module.exports = {
  startReminderScheduler,
  stopReminderScheduler,
  checkAndTriggerDueReminders,
};
