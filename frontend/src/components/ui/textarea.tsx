import * as React from "react";
import "./textarea.css";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`custom-textarea ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
