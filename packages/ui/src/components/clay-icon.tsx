import * as React from "react";
import { cn } from "../lib/utils";

type ClaySize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type ClayColor =
  | "yellow"
  | "sky"
  | "green"
  | "red"
  | "orange"
  | "teal"
  | "purple"
  | "pink"
  | "navy"
  | "black"
  | "white";

interface ClayIconProps extends React.ComponentProps<"div"> {
  size?: ClaySize;
  color?: ClayColor;
  children?: React.ReactNode;
}

const sizeClasses: Record<ClaySize, string> = {
  xs: "w-7 h-7",
  sm: "w-9 h-9",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-[88px] h-[88px]",
  "2xl": "w-28 h-28",
};

const iconSizeClasses: Record<ClaySize, string> = {
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  md: "w-7 h-7",
  lg: "w-9 h-9",
  xl: "w-12 h-12",
  "2xl": "w-16 h-16",
};

const roundingClasses: Record<ClaySize, string> = {
  xs: "rounded-lg",
  sm: "rounded-xl",
  md: "rounded-2xl",
  lg: "rounded-[22px]",
  xl: "rounded-[26px]",
  "2xl": "rounded-[30px]",
};

function ClayIcon({ size = "md", color = "yellow", className, children, ...props }: ClayIconProps) {
  return (
    <div
      className={cn(
        "clay-icon inline-flex items-center justify-center relative flex-shrink-0",
        `clay-${color}`,
        sizeClasses[size],
        roundingClasses[size],
        className,
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === "img") {
          return React.cloneElement(child as React.ReactElement<React.ImgHTMLAttributes<HTMLImageElement>>, {
            className: cn(
              iconSizeClasses[size],
              "object-contain relative z-[2] drop-shadow-[0_1px_2px_rgba(0,0,0,0.28)]",
              (child as React.ReactElement<React.ImgHTMLAttributes<HTMLImageElement>>).props.className,
            ),
          });
        }
        return child;
      })}
    </div>
  );
}

function ClayIconCSS() {
  return null;
}

export { ClayIcon, ClayIconCSS };
export type { ClaySize, ClayColor, ClayIconProps };
