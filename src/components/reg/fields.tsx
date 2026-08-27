import type { ReactNode } from "react";
import { useId, useState, useEffect, useRef, useMemo } from "react";

export function Section({ title, variant = "sub", children }: { title: string; variant?: "main" | "sub"; children?: ReactNode }) {
  return (
    <>
      <div className={variant === "main" ? "sec-head sec-head--main" : "sec-head"}>
        <h2>{title}</h2>
      </div>
      {children ? <div className="sec-body">{children}</div> : null}
    </>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="frow">{children}</div>;
}

export function Field({
  label,
  required,
  info,
  error,
  htmlFor,
  children,
  span = 4,
}: {
  label?: ReactNode | undefined;
  required?: boolean | undefined;
  info?: string | undefined;
  error?: string | undefined;
  htmlFor?: string | undefined;
  children: ReactNode;
  span?: 4 | 8 | 12 | undefined;
}) {
  return (
    <div className={`fcol fcol-${span}`}>
      {label ? (
        <label className="ctrl-label" htmlFor={htmlFor}>
          {label} {required ? <span className="req">*</span> : null}
        </label>
      ) : null}
      {info ? (
        <p style={{ fontSize: "11px", color: "#b91c1c", marginTop: "-4px", marginBottom: "6px", fontWeight: 500 }}>
          {info}
        </p>
      ) : null}
      {children}
      {error ? <p className="err-msg">{error}</p> : null}
    </div>
  );
}

type BaseInput = {
  label?: string | undefined;
  required?: boolean | undefined;
  info?: string | undefined;
  error?: string | undefined;
  span?: 4 | 8 | 12 | undefined;
};

export function TextField({
  label,
  required,
  info,
  error,
  span,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  inputMode,
}: BaseInput & {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  type?: string | undefined;
  maxLength?: number | undefined;
  inputMode?: "text" | "numeric" | "tel" | "email" | undefined;
}) {
  const id = useId();
  return (
    <Field label={label} required={required} info={info} error={error} htmlFor={id} span={span}>
      <input
        id={id}
        className={`form-ctrl${error ? " is-invalid" : ""}`}
        type={type}
        value={value}
        maxLength={maxLength}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function SelectField({
  label,
  required,
  info,
  error,
  span,
  value,
  onChange,
  options,
  placeholder = "Select",
  withPlaceholder = true,
  disabled,
}: BaseInput & {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  withPlaceholder?: boolean;
  disabled?: boolean | undefined;
}) {
  const id = useId();
  return (
    <Field label={label} required={required} info={info} error={error} htmlFor={id} span={span}>
      <select
        id={id}
        className={`form-ctrl${error ? " is-invalid" : ""}`}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {withPlaceholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Field>
  );
}


export function RadioGroup({
  label,
  required,
  error,
  span,
  name,
  value,
  onChange,
  options,
}: BaseInput & {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <Field label={label} required={required} error={error} span={span}>
      <div className="radio-block">
        {options.map((o) => (
          <label key={o} className="radio-inline">
            <input type="radio" name={name} value={o} checked={value === o} onChange={() => onChange(o)} />
            <span>{o}</span>
          </label>
        ))}
      </div>
    </Field>
  );
}

export function MultiSelect({
  label,
  required,
  error,
  span,
  options,
  value,
  onChange,
  max,
  searchable,
  single,
}: BaseInput & {
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
  max?: number | undefined;
  searchable?: boolean | undefined;
  single?: boolean | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear query when menu opens/closes
  useEffect(() => {
    if (!open) {
      setQ("");
    }
  }, [open]);

  // Priority filtering: typed matches should rank matches starting with the typed query higher, followed by general inclusion.
  // Search matches only against the English part (text before the hyphen " - ") of each option.
  const shown = useMemo(() => {
    if (!q) return options;
    const query = q.toLowerCase();
    
    const startsWithMatches: string[] = [];
    const containsMatches: string[] = [];

    options.forEach((o) => {
      // Split by hyphen to isolate the English text
      const englishPart = o.split(" - ")[0] || "";
      const englishLower = englishPart.toLowerCase();
      
      if (englishLower.startsWith(query)) {
        startsWithMatches.push(o);
      } else if (englishLower.includes(query)) {
        containsMatches.push(o);
      }
    });

    return [...startsWithMatches, ...containsMatches];
  }, [q, options]);

  const toggle = (o: string) => {
    if (single) {
      onChange(value.includes(o) ? [] : [o]);
      setOpen(false);
      return;
    }
    if (value.includes(o)) onChange(value.filter((v) => v !== o));
    else if (!max || value.length < max) onChange([...value, o]);
  };

  return (
    <Field label={label} required={required} error={error} span={span}>
      <div className="ms" ref={containerRef}>
        <button type="button" className={`form-ctrl ms-btn${error ? " is-invalid" : ""}`} onClick={() => setOpen((v) => !v)}>
          <span className="ms-btn-text">{value.length ? value.join(", ") : "None selected"}</span>
          <span className="caret" aria-hidden />
        </button>
        {open ? (
          <div className="ms-menu">
            {searchable ? (
              <div className="ms-search-container" style={{ position: 'relative' }}>
                <input 
                  className="form-ctrl ms-search" 
                  placeholder="Search" 
                  value={q} 
                  onChange={(e) => setQ(e.target.value)} 
                  autoFocus
                />
                {q ? (
                  <button 
                    type="button" 
                    className="ms-clear-btn" 
                    onClick={() => setQ("")}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#999',
                      padding: '4px'
                    }}
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            ) : null}
            <ul>
              {shown.length > 0 ? (
                shown.map((o, idx) => (
                  <li key={`${o}-${idx}`}>
                    <label>
                      <input type={single ? "radio" : "checkbox"} checked={value.includes(o)} onChange={() => toggle(o)} />
                      <span>{o}</span>
                    </label>
                  </li>
                ))
              ) : (
                <li className="ms-empty">No results</li>
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </Field>
  );
}

import { supabase } from "@/integrations/supabase/client";

export function FileField({
  label,
  required,
  error,
  span,
  value,
  onChange,
  accept = "application/pdf",
  maxSizeMb = 1,
  hint = "PDF only, max 1 MB",
}: BaseInput & {
  value: string;
  onChange: (v: string) => void;
  accept?: string | undefined;
  maxSizeMb?: number | undefined;
  hint?: string | undefined;
}) {
  const id = useId();
  const [localError, setLocalError] = useState("");
  const [uploading, setUploading] = useState(false);
  const shownError = localError || error;

  const handle = async (file: File | undefined) => {
    if (!file) {
      setLocalError("");
      onChange("");
      return;
    }
    const acceptList = accept.split(",").map((a) => a.trim().toLowerCase());
    const ok = acceptList.some((a) =>
      a.startsWith(".") ? file.name.toLowerCase().endsWith(a) : a.endsWith("/*") ? file.type.startsWith(a.slice(0, -1)) : file.type === a,
    );
    if (!ok) {
      setLocalError(accept === "application/pdf" ? "Only PDF files are allowed" : "Invalid file type");
      onChange("");
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setLocalError(`File must be less than ${maxSizeMb} MB`);
      onChange("");
      return;
    }
    setLocalError("");
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const randomId = Math.random().toString(36).substring(2, 15);
      const safeName = file.name.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `${randomId}_${Date.now()}_${safeName}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("registrations")
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("registrations")
        .getPublicUrl(fileName);

      onChange(publicUrl);
    } catch (err: any) {
      console.error("Error uploading file:", err);
      setLocalError(err.message || "Failed to upload file");
      onChange("");
    } finally {
      setUploading(false);
    }
  };

  const getDisplayValue = () => {
    if (uploading) return "Uploading...";
    if (!value) return "";
    if (value.startsWith("http")) {
      const parts = value.split("/");
      const name = parts[parts.length - 1] || "";
      const cleanName = name.replace(/^[a-z0-9]+_\d+_/, "");
      return cleanName || "Uploaded File";
    }
    return value;
  };

  return (
    <Field label={label} required={required} error={shownError} span={span} info={hint}>
      <div className="file-input">
        <input className={`form-ctrl file-name${shownError ? " is-invalid" : ""}`} readOnly value={getDisplayValue()} placeholder="No file selected" />
        <label className={`file-btn${uploading ? " disabled" : ""}`} htmlFor={uploading ? undefined : id}>
          {uploading ? "..." : "Browse"}
        </label>
        {!uploading && <input id={id} type="file" accept={accept} className="sr-only" onChange={(e) => handle(e.target.files?.[0])} />}
      </div>
    </Field>
  );
}

export function DateField({
  label,
  required,
  error,
  span,
  value,
  onChange,
  placeholder,
  min,
  max,
}: BaseInput & { value: string; onChange: (v: string) => void; placeholder?: string | undefined; min?: string; max?: string }) {
  const id = useId();
  return (
    <Field label={label} required={required} error={error} htmlFor={id} span={span}>
      <div className="date-wrap">
        <input
          id={id}
          type="date"
          className={`form-ctrl${error ? " is-invalid" : ""}`}
          value={value}
          placeholder={placeholder}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  );
}
