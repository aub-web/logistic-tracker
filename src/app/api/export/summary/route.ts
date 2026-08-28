import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getBusinessDeviceSummary, getBusinessLifecycleStatuses, BUSINESS_SUMMARY_CATEGORIES } from "@/lib/data";
import { toCsv } from "@/lib/csv";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rows, statuses] = await Promise.all([
    getBusinessDeviceSummary(),
    getBusinessLifecycleStatuses(),
  ]);
  const additionalHeaders = BUSINESS_SUMMARY_CATEGORIES.map((c) => `Additional: ${c}`);

  const csv = toCsv(
    [
      "Business Name",
      "Status",
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
      statuses.get(row.businessName) === "PULLED_OUT" ? "Pulled Out" : "Active",
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
      "Content-Disposition": `attachment; filename="business-summary-${Date.now()}.csv"`,
    },
  });
}
