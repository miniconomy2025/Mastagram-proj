import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import "./Checkbox.css";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className = "", ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={`custom-checkbox ${className}`}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="checkbox-indicator">
      <Check className="checkbox-icon" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
