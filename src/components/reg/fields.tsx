import type { ReactNode } from "react";
import { useId, useState } from "react";

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
  label?: ReactNode;
  required?: boolean;
  info?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  span?: 4 | 8 | 12;
}) {
  return (
    <div className={`fcol fcol-${span}`}>
      {label ? (
        <label className="ctrl-label" htmlFor={htmlFor}>
          {label} {required ? <span className="req">*</span> : null}
          {info ? (
            <span className="info-i" title={info} aria-label={info}>
              i
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? <p className="err-msg">{error}</p> : null}
    </div>
  );
}

type BaseInput = {
  label?: string;
  required?: boolean;
  info?: string;
  error?: string;
  span?: 4 | 8 | 12;
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
  placeholder?: string;
  type?: string;
  maxLength?: number;
  inputMode?: "text" | "numeric" | "tel" | "email";
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
}: BaseInput & {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  withPlaceholder?: boolean;
}) {
  const id = useId();
  return (
    <Field label={label} required={required} info={info} error={error} htmlFor={id} span={span}>
      <select id={id} className={`form-ctrl${error ? " is-invalid" : ""}`} value={value} onChange={(e) => onChange(e.target.value)}>
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
}: BaseInput & {
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const shown = q ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : options;

  const toggle = (o: string) => {
    if (value.includes(o)) onChange(value.filter((v) => v !== o));
    else if (!max || value.length < max) onChange([...value, o]);
  };

  return (
    <Field label={label} required={required} error={error} span={span}>
      <div className="ms">
        <button type="button" className={`form-ctrl ms-btn${error ? " is-invalid" : ""}`} onClick={() => setOpen((v) => !v)}>
          <span className="ms-btn-text">{value.length ? value.join(", ") : "None selected"}</span>
          <span className="caret" aria-hidden />
        </button>
        {open ? (
          <div className="ms-menu">
            {searchable ? (
              <input className="form-ctrl ms-search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
            ) : null}
            <ul>
              {shown.map((o) => (
                <li key={o}>
                  <label>
                    <input type="checkbox" checked={value.includes(o)} onChange={() => toggle(o)} />
                    <span>{o}</span>
                  </label>
                </li>
              ))}
              {shown.length === 0 ? <li className="ms-empty">No results</li> : null}
            </ul>
          </div>
        ) : null}
      </div>
    </Field>
  );
}

export function FileField({
  label,
  required,
  error,
  span,
  value,
  onChange,
}: BaseInput & { value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <Field label={label} required={required} error={error} span={span}>
      <div className="file-input">
        <input className={`form-ctrl file-name${error ? " is-invalid" : ""}`} readOnly value={value} placeholder="" />
        <label className="file-btn" htmlFor={id}>
          Browse
        </label>
        <input
          id={id}
          type="file"
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")}
        />
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
}: BaseInput & { value: string; onChange: (v: string) => void; placeholder?: string }) {
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
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  );
}
