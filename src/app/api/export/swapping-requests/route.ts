import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listSwappingRequests } from "@/lib/data";
import { toCsv } from "@/lib/csv";
import type { BusinessType } from "@/generated/prisma/enums";

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  DIRECT_BUSINESS: "Direct Business",
  EXTERNAL_PARTNER: "External Partner",
  OUTBOUND: "Outbound",
};

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
  const requests = await listSwappingRequests({
    businessType: parseBusinessType(searchParams.get("businessType")),
    query: searchParams.get("q") ?? undefined,
    sdrName: searchParams.get("sdr") ?? undefined,
    dateFrom: searchParams.get("from") ?? undefined,
    dateTo: searchParams.get("to") ?? undefined,
  });

  const csv = toCsv(
    [
      "Request ID",
      "Submitted",
      "Business",
      "Business Type",
      "Contact Person",
      "Contact Number",
      "Address",
      "SD Cards",
      "SDR",
      "SS",
      "Status",
      "Dispatched At",
      "Updated By",
    ],
    requests.map((r) => [
      r.requestId,
      r.submittedAt.toISOString(),
      r.businessName,
      BUSINESS_TYPE_LABEL[r.businessType] ?? r.businessType,
      r.contactPerson,
      r.contactNumber,
      r.businessAddress,
      r.sdCardCount,
      r.sdrName,
      r.ssName ?? "",
      r.status === "DISPATCHED" ? "Dispatched" : "In Progress",
      r.dispatchedAt ? r.dispatchedAt.toISOString() : "",
      r.lastChangedBy ?? "",
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="swapping-requests-${Date.now()}.csv"`,
    },
  });
}
