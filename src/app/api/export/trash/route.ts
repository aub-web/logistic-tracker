import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getTrashedBusinessSummary, getBusinessLifecycleStatuses, BUSINESS_SUMMARY_CATEGORIES } from "@/lib/data";
import { toCsv } from "@/lib/csv";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rows, statuses] = await Promise.all([
    getTrashedBusinessSummary(),
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
      "SD Cards Swapped",
      "SD Cards Expected",
      "Deleted By",
      "Deleted At",
    ],
    rows.map((row) => [
      row.businessName,
      statuses.get(row.businessName) === "PULLED_OUT" ? "Pulled Out" : "Active",
      ...BUSINESS_SUMMARY_CATEGORIES.map((c) => row.categoryCounts[c] ?? 0),
      row.totalDeviceQty,
      row.totalDispatchedQty,
      ...BUSINESS_SUMMARY_CATEGORIES.map((c) => row.additionalCategoryCounts[c] ?? 0),
      row.totalAdditionalQty,
      row.totalSdCards,
      row.expectedSdCards,
      row.deletedBy,
      row.deletedAt.toISOString(),
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trash-${Date.now()}.csv"`,
    },
  });
}
