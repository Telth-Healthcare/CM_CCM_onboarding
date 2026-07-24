import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export interface RowAction {
  label: string;
  onClick: () => void;
  className?: string;
}

interface RowActionDropdownProps {
  actions: RowAction[];
}

const RowActionDropdown: React.FC<RowActionDropdownProps> = ({ actions }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Recalculate position every time the dropdown opens
  const recalcPosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    
    // Get the width of the button to align dropdown properly
    // const buttonWidth = rect.width;
    
    setCoords({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
    });
  }, []);

  const handleToggle = () => {
    if (!open) recalcPosition();
    setOpen((prev) => !prev);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on scroll or resize
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
      >
        Actions
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ 
              top: coords.top, 
              left: coords.left,
              position: 'fixed',
              // absolute
            }}
            className="z-[9999]"
          >
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick();
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-sm text-left whitespace-nowrap hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    action.className ?? "text-gray-700 dark:text-gray-200"
                  }`}
                  style={{ minWidth: 'fit-content' }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default RowActionDropdown;