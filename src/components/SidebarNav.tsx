"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoutButton from "@/components/LogoutButton";

function BoxIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M10 2.5 17 6.25v7.5L10 17.5l-7-3.75v-7.5L10 2.5Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M3 6.25 10 10l7-3.75M10 10v7.5" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M4 7h11l-2.5-2.5M16 13H5l2.5 2.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M4 16V9M10 16V4M16 16v-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2.5 16.5h15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PulledOutIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M12.5 6.5 16 10l-3.5 3.5M16 10H7.5M9 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M4 5.5h12M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M6 5.5v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-10"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 8.5v5M11.5 8.5v5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`h-3.5 w-3.5 shrink-0 text-white/50 transition-transform ${open ? "rotate-90" : ""}`}
    >
      <path d="M7 5l6 5-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CollapseToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`h-4 w-4 text-white/60 transition-transform ${collapsed ? "rotate-180" : ""}`}
    >
      <path
        d="M12.5 4.5 7 10l5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV_SECTIONS = [
  {
    href: "/device-requests",
    label: "Device Request",
    color: "bg-sky-500",
    icon: BoxIcon,
    children: [
      { href: "/device-requests/external-partner", label: "External Partner" },
      { href: "/device-requests/direct-business", label: "Direct Business" },
    ],
  },
  {
    href: "/swapping-requests",
    label: "Swapping Request",
    color: "bg-violet-500",
    icon: SwapIcon,
    children: [
      { href: "/swapping-requests/external-partner", label: "External Partner" },
      { href: "/swapping-requests/direct-business", label: "Direct Business" },
    ],
  },
  {
    href: "/summary",
    label: "Summary",
    color: "bg-emerald-500",
    icon: ChartIcon,
    children: [
      { href: "/summary/external-partner", label: "External Partner" },
      { href: "/summary/direct-business", label: "Direct Business" },
    ],
  },
];

export default function SidebarNav({ name }: { name: string }) {
  const pathname = usePathname();
  // Sections default open when the current page belongs to them, and closed
  // otherwise — this set only tracks manual clicks that flip a section away
  // from that default, so it never needs to resync via an effect when the
  // route (and therefore the default) changes.
  const [toggled, setToggled] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  function toggleCollapsed() {
    setCollapsed((prev) => !prev);
  }

  function isSectionOpen(href: string): boolean {
    const defaultOpen = pathname.startsWith(href);
    return toggled.has(href) ? !defaultOpen : defaultOpen;
  }

  function toggleSection(href: string) {
    setToggled((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col overflow-y-auto overflow-x-hidden bg-[#14293D] transition-[width] duration-150 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className={`flex items-center justify-between px-3 py-6 ${collapsed ? "px-2" : "px-5"}`}>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight text-white">Atlas Capture</p>
            <p className="mt-0.5 truncate text-xs text-white/60">Logistics PH Team</p>
          </div>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-white/10"
        >
          <CollapseToggleIcon collapsed={collapsed} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_SECTIONS.map((section) => {
          const active = pathname.startsWith(section.href);
          const open = !collapsed && isSectionOpen(section.href);
          const Icon = section.icon;

          return (
            <div key={section.href}>
              <div
                className={`flex items-center rounded-lg border-l-2 transition ${
                  active ? "border-emerald-400 bg-white/10" : "border-transparent hover:bg-white/5"
                }`}
              >
                <Link
                  href={section.href}
                  title={section.label}
                  className={`flex flex-1 items-center gap-3 py-2 text-sm font-medium ${
                    collapsed ? "justify-center pl-0 pr-0" : "pl-2.5 pr-1"
                  } ${active ? "text-white" : "text-white/70 hover:text-white"}`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${section.color}`}
                  >
                    <Icon />
                  </span>
                  {!collapsed && section.label}
                </Link>
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleSection(section.href)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center"
                    aria-label={open ? `Collapse ${section.label}` : `Expand ${section.label}`}
                  >
                    <ChevronIcon open={open} />
                  </button>
                )}
              </div>

              {open && (
                <div className="ml-9 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                  {section.children.map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block rounded-md px-2 py-1.5 text-xs font-medium transition ${
                          childActive
                            ? "bg-white/10 text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <Link
          href="/pulled-out"
          title="Pulled Out"
          className={`flex items-center rounded-lg border-l-2 py-2 text-sm font-medium transition ${
            collapsed ? "justify-center pl-0 pr-0" : "gap-3 pl-2.5 pr-3"
          } ${
            pathname === "/pulled-out"
              ? "border-emerald-400 bg-white/10 text-white"
              : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
          }`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-500">
            <PulledOutIcon />
          </span>
          {!collapsed && "Pulled Out"}
        </Link>

        <Link
          href="/trash"
          title="Trash"
          className={`flex items-center rounded-lg border-l-2 py-2 text-sm font-medium transition ${
            collapsed ? "justify-center pl-0 pr-0" : "gap-3 pl-2.5 pr-3"
          } ${
            pathname === "/trash"
              ? "border-emerald-400 bg-white/10 text-white"
              : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
          }`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-500">
            <TrashIcon />
          </span>
          {!collapsed && "Trash"}
        </Link>
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        {!collapsed && (
          <p className="truncate px-2.5 pb-2 text-xs text-white/50" title={name}>
            Signed in as <span className="font-medium text-white/80">{name}</span>
          </p>
        )}
        <LogoutButton collapsed={collapsed} />
      </div>
    </aside>
  );
}
