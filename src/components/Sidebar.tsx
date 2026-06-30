"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  FileText,
  Users,
  Kanban,
  Zap,
  Mail,
  MessageSquare,
  Bot,
  Code,
  Webhook,
  CreditCard,
  Building2,
  Share2,
  Camera,
  FolderOpen,
  Wrench,
  Globe,
  Calendar,
  ClipboardList,
  LogOut,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/snapshots", label: "Snapshots", icon: Camera },
  { href: "/dashboard/funnels", label: "Funnels", icon: GitBranch },
  { href: "/dashboard/websites", label: "Websites", icon: Globe },
  { href: "/dashboard/forms", label: "Forms", icon: FileText },
  { href: "/dashboard/surveys", label: "Surveys", icon: ClipboardList },
  { href: "/dashboard/calendars", label: "Calendars", icon: Calendar },
  { href: "/dashboard/crm", label: "CRM Pipeline", icon: Kanban },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/workflows", label: "Workflows", icon: Zap },
  { href: "/dashboard/sequences", label: "Email & SMS", icon: Mail },
  { href: "/dashboard/ai", label: "AI Agents", icon: Bot },
  { href: "/dashboard/custom-code", label: "Custom Code", icon: Code },
  { href: "/dashboard/integrations", label: "API & Webhooks", icon: Webhook },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/saas", label: "SaaS Mode", icon: Building2 },
  { href: "/dashboard/white-label", label: "White Label", icon: Rocket },
  { href: "/dashboard/affiliates", label: "Affiliates", icon: Share2 },
  { href: "/dashboard/organization", label: "Organization", icon: FolderOpen },
  { href: "/dashboard/troubleshoot", label: "Troubleshoot", icon: Wrench },
];

export function Sidebar() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 p-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold">S</div>
          <div>
            <div className="font-semibold">SpotShip</div>
            <div className="text-xs text-slate-400">Ship clients instantly</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active ? "bg-indigo-600/20 text-indigo-300" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-900 hover:text-slate-200"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
