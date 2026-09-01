import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDailyDispatchedTotals } from "@/lib/data";
import { toCsv } from "@/lib/csv";
import type { BusinessType } from "@/generated/prisma/enums";

function parseBusinessType(value: string | null): BusinessType | undefined {
  return value === "DIRECT_BUSINESS" || value === "EXTERNAL_PARTNER" || value === "OUTBOUND"
    ? value
    : undefined;
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rows = await getDailyDispatchedTotals(
    parseBusinessType(searchParams.get("businessType")),
    searchParams.get("from") ?? undefined,
    searchParams.get("to") ?? undefined,
  );

  const csv = toCsv(
    ["Date", "Total Dispatched"],
    rows.map((row) => [row.date, row.total]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="daily-dispatched-${Date.now()}.csv"`,
    },
  });
}
