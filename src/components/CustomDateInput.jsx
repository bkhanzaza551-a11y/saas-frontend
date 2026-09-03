import React, { useRef } from "react";
import { Calendar, X } from "lucide-react";

/**
 * CustomDateInput
 * 
 * @param {String} value - YYYY-MM-DD
 * @param {Function} onChange - (e) => void or (value) => void
 * @param {String} placeholder - Placeholder text like "From date", "To date"
 * @param {String} min - Minimum date (YYYY-MM-DD)
 * @param {String} max - Maximum date (YYYY-MM-DD)
 * @param {Object} style - Custom styling
 * @param {Boolean} disabled - If true, input is disabled
 */
export default function CustomDateInput({
  value = "",
  onChange,
  placeholder = "Select date...",
  min,
  max,
  style = {},
  disabled = false,
  className = "",
  title = ""
}) {
  const inputRef = useRef(null);

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const handleContainerClick = () => {
    if (disabled) return;
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === "function") {
        try {
          inputRef.current.showPicker();
        } catch {
          inputRef.current.focus();
        }
      } else {
        inputRef.current.focus();
      }
    }
  };

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange({ target: { value: "" } });
    }
  };

  const displayVal = formatDateDisplay(value);

  return (
    <div
      onClick={handleContainerClick}
      title={title || placeholder}
      className={`custom-date-input-wrap ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 42,
        padding: "0 12px",
        background: disabled ? "#f8fafc" : "#ffffff",
        border: value ? "1.5px solid #6366f1" : "1px solid #cbd5e1",
        borderRadius: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        boxSizing: "border-box",
        transition: "all 0.2s ease",
        userSelect: "none",
        minWidth: 140,
        boxShadow: value ? "0 1px 3px rgba(99, 102, 241, 0.1)" : "none",
        ...style
      }}
    >
      <Calendar size={15} color={value ? "#4f46e5" : "#94a3b8"} style={{ flexShrink: 0 }} />

      <span
        style={{
          flex: 1,
          fontSize: "0.84rem",
          fontWeight: value ? 700 : 500,
          color: value ? "#0f172a" : "#94a3b8",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}
      >
        {displayVal || placeholder}
      </span>

      {value && !disabled ? (
        <button
          type="button"
          onClick={handleClear}
          title="Clear date"
          style={{
            background: "#f1f5f9",
            border: "none",
            borderRadius: "50%",
            width: 18,
            height: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#64748b",
            padding: 0,
            flexShrink: 0,
            transition: "all 0.15s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#fee2e2";
            e.currentTarget.style.color = "#dc2626";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.color = "#64748b";
          }}
        >
          <X size={11} />
        </button>
      ) : null}

      <input
        ref={inputRef}
        type="date"
        value={value || ""}
        onChange={handleChange}
        min={min}
        max={max}
        disabled={disabled}
        tabIndex={-1}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          width: "100%",
          height: "100%",
          cursor: "pointer",
          pointerEvents: "auto"
        }}
      />
    </div>
  );
}
