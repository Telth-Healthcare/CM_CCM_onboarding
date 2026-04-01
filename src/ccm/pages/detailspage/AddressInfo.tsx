// src/ccm/pages/detailspage/AddressInfo.tsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import { StepProps } from "./types";

const PINCODE_BASE = "https://api.postalpincode.in/pincode";

interface EditableDropdownProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;       // select-only — shows dropdown but input not typeable
  error?: boolean;
  hint?: string;
  onAfterPick?: () => void; // called after selection, e.g. to move cursor
}

const EditableDropdown: React.FC<EditableDropdownProps> = ({
  id, value, onChange, options, placeholder,
  disabled, readOnly, error, hint, onAfterPick,
}) => {
  const [open, setOpen]     = useState(false);
  const [filter, setFilter] = useState("");
  const inputRef            = useRef<HTMLInputElement>(null);
  const wrapRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayed = filter
    ? options.filter(o => o.toLowerCase().includes(filter.toLowerCase()))
    : options;

  const pick = (opt: string) => {
    onChange(opt);
    setFilter("");
    setOpen(false);
    // For editable inputs: place cursor at start so user can type door no. first
    if (!readOnly && inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => inputRef.current?.setSelectionRange(0, 0), 0);
    }
    onAfterPick?.();
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Input
          ref={inputRef}
          type="text"
          id={id}
          name={id}
          value={readOnly ? value : (open && filter !== "" ? filter : value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          error={error}
          hint={hint}
          autoComplete="off"
          style={{ paddingRight: 32, cursor: readOnly ? "pointer" : "text" }}
          onChange={e => {
            if (readOnly) return;
            setFilter(e.target.value);
            onChange(e.target.value);   // keep formData in sync while typing
            setOpen(true);
          }}
          onFocus={() => { if (options.length > 0) setOpen(true); }}
        />

        {/* Chevron — only shown when options are available */}
        {options.length > 0 && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={e => {
              e.preventDefault();       // prevent input blur
              setOpen(o => !o);
            }}
            style={{
              position: "absolute", right: 8, top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              padding: 4, color: "var(--color-text-secondary)",
              display: "flex", alignItems: "center",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2">
              <path d={open ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown list — z-index 50 keeps it above sibling inputs */}
      {open && displayed.length > 0 && (
        <ul style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "white",
          border: "0.5px solid var(--color-border-secondary)",
          borderRadius: "var(--border-radius-md)",
          maxHeight: 190, overflowY: "auto",
          zIndex: 50,                   // above other inputs, no overlap issues
          margin: 0, padding: "4px 0", listStyle: "none",
          boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
        }}>
          {displayed.map((opt, i) => (
            <li
              key={i}
              onMouseDown={e => { e.preventDefault(); pick(opt); }}  // mouseDown before blur
              style={{
                padding: "9px 12px",
                fontSize: 13,
                color: "var(--color-text-primary)",
                cursor: "pointer",
                borderBottom: i < displayed.length - 1
                  ? "0.5px solid var(--color-border-tertiary)" : "none",
                display: "flex", alignItems: "center", gap: 8,
                background: value === opt
                  ? "var(--color-background-secondary)" : "transparent",
              }}
              onMouseEnter={e =>
                (e.currentTarget.style.background = "var(--color-background-secondary)")
              }
              onMouseLeave={e =>
                (e.currentTarget.style.background =
                  value === opt ? "var(--color-background-secondary)" : "transparent")
              }
            >
              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>›</span>
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const AddressInfo: React.FC<StepProps> = ({ formData, updateFormData, errors }) => {
  if (!formData) return null;

  const [fetching,    setFetching]    = useState(false);
  const [pinError,    setPinError]    = useState("");
  const [areaCount,   setAreaCount]   = useState(0);
  const [postOffices, setPostOffices] = useState<string[]>([]);  // Name → addr1 options
  const [blocks,      setBlocks]      = useState<string[]>([]);  // Block → addr2 options

  const handlePincodeChange = async (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    updateFormData("zipcode", digits);

    if (digits.length < 6) {
      updateFormData("state", "");
      updateFormData("city", "");
      updateFormData("addressLine1", "");
      updateFormData("addressLine2", "");
      setPostOffices([]); setBlocks([]);
      setPinError(""); setAreaCount(0);
      return;
    }

    setFetching(true); setPinError("");
    try {
      const res  = await axios.get(`${PINCODE_BASE}/${digits}`);
      const data = res.data?.[0];

      if (data?.Status !== "Success" || !data.PostOffice?.length) {
        setPinError("Invalid pincode — no results found");
        updateFormData("state", ""); updateFormData("city", "");
        setPostOffices([]); setBlocks([]); setAreaCount(0);
        return;
      }

      const pos: any[] = data.PostOffice;
      updateFormData("state", pos[0].State);
      updateFormData("city",  pos[0].District);   // backend field = district

      const names  = [...new Set(pos.map((p: any) => p.Name).filter(Boolean))]   as string[];
      const bks    = [...new Set(pos.map((p: any) => p.Block).filter(Boolean))]  as string[];
      setPostOffices(names); setBlocks(bks); setAreaCount(pos.length);
    } catch {
      setPinError("Failed to fetch. Check your connection.");
    } finally {
      setFetching(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">
        Address Information
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Enter your pincode first — state, district and area options will load automatically
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Pincode */}
        <div>
          <Label htmlFor="zipcode">
            Pincode <span className="text-red-500">*</span>
          </Label>
          <div style={{ position: "relative" }}>
            <Input
              type="text" id="zipcode" name="zipcode"
              placeholder="6-digit PIN code"
              value={formData.zipcode}
              inputMode="numeric"
              onChange={e => handlePincodeChange(e.target.value)}
              error={!!errors?.zipcode || !!pinError}
              hint={pinError || errors?.zipcode}
            />
            {fetching && (
              <span style={{
                position: "absolute", right: 10, top: "50%",
                transform: "translateY(-50%)",
                width: 14, height: 14,
                border: "2px solid var(--color-border-tertiary)",
                borderTopColor: "#378add",
                borderRadius: "50%",
                display: "inline-block",
                animation: "ccm-spin .7s linear infinite",
              }} />
            )}
          </div>
          {/* Found badge */}
          {areaCount > 0 && !fetching && (
            <p style={{
              marginTop: 5, fontSize: 11, fontWeight: 500,
              color: "#0f6e56",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" />
              </svg>
              {areaCount} areas found
            </p>
          )}
        </div>

        {/* Country — locked */}
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            type="text" id="country" name="country"
            value="India" disabled
            className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
          />
        </div>

        {/* Address Line 1 — editable + dropdown */}
        <div className="sm:col-span-2">
          <Label htmlFor="addressLine1">
            Address Line 1 <span className="text-red-500">*</span>
            {postOffices.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                — select area then add door no.
              </span>
            )}
          </Label>
          <EditableDropdown
            id="addressLine1"
            value={formData.addressLine1}
            onChange={val => updateFormData("addressLine1", val)}
            options={postOffices}
            placeholder={
              postOffices.length > 0
                ? "Select area or type door no., street…"
                : "Door No, Street Name"
            }
            error={!!errors?.addressLine1}
            hint={errors?.addressLine1}
          />
        </div>

        {/* Address Line 2 — select-only dropdown (Block) */}
        <div className="sm:col-span-2">
          <Label htmlFor="addressLine2">
            Address Line 2
            {blocks.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                — block / taluk area
              </span>
            )}
          </Label>
          <EditableDropdown
            id="addressLine2"
            value={formData.addressLine2}
            onChange={val => updateFormData("addressLine2", val)}
            options={blocks}
            readOnly={blocks.length > 0}   // select-only once options load
            disabled={blocks.length === 0}
            placeholder={
              blocks.length > 0
                ? "Select block / taluk area"
                : "Auto-filled after pincode"
            }
          />
        </div>

        {/* State — auto-filled */}
        <div>
          <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
          <Input
            type="text" id="state" name="state"
            placeholder="Auto-filled from pincode"
            value={formData.state} disabled
            className={`cursor-not-allowed ${
              formData.state
                ? "bg-green-50 dark:bg-green-900/20 text-green-800"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
            error={!!errors?.state}
            hint={errors?.state}
          />
        </div>

        {/* City/District — auto-filled */}
        <div>
          <Label htmlFor="city">City / District <span className="text-red-500">*</span></Label>
          <Input
            type="text" id="city" name="city"
            placeholder="Auto-filled from pincode"
            value={formData.city} disabled
            className={`cursor-not-allowed ${
              formData.city
                ? "bg-green-50 dark:bg-green-900/20 text-green-800"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
            error={!!errors?.city}
            hint={errors?.city}
          />
        </div>

      </div>

      <style>{`@keyframes ccm-spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  );
};

export default AddressInfo;