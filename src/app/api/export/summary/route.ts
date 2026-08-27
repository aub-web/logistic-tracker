import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getBusinessDeviceSummary, BUSINESS_SUMMARY_CATEGORIES } from "@/lib/data";
import { toCsv } from "@/lib/csv";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getBusinessDeviceSummary();

  const csv = toCsv(
    [
      "Business Name",
      ...BUSINESS_SUMMARY_CATEGORIES,
      "Total Device Qty",
      "Device Requests",
      "SD Cards",
    ],
    rows.map((row) => [
      row.businessName,
      ...BUSINESS_SUMMARY_CATEGORIES.map((c) => row.categoryCounts[c] ?? 0),
      row.totalDeviceQty,
      row.totalDeviceRequests,
      row.totalSdCards,
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="business-summary-${Date.now()}.csv"`,
    },
  });
}
