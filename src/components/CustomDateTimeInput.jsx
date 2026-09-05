import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Calendar, Clock, ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const QUICK_TIMES = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"
];

export default function CustomDateTimeInput({
  value = "", // Format: "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD HH:mm:ss"
  onChange,
  placeholder = "Select date & time...",
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

  // Parse initial value
  const parseDateTime = (val) => {
    if (!val) return null;
    const clean = val.replace(" ", "T");
    const d = new Date(clean);
    return isNaN(d.getTime()) ? null : d;
  };

  const currentObj = parseDateTime(value);
  const today = new Date();

  const [selectedYear, setSelectedYear] = useState(currentObj ? currentObj.getFullYear() : today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentObj ? currentObj.getMonth() : today.getMonth());
  const [selectedDay, setSelectedDay] = useState(currentObj ? currentObj.getDate() : today.getDate());

  // Time state (12-hour format)
  const getInitialTime = () => {
    if (currentObj) {
      const h24 = currentObj.getHours();
      const m = currentObj.getMinutes();
      const ampm = h24 >= 12 ? "PM" : "AM";
      const h12 = h24 % 12 || 12;
      return {
        hour: String(h12).padStart(2, "0"),
        minute: String(m).padStart(2, "0"),
        ampm
      };
    }
    return { hour: "10", minute: "00", ampm: "AM" };
  };

  const [timeState, setTimeState] = useState(getInitialTime);

  // Synchronize when external value changes
  useEffect(() => {
    if (value) {
      const d = parseDateTime(value);
      if (d) {
        setSelectedYear(d.getFullYear());
        setSelectedMonth(d.getMonth());
        setSelectedDay(d.getDate());
        const h24 = d.getHours();
        const m = d.getMinutes();
        const ampm = h24 >= 12 ? "PM" : "AM";
        const h12 = h24 % 12 || 12;
        setTimeState({
          hour: String(h12).padStart(2, "0"),
          minute: String(m).padStart(2, "0"),
          ampm
        });
      }
    }
  }, [value]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 340;
    const dropdownWidth = 510;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    let left = rect.left;
    // Ensure the dropdown never goes off the right edge of the viewport
    if (left + dropdownWidth > window.innerWidth - 16) {
      left = Math.max(12, window.innerWidth - dropdownWidth - 16);
    }

    let top = openUp ? rect.top - dropdownHeight - 6 : rect.bottom + 6;
    // Clamp top so it never extends past the bottom of the viewport
    if (!openUp && top + dropdownHeight > window.innerHeight - 12) {
      top = Math.max(12, window.innerHeight - dropdownHeight - 12);
    }
    if (openUp && top < 12) {
      top = 12;
    }

    setCoords({
      top,
      left,
      width: dropdownWidth,
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

  // Convert 12h to 24h string and emit change
  const emitDateTime = (y, m, d, timeObj) => {
    let h24 = parseInt(timeObj.hour, 10);
    if (timeObj.ampm === "PM" && h24 < 12) h24 += 12;
    if (timeObj.ampm === "AM" && h24 === 12) h24 = 0;

    const yyyy = y;
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const hh = String(h24).padStart(2, "0");
    const min = String(timeObj.minute).padStart(2, "0");

    const isoStr = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    if (onChange) {
      onChange({ target: { value: isoStr } });
    }
  };

  const handleDateClick = (y, m, d) => {
    setSelectedYear(y);
    setSelectedMonth(m);
    setSelectedDay(d);
    emitDateTime(y, m, d, timeState);
  };

  const handleQuickTimeClick = (timeStr) => {
    // e.g. "03:00 PM"
    const [timePart, ampmPart] = timeStr.split(" ");
    const [h, min] = timePart.split(":");
    const newTime = { hour: h, minute: min, ampm: ampmPart };
    setTimeState(newTime);
    emitDateTime(selectedYear, selectedMonth, selectedDay, newTime);
    handleClose(); // Instantly apply and close!
  };

  const handleApplyAndClose = () => {
    emitDateTime(selectedYear, selectedMonth, selectedDay, timeState);
    handleClose();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange({ target: { value: "" } });
    }
    handleClose();
  };

  const formatDisplay = (val) => {
    if (!val) return "";
    try {
      const d = parseDateTime(val);
      if (!d) return val;
      const datePart = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${datePart}, ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
    } catch {
      return val;
    }
  };

  // Calendar calculations
  const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  const calendarDays = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    calendarDays.push({ day: d, month: prevMonth, year: prevYear, isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, month: selectedMonth, year: selectedYear, isCurrentMonth: true });
  }
  const totalCells = calendarDays.length <= 35 ? 35 : 42;
  const remainingCells = totalCells - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
    const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    calendarDays.push({ day: i, month: nextMonth, year: nextYear, isCurrentMonth: false });
  }

  const isSelected = (y, m, d) => selectedYear === y && selectedMonth === m && selectedDay === d;
  const isToday = (y, m, d) => today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;

  const displayVal = formatDisplay(value);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleOpen}
        title={title || placeholder}
        className={`custom-datetime-wrap ${className}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 40,
          padding: "0 10px",
          background: disabled ? "#f8fafc" : "#ffffff",
          border: isOpen ? "1.5px solid #4f46e5" : value ? "1.5px solid #6366f1" : "1px solid #cbd5e1",
          borderRadius: 10,
          cursor: disabled ? "not-allowed" : "pointer",
          position: "relative",
          boxSizing: "border-box",
          transition: "all 0.18s ease",
          userSelect: "none",
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
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
            minWidth: 0,
            fontSize: "0.82rem",
            fontWeight: value ? 700 : 500,
            color: value ? "#0f172a" : "#94a3b8",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {displayVal || placeholder}
        </span>

        <Clock size={14} color={value || isOpen ? "#4f46e5" : "#94a3b8"} style={{ flexShrink: 0 }} />
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={portalRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: 510,
              maxWidth: "calc(100vw - 24px)",
              maxHeight: "calc(100vh - 24px)",
              background: "#ffffff",
              borderRadius: 16,
              boxShadow: "0 20px 40px -6px rgba(15, 23, 42, 0.2), 0 8px 16px -4px rgba(15, 23, 42, 0.1)",
              border: "1px solid #e2e8f0",
              padding: "16px",
              zIndex: 9999999,
              fontFamily: "'Poppins', 'Segoe UI', sans-serif",
              animation: "fadeInPicker 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
              boxSizing: "border-box",
              overflowY: "auto",
              overflowX: "hidden"
            }}
          >
            <style>{`
              @keyframes fadeInPicker {
                from { opacity: 0; transform: translateY(${coords.openUp ? "6px" : "-6px"}) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
              .dt-day-cell {
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                font-size: 0.78rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.15s ease;
                border: none;
                background: transparent;
                margin: 0 auto;
              }
              .dt-day-cell:hover:not(.selected) {
                background: #f1f5f9;
                color: #0f172a;
                transform: scale(1.06);
              }
              .dt-day-cell.selected {
                background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%) !important;
                color: #ffffff !important;
                font-weight: 800 !important;
                box-shadow: 0 4px 10px rgba(79, 70, 229, 0.35) !important;
              }
              .dt-day-cell.today:not(.selected) {
                background: #eef2ff;
                color: #4f46e5;
                font-weight: 800;
                border: 1.5px solid #6366f1;
              }
              .dt-day-cell.overflow {
                color: #cbd5e1;
                font-weight: 500;
              }
              .time-pill-btn {
                padding: 5px 8px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                background: #f8fafc;
                font-size: 0.76rem;
                font-weight: 600;
                color: #334155;
                cursor: pointer;
                transition: all 0.15s;
                text-align: center;
              }
              .time-pill-btn:hover {
                background: #eef2ff;
                border-color: #c7d2fe;
                color: #4f46e5;
              }
              .time-pill-btn.active {
                background: #4f46e5 !important;
                border-color: #4f46e5 !important;
                color: #ffffff !important;
                font-weight: 700 !important;
                box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3) !important;
              }
            `}</style>

            <div style={{ display: "grid", gridTemplateColumns: "246px 1fr", gap: 16 }}>
              {/* Left Column: Calendar Date */}
              <div style={{ borderRight: "1px solid #f1f5f9", paddingRight: 14 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0f172a" }}>
                    {MONTH_NAMES[selectedMonth]} {selectedYear}
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedMonth === 0) {
                          setSelectedMonth(11);
                          setSelectedYear(selectedYear - 1);
                        } else {
                          setSelectedMonth(selectedMonth - 1);
                        }
                      }}
                      style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#0f172a", padding: 0 }}
                      onMouseOver={(e) => { e.currentTarget.style.background = "#eef2ff"; e.currentTarget.style.borderColor = "#818cf8"; e.currentTarget.style.color = "#4f46e5"; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#0f172a"; }}
                    >
                      <ChevronLeft size={16} color="currentColor" strokeWidth={2.6} style={{ display: "block", pointerEvents: "none" }} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedMonth === 11) {
                          setSelectedMonth(0);
                          setSelectedYear(selectedYear + 1);
                        } else {
                          setSelectedMonth(selectedMonth + 1);
                        }
                      }}
                      style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#0f172a", padding: 0 }}
                      onMouseOver={(e) => { e.currentTarget.style.background = "#eef2ff"; e.currentTarget.style.borderColor = "#818cf8"; e.currentTarget.style.color = "#4f46e5"; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#0f172a"; }}
                    >
                      <ChevronRight size={16} color="currentColor" strokeWidth={2.6} style={{ display: "block", pointerEvents: "none" }} />
                    </button>
                  </div>
                </div>

                {/* Days of week */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
                  {DAYS_SHORT.map((d) => (
                    <div key={d} style={{ textAlign: "center", fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{d}</div>
                  ))}
                </div>

                {/* Days matrix */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px 2px" }}>
                  {calendarDays.map((item, idx) => {
                    const sel = isSelected(item.year, item.month, item.day);
                    const tod = isToday(item.year, item.month, item.day);
                    return (
                      <button
                        key={`${item.year}-${item.month}-${item.day}-${idx}`}
                        type="button"
                        onClick={() => handleDateClick(item.year, item.month, item.day)}
                        className={`dt-day-cell ${sel ? "selected" : ""} ${tod ? "today" : ""} ${!item.isCurrentMonth ? "overflow" : ""}`}
                      >
                        {item.day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Time Selection */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    <Clock size={13} color="#4f46e5" /> Time
                  </div>

                  {/* Hour : Minute : AM/PM selector */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
                    {/* Hour dropdown */}
                    <select
                      value={timeState.hour}
                      onChange={(e) => {
                        const nt = { ...timeState, hour: e.target.value };
                        setTimeState(nt);
                        emitDateTime(selectedYear, selectedMonth, selectedDay, nt);
                      }}
                      style={{ flex: 1, minWidth: 44, padding: "5px 2px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", outline: "none", textAlign: "center" }}
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>

                    <span style={{ fontWeight: 800, color: "#64748b" }}>:</span>

                    {/* Minute dropdown */}
                    <select
                      value={timeState.minute}
                      onChange={(e) => {
                        const nt = { ...timeState, minute: e.target.value };
                        setTimeState(nt);
                        emitDateTime(selectedYear, selectedMonth, selectedDay, nt);
                      }}
                      style={{ flex: 1, minWidth: 44, padding: "5px 2px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", outline: "none", textAlign: "center" }}
                    >
                      {["00", "15", "30", "45"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    {/* AM / PM toggle */}
                    <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 2, border: "1px solid #e2e8f0", flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => {
                          const nt = { ...timeState, ampm: "AM" };
                          setTimeState(nt);
                          emitDateTime(selectedYear, selectedMonth, selectedDay, nt);
                        }}
                        style={{ padding: "4px 7px", minWidth: 26, border: "none", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", background: timeState.ampm === "AM" ? "#4f46e5" : "transparent", color: timeState.ampm === "AM" ? "#fff" : "#64748b" }}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nt = { ...timeState, ampm: "PM" };
                          setTimeState(nt);
                          emitDateTime(selectedYear, selectedMonth, selectedDay, nt);
                        }}
                        style={{ padding: "4px 7px", minWidth: 26, border: "none", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", background: timeState.ampm === "PM" ? "#4f46e5" : "transparent", color: timeState.ampm === "PM" ? "#fff" : "#64748b" }}
                      >
                        PM
                      </button>
                    </div>
                  </div>

                  {/* Quick Preset Time Slots */}
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Quick Slots</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                    {QUICK_TIMES.slice(0, 6).map((qTime) => (
                      <button
                        key={qTime}
                        type="button"
                        onClick={() => handleQuickTimeClick(qTime)}
                        className="time-pill-btn"
                      >
                        {qTime}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer Controls */}
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={handleClear}
                    style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#ffffff", color: "#64748b", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyAndClose}
                    style={{ flex: 1.5, padding: "7px 12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "#ffffff", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, boxShadow: "0 2px 6px rgba(79, 70, 229, 0.3)" }}
                  >
                    <Check size={13} /> Done
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
