import React from 'react';

export default function ToggleSwitch({ checked, onChange, label, disabled = false }) {
  return (
    <label style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '12px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      userSelect: 'none'
    }}>
      <div style={{
        position: 'relative',
        width: '44px',
        height: '24px',
        background: checked ? 'var(--sf-accent, #c8a97e)' : '#e2e8f0',
        borderRadius: '999px',
        transition: 'background 0.3s ease',
        boxShadow: checked ? '0 2px 4px rgba(200, 169, 126, 0.3)' : 'inset 0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          width: '20px',
          height: '20px',
          background: '#ffffff',
          borderRadius: '50%',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }} />
      </div>
      {label && (
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          color: checked ? 'var(--sf-accent, #c8a97e)' : '#475569',
          transition: 'color 0.3s ease'
        }}>
          {label}
        </span>
      )}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{ display: 'none' }}
      />
    </label>
  );
}
