import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import "./Toast.css";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props} className="toast">
          <div className="toast-content">
            {title && <ToastTitle className="toast-title">{title}</ToastTitle>}
            {description && (
              <ToastDescription className="toast-description">
                {description}
              </ToastDescription>
            )}
          </div>
          {action}
          <ToastClose className="toast-close" />
        </Toast>
      ))}
      <ToastViewport className="toast-viewport" />
    </ToastProvider>
  );
}
