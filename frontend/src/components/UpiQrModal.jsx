import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, QrCode, Copy, Check, Send, Download, Settings, 
  Smartphone, IndianRupee, ShieldCheck, Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const UpiQrModal = ({ 
  isOpen, 
  onClose, 
  customer = null, 
  initialAmount = 0, 
  transactionNote = 'Udhaar Settlement' 
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [amount, setAmount] = useState(initialAmount || 0);
  const [vpa, setVpa] = useState(() => {
    return localStorage.getItem('merchant_upi_vpa') || (user?.phone ? `${user.phone}@okhdfcbank` : 'merchant@upi');
  });
  const [isEditingVpa, setIsEditingVpa] = useState(false);
  const [vpaDraft, setVpaDraft] = useState(vpa);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync initialAmount when modal opens or customer changes
  useEffect(() => {
    if (isOpen) {
      setAmount(initialAmount || (customer?.netBalance ? Math.max(0, customer.netBalance) : 0));
    }
  }, [isOpen, initialAmount, customer]);

  // Construct UPI URI according to NPCI specs
  const shopName = user?.shopName || 'Digital Udhaar Khata';
  const note = `Udhaar payment from ${customer?.name || 'Customer'}`;
  const upiUri = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(shopName)}&am=${amount > 0 ? amount.toFixed(2) : '0'}&cu=INR&tn=${encodeURIComponent(note)}`;

  // Generate QR code whenever upiUri changes
  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(upiUri, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate UPI QR Code:', err));
  }, [upiUri, isOpen]);

  const handleSaveVpa = () => {
    const cleaned = vpaDraft.trim();
    if (cleaned && cleaned.includes('@')) {
      setVpa(cleaned);
      localStorage.setItem('merchant_upi_vpa', cleaned);
      setIsEditingVpa(false);
    } else {
      alert('Please enter a valid UPI VPA (e.g. yourname@okhdfcbank or 9876543210@paytm)');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `UPI_QR_${shopName.replace(/\s+/g, '_')}_Rs${amount}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareWhatsApp = () => {
    const phone = customer?.phone?.replace(/\D/g, '') || '';
    const textMsg = `Namaste ${customer?.name || ''}! 🙏\n\nThis is a friendly reminder from *${shopName}*.\nPlease pay your pending balance of *₹${amount.toLocaleString()}*.\n\n💳 Pay directly via UPI:\n${upiUri}\n\nAccepted via Google Pay, PhonePe, Paytm, and BHIM.\nThank you!`;
    const targetUrl = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(textMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(textMsg)}`;
    window.open(targetUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                Dynamic UPI Payment QR
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Instant Pay
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {customer?.name ? `Customer: ${customer.name}` : shopName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Amount input & Quick Chips */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>{t('amountToCollect')}</span>
              {customer?.netBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(customer.netBalance)}
                  className="text-indigo-400 hover:text-indigo-300 text-[10px] lowercase font-semibold"
                >
                  Set Full Balance (₹{customer.netBalance.toLocaleString()})
                </button>
              )}
            </label>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 text-white font-extrabold text-xl pl-8 pr-4 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Enter amount..."
              />
            </div>

            {/* Quick addition chips */}
            <div className="flex items-center gap-1.5 pt-1">
              {[100, 200, 500, 1000, 2000].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setAmount((prev) => (prev || 0) + chip)}
                  className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold transition-colors border border-slate-700/60"
                >
                  +{chip}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount(0)}
                className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold transition-colors border border-rose-500/20 ml-auto"
              >
                Clear
              </button>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 shadow-inner space-y-3">
            <div className="bg-white p-3.5 rounded-2xl shadow-xl flex items-center justify-center border-4 border-slate-100">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="UPI Payment QR Code"
                  className="w-52 h-52 object-contain rounded-lg"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            {/* UPI Brand Acceptance Row */}
            <div className="text-center space-y-1">
              <p className="text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Accepted by Google Pay, PhonePe, Paytm, BHIM, Cred & Any UPI App
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Payments settle directly into your linked bank account
              </p>
            </div>
          </div>

          {/* Merchant UPI VPA setting */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('upiId')} (Recipient VPA)
              </span>
              {!isEditingVpa ? (
                <button
                  type="button"
                  onClick={() => {
                    setVpaDraft(vpa);
                    setIsEditingVpa(true);
                  }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  Change UPI ID
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveVpa}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold"
                >
                  Save UPI ID
                </button>
              )}
            </div>

            {!isEditingVpa ? (
              <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200">
                <span className="truncate">{vpa}</span>
                <span className="text-[10px] font-sans text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0 ml-2">
                  Verified
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={vpaDraft}
                  onChange={(e) => setVpaDraft(e.target.value)}
                  placeholder="e.g. mobile@upi or shop@okaxis"
                  className="w-full bg-slate-900 border border-indigo-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveVpa}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shrink-0"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons: WhatsApp Share & Copy Link */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              {t('shareOnWhatsapp')}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
              {copied ? t('copied') : t('copyUpiLink')}
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadQr}
            className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            {t('downloadQrPng')} (for print or counter display)
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpiQrModal;
