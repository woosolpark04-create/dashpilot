"use client";

import { useState } from "react";

/**
 * Shared state machine behind the "read-only by default, explicit Edit
 * button toggles a form, Cancel discards, Save exits back to read-only"
 * pattern used by every editable detail screen (leads, users, ...). Each
 * screen still owns its own fields/layout/security rules — this only
 * centralizes the toggle bookkeeping so it isn't reimplemented per screen.
 *
 * `editSession` is bumped on every entry into edit mode and meant to be
 * passed as a React `key` on the edit form, forcing it (and whatever
 * `useActionState` it holds) to remount fresh — so a stale error/pending
 * state from a previous attempt never leaks into the next edit session.
 */
export function useEditMode() {
  const [isEditing, setIsEditing] = useState(false);
  const [editSession, setEditSession] = useState(0);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function startEditing() {
    setSavedMessage(null);
    setEditSession((session) => session + 1);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
  }

  function handleSaved(message: string) {
    setIsEditing(false);
    setSavedMessage(message);
  }

  return { isEditing, editSession, savedMessage, startEditing, cancelEditing, handleSaved };
}
