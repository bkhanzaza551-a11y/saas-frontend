import React, { createContext, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const AlertContext = createContext(null);

export const useAlert = () => useContext(AlertContext);

export function AlertProvider({ children }) {
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: null,
    onResolve: null
  });

  const showAlert = (message, title = 'Notification') => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        type: 'alert',
        title,
        message,
        onConfirm: null,
        onResolve: () => resolve(true)
      });
    });
  };

  const showConfirm = (message, onConfirmOrTitle, maybeTitle = 'Confirm Action') => {
    return new Promise((resolve) => {
      let onConfirm = null;
      let title = maybeTitle;
      if (typeof onConfirmOrTitle === 'function') {
        onConfirm = onConfirmOrTitle;
      } else if (typeof onConfirmOrTitle === 'string') {
        title = onConfirmOrTitle;
      }

      setModal({
        isOpen: true,
        type: 'confirm',
        title: title || 'Confirm Action',
        message,
        onConfirm,
        onResolve: (res) => resolve(res)
      });
    });
  };

  const close = (result = false) => {
    setModal((m) => {
      if (m.onResolve) m.onResolve(result);
      return { ...m, isOpen: false };
    });
  };

  const handleConfirm = async () => {
    if (modal.onConfirm) {
      try {
        await modal.onConfirm();
      } catch (err) {
        console.error("AlertContext confirm callback error:", err);
      }
    }
    close(true);
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {modal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, width: 400, maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: modal.type === 'confirm' ? '#f59e0b' : '#3b82f6' }}>
                {modal.type === 'confirm' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 600 }}>{modal.title}</h3>
              </div>
              <button onClick={() => close(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.5, marginBottom: 24 }}>
              {modal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              {modal.type === 'confirm' && (
                <button onClick={() => close(false)} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
              )}
              <button onClick={handleConfirm} style={{ padding: '10px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                {modal.type === 'confirm' ? 'Confirm' : 'Okay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}
