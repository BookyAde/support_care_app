import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export const fieldInputClasses =
  "w-full border border-black/15 rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal transition";
const labelClasses = "block text-[13px] font-bold mb-1.5";

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className={labelClasses}>
      {label}
      {required && <span className="text-brick"> *</span>}
    </label>
  );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function TextField({ label, required, className = "", ...props }: TextFieldProps) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <input required={required} className={`${fieldInputClasses} ${className}`} {...props} />
    </div>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string };

export function TextAreaField({ label, required, className = "", ...props }: TextAreaFieldProps) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <textarea required={required} className={`${fieldInputClasses} ${className}`} {...props} />
    </div>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string };

export function SelectField({ label, required, className = "", children, ...props }: SelectFieldProps) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <select required={required} className={`${fieldInputClasses} ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}
