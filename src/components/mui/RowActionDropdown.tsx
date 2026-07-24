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

  // Calculate dropdown position relative to viewport
  const recalcPosition = useCallback(() => {
    if (!btnRef.current) return;

    const rect = btnRef.current.getBoundingClientRect();

    setCoords({
      top: rect.bottom + 4,
      left: rect.left,
    });
  }, []);

  const handleToggle = () => {
    if (!open) {
      recalcPosition();
    }

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

    return () => {
      document.removeEventListener("mousedown", handler);
    };
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
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              zIndex: 9999,
            }}
          >
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick();
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-2.5 text-sm text-left border-b last:border-b-0 border-indigo-100 dark:border-slate-700 bg-gray-300 text-gray-800 dark:text-gray-100 hover:bg-indigo-600
                               hover:text-white transition-all duration-150 ${action.className ?? ""}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default RowActionDropdown;
