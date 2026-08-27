import "server-only";

// The /gviz/tq?tqx=out:csv&sheet=<name> export respects whatever Filter View
// is currently active on that tab — it silently returns only the visible
// subset of rows, which is wrong for a sync that must see every submission.
// /export?format=csv&gid=<tab id> reads the tab's real data and ignores
// filters, so that's what we use here.
function buildCsvExportUrl(spreadsheetId: string, gid: string): string {
  const params = new URLSearchParams({ format: "csv", gid });
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?${params.toString()}`;
}

/** Minimal RFC 4180 CSV parser: handles quoted fields, embedded commas,
 * doubled-quote escaping, and quoted fields that span multiple lines. */
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

/** Raw cell rows (including the header row) from a Sheet tab, identified by
 * its gid (visible in the URL when that tab is selected, e.g.
 * ".../edit?gid=1804606724").
 *
 * Reads via the public CSV export endpoint rather than the authenticated
 * Sheets API, so no service account is needed — this only works because the
 * response Sheets are shared as "Anyone with the link can view". If that
 * sharing is ever locked down, this will start returning an error and the
 * fetch here would need to switch to an authenticated Sheets API call. */
export async function fetchSheetRows(
  spreadsheetId: string,
  gid: string,
): Promise<string[][]> {
  const url = buildCsvExportUrl(spreadsheetId, gid);
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(
      `Couldn't read the Google Sheet (HTTP ${res.status}). Make sure it's still ` +
        `shared as "Anyone with the link can view", and that the sheet tab gid ` +
        `("${gid}") is correct.`,
    );
  }

  const text = await res.text();
  return parseCsv(text);
}
