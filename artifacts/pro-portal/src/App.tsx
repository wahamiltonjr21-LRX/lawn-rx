import React, { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAuthTokenGetter, useProGetMe } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Leads from "@/pages/leads";
import LeadDetail from "@/pages/lead-detail";
import Profile from "@/pages/profile";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  
  // Set the token getter once
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("pro_token") || "");
  }, []);

  const { data: user, isLoading, isError } = useProGetMe({
    query: {
      queryKey: ["proGetMe"],
      retry: false,
    }
  });

  const isAuthRoute = location === "/" || location === "/register";

  useEffect(() => {
    if (isLoading) return;
    
    if (isError || !user) {
      if (!isAuthRoute) {
        setLocation("/");
      }
    } else {
      if (isAuthRoute) {
        setLocation("/leads");
      }
    }
  }, [user, isLoading, isError, location, setLocation, isAuthRoute]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Prevent flash of protected content before redirect
  if ((isError || !user) && !isAuthRoute) return null;
  if (user && isAuthRoute) return null;

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/leads" component={Leads} />
      <Route path="/leads/:id" component={LeadDetail} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthGuard>
            <Router />
          </AuthGuard>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
