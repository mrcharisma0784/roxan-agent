import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-11 w-full resize-none rounded-xl bg-transparent px-1 py-2.5 text-base text-fg outline-none placeholder:text-subtle disabled:opacity-40 md:text-sm",
          className,
        )}
        suppressHydrationWarning
        {...props}
      />
    );
  },
);

export { Textarea };
