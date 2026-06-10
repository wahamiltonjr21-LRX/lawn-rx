import { Link, useLocation } from "wouter";
import { Home, List, Info, Leaf, Bell, Users, ShoppingBag, LogIn, LogOut, User, CalendarDays, Trash2, CreditCard, Loader2 } from "lucide-react";
import YardMapIcon from "@/components/icons/yard-map-icon";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useAnimatedLogout } from "@/App";
import { useOpenPortal } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const allNavItems = [
  { href: "/",            label: "Diagnose",  icon: Home        },
  { href: "/plans",       label: "My Plans",  icon: List        },
  { href: "/calendar",    label: "Calendar",  icon: CalendarDays},
  { href: "/shop",        label: "Shop",      icon: ShoppingBag },
  { href: "/community",   label: "Community", icon: Users       },
  { href: "/yard-map",    label: "Yard Map",  icon: YardMapIcon },
  { href: "/care-alerts", label: "Alerts",    icon: Bell        },
  { href: "/about",       label: "About",     icon: Info        },
];

// Mobile bottom nav: 6 tabs — hide About and Care Alerts only
const mobileNavItems = allNavItems.filter(
  (i) => i.href !== "/about" && i.href !== "/care-alerts"
);

function isActive(href: string, location: string) {
  return href === "/"
    ? location === "/"
    : location === href || location.startsWith(href + "/");
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

async function deleteAccount() {
  await fetch("/api/user/me", { method: "DELETE", credentials: "include" });
  window.location.href = "/";
}

function DeleteAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your account, all saved plans, treatment history, and community posts. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={deleteAccount}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete my account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AccountButton() {
  const { user, isAuthenticated, login } = useAuth();
  const handleLogout = useAnimatedLogout();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const openPortal = useOpenPortal();
  const { toast } = useToast();

  const handleBilling = async () => {
    try {
      const { url } = await openPortal.mutateAsync();
      window.location.href = url;
    } catch {
      toast({ title: "No billing account found", description: "Subscribe to a plan to manage billing.", variant: "destructive" });
    }
  };

  if (!isAuthenticated) {
    return (
      <button
        onClick={login}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        title="Sign in"
      >
        <LogIn className="w-4 h-4" />
        Sign In
      </button>
    );
  }

  return (
    <>
      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none rounded-full" title="Account">
            <Avatar className="w-8 h-8 ring-2 ring-white/30 hover:ring-white/70 transition-all">
              {user?.profileImageUrl && (
                <AvatarImage src={user.profileImageUrl} alt={user.firstName ?? "User"} />
              )}
              <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                {getInitials(
                  user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : (user?.firstName ?? user?.email)
                )}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              {(user?.firstName || user?.lastName) && (
                <span className="font-semibold text-sm">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ")}
                </span>
              )}
              {user?.email && (
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleBilling}
            disabled={openPortal.isPending}
            className="cursor-pointer"
          >
            {openPortal.isPending
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <CreditCard className="w-4 h-4 mr-2" />}
            Manage Billing
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function SidebarAccountSection() {
  const { user, isAuthenticated, login } = useAuth();
  const handleLogout = useAnimatedLogout();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const openPortal = useOpenPortal();
  const { toast } = useToast();

  const handleBilling = async () => {
    try {
      const { url } = await openPortal.mutateAsync();
      window.location.href = url;
    } catch {
      toast({ title: "No billing account found", description: "Subscribe to a plan to manage billing.", variant: "destructive" });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="px-4 py-4 border-t border-border">
        <button
          onClick={login}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors font-medium"
        >
          <LogIn className="w-5 h-5 shrink-0" />
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 border-t border-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-sidebar-accent transition-colors focus:outline-none group">
            <Avatar className="w-8 h-8 ring-2 ring-emerald-500/30 group-hover:ring-emerald-500/60 transition-all shrink-0">
              {user?.profileImageUrl && (
                <AvatarImage src={user.profileImageUrl} alt={user.firstName ?? "User"} />
              )}
              <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                {getInitials(
                  user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : (user?.firstName ?? user?.email)
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "My Account"}
              </p>
              {user?.email && (
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              )}
            </div>
            <User className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              {(user?.firstName || user?.lastName) && (
                <span className="font-semibold text-sm">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ")}
                </span>
              )}
              {user?.email && (
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleBilling}
            disabled={openPortal.isPending}
            className="cursor-pointer"
          >
            {openPortal.isPending
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <CreditCard className="w-4 h-4 mr-2" />}
            Manage Billing
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col md:flex-row">
      {/* ── Mobile Header ── */}
      <header className="md:hidden sticky top-0 z-50 bg-emerald-800 px-4 py-3 flex items-center justify-between shadow-md" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
        <Link href="/" className="flex items-center gap-2 text-white">
          <Leaf className="w-6 h-6 text-emerald-300" />
          <span className="font-bold text-lg tracking-tight text-white">LawnRX</span>
        </Link>
        <AccountButton />
      </header>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar h-[100dvh] sticky top-0">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 text-sidebar-primary">
            <Leaf className="w-8 h-8" />
            <span className="font-bold text-2xl tracking-tight">LawnRX</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, location);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
                {active && (
                  <motion.span
                    layoutId="sidebar-indicator"
                    className="absolute inset-0 rounded-xl bg-sidebar-primary -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <SidebarAccountSection />
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col pb-20 md:pb-0 overflow-y-auto">
        <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-emerald-800 flex justify-around items-center pt-2 z-50 shadow-[0_-2px_12px_rgba(0,0,0,0.25)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, location);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 py-1.5 px-3 min-w-[3.8rem]"
            >
              {/* active pill */}
              {active && (
                <motion.span
                  layoutId="mobile-nav-pill"
                  className="absolute inset-x-1 top-0 bottom-0 rounded-xl bg-white/15 -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 36 }}
                />
              )}
              <motion.div
                animate={active ? { scale: 1.1, y: -1 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    active ? "text-white" : "text-emerald-300/70"
                  }`}
                />
              </motion.div>
              <span
                className={`text-[10px] font-semibold tracking-wide leading-tight transition-colors ${
                  active ? "text-white" : "text-emerald-300/70"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
