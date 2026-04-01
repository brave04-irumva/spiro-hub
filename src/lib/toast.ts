// Minimal event-based toast utility.
// Components call toast(); the ToastContainer listens and renders the UI.

export type ToastLevel = "success" | "error" | "info";

type Listener = (message: string, level: ToastLevel) => void;

let _listener: Listener | null = null;

/** Called once by ToastContainer to receive toast events. */
export function _registerToastListener(fn: Listener) {
  _listener = fn;
}

/** Trigger a toast notification from any client component. */
export function toast(message: string, level: ToastLevel = "info") {
  if (_listener) {
    _listener(message, level);
  } else {
    // Fallback before ToastContainer mounts (should not happen in normal flow)
    console.info(`[toast:${level}] ${message}`);
  }
}
