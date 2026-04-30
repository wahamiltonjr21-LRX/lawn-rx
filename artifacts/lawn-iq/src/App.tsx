import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { Leaf, Sparkles, Camera, ListChecks } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import Plans from "@/pages/plans";
import PlanDetail from "@/pages/plan-detail";
import About from "@/pages/about";
import CareAlerts from "@/pages/care-alerts";
import Terms from "@/pages/terms";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/plans" component={Plans} />
      <Route path="/plans/:id" component={PlanDetail} />
      <Route path="/care-alerts" component={CareAlerts} />
      <Route path="/about" component={About} />
      <Route path="/terms" component={Terms} />
      <Route component={NotFound} />
    </Switch>
  );
}

function SignInScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-amber-50 dark:from-emerald-950/40 dark:via-background dark:to-amber-950/30 px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex items-center justify-center gap-2">
          <Leaf className="h-9 w-9 text-emerald-600" />
          <span className="text-3xl font-bold tracking-tight">LawnRX</span>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold leading-tight">Diagnose your lawn with AI</h1>
          <p className="text-muted-foreground">
            Snap a photo, describe what you're seeing, and get a personalized recovery
            plan in seconds.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card border">
            <Camera className="h-5 w-5 text-emerald-600" />
            <span>Photo upload</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card border">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <span>AI diagnosis</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card border">
            <ListChecks className="h-5 w-5 text-emerald-600" />
            <span>Saved plans</span>
          </div>
        </div>
        <Button
          size="lg"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={onLogin}
          data-testid="button-sign-in"
        >
          Sign in to get started
        </Button>
        <p className="text-xs text-muted-foreground">
          Your saved plans stay private to your account.
        </p>
        <p className="text-xs text-muted-foreground/70">
          By signing in you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, login } = useAuth();
  const [location] = useLocation();
  if (location === "/terms") return <>{children}</>;
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Leaf className="h-5 w-5 animate-pulse text-emerald-600" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <SignInScreen onLogin={login} />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthGate>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Layout>
              <Router />
            </Layout>
          </WouterRouter>
        </AuthGate>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;