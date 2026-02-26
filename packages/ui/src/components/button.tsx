import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-xl text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-[#F5C518]/40 relative border-[2.5px]",
  {
    variants: {
      variant: {
        // Primary button: Yellow background, black text, bold border, offset shadow
        default: `
          bg-[#F5C518] text-[#0A0A0A] border-[#0A0A0A]
          hover:bg-[#FFE040] hover:shadow-[8px_8px_0px_#0A0A0A]
          active:translate-x-[2px] active:translate-y-[2px] active:shadow-[3px_3px_0px_#0A0A0A]
          shadow-[5px_5px_0px_#0A0A0A]
          transition-[transform,box-shadow] duration-[150ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]
        `,
        // Secondary button: White background, black text, bold border, offset shadow  
        secondary: `
          bg-white text-[#0A0A0A] border-[#0A0A0A]
          hover:bg-[#F4F4F4] hover:shadow-[8px_8px_0px_#0A0A0A]
          active:translate-x-[2px] active:translate-y-[2px] active:shadow-[3px_3px_0px_#0A0A0A]
          shadow-[5px_5px_0px_#0A0A0A]
          transition-[transform,box-shadow] duration-[150ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]
        `,
        // Destructive: Red background, white text, bold border, offset shadow
        destructive: `
          bg-[#E63830] text-white border-[#0A0A0A]
          hover:bg-[#CC2B24] hover:shadow-[8px_8px_0px_#0A0A0A]
          active:translate-x-[2px] active:translate-y-[2px] active:shadow-[3px_3px_0px_#0A0A0A]
          shadow-[5px_5px_0px_#0A0A0A]
          transition-[transform,box-shadow] duration-[150ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]
        `,
        // Outline: Transparent background, black border
        outline: `
          bg-transparent text-[#0A0A0A] border-[#0A0A0A]
          hover:bg-[#F4F4F4]
          active:bg-[#EBEBEB]
          transition-colors duration-150
        `,
        // Ghost: No border, no shadow, minimal styling
        ghost: `
          bg-transparent text-[#0A0A0A] border-transparent
          hover:bg-[#F4F4F4]
          active:bg-[#EBEBEB]
          transition-colors duration-150
        `,
        // Link: Just text, no background or border
        link: `
          text-[#0A0A0A] underline-offset-4 hover:underline border-transparent
          transition-colors duration-150
        `,
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-2xl px-8 py-4 text-base",
        icon: "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
