"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { logoutAdmin } from "@/lib/actions/admin-auth-actions";

export default function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await logoutAdmin();
          router.replace("/login");
          router.refresh();
        })
      }
      className="flex w-full items-center gap-3 rounded-lg border-l-2 border-transparent py-2 pl-2.5 pr-3 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/15">
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
          <path
            d="M7.5 17H4.5a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 4.5 3h3"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12.5 13.5 16.5 10l-4-3.5M16 10H7.5"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      Log out
    </button>
  );
}
