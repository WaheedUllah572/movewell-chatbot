"use client";

import {
  BookOpen,
  CalendarDays,
  FileText,
  Grid2X2,
  Leaf,
  LifeBuoy,
  MessageCircleHeart,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PortalSidebarProps = {
  onHome?: () => void;
};

const navItems = [
  ["Home", Leaf],
  ["Appointments", CalendarDays],
  ["Our Services", Grid2X2],
  ["Health Resources", BookOpen],
  ["My Records", FileText],
  ["Messages", MessageCircleHeart],
  ["Support", LifeBuoy],
] as const;

export function PortalSidebar({ onHome }: PortalSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("movewell-sidebar-collapsed");

    if (saved === "true") {
      setCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(
        "movewell-sidebar-collapsed",
        String(next)
      );
      return next;
    });
  };

  const handleNavigation = (label: string) => {
    if (label === "Home") {
      if (pathname === "/") {
        onHome?.();
      } else {
        router.push("/");
      }
      return;
    }

    if (label === "Appointments") {
      if (pathname !== "/appointments") {
        router.push("/appointments");
      }
    }
  };

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-slate-200/70 bg-white transition-[width] duration-200 md:flex ${
        collapsed ? "w-[76px]" : "w-[232px]"
      }`}
    >
      <div
        className={`flex h-[74px] items-center border-b border-slate-100 ${
          collapsed ? "justify-center px-2" : "justify-end px-4"
        }`}
      >
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex size-9 items-center justify-center rounded-[10px] border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-[18px]" />
          ) : (
            <PanelLeftClose className="size-[18px]" />
          )}
        </button>
      </div>

      <nav
        className={`flex-1 space-y-1.5 py-6 ${
          collapsed ? "px-2" : "px-4"
        }`}
      >
        {navItems.map(([label, Icon]) => {
          const active =
            (label === "Home" && pathname === "/") ||
            (label === "Appointments" && pathname === "/appointments");

          return (
            <button
              key={label}
              type="button"
              onClick={() => handleNavigation(label)}
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
              className={`group flex h-[45px] w-full items-center rounded-[11px] text-left text-[14px] transition ${
                collapsed ? "justify-center px-0" : "gap-3 px-3.5"
              } ${
                active
                  ? "bg-[#e2f7ef] font-semibold text-[#075f4f]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`size-[18px] shrink-0 ${
                  active
                    ? "text-[#08715d]"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />

              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      <div className={collapsed ? "px-2 pb-5" : "px-4 pb-5"}>
        {!collapsed ? (
          <>
            <div className="rounded-[14px] border border-emerald-100 bg-[#f0fbf7] p-4">
              <div className="flex size-9 items-center justify-center rounded-full bg-white text-emerald-700">
                <Phone className="size-4" />
              </div>

              <p className="mt-3 text-[12px] font-bold">
                Need urgent help?
              </p>

              <p className="mt-1 text-[12px] text-slate-500">
                Call us directly
              </p>

              <p className="mt-1.5 text-[13px] font-bold text-[#08715d]">
                +33 3 89 123 456
              </p>
            </div>

            <p className="mt-7 px-1 text-[17px] font-extrabold tracking-[-.04em]">
              MoveWell
            </p>

            <p className="mt-1 px-1 text-[11px] leading-4 text-slate-400">
              Small Steps
              <br />
              Stronger You
            </p>
          </>
        ) : (
          <button
            type="button"
            title="Need urgent help: +33 3 89 123 456"
            aria-label="Need urgent help: +33 3 89 123 456"
            className="mx-auto flex size-11 items-center justify-center rounded-[12px] border border-emerald-100 bg-[#f0fbf7] text-emerald-700"
          >
            <Phone className="size-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
