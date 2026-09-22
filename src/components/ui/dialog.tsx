"use client";

import {
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

// Built on the native <dialog> element: showModal()/close() give us a
// backdrop, focus trapping, and Escape-to-close for free, without an extra
// dependency. We just keep the element's open state in sync with `open`.
export function Dialog({ open, onOpenChange, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={() => onOpenChange(false)}
      onCancel={() => onOpenChange(false)}
      onClick={(event) => {
        if (event.target === ref.current) {
          onOpenChange(false);
        }
      }}
      className={cn(
        // Native <dialog> centers itself via the UA stylesheet's `margin:
        // auto` — but Tailwind's Preflight resets `margin` to 0 on every
        // element, which silently breaks that and leaves the dialog pinned
        // to the top-left corner. `fixed inset-0 m-auto` re-creates the
        // centering explicitly (a fixed box with all insets at 0 and auto
        // margins centers itself both axes), independent of the UA default.
        "fixed inset-0 m-auto w-full max-w-md rounded-lg border border-gray-200 bg-white p-0 shadow-lg backdrop:bg-gray-900/40",
        className,
      )}
    >
      <div onClick={(event) => event.stopPropagation()}>{children}</div>
    </dialog>
  );
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4 border-b border-gray-100 p-5", className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-sm font-semibold text-gray-900", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm text-gray-500", className)} {...props} />;
}

export function DialogCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      aria-label="Close dialog"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-end gap-3 border-t border-gray-100 p-5", className)}
      {...props}
    />
  );
}
