import React, { createContext, useContext, useState } from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

const AlertContext = createContext(null);

export const useAlert = () => useContext(AlertContext);

export function AlertProvider({ children }) {
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'alert',
    variant: 'default',
    title: '',
    message: '',
    onConfirm: null,
    onResolve: null
  });

  const showAlert = (message, title = 'Notification', variant = 'default') => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        type: 'alert',
        variant,
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
      <style>{`
        @keyframes salonnestAlertFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes salonnestAlertPopIn {
          0% { opacity: 0; transform: translateY(18px) scale(0.94); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      {modal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', animation: 'salonnestAlertFadeIn 0.2s ease-out', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: 400, maxWidth: '100%', boxShadow: '0 24px 60px -12px rgba(15, 23, 42, 0.35), 0 8px 24px rgba(15, 23, 42, 0.08)', overflow: 'hidden', animation: 'salonnestAlertPopIn 0.32s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ height: 5, background: modal.type === 'confirm'
              ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
              : modal.variant === 'danger'
                ? 'linear-gradient(90deg, #ef4444, #f87171)'
                : 'linear-gradient(90deg, #ea580c, #fb923c)' }} />
            <div style={{ padding: '26px 26px 22px 26px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{
                  width: 62, height: 62, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                  background: modal.type === 'confirm' ? '#fffbeb' : (modal.variant === 'danger' ? '#fef2f2' : '#fff7ed'),
                  border: modal.type === 'confirm' ? '1px solid #fde68a' : (modal.variant === 'danger' ? '1px solid #fecaca' : '1px solid #fed7aa')
                }}>
                  {modal.type === 'confirm'
                    ? <AlertCircle size={30} color="#d97706" strokeWidth={2} />
                    : <ShieldAlert size={30} color={modal.variant === 'danger' ? '#dc2626' : '#ea580c'} strokeWidth={2} />}
                </div>
                <h3 style={{ margin: 0, fontSize: 19, color: '#0f172a', fontWeight: 700, letterSpacing: '-0.01em' }}>{modal.title}</h3>
                <p style={{ margin: '10px 0 0 0', fontSize: 14.5, color: '#64748b', lineHeight: 1.6, fontWeight: 500 }}>
                  {modal.message}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                {modal.type === 'confirm' && (
                  <button onClick={() => close(false)} style={{ flex: 1, padding: '12px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}>
                    Cancel
                  </button>
                )}
                <button onClick={handleConfirm} style={{ flex: 1, padding: '12px 16px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.35)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.25)'; }}>
                  {modal.type === 'confirm' ? 'Confirm' : 'Okay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}
