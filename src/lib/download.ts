/** Trigger a browser download of `text` as `filename`. */
export function downloadText(text: string, filename: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  // The anchor must be in the document for the `download` attribute to be
  // honored in all browsers; otherwise the file lands with a UUID name.
  document.body.appendChild(a);
  a.click();
  // Defer cleanup: revoking the object URL synchronously (before the browser
  // has started the download) cancels it or drops the filename.
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 0);
}

export const ELISP_MIME = "text/x-emacs-lisp";
