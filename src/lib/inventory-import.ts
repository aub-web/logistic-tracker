import "server-only";
import { categorize } from "@/lib/data";

/** Minimal RFC 4180 CSV parser — same approach as the Google Sheets sync,
 * duplicated locally since this parses an uploaded file's text, not a sheet
 * export. Handles quoted fields, embedded commas, and doubled-quote
 * escaping. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
      } else {
        field += char;
        i += 1;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
    } else if (char === ",") {
      row.push(field);
      field = "";
      i += 1;
    } else if (char === "\r") {
      i += 1;
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
      i += 1;
    } else {
      field += char;
      i += 1;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
}

function findColumn(header: string[], ...candidates: string[]): number {
  const normalized = header.map(normalizeHeader);
  for (const candidate of candidates) {
    const exact = normalized.indexOf(normalizeHeader(candidate));
    if (exact !== -1) return exact;
  }
  for (let i = 0; i < normalized.length; i++) {
    if (candidates.some((c) => normalized[i].includes(normalizeHeader(c)))) return i;
  }
  return -1;
}

function parseQuantity(raw: string): number | null {
  const n = parseInt(raw.replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

export interface ParsedInventoryImport {
  /** Quantity per category, already bucketed with the app's own categorize() rules. */
  counts: Map<string, number>;
  /** Data rows that had a name but no readable quantity — surfaced so a
   * typo in the file doesn't just silently vanish from the total. */
  skippedRows: number;
}

/** Turns an uploaded inventory file's raw text into per-category totals.
 * Expects a header row with a device name column ("Device Type", "Category",
 * "Device", ...) and a quantity column ("Quantity", "Count", "Qty", ...) —
 * order and extra columns don't matter. Every device name is bucketed
 * through the same categorize() rules the rest of the app uses, so an
 * inventory sheet listing model names (e.g. "GOHAN (MULTICAM SET)") tallies
 * correctly against what's tracked as deployed. */
export function parseInventoryImport(text: string): ParsedInventoryImport {
  const rows = parseCsv(text).filter((row) => row.some((c) => c.trim()));
  if (rows.length < 2) {
    throw new Error("The file needs a header row plus at least one data row.");
  }

  const [header, ...dataRows] = rows;
  const nameIdx = findColumn(header, "Device Type", "Category", "Device", "Item");
  const qtyIdx = findColumn(header, "Quantity", "Count", "Qty", "Total");

  if (nameIdx === -1 || qtyIdx === -1) {
    throw new Error(
      'Couldn\'t find both columns — the file needs a device/category name column and a quantity column (e.g. "Device Type" and "Quantity").',
    );
  }

  const counts = new Map<string, number>();
  let skippedRows = 0;

  for (const row of dataRows) {
    const name = (row[nameIdx] ?? "").trim();
    if (!name) continue;

    const quantity = parseQuantity(row[qtyIdx] ?? "");
    if (quantity === null) {
      skippedRows += 1;
      continue;
    }

    const category = categorize(name);
    counts.set(category, (counts.get(category) ?? 0) + quantity);
  }

  return { counts, skippedRows };
}
