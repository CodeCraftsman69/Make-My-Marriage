"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  error?: string;
  children?: ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

/** Shared application dialog. The modal element supplies focus trapping and inert background content. */
export function ConfirmationDialog({ open, title, description, confirmLabel, cancelLabel = "Cancel", danger = false, busy = false, error, children, onConfirm, onCancel }: ConfirmationDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false);
  const [failure, setFailure] = useState("");
  const id = useId();
  function cancel() { setFailure(""); onCancel(); }

  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    cancelButton.current?.focus();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  return <dialog ref={dialog} className="confirmation-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} aria-busy={busy}
    onCancel={event => { event.preventDefault(); if (!busy && !submitting.current) cancel(); }}
    onClick={event => {
      if (event.target !== event.currentTarget || busy || submitting.current) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) cancel();
    }}>
    <form onSubmit={async event => {
      event.preventDefault();
      if (busy || submitting.current) return;
      submitting.current = true;
      setFailure("");
      try { await onConfirm(); }
      catch { setFailure("We couldn’t complete this action. Please try again."); }
      finally { submitting.current = false; }
    }}>
      <span className={`confirmation-dialog-icon${danger ? " is-danger" : ""}`} aria-hidden="true">{danger ? "!" : "?"}</span>
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-description`}>{description}</p>
      {children && <fieldset className="confirmation-dialog-fields" disabled={busy}>{children}</fieldset>}
      {(error || failure) && <p className="confirmation-dialog-error" role="alert">{error || failure}</p>}
      <div className="confirmation-dialog-actions">
        <button ref={cancelButton} type="button" disabled={busy} onClick={() => { if (!submitting.current) cancel(); }}>{cancelLabel}</button>
        <button type="submit" className={`confirmation-dialog-confirm${danger ? " is-danger" : ""}`} disabled={busy}>{busy ? "Please wait…" : confirmLabel}</button>
      </div>
    </form>
  </dialog>;
}
