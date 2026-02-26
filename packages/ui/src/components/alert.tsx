import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const alertVariants = cva(
  // TripSlip geometric alert styles - bold borders and offset shadows
  "relative w-full rounded-lg border-[2.5px] px-5 py-4 text-sm flex items-start gap-3.5",
  {
    variants: {
      variant: {
        // Yellow - info/warning
        yellow: "bg-yellow-light border-yellow-warm text-black-true",
        // Green - success/confirmed
        success: "bg-[#D9F5E8] border-accent-green text-black-true",
        // Red - error/urgent
        error: "bg-[#FEEAE9] border-accent-red text-black-true",
        // Default - neutral
        default: "bg-gray-50 border-gray-300 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "text-[0.9rem] font-bold leading-tight mb-1",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-gray-700 leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };