"use client";

import {
  BookOpen,
  CalendarDays,
  FileText,
  Grid2X2,
  Leaf,
  LifeBuoy,
  MessageCircleHeart,
  Phone,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

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
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-slate-200/70 bg-white lg:flex">
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {navItems.map(([label, Icon]) => {
          const active =
            (label === "Home" && pathname === "/") ||
            (label === "Appointments" && pathname === "/appointments");

          return (
            <button
              key={label}
              type="button"
              onClick={() => handleNavigation(label)}
              className={`group flex h-[45px] w-full items-center gap-3 rounded-[11px] px-3.5 text-left text-[14px] transition ${
                active
                  ? "bg-[#e2f7ef] font-semibold text-[#075f4f]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`size-[18px] ${
                  active
                    ? "text-[#08715d]"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 pb-5">
        <div className="rounded-[14px] border border-emerald-100 bg-[#f0fbf7] p-4">
          <div className="flex size-9 items-center justify-center rounded-full bg-white text-emerald-700">
            <Phone className="size-4" />
          </div>
          <p className="mt-3 text-[12px] font-bold">Need urgent help?</p>
          <p className="mt-1 text-[12px] text-slate-500">Call us directly</p>
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
      </div>
    </aside>
  );
}
