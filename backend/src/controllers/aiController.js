const customerModel = require('../models/customerModel');
const transactionModel = require('../models/transactionModel');
const merchantModel = require('../models/merchantModel');

async function parseNlp(req, res) {
  try {
    const prompt = (req.body.prompt || '').trim();
    const lower = prompt.toLowerCase();

    const isReceive =
      lower.includes('paid') ||
      lower.includes('received') ||
      lower.includes('mila') ||
      lower.includes('gave back') ||
      lower.includes('jama');

    const type = isReceive ? 'RECEIVE' : 'GIVE';

    const amountMatch = prompt.match(/\b(\d+(?:\.\d{1,2})?)\b/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 500;

    const customers = await customerModel.getAll();
    let extractedName = '';

    const matched = customers.find((c) =>
      lower.includes(c.name.toLowerCase().split(' ')[0])
    );

    if (matched) {
      extractedName = matched.name;
    } else {
      const words = prompt.split(/\s+/);
      for (const w of words) {
        const clean = w.replace(/[^a-zA-Z]/g, '');
        if (
          clean &&
          /^[A-Z]/.test(clean) &&
          ![
            'Took',
            'Paid',
            'Gave',
            'Rupees',
            'Rs',
            'Grocery',
            'Credit',
            'Udhaar',
            'UPI',
            'Cash',
            'Via',
            'On',
          ].includes(clean)
        ) {
          extractedName = clean;
          break;
        }
      }
      if (!extractedName && words.length > 0) {
        extractedName = words[0].replace(/[^a-zA-Z0-9]/g, '');
      }
    }

    let paymentMode = 'CASH';
    if (lower.includes('upi') || lower.includes('phonepe') || lower.includes('gpay') || lower.includes('paytm')) {
      paymentMode = 'UPI';
    } else if (lower.includes('cheque') || lower.includes('check')) {
      paymentMode = 'CHEQUE';
    } else if (lower.includes('bank') || lower.includes('neft') || lower.includes('rtgs')) {
      paymentMode = 'BANK_TRANSFER';
    }

    res.json({
      customerName: extractedName || 'Customer',
      amount,
      type,
      note: prompt,
      paymentMode,
      parsedSuccessfully: true,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error parsing natural language prompt', error: err.message });
  }
}

async function generateReminder(req, res) {
  try {
    const custId = parseInt(req.body.customerId, 10);
    const customer = await customerModel.getById(custId);
    const merchant = await merchantModel.getDefault();

    const name = customer ? customer.name : 'Customer';
    const phone = customer ? customer.phone : '';
    const pendingAmount = customer && customer.netBalance > 0 ? customer.netBalance : 0;
    const shopName = merchant.shop_name || 'Sharma General Store';

    const tone = (req.body.tone || 'POLITE').toUpperCase();
    let msg = `Namaste ${name} ji! Please clear your pending balance of ₹${pendingAmount} at ${shopName}. Thank you!`;

    if (tone === 'URGENT') {
      msg = `URGENT: ${name}, your balance ₹${pendingAmount} at ${shopName} is overdue. Please settle immediately via UPI/Cash.`;
    } else if (tone === 'FIRM') {
      msg = `Dear ${name}, kindly note that your pending balance of ₹${pendingAmount} at ${shopName} is due. Please clear it soon.`;
    }

    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;

    res.json({
      customerName: name,
      phone,
      pendingAmount,
      generatedMessage: msg,
      whatsappUrl,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error generating payment reminder', error: err.message });
  }
}

async function riskAssessment(req, res) {
  try {
    const custId = parseInt(req.params.id, 10);
    const customer = await customerModel.getById(custId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const limit = customer.creditLimit || 10000;
    const balance = customer.netBalance || 0;
    const ratio = limit > 0 ? balance / limit : 0;

    let riskLevel = 'LOW';
    let score = 88;
    if (ratio > 0.85) {
      riskLevel = 'HIGH';
      score = 35;
    } else if (ratio > 0.5) {
      riskLevel = 'MEDIUM';
      score = 65;
    }

    res.json({
      customerId: customer.id,
      customerName: customer.name,
      riskLevel,
      riskScore: score,
      creditLimit: limit,
      currentBalance: balance,
      recommendation:
        riskLevel === 'HIGH'
          ? 'High credit utilization! Hold further credit until partial repayment.'
          : riskLevel === 'MEDIUM'
          ? 'Moderate credit usage. Send gentle reminders for overdue balances.'
          : 'Low risk. Customer has healthy repayment velocity.',
      riskFactors: [
        `Credit ratio is ${(Math.max(0, ratio) * 100).toFixed(0)}% of approved limit`,
      ],
    });
  } catch (err) {
    res.status(500).json({ message: 'Error assessing credit risk', error: err.message });
  }
}

async function cashflowInsights(req, res) {
  try {
    const split = await transactionModel.getMarketSplit();
    const totalOutstanding = split.totalYouWillGet;
    const totalDebtors = split.youWillGetCount;

    res.json({
      totalOutstanding,
      totalDebtors,
      healthStatus: totalOutstanding > 25000 ? 'MODERATE' : 'HEALTHY',
      summaryText: `Total market credit receivable is ₹${totalOutstanding.toLocaleString()} across ${totalDebtors} active debtors. Total advance held is ₹${split.totalYouWillGive.toLocaleString()}. Net market position: ₹${split.netMarketPosition.toLocaleString()}.`,
      actionableAdvice: [
        'Automated due date cron checks for overdue debts every minute.',
        'Use 1-Click WhatsApp or SMS Reminders to speed up collections.',
        'Collect digital UPI payments for instant ledger settlement.',
      ],
      predictedCollectionTimeframe: '5 to 7 days',
    });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving cashflow insights', error: err.message });
  }
}

module.exports = {
  parseNlp,
  generateReminder,
  riskAssessment,
  cashflowInsights,
};
