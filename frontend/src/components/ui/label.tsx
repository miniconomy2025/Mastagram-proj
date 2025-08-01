import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import "./Label.css";

interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className = "", ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={`custom-label ${className}`}
    {...props}
  />
));

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
