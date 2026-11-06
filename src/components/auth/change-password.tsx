"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

type ChangePasswordProps = {
  className?: string;
  label?: string;
};

export function ChangePassword({ className = "btn btn-outline", label = "Change password" }: ChangePasswordProps) {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  function close() {
    if (busy) return;
    setOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters long.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Choose a new password different from your current password.");
      return;
    }

    setBusy(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        setError(result.error.message || "Unable to change your password. Check your current password and try again.");
        return;
      }
      setSuccess("Your password has been changed. Other active sessions have been signed out.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to change your password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => { setOpen(true); setError(""); setSuccess(""); }}>
        {label}
      </button>
      {open && (
        <div className="orchid-password-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
          <section className="orchid-password-dialog" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
            <div className="orchid-password-heading">
              <div>
                <p className="t-caption text-tertiary">ACCOUNT SECURITY</p>
                <h2 id="change-password-title">Change password</h2>
                <p>Verify your current password before choosing a new one.</p>
              </div>
              <button type="button" className="icon-btn" onClick={close} disabled={busy} aria-label="Close">×</button>
            </div>
            <form onSubmit={submit} className="orchid-password-form">
              <label>Current password<input autoComplete="current-password" type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required disabled={busy} /></label>
              <label>New password<input autoComplete="new-password" type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} minLength={8} maxLength={128} required disabled={busy} /></label>
              <label>Confirm new password<input autoComplete="new-password" type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} minLength={8} maxLength={128} required disabled={busy} /></label>
              <p className="orchid-password-hint">Use at least 8 characters. Changing your password signs out your other active sessions.</p>
              {error && <p className="orchid-password-message error" role="alert">{error}</p>}
              {success && <p className="orchid-password-message success" role="status">{success}</p>}
              <div className="orchid-password-actions">
                <button type="button" className="btn btn-outline" onClick={close} disabled={busy}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
