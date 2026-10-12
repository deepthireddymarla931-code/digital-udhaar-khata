const transactionModel = require('../models/transactionModel');
const reminderModel = require('../models/reminderModel');
const customerModel = require('../models/customerModel');
const merchantModel = require('../models/merchantModel');
const smsService = require('../services/smsService');
const socketService = require('../services/socketService');
const { checkAndTriggerDueReminders } = require('../services/reminderScheduler');

async function getDueReminders(req, res) {
  try {
    const list = await reminderModel.getScheduledUpcoming(50);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving scheduled reminders', error: err.message });
  }
}

async function getReminderLogs(req, res) {
  try {
    const logs = await reminderModel.getRecentLogs(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving reminder logs', error: err.message });
  }
}

/**
 * Manual trigger for reminder:
 * Can be sent via SMS / WhatsApp immediately on demand
 */
async function triggerManualReminder(req, res) {
  try {
    const { transactionId, customerId, channel = 'SMS', customMessage = '' } = req.body;
    let customer = null;
    let amount = 0;
    let dueDate = null;

    if (customerId) {
      customer = await customerModel.getById(customerId);
      amount = customer ? customer.netBalance : 0;
    }

    if (transactionId) {
      const tx = await transactionModel.getById(transactionId);
      if (tx) {
        amount = tx.amount;
        dueDate = tx.dueDate;
        if (!customer) {
          customer = await customerModel.getById(tx.customerId);
        }
      }
    }

    if (!customer) {
      return res.status(404).json({ message: 'Customer details could not be found' });
    }

    const defaultMerchant = await merchantModel.getDefault();
    const smsResult = await smsService.sendReminderNotification({
      toPhone: customer.phone,
      customerName: customer.name,
      amount: amount > 0 ? amount : customer.netBalance,
      dueDate: dueDate || new Date(),
      shopName: defaultMerchant.shop_name || 'Sharma General Store',
      channel,
      customNote: customMessage,
    });

    if (transactionId) {
      await transactionModel.markReminderSent(transactionId, 'SENT');
    }

    await reminderModel.logReminder({
      transactionId: transactionId || null,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      amount: amount > 0 ? amount : customer.netBalance,
      dueDate: dueDate || new Date(),
      channel,
      status: 'SENT',
      responseMessage: smsResult.text || 'Manual reminder dispatched successfully.',
    });

    socketService.emitEvent('reminder:triggered', {
      customerId: customer.id,
      customerName: customer.name,
      amount,
      channel,
      smsResult,
      triggeredAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Reminder notification dispatched successfully',
      smsResult,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error triggering reminder', error: err.message });
  }
}

async function triggerCronPass(req, res) {
  try {
    await checkAndTriggerDueReminders();
    res.json({ success: true, message: 'Cron scheduler check completed.' });
  } catch (err) {
    res.status(500).json({ message: 'Error during cron pass', error: err.message });
  }
}

module.exports = {
  getDueReminders,
  getReminderLogs,
  triggerManualReminder,
  triggerCronPass,
};
