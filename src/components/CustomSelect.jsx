import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X } from "lucide-react";
import "./CustomSelect.css";

const extractOptionsFromChildren = (children) => {
  const extracted = [];
  
  const processChild = (child) => {
    if (!child) return;
    
    if (Array.isArray(child)) {
      child.forEach(processChild);
      return;
    }
    
    if (!React.isValidElement(child)) return;
    
    if (child.type === React.Fragment) {
      if (child.props && child.props.children) {
        React.Children.forEach(child.props.children, processChild);
      }
      return;
    }
    
    if (child.type === 'option') {
      extracted.push({
        label: child.props.children,
        value: child.props.value !== undefined ? child.props.value : child.props.children
      });
    } else if (child.type === 'optgroup') {
      const groupOptions = [];
      const processGroupChild = (optChild) => {
        if (!optChild) return;
        if (Array.isArray(optChild)) {
          optChild.forEach(processGroupChild);
          return;
        }
        if (React.isValidElement(optChild) && optChild.type === 'option') {
          groupOptions.push({
            label: optChild.props.children,
            value: optChild.props.value !== undefined ? optChild.props.value : optChild.props.children
          });
        } else if (React.isValidElement(optChild) && optChild.type === React.Fragment) {
            if (optChild.props && optChild.props.children) {
                React.Children.forEach(optChild.props.children, processGroupChild);
            }
        }
      };
      
      React.Children.forEach(child.props.children, processGroupChild);
      
      if (groupOptions.length > 0) {
        extracted.push({
          groupLabel: child.props.label,
          options: groupOptions
        });
      }
    }
  };
  
  React.Children.forEach(children, processChild);
  return extracted;
};

/**
 * CustomSelect
 * 
 * @param {Array} options - Array of objects { label, value } or array of strings.
 * @param {ReactNode} children - Support for native <option> and <optgroup> passing.
 * @param {String|Number} value - The currently selected value.
 * @param {Function} onChange - Callback receiving the new value, or event object mimicking native select (e.target.value).
 * @param {String} placeholder - Text when nothing is selected.
 * @param {Boolean} disabled - If true, select is disabled.
 * @param {Boolean} searchable - If true, displays search input inside dropdown (default: true).
 * @param {Object} style - Optional inline styles for the container.
 * @param {String} className - Optional classes.
 * @param {String} id - Optional id.
 * @param {Boolean} required - Required form field flag.
 */
export default function CustomSelect({
  options = [],
  children,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  searchable = true,
  style = {},
  className = "",
  id,
  required = false,
  ...rest
}) {
  const containerStyleProps = ['width', 'minWidth', 'maxWidth', 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'display', 'gridColumn', 'gridRow', 'position', 'top', 'left', 'right', 'bottom'];
  const containerStyles = {};
  const triggerStyles = {};
  
  if (style) {
    Object.keys(style).forEach(key => {
      if (containerStyleProps.includes(key) || key.startsWith('--')) {
        containerStyles[key] = style[key];
      } else {
        triggerStyles[key] = style[key];
      }
    });
  }
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  
  const normalizedOptions = useMemo(() => {
    let opts = [];
    if (children) {
      opts = extractOptionsFromChildren(children);
    } else if (options && options.length > 0) {
      opts = options.map(opt => {
        if (typeof opt === "string" || typeof opt === "number") {
          return { label: opt, value: opt };
        }
        return opt;
      });
    }
    return opts;
  }, [options, children]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.reduce((acc, opt) => {
      if (opt.groupLabel) {
        const matchingSubs = (opt.options || []).filter(sub => {
          const l = typeof sub.label === "string" ? sub.label : String(sub.label || "");
          const v = String(sub.value || "");
          return l.toLowerCase().includes(q) || v.toLowerCase().includes(q);
        });
        if (matchingSubs.length > 0) {
          acc.push({ ...opt, options: matchingSubs });
        }
      } else {
        const l = typeof opt.label === "string" ? opt.label : String(opt.label || "");
        const v = String(opt.value || "");
        if (l.toLowerCase().includes(q) || v.toLowerCase().includes(q)) {
          acc.push(opt);
        }
      }
      return acc;
    }, []);
  }, [normalizedOptions, searchQuery]);

  const findSelectedOption = () => {
    for (const opt of normalizedOptions) {
      if (opt.groupLabel) {
        const found = opt.options.find(o => o.value == value); // loose equality for string/number mixing
        if (found) return found;
      } else {
        if (opt.value == value) return opt;
      }
    }
    return null;
  };

  const selectedOption = findSelectedOption();

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

  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 220;
    const shouldOpenUpward = spaceBelow < 150 && rect.top > dropdownHeight;

    if (shouldOpenUpward) {
      setDropdownStyle({
        position: "fixed",
        bottom: `${Math.max(8, window.innerHeight - rect.top + 4)}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        transformOrigin: "bottom center"
      });
    } else {
      setDropdownStyle({
        position: "fixed",
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        transformOrigin: "top center"
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
    }
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const handleSelect = (val) => {
    setIsOpen(false);
    if (onChange) {
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
          style={{ transformOrigin: dropdownStyle.transformOrigin }}
        >
          {searchable && normalizedOptions.length > 2 && (
            <div 
              className="custom-select-search-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="custom-select-search-wrapper">
                <Search size={14} className="custom-select-search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsOpen(false);
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      const firstOpt = filteredOptions[0];
                      if (firstOpt) {
                        if (firstOpt.groupLabel && firstOpt.options?.length > 0) {
                          handleSelect(firstOpt.options[0].value);
                        } else if (firstOpt.value !== undefined) {
                          handleSelect(firstOpt.value);
                        }
                      }
                    }
                  }}
                  className="custom-select-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="custom-select-search-clear"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="custom-select-option" style={{ color: "#94a3b8", justifyContent: "center", padding: "12px 8px", fontSize: "12px" }}>
              {searchQuery ? "No matching options found" : "No options"}
            </div>
          ) : (
            filteredOptions.map((opt, i) => {
              if (opt.groupLabel) {
                return (
                  <div key={`group-${i}`}>
                    <div className="custom-select-optgroup-label">{opt.groupLabel}</div>
                    {opt.options.map((subOpt, j) => {
                      const isSelected = subOpt.value == value;
                      return (
                        <div
                          key={`${subOpt.value}-${j}`}
                          className={`custom-select-option ${isSelected ? "selected" : ""}`}
                          onClick={() => handleSelect(subOpt.value)}
                        >
                          <span>{subOpt.label}</span>
                          {isSelected && <Check size={14} className="custom-select-option-check" />}
                        </div>
                      );
                    })}
                  </div>
                );
              } else {
                const isSelected = opt.value == value;
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
              }
            })
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div 
      className={`custom-select-container ${className}`} 
      ref={containerRef}
      style={containerStyles}
      id={id}
      {...rest}
    >
      <div 
        className={`custom-select-trigger ${isOpen ? "custom-select-open" : ""} ${disabled ? "custom-select-disabled" : ""}`}
        style={triggerStyles}
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
      
      <input 
        type="hidden" 
        value={value ?? ""} 
        required={required} 
      />
      
      {renderDropdown()}
    </div>
  );
}
