"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
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

interface DialogIds {
  titleId: string;
  descriptionId: string;
}

const DialogIdsContext = createContext<DialogIds | null>(null);

// Built on the native <dialog> element: showModal()/close() give us a
// backdrop, focus trapping, and Escape-to-close for free, without an extra
// dependency. We just keep the element's open state in sync with `open`.
//
// A modal <dialog> has no accessible name on its own — screen readers just
// announce "dialog" unless it's explicitly labelled. `aria-labelledby`/
// `aria-describedby` point at DialogTitle/DialogDescription's ids (shared
// via context so callers don't have to wire ids up by hand); pointing at an
// id that never renders — e.g. a dialog with no DialogDescription — is
// harmless, per the ARIA spec.
export function Dialog({ open, onOpenChange, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

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
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
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
      <DialogIdsContext.Provider value={{ titleId, descriptionId }}>
        <div onClick={(event) => event.stopPropagation()}>{children}</div>
      </DialogIdsContext.Provider>
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

export function DialogTitle({ className, id, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  const ids = useContext(DialogIdsContext);
  return <h2 id={id ?? ids?.titleId} className={cn("text-sm font-semibold text-gray-900", className)} {...props} />;
}

export function DialogDescription({ className, id, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  const ids = useContext(DialogIdsContext);
  return <p id={id ?? ids?.descriptionId} className={cn("mt-1 text-sm text-gray-500", className)} {...props} />;
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
