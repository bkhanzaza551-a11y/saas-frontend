import React, { useRef, useMemo, useEffect } from "react";

export default function DigitOtpInput({
  value = "",
  onChange,
  length = 6,
  autoFocus = true,
  disabled = false,
  error = false,
  brandColor = "#0f766e"
}) {
  const inputRefs = useRef([]);

  const digits = useMemo(() => {
    const arr = (value || "").split("");
    while (arr.length < length) arr.push("");
    return arr.slice(0, length);
  }, [value, length]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (e, index) => {
    if (disabled) return;
    const rawVal = e.target.value;
    const cleanDigits = rawVal.replace(/\D/g, "");

    if (!cleanDigits) {
      // Cleared the input
      const nextDigits = [...digits];
      nextDigits[index] = "";
      onChange(nextDigits.join(""));
      return;
    }

    if (cleanDigits.length > 1) {
      // Multiple digits entered (e.g. pasted or mobile autocomplete)
      const pasted = cleanDigits.slice(0, length);
      onChange(pasted);
      const nextFocus = Math.min(pasted.length, length - 1);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleanDigits;
    const nextVal = nextDigits.join("");
    onChange(nextVal);

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (disabled) return;
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const nextDigits = [...digits];
        nextDigits[index - 1] = "";
        onChange(nextDigits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    if (disabled) return;
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        margin: "0 auto",
        maxWidth: "360px"
      }}
      onPaste={handlePaste}
    >
      {Array.from({ length }).map((_, i) => {
        const isFilled = Boolean(digits[i]);
        return (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[i] || ""}
            disabled={disabled}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            style={{
              width: "48px",
              height: "54px",
              minHeight: "54px",
              textAlign: "center",
              fontSize: "22px",
              fontWeight: "800",
              color: "#0f172a",
              backgroundColor: isFilled ? "#f0fdfa" : "#f8fafc",
              border: error
                ? "2px solid #ef4444"
                : isFilled
                ? `2px solid ${brandColor}`
                : "1.5px solid #cbd5e1",
              borderRadius: "12px",
              outline: "none",
              boxShadow: isFilled ? `0 2px 8px rgba(15, 118, 110, 0.12)` : "none",
              transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
              boxSizing: "border-box",
              cursor: disabled ? "not-allowed" : "text"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = brandColor;
              e.target.style.backgroundColor = "#ffffff";
              e.target.style.boxShadow = `0 0 0 3px rgba(15, 118, 110, 0.18)`;
              e.target.select();
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error
                ? "#ef4444"
                : isFilled
                ? brandColor
                : "#cbd5e1";
              e.target.style.backgroundColor = isFilled ? "#f0fdfa" : "#f8fafc";
              e.target.style.boxShadow = isFilled ? `0 2px 8px rgba(15, 118, 110, 0.12)` : "none";
            }}
          />
        );
      })}
    </div>
  );
}
