"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart3,
  ClipboardPlus,
  DollarSign,
  FileCheck2,
  HeartPulse,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  Settings,
  ShieldAlert,
  Sun,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ComplianceBadges } from "@/components/shared/compliance-badges";
import { getCurrentSession, logout } from "@/lib/services/auth.service";
import { getSettings } from "@/stores/local-store";
import type { AuthSession, AppSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const PRIMARY_NAV = [
  {
    href: "/encounters/new",
    label: "Clinical Documentation",
    icon: ClipboardPlus,
  },
  {
    href: "/claim-readiness",
    label: "Claim Readiness",
    icon: ShieldAlert,
  },
  {
    href: "/revenue",
    label: "Revenue Cycle",
    icon: DollarSign,
  },
  {
    href: "/prior-auth",
    label: "Prior Authorization",
    icon: FileCheck2,
  },
  {
    href: "/care-gaps",
    label: "Care Gaps",
    icon: HeartPulse,
  },
] as const;

const SECONDARY_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/encounters", label: "History", icon: History },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/ask", label: "Ask Operyx AI", icon: MessageSquareText },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function isPrimaryActive(href: string, pathname: string) {
  if (href === "/encounters/new") return pathname.startsWith("/encounters/new");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isSecondaryActive(href: string, pathname: string) {
  if (href === "/encounters") {
    return (
      pathname === "/encounters" ||
      (pathname.startsWith("/encounters/") && !pathname.startsWith("/encounters/new"))
    );
  }
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [checking, setChecking] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await getCurrentSession();
      if (!mounted) return;
      if (!s) {
        router.replace("/login");
        return;
      }
      const saved = getSettings();
      setSession(s);
      setSettings(saved);
      if (saved.theme) setTheme(saved.theme);
      setChecking(false);
    })();
    return () => {
      mounted = false;
    };
  }, [router, pathname, setTheme]);

  async function handleLogout() {
    await logout();
    toast.success("Signed out");
    router.replace("/login");
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const doctor = settings?.doctorName ?? session?.name ?? "Clinician";
  const hospital = settings?.hospitalName ?? "Operyx Memorial Hospital";

  const navContent = (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-3 px-4 py-5", collapsed && "justify-center px-2")}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-sm">
          <Activity className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-display text-sm font-bold tracking-tight">Operyx AI</p>
            <p className="text-[11px] text-muted-foreground">Clinical Intelligence</p>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-2 pb-4">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Core workflows
            </p>
          )}
          {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
            const active = isPrimaryActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-sidebar-foreground/80 hover:bg-secondary/70 hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={label}
                aria-label={label}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="leading-snug">{label}</span>}
              </Link>
            );
          })}
        </div>
        <div className="space-y-1 border-t border-border/60 pt-3">
          {!collapsed && (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Workspace
            </p>
          )}
          {SECONDARY_NAV.map(({ href, label, icon: Icon }) => {
            const active = isSecondaryActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-sidebar-foreground/80 hover:bg-secondary/70 hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={label}
                aria-label={label}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>
      {!collapsed && (
        <div className="border-t border-border/60 p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Compliance
          </p>
          <ComplianceBadges className="flex-col" />
        </div>
      )}
    </div>
  );

  return (
    <div className="app-surface flex min-h-screen">
      <aside
        className={cn(
          "no-print sticky top-0 hidden h-screen shrink-0 border-r border-border/60 bg-sidebar backdrop-blur-xl transition-all md:block",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        {navContent}
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="no-print fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="relative h-full w-72 border-r border-border bg-sidebar"
            >
              <button
                type="button"
                className="absolute right-3 top-3 rounded-lg p-2 hover:bg-secondary"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
              {navContent}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold">{hospital}</p>
              <p className="text-xs text-muted-foreground">Clinical documentation workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2" aria-label="Account menu">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/15 text-primary text-xs">
                      {doctor
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-medium leading-none">{doctor}</span>
                    <span className="text-[11px] text-muted-foreground">{session?.role}</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 p-4 md:p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
