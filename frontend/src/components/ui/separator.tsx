import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import "./Separator.css";

interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {}

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(({ className = "", orientation = "horizontal", decorative = true, ...props }, ref) => {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={`separator ${orientation === "vertical" ? "separator-vertical" : "separator-horizontal"} ${className}`}
      {...props}
    />
  );
});

Separator.displayName = "Separator";

export { Separator };
