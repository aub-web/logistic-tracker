/** Builds the query string shared between a filtered page's own URL and its
 * "Export CSV" link, so the export always reflects whatever's on screen. */
export function buildFilterQueryString(params: {
  q?: string;
  sdr?: string;
  device?: string;
  type?: string;
  from?: string;
  to?: string;
  businessType?: string;
}): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.sdr) sp.set("sdr", params.sdr);
  if (params.device) sp.set("device", params.device);
  if (params.type) sp.set("type", params.type);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.businessType) sp.set("businessType", params.businessType);
  const str = sp.toString();
  return str ? `?${str}` : "";
}
