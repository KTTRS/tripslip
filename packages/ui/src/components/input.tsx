import * as React from "react";

import { cn } from "../lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full min-w-0 rounded-lg border-[2.5px] border-[#0A0A0A] px-5 py-3 text-base bg-white transition-all outline-none placeholder:text-[#C8C8C8] text-[#0A0A0A] font-medium",
        "focus:border-[#F5C518] focus:ring-4 focus:ring-[#F5C518]/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F4F4F4]",
        "aria-invalid:border-[#E63830] aria-invalid:ring-[#E63830]/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
