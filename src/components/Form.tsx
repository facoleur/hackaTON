import type { FieldError, FieldErrorsImpl, Merge } from "react-hook-form";

type AnyFieldError =
  | FieldError
  // @ts-ignore
  | Merge<FieldError, FieldErrorsImpl<unknown>>
  | undefined;

function FormSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card space-y-2 rounded-xl p-2">
      <div className="rounded-xl">{children}</div>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: AnyFieldError;
  children: React.ReactNode;
}) {
  return (
    <label className="text-foreground mb-1 flex h-full w-full flex-row items-center justify-between border-b border-slate-300 text-sm font-medium last:border-0">
      {label}
      <div className="w-3/5">{children}</div>
      {error && (
        <p className="text-destructive mt-1 text-xs">{error.message}</p>
      )}
    </label>
  );
}

export { FormField, FormSection };
