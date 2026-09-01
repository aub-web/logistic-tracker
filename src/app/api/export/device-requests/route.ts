import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listDeviceRequests } from "@/lib/data";
import { toCsv } from "@/lib/csv";
import type { BusinessType, DeviceRequestType } from "@/generated/prisma/enums";

const REQUEST_TYPE_LABEL: Record<string, string> = {
  DROP_OFF: "Drop-off",
  REPLACEMENT: "Replacement",
  PULL_OUT: "Pull-out",
};

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

function parseRequestType(value: string | null): DeviceRequestType | undefined {
  return value === "DROP_OFF" || value === "REPLACEMENT" || value === "PULL_OUT"
    ? value
    : undefined;
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requests = await listDeviceRequests({
    businessType: parseBusinessType(searchParams.get("businessType")),
    query: searchParams.get("q") ?? undefined,
    sdrName: searchParams.get("sdr") ?? undefined,
    deviceType: searchParams.get("device") ?? undefined,
    requestType: parseRequestType(searchParams.get("type")),
    dateFrom: searchParams.get("from") ?? undefined,
    dateTo: searchParams.get("to") ?? undefined,
  });

  const csv = toCsv(
    [
      "Request ID",
      "Submitted",
      "Request Date",
      "Type",
      "Business",
      "Business Type",
      "Contact Person",
      "Contact Number",
      "Address",
      "Delivery Mode",
      "Device Type",
      "Quantity",
      "SDR",
      "SS",
      "Status",
      "Dispatched At",
      "Updated By",
    ],
    requests.map((r) => [
      r.requestId,
      r.submittedAt.toISOString(),
      r.requestDate,
      REQUEST_TYPE_LABEL[r.requestType] ?? r.requestType,
      r.businessName,
      BUSINESS_TYPE_LABEL[r.businessType] ?? r.businessType,
      r.contactPerson,
      r.contactNumber,
      r.businessAddress,
      r.deliveryMode,
      r.deviceType,
      r.quantity,
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
      "Content-Disposition": `attachment; filename="device-requests-${Date.now()}.csv"`,
    },
  });
}
