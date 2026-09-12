import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl bg-bg-elevated px-3.5 text-sm text-fg shadow-border outline-none transition-[box-shadow] duration-[var(--motion-quick)] ease-[var(--ease-out)] placeholder:text-subtle hover:shadow-border-hover focus-visible:shadow-border-hover focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
