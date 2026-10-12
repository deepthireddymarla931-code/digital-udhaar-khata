import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // In dev: Vite proxies /api to 8080, but Socket.io needs direct connection to :8080
    // In production: VITE_SOCKET_URL should point to the Render backend URL (e.g. https://digital-udhaar-backend.onrender.com)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (
      import.meta.env.DEV
        ? `http://${window.location.hostname}:8080`
        : window.location.origin
    );
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ [Socket.io] Connected to Ledger Server! ID:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('⚡ [Socket.io] Disconnected from Ledger Server');
      setIsConnected(false);
    });

    // Global listener for reminders
    socketInstance.on('reminder:triggered', (data) => {
      addNotification({
        id: 'rem_' + Date.now(),
        type: 'REMINDER',
        title: '⏰ Automated Reminder Dispatched!',
        message: `SMS reminder sent to ${data.customerName} (+91 ${data.customerPhone}) for ₹${data.amount?.toLocaleString()}`,
        time: new Date().toLocaleTimeString(),
      });
    });

    // Global listener for new transactions
    socketInstance.on('transaction:created', (data) => {
      const isGive = data.transaction?.type === 'GIVE';
      addNotification({
        id: 'tx_' + Date.now(),
        type: isGive ? 'GIVE' : 'RECEIVE',
        title: isGive ? '📤 Udhaar Entry Recorded' : '📥 Payment Received (Paisa Mila)',
        message: `₹${data.transaction?.amount?.toLocaleString()} recorded for ${data.customer?.name || data.transaction?.customerName}`,
        time: new Date().toLocaleTimeString(),
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const addNotification = (notif) => {
    setNotifications((prev) => [notif, ...prev.slice(0, 4)]);
    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    }, 6000);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, notifications, removeNotification }}>
      {children}
      {/* Real-time Toast Notifications Float Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-start gap-3 transition-all transform animate-slide-in ${
              n.type === 'REMINDER'
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
                : n.type === 'GIVE'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <div className="text-xl">
              {n.type === 'REMINDER' ? '⏰' : n.type === 'GIVE' ? '🔴' : '🟢'}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-100">{n.title}</h4>
                <span className="text-[10px] opacity-70">{n.time}</span>
              </div>
              <p className="text-xs mt-0.5 leading-snug">{n.message}</p>
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="text-slate-400 hover:text-white text-xs font-bold p-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
