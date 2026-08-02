import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import "./CustomSelect.css";

/**
 * CustomSelect
 * 
 * @param {Array} options - Array of objects { label, value } or array of strings.
 * @param {String|Number} value - The currently selected value.
 * @param {Function} onChange - Callback receiving the new value, or event object mimicking native select (e.target.value).
 * @param {String} placeholder - Text when nothing is selected.
 * @param {Boolean} disabled - If true, select is disabled.
 * @param {Object} style - Optional inline styles for the container.
 * @param {Boolean} required - Required form field flag.
 */
export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  style = {},
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // Normalize options to { label, value }
  const normalizedOptions = options.map(opt => {
    if (typeof opt === "string" || typeof opt === "number") {
      return { label: opt, value: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  // Update dropdown position on open or window resize/scroll
  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width
    });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true); // true to catch scroll in scrollable containers
    }
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const handleSelect = (val) => {
    setIsOpen(false);
    if (onChange) {
      // Mimic standard native event object to support e.target.value pattern
      onChange({ target: { value: val } });
    }
  };

  const renderDropdown = () => {
    if (!isOpen) return null;

    return createPortal(
      <div 
        className="custom-select-portal"
        style={{ ...dropdownStyle }}
      >
        <div 
          ref={dropdownRef}
          className={`custom-select-dropdown ${isOpen ? "open" : ""}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="custom-select-option" style={{ color: "#94a3b8", justifyContent: "center" }}>
              No options
            </div>
          ) : (
            normalizedOptions.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={`${opt.value}-${i}`}
                  className={`custom-select-option ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={14} className="custom-select-option-check" />}
                </div>
              );
            })
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div 
      className="custom-select-container" 
      ref={containerRef}
      style={style}
    >
      <div 
        className={`custom-select-trigger ${isOpen ? "custom-select-open" : ""} ${disabled ? "custom-select-disabled" : ""}`}
        onClick={toggleOpen}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleOpen();
          }
        }}
      >
        <div className={selectedOption ? "custom-select-value" : "custom-select-placeholder"}>
          {selectedOption ? selectedOption.label : placeholder}
        </div>
        <ChevronDown size={16} className={`custom-select-icon ${isOpen ? "open" : ""}`} />
      </div>
      
      {/* Hidden input for form submission & native 'required' validation if wrapped in a <form> */}
      <input 
        type="hidden" 
        value={value ?? ""} 
        required={required} 
      />
      
      {renderDropdown()}
    </div>
  );
}
