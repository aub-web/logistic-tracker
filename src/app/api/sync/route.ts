import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { syncDeviceRequests, syncSwappingRequests } from "@/lib/sync";

const PATHS_TO_REVALIDATE = [
  "/device-requests",
  "/device-requests/direct-business",
  "/device-requests/external-partner",
  "/swapping-requests",
  "/swapping-requests/direct-business",
  "/swapping-requests/external-partner",
  "/summary",
];

// Lets an external cron service trigger a sync without a logged-in session —
// see SYNC_SECRET in .env.example. Requests still need the shared secret,
// so this doesn't widen who can read or write data, just how it's triggered.
export async function POST(request: Request) {
  const secret = process.env.SYNC_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [device, swapping] = await Promise.all([
    syncDeviceRequests(),
    syncSwappingRequests(),
  ]);

  for (const path of PATHS_TO_REVALIDATE) revalidatePath(path);

  return NextResponse.json({
    deviceCreated: device.created,
    swappingCreated: swapping.created,
  });
}
