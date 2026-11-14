// Export and import of everything the app keeps: settings, saved tracks and history.
// The file is one JSON object holding every `drift:*` and `raag:*` localStorage entry.

export const EXPORT_APP = "pause-a-little";
export const EXPORT_VERSION = 1;
const OWN = /^(drift|raag):/;

export interface ExportFile {
  app: typeof EXPORT_APP;
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
}

/** Read every app key out of a storage (JSON values are parsed, so the file stays readable). */
export function buildExport(storage: Pick<Storage, "length" | "key" | "getItem">, now = new Date()): ExportFile {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (!k || !OWN.test(k)) continue;
    const raw = storage.getItem(k);
    if (raw === null) continue;
    try {
      data[k] = JSON.parse(raw);
    } catch {
      data[k] = raw;
    }
  }
  return { app: EXPORT_APP, version: EXPORT_VERSION, exportedAt: now.toISOString(), data };
}

/** Check a picked file's text. Returns the entries to restore, or an error message. */
export function parseImport(text: string): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file is not valid JSON." };
  }
  const f = json as Partial<ExportFile> | null;
  if (!f || typeof f !== "object" || f.app !== EXPORT_APP) return { ok: false, error: "This is not a pause a little backup." };
  if (typeof f.version !== "number" || f.version > EXPORT_VERSION) return { ok: false, error: "This backup is from a newer version of the app." };
  if (!f.data || typeof f.data !== "object" || Array.isArray(f.data)) return { ok: false, error: "The backup has no data in it." };
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(f.data)) if (OWN.test(k)) data[k] = v;
  if (!Object.keys(data).length) return { ok: false, error: "The backup has no data in it." };
  return { ok: true, data };
}

/** Replace the app's keys with the imported ones. */
export function applyImport(storage: Pick<Storage, "length" | "key" | "removeItem" | "setItem">, data: Record<string, unknown>) {
  const old: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k && OWN.test(k)) old.push(k);
  }
  old.forEach((k) => storage.removeItem(k));
  for (const [k, v] of Object.entries(data)) storage.setItem(k, JSON.stringify(v));
}
