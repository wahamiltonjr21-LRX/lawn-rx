import { Link, useLocation } from "wouter";
import { Home, List, Info, Leaf, Bell, Users, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

const allNavItems = [
  { href: "/",            label: "Diagnose",  icon: Home        },
  { href: "/plans",       label: "My Plans",  icon: List        },
  { href: "/shop",        label: "Shop",      icon: ShoppingBag },
  { href: "/community",   label: "Community", icon: Users       },
  { href: "/care-alerts", label: "Alerts",    icon: Bell        },
  { href: "/about",       label: "About",     icon: Info        },
];

// Mobile bottom nav shows the 5 most-used tabs; About lives in sidebar only
const mobileNavItems = allNavItems.filter((i) => i.href !== "/about");

function isActive(href: string, location: string) {
  return href === "/"
    ? location === "/"
    : location === href || location.startsWith(href + "/");
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col md:flex-row">
      {/* ── Mobile Header ── */}
      <header className="md:hidden sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-center">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <Leaf className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight">LawnRX</span>
        </Link>
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
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col pb-20 md:pb-0 overflow-y-auto">
        <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border flex justify-around items-center py-1 pb-safe z-50">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, location);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[3.8rem]"
            >
              {/* sliding pill behind active tab */}
              {active && (
                <motion.span
                  layoutId="mobile-nav-pill"
                  className="absolute inset-x-1 top-0.5 bottom-0.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 36 }}
                />
              )}
              <motion.div
                animate={active ? { scale: 1.15, y: -1 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                  }`}
                />
              </motion.div>
              <span
                className={`text-[9px] font-semibold tracking-wide transition-colors leading-tight ${
                  active ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"
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
