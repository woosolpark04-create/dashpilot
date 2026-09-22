import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { KeyboardEvent } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Pressing Enter inside a text <input> implicitly submits the nearest form
// in most browsers as soon as any submit button exists in it — surprising
// on a multi-field edit form where Save is meant to be a deliberate,
// explicit action. Only <input> keypresses are blocked: Enter still inserts
// a newline in <textarea> (browsers never submit on that), and it still
// activates a focused <button> normally, since a button isn't an <input>.
export function blockImplicitSubmit(event: KeyboardEvent<HTMLFormElement>) {
  if (event.key === "Enter" && (event.target as HTMLElement).tagName === "INPUT") {
    event.preventDefault();
  }
}
