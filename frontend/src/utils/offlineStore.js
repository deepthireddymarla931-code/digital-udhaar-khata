// frontend/src/utils/offlineStore.js
// Universal Offline & Demo Fallback Store for Digital Udhaar Khata

const STORAGE_KEY_CUSTOMERS = 'duk_offline_customers';
const STORAGE_KEY_TRANSACTIONS = 'duk_offline_transactions';

const INITIAL_CUSTOMERS = [
  {
    id: 1,
    name: 'Ramesh Kumar',
    phone: '9876543211',
    email: 'ramesh@example.com',
    address: 'Sector 4, Main Market',
    netBalance: 4500,
    creditLimit: 15000,
    totalGiven: 6000,
    totalReceived: 1500,
    riskLevel: 'LOW',
    status: 'OWES',
  },
  {
    id: 2,
    name: 'Priya Singh',
    phone: '9876543212',
    email: 'priya@example.com',
    address: 'Lane 2, Vikas Nagar',
    netBalance: 3200,
    creditLimit: 10000,
    totalGiven: 3200,
    totalReceived: 0,
    riskLevel: 'MEDIUM',
    status: 'OWES',
  },
  {
    id: 3,
    name: 'Amit Verma',
    phone: '9876543213',
    email: 'amit@example.com',
    address: 'Shop 12, Gandhi Chowk',
    netBalance: 7500,
    creditLimit: 8000,
    totalGiven: 7500,
    totalReceived: 0,
    riskLevel: 'HIGH',
    status: 'OWES',
  },
  {
    id: 4,
    name: 'Suresh Patel',
    phone: '9876543214',
    email: 'suresh@example.com',
    address: 'Cross Road 1, Bazaar',
    netBalance: 4100,
    creditLimit: 12000,
    totalGiven: 5000,
    totalReceived: 900,
    riskLevel: 'LOW',
    status: 'OWES',
  },
  {
    id: 5,
    name: 'Deepak Sharma',
    phone: '9876543215',
    email: 'deepak@example.com',
    address: 'New Colony, Ward 3',
    netBalance: -2500,
    creditLimit: 5000,
    totalGiven: 0,
    totalReceived: 2500,
    riskLevel: 'LOW',
    status: 'ADVANCE',
  },
];

const INITIAL_TRANSACTIONS = [
  {
    id: 101,
    customerId: 1,
    customerName: 'Ramesh Kumar',
    customerPhone: '9876543211',
    amount: 4500,
    type: 'GIVE',
    paymentMode: 'CASH',
    note: 'Grocery on credit',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    transactionDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    reminderStatus: 'SCHEDULED',
  },
  {
    id: 102,
    customerId: 1,
    customerName: 'Ramesh Kumar',
    customerPhone: '9876543211',
    amount: 1500,
    type: 'RECEIVE',
    paymentMode: 'ONLINE',
    note: 'Part payment via UPI',
    dueDate: null,
    transactionDate: new Date(Date.now() - 86400000).toISOString(),
    reminderStatus: 'NONE',
  },
  {
    id: 103,
    customerId: 2,
    customerName: 'Priya Singh',
    customerPhone: '9876543212',
    amount: 3200,
    type: 'GIVE',
    paymentMode: 'CASH',
    note: 'Household provisions',
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    transactionDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    reminderStatus: 'SCHEDULED',
  },
  {
    id: 104,
    customerId: 3,
    customerName: 'Amit Verma',
    customerPhone: '9876543213',
    amount: 7500,
    type: 'GIVE',
    paymentMode: 'CASH',
    note: 'Bulk store supplies',
    dueDate: new Date(Date.now() - 86400000).toISOString(),
    transactionDate: new Date(Date.now() - 86400000 * 4).toISOString(),
    reminderStatus: 'OVERDUE',
  },
  {
    id: 105,
    customerId: 5,
    customerName: 'Deepak Sharma',
    customerPhone: '9876543215',
    amount: 2500,
    type: 'RECEIVE',
    paymentMode: 'ONLINE',
    note: 'Advance deposit',
    dueDate: null,
    transactionDate: new Date().toISOString(),
    reminderStatus: 'NONE',
  },
];

class OfflineStore {
  constructor() {
    this._init();
  }

  _init() {
    try {
      const storedCust = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      if (!storedCust) {
        localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
      }
      const storedTx = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      if (!storedTx) {
        localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      }
    } catch (e) {
      console.warn('LocalStorage error in OfflineStore:', e);
    }
  }

  getCustomers(search = '') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      const list = raw ? JSON.parse(raw) : INITIAL_CUSTOMERS;
      if (!search || !search.trim()) return list;
      const q = search.toLowerCase().trim();
      return list.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
      );
    } catch {
      return INITIAL_CUSTOMERS;
    }
  }

  getCustomerById(id) {
    const list = this.getCustomers();
    const numId = parseInt(id, 10);
    return list.find((c) => c.id === numId) || null;
  }

  getCustomerByPhone(phone) {
    const clean = phone.replace(/[^0-9]/g, '');
    const list = this.getCustomers();
    return list.find((c) => c.phone && c.phone.replace(/[^0-9]/g, '') === clean) || null;
  }

  syncCustomers(serverList) {
    if (!Array.isArray(serverList) || serverList.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(serverList));
      this._emitChange();
    } catch (e) {
      console.warn('Failed to sync customers:', e);
    }
  }

  addCustomerLocally(data) {
    const list = this.getCustomers();
    const newId = Date.now();
    const newCust = {
      id: newId,
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      address: data.address || '',
      creditLimit: parseFloat(data.creditLimit) || 10000,
      netBalance: 0,
      totalGiven: 0,
      totalReceived: 0,
      riskLevel: 'LOW',
      status: 'SETTLED',
      createdAt: new Date().toISOString(),
    };
    list.unshift(newCust);
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(list));
      this._emitChange();
    } catch (e) {
      console.warn('Failed to save customer locally:', e);
    }
    return newCust;
  }

  addTransactionLocally(data) {
    const custId = parseInt(data.customerId, 10);
    const amount = parseFloat(data.amount) || 0;
    const type = data.type || 'GIVE';

    // 1. Update customer's balance
    const custList = this.getCustomers();
    const cust = custList.find((c) => c.id === custId);
    let custName = 'Customer';
    let custPhone = '';

    if (cust) {
      custName = cust.name;
      custPhone = cust.phone;
      if (type === 'GIVE') {
        cust.netBalance = (cust.netBalance || 0) + amount;
        cust.totalGiven = (cust.totalGiven || 0) + amount;
      } else {
        cust.netBalance = (cust.netBalance || 0) - amount;
        cust.totalReceived = (cust.totalReceived || 0) + amount;
      }
      cust.status = cust.netBalance > 0 ? 'OWES' : cust.netBalance < 0 ? 'ADVANCE' : 'SETTLED';
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(custList));
      } catch (e) {
        console.warn(e);
      }
    }

    // 2. Save transaction
    const txList = this.getTransactions();
    const newTx = {
      id: Date.now(),
      customerId: custId,
      customerName: custName,
      customerPhone: custPhone,
      amount,
      type,
      paymentMode: data.paymentMode || 'CASH',
      note: data.note || '',
      dueDate: data.dueDate || null,
      reminderChannel: data.reminderChannel || 'SMS',
      reminderNote: data.reminderNote || '',
      transactionDate: new Date().toISOString(),
      reminderStatus: data.dueDate ? 'SCHEDULED' : 'NONE',
    };
    txList.unshift(newTx);
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(txList));
      this._emitChange();
    } catch (e) {
      console.warn('Failed to save transaction locally:', e);
    }
    return newTx;
  }

  getTransactions(customerId = null) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      const list = raw ? JSON.parse(raw) : INITIAL_TRANSACTIONS;
      if (!customerId) return list;
      const numId = parseInt(customerId, 10);
      return list.filter((t) => t.customerId === numId);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  }

  getDashboardSummary() {
    const customers = this.getCustomers();
    const transactions = this.getTransactions();

    const todayStr = new Date().toDateString();
    let totalGivenToday = 0;
    let totalCollectedToday = 0;

    transactions.forEach((tx) => {
      const txDate = new Date(tx.transactionDate).toDateString();
      if (txDate === todayStr) {
        if (tx.type === 'GIVE') totalGivenToday += tx.amount;
        if (tx.type === 'RECEIVE') totalCollectedToday += tx.amount;
      }
    });

    let totalOutstanding = 0;
    let activeDebtors = 0;
    customers.forEach((c) => {
      if (c.netBalance > 0) {
        totalOutstanding += c.netBalance;
        activeDebtors += 1;
      }
    });

    const pendingReminders = transactions.filter(
      (t) => t.dueDate && t.reminderStatus === 'SCHEDULED'
    ).length;

    return {
      totalOutstandingCredit: totalOutstanding,
      totalGivenToday,
      totalCollectedToday,
      activeDebtorsCount: activeDebtors,
      pendingRemindersCount: pendingReminders,
    };
  }

  getMarketSplit() {
    const customers = this.getCustomers();
    let totalYouWillGet = 0;
    let totalYouWillGive = 0;
    const youWillGetList = [];
    const youWillGiveList = [];

    customers.forEach((c) => {
      if (c.netBalance > 0) {
        totalYouWillGet += c.netBalance;
        youWillGetList.push(c);
      } else if (c.netBalance < 0) {
        totalYouWillGive += Math.abs(c.netBalance);
        youWillGiveList.push(c);
      }
    });

    return {
      totalYouWillGet,
      totalYouWillGive,
      netMarketPosition: totalYouWillGet - totalYouWillGive,
      youWillGetCount: youWillGetList.length,
      youWillGiveCount: youWillGiveList.length,
      youWillGetList,
      youWillGiveList,
    };
  }

  _emitChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('duk:offline_data_updated'));
    }
  }
}

export const offlineStore = new OfflineStore();
