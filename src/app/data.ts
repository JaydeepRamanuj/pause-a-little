// Export and import of everything the app keeps, as one JSON file.

import { applyImport, buildExport, parseImport } from "./dataIO";
import { toast } from "./ui";

/** Download everything (settings, saved tracks, history) as one JSON file. */
export function exportData() {
  const file = buildExport(localStorage);
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `pause-a-little-${new Date().toLocaleDateString("en-CA")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast("Backup saved");
}

/** Read a picked backup file; replaces the saved data and reloads. Returns an error message, or null. */
export async function importData(file: File): Promise<string | null> {
  const parsed = parseImport(await file.text());
  if (!parsed.ok) return parsed.error;
  applyImport(localStorage, parsed.data);
  location.reload();
  return null;
}
