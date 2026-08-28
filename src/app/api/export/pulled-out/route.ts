import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPulledOutBusinessSummary, BUSINESS_SUMMARY_CATEGORIES } from "@/lib/data";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rows = await getPulledOutBusinessSummary(searchParams.get("q") ?? undefined);
  const additionalHeaders = BUSINESS_SUMMARY_CATEGORIES.map((c) => `Additional: ${c}`);

  const csv = toCsv(
    [
      "Business Name",
      ...BUSINESS_SUMMARY_CATEGORIES,
      "Device Request (Qty)",
      "Total Dispatched",
      ...additionalHeaders,
      "Total Additional Request",
      "SD Card",
      "Total Extra SD Card",
      "Total Swap Requests",
    ],
    rows.map((row) => [
      row.businessName,
      ...BUSINESS_SUMMARY_CATEGORIES.map((c) => row.categoryCounts[c] ?? 0),
      row.totalDeviceQty,
      row.totalDispatchedQty,
      ...BUSINESS_SUMMARY_CATEGORIES.map((c) => row.additionalCategoryCounts[c] ?? 0),
      row.totalAdditionalQty,
      row.sdCardCount,
      row.extraSdCards,
      row.totalSwapRequests,
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pulled-out-${Date.now()}.csv"`,
    },
  });
}
