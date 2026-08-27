import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import SidebarNav from "@/components/SidebarNav";

// Requests change whenever a form is submitted or a sync runs — these pages
// must never serve a cached response.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1">
      <SidebarNav name={session.name} />
      <main className="min-w-0 flex-1 overflow-x-auto px-4 py-6 sm:px-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
