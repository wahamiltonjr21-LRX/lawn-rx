import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { Camera, Sparkles, ListChecks } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { GrassLoader } from "@/components/grass-loader";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import Plans from "@/pages/plans";
import PlanDetail from "@/pages/plan-detail";
import About from "@/pages/about";
import CareAlerts from "@/pages/care-alerts";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import Community from "@/pages/community";
import Shop from "@/pages/shop";

const queryClient = new QueryClient();

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15, ease: "easeIn" as const } },
};

function AnimatedRouter() {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-full"
      >
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/plans" component={Plans} />
          <Route path="/plans/:id" component={PlanDetail} />
          <Route path="/care-alerts" component={CareAlerts} />
          <Route path="/about" component={About} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/community" component={Community} />
          <Route path="/shop" component={Shop} />
          <Route component={NotFound} />
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function SignInScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-amber-50 dark:from-emerald-950/40 dark:via-background dark:to-amber-950/30 px-6">
      <div className="max-w-md w-full text-center space-y-8">

        {/* Animated grass logo */}
        <div className="flex flex-col items-center gap-3">
          <GrassLoader label="" />
          <motion.span
            className="text-3xl font-bold tracking-tight flex"
          >
            {"LawnRX".split("").map((char, i) => (
              <motion.span
                key={i}
                style={{ display: "inline-block" }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.06, type: "spring", stiffness: 300, damping: 20 }}
              >
                {char}
              </motion.span>
            ))}
          </motion.span>
        </div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold leading-tight">Diagnose your lawn with AI</h1>
          <p className="text-muted-foreground">
            Snap a photo, describe what you're seeing, and get a personalised recovery
            plan in seconds.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-3 gap-3 text-xs text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.4 }}
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.25, type: "spring", stiffness: 260, damping: 22 }}
        >
          <Button
            size="lg"
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] transition-transform text-white"
            onClick={onLogin}
            data-testid="button-sign-in"
          >
            Sign in to get started
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.4 }}
          className="space-y-2"
        >
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
        </motion.div>
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
        <GrassLoader label="Loading LawnRX…" />
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
              <AnimatedRouter />
            </Layout>
          </WouterRouter>
        </AuthGate>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
