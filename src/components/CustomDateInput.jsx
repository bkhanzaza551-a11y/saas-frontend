import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight, X, ChevronDown } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false });
  const [viewMode, setViewMode] = useState("calendar"); // 'calendar' | 'month'

  const triggerRef = useRef(null);
  const portalRef = useRef(null);

  // Parse initial selected date or default to current date
  const selectedDate = value ? new Date(value + "T00:00:00") : null;
  const today = new Date();

  const [viewYear, setViewYear] = useState(
    selectedDate ? selectedDate.getFullYear() : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selectedDate ? selectedDate.getMonth() : today.getMonth()
  );

  // Synchronize view state when value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 320;
    const dropdownWidth = 290;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;

    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - dropdownWidth - 10);
    }

    setCoords({
      top: openUp ? rect.top - dropdownHeight - 6 : rect.bottom + 6,
      left,
      width: Math.max(dropdownWidth, rect.width),
      openUp
    });
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    updatePosition();
    setViewMode("calendar");
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setViewMode("calendar");
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e) => {
      if (portalRef.current && portalRef.current.contains(e.target)) return;
      updatePosition();
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };

    const handleClickOutside = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        portalRef.current &&
        !portalRef.current.contains(e.target)
      ) {
        handleClose();
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDateSelect = (year, month, day) => {
    const formattedMonth = String(month + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    if (onChange) {
      onChange({ target: { value: dateStr } });
    }
    handleClose();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange({ target: { value: "" } });
    }
    handleClose();
  };

  const handleSelectToday = (e) => {
    e.stopPropagation();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    handleDateSelect(y, m, d);
  };

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

  // Build calendar matrix
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays = [];

  // Previous month overflow days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    calendarDays.push({ day, month: prevMonth, year: prevYear, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, month: viewMonth, year: viewYear, isCurrentMonth: true });
  }

  // Next month overflow days to complete grid
  const totalCells = calendarDays.length <= 35 ? 35 : 42;
  const remainingCells = totalCells - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    calendarDays.push({ day: i, month: nextMonth, year: nextYear, isCurrentMonth: false });
  }

  const isDateDisabled = (y, m, d) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

  const isDateSelected = (y, m, d) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === y &&
      selectedDate.getMonth() === m &&
      selectedDate.getDate() === d
    );
  };

  const isDateToday = (y, m, d) => {
    return (
      today.getFullYear() === y &&
      today.getMonth() === m &&
      today.getDate() === d
    );
  };

  const yearRange = [];
  const currentYear = today.getFullYear();
  for (let y = currentYear - 8; y <= currentYear + 8; y++) {
    yearRange.push(y);
  }

  const displayVal = formatDateDisplay(value);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleOpen}
        title={title || placeholder}
        className={`custom-date-input-wrap ${className}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 40,
          padding: "0 12px",
          background: disabled ? "#f8fafc" : "#ffffff",
          border: isOpen ? "1.5px solid #4f46e5" : value ? "1.5px solid #6366f1" : "1px solid #cbd5e1",
          borderRadius: 10,
          cursor: disabled ? "not-allowed" : "pointer",
          position: "relative",
          boxSizing: "border-box",
          transition: "all 0.18s ease",
          userSelect: "none",
          minWidth: 140,
          boxShadow: isOpen
            ? "0 0 0 3px rgba(79, 70, 229, 0.12)"
            : value
            ? "0 1px 3px rgba(99, 102, 241, 0.1)"
            : "none",
          ...style
        }}
      >
        <Calendar size={15} color={value || isOpen ? "#4f46e5" : "#94a3b8"} style={{ flexShrink: 0 }} />

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
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={portalRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: 290,
              background: "#ffffff",
              borderRadius: 16,
              boxShadow: "0 20px 40px -6px rgba(15, 23, 42, 0.18), 0 8px 16px -4px rgba(15, 23, 42, 0.08)",
              border: "1px solid #e2e8f0",
              padding: "16px",
              zIndex: 9999999,
              fontFamily: "'Poppins', 'Segoe UI', sans-serif",
              animation: "fadeInPicker 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
              boxSizing: "border-box"
            }}
          >
            <style>{`
              @keyframes fadeInPicker {
                from { opacity: 0; transform: translateY(${coords.openUp ? "6px" : "-6px"}) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
              .cal-day-cell {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                font-size: 0.82rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.15s ease;
                border: none;
                background: transparent;
                margin: 0 auto;
                box-sizing: border-box;
              }
              .cal-day-cell:hover:not(.disabled):not(.selected) {
                background: #f1f5f9;
                color: #0f172a;
                transform: scale(1.06);
              }
              .cal-day-cell.selected {
                background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%) !important;
                color: #ffffff !important;
                font-weight: 800 !important;
                box-shadow: 0 4px 10px rgba(79, 70, 229, 0.35) !important;
              }
              .cal-day-cell.today:not(.selected) {
                background: #eef2ff;
                color: #4f46e5;
                font-weight: 800;
                border: 1.5px solid #6366f1;
              }
              .cal-day-cell.overflow {
                color: #cbd5e1;
                font-weight: 500;
              }
              .cal-day-cell.disabled {
                opacity: 0.3;
                cursor: not-allowed;
                pointer-events: none;
              }
            `}</style>

            {/* Calendar Navigation Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "month" ? "calendar" : "month")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 8px",
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: "0.92rem",
                  color: "#0f172a",
                  transition: "background 0.15s"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "#f1f5f9"}
                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
              >
                <span>{MONTH_NAMES[viewMonth]} {viewYear}</span>
                <ChevronDown size={14} color="#64748b" />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  title="Previous Month"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#475569",
                    transition: "all 0.15s"
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  title="Next Month"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#475569",
                    transition: "all 0.15s"
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Quick Month & Year Picker Overlay */}
            {viewMode === "month" ? (
              <div style={{ padding: "4px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 4px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Select Month & Year</span>
                  <select
                    value={viewYear}
                    onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      outline: "none"
                    }}
                  >
                    {yearRange.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {MONTH_NAMES.map((mName, mIdx) => {
                    const isSelected = viewMonth === mIdx;
                    return (
                      <button
                        key={mName}
                        type="button"
                        onClick={() => {
                          setViewMonth(mIdx);
                          setViewMode("calendar");
                        }}
                        style={{
                          padding: "8px 4px",
                          borderRadius: 8,
                          border: isSelected ? "1.5px solid #4f46e5" : "1px solid #f1f5f9",
                          background: isSelected ? "#eef2ff" : "#f8fafc",
                          color: isSelected ? "#4f46e5" : "#334155",
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                        onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = "#f1f5f9"; }}
                        onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = "#f8fafc"; }}
                      >
                        {mName.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* Days of week header */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>
                  {DAYS_SHORT.map((d) => (
                    <div
                      key={d}
                      style={{
                        textAlign: "center",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        padding: "4px 0"
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar Days Matrix */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px 2px", marginBottom: 12 }}>
                  {calendarDays.map((item, idx) => {
                    const isSelected = isDateSelected(item.year, item.month, item.day);
                    const isToday = isDateToday(item.year, item.month, item.day);
                    const disabled = isDateDisabled(item.year, item.month, item.day);

                    return (
                      <button
                        key={`${item.year}-${item.month}-${item.day}-${idx}`}
                        type="button"
                        onClick={() => !disabled && handleDateSelect(item.year, item.month, item.day)}
                        className={`cal-day-cell ${isSelected ? "selected" : ""} ${isToday ? "today" : ""} ${!item.isCurrentMonth ? "overflow" : ""} ${disabled ? "disabled" : ""}`}
                        disabled={disabled}
                      >
                        {item.day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Quick Action Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 10,
                borderTop: "1px solid #f1f5f9"
              }}
            >
              <button
                type="button"
                onClick={handleClear}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 6,
                  transition: "background 0.15s"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "#fef2f2"}
                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleSelectToday}
                style={{
                  background: "#eef2ff",
                  border: "1px solid #c7d2fe",
                  color: "#4f46e5",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "4px 12px",
                  borderRadius: 6,
                  transition: "all 0.15s"
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "#4f46e5"; e.currentTarget.style.color = "#ffffff"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "#eef2ff"; e.currentTarget.style.color = "#4f46e5"; }}
              >
                Today
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
