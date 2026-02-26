import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const badgeVariants = cva(
  // Base TripSlip badge styles - geometric with pill shape
  "inline-flex items-center justify-center gap-1 font-mono text-[11px] font-bold uppercase tracking-wider px-[11px] py-[3px] rounded-full border-2 w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 [&>svg]:pointer-events-none transition-colors",
  {
    variants: {
      variant: {
        // TripSlip brand badge - yellow
        yellow:
          "bg-tripslip-yellow border-black-true text-black-true",
        // Black badge - inverted
        black:
          "bg-black-true border-black-true text-tripslip-yellow",
        // Outline badge - transparent background
        outline:
          "bg-transparent border-black-true text-black-true",
        // Success/confirmed - green
        success:
          "bg-[#D9F5E8] border-accent-green text-[#005A28]",
        // Error/action needed - red
        error:
          "bg-[#FEEAE9] border-accent-red text-accent-red",
        // Archived/inactive - gray
        inactive:
          "bg-gray-100 border-gray-300 text-gray-500",
        // Default fallback
        default:
          "bg-gray-100 border-gray-300 text-foreground",
      },
    },
    defaultVariants: {
      variant: "yellow",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };