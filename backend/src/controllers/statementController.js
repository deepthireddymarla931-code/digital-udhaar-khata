const customerModel = require('../models/customerModel');
const transactionModel = require('../models/transactionModel');
const merchantModel = require('../models/merchantModel');

async function downloadCustomerStatement(req, res) {
  try {
    const custId = parseInt(req.params.id, 10);
    const customer = await customerModel.getById(custId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const merchant = await merchantModel.getDefault();
    const transactions = await transactionModel.getByCustomer(custId);

    let textContent = `==========================================================\n`;
    textContent += `       DIGITAL UDHAAR KHATA - OFFICIAL ACCOUNT STATEMENT\n`;
    textContent += `==========================================================\n`;
    textContent += `Database Engine: MySQL (udhaar_db)\n`;
    textContent += `Shop:            ${merchant.shop_name} (Merchant: ${merchant.name})\n`;
    textContent += `Customer:        ${customer.name} | Phone: ${customer.phone}\n`;
    textContent += `Generated At:    ${new Date().toLocaleString('en-IN')}\n`;
    textContent += `----------------------------------------------------------\n`;
    textContent += `Net Balance:        ₹${customer.netBalance} (${customer.status})\n`;
    textContent += `Total Udhaar Given: ₹${customer.totalGiven}\n`;
    textContent += `Total Paisa Mila:   ₹${customer.totalReceived}\n`;
    textContent += `Credit Limit:       ₹${customer.creditLimit}\n`;
    textContent += `Risk Rating:        ${customer.riskLevel}\n`;
    textContent += `----------------------------------------------------------\n`;
    textContent += `TRANSACTION HISTORY:\n`;
    if (transactions.length === 0) {
      textContent += `(No transactions recorded yet)\n`;
    } else {
      transactions.forEach((t, i) => {
        const isGive = t.type === 'GIVE';
        const typeStr = isGive ? 'UDHAAR DIYA (-)' : 'PAISA MILA (+)';
        const dueStr = t.dueDate ? ` | Due: ${new Date(t.dueDate).toLocaleDateString()}` : '';
        textContent += `${i + 1}. [${typeStr}] ₹${t.amount} | Mode: ${t.paymentMode} | Note: ${t.note || '-'}${dueStr} | Date: ${new Date(t.transactionDate).toLocaleString()}\n`;
      });
    }
    textContent += `==========================================================\n`;
    textContent += `Powered by Digital Udhaar Khata Real-Time Engine\n`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Statement_${customer.name.replace(/\s+/g, '_')}_${customer.id}.txt`
    );
    res.send(textContent);
  } catch (err) {
    res.status(500).json({ message: 'Error generating customer statement', error: err.message });
  }
}

module.exports = {
  downloadCustomerStatement,
};
