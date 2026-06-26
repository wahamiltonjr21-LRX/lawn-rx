import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useProLogout, useProGetMe } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { Leaf, LogOut, Users, User, LayoutDashboard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Layout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useProGetMe({ query: { queryKey: ["proGetMe"] } });
  const logout = useProLogout();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem("pro_token");
      setLocation("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {/* Sidebar */}
      <aside className="w-64 flex-col hidden sm:flex border-r bg-background">
        <div className="flex h-16 items-center px-6 border-b">
          <Leaf className="h-6 w-6 text-primary mr-2" />
          <span className="font-bold text-lg">LawnRX Pro</span>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid items-start px-4 text-sm font-medium space-y-1">
            <Link href="/leads" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted" data-testid="nav-leads">
              <Users className="h-4 w-4" />
              Leads
            </Link>
            <Link href="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted" data-testid="nav-profile">
              <User className="h-4 w-4" />
              Profile
            </Link>
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
          <div className="flex flex-col gap-1 mb-4 px-2">
            <span className="text-sm font-semibold truncate">{user?.businessName}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b bg-background px-6 sm:hidden">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="font-bold">LawnRX Pro</span>
          <div className="ml-auto">
            <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout-mobile">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
