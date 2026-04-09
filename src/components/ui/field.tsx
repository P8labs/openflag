import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type BaseProps = {
  className?: string;
};

export function UiInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & BaseProps) {
  const nextClassName = ["ui-input", className].filter(Boolean).join(" ");

  return <input className={nextClassName} {...props} />;
}

export function UiTextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & BaseProps) {
  const nextClassName = ["ui-input ui-textarea", className]
    .filter(Boolean)
    .join(" ");

  return <textarea className={nextClassName} {...props} />;
}

export function UiSelect({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & BaseProps) {
  const nextClassName = ["ui-input", className].filter(Boolean).join(" ");

  return <select className={nextClassName} {...props} />;
}
