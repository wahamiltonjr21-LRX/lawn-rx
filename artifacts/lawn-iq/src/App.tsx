import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { Camera, Sparkles, ListChecks, CheckCircle2, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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
import Calendar from "@/pages/calendar";
import YardMap from "@/pages/yard-map";
import DeleteAccount from "@/pages/delete-account";

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
          <Route path="/calendar" component={Calendar} />
          <Route path="/yard-map" component={YardMap} />
          <Route path="/delete-account" component={DeleteAccount} />
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

export const LogoutContext = createContext<() => void>(() => {});
export function useAnimatedLogout() { return useContext(LogoutContext); }

const BLADES = Array.from({ length: 18 }, (_, i) => i);

function LoginSuccessScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06, transition: { duration: 0.45, ease: "easeIn" } }}
    >
      {/* Floating grass blades background */}
      {BLADES.map((i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 rounded-full bg-white/10"
          style={{
            left: `${(i / BLADES.length) * 100 + Math.sin(i) * 3}%`,
            width: `${6 + (i % 5) * 4}px`,
            transformOrigin: "bottom center",
          }}
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: `${40 + (i % 7) * 22}px`,
            opacity: 0.7,
            rotate: [0, (i % 2 === 0 ? 6 : -6), 0],
          }}
          transition={{
            height: { delay: 0.1 + i * 0.04, duration: 0.6, ease: "easeOut" },
            opacity: { delay: 0.1 + i * 0.04, duration: 0.4 },
            rotate: { delay: 0.6, duration: 2.5, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      ))}

      {/* Radiating rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-white/20"
          initial={{ width: 80, height: 80, opacity: 0.6 }}
          animate={{ width: 420, height: 420, opacity: 0 }}
          transition={{ delay: 0.3 + i * 0.35, duration: 1.4, ease: "easeOut", repeat: Infinity, repeatDelay: 0.6 }}
        />
      ))}

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-6 px-8 text-center">
        {/* Logo mark */}
        <motion.div
          className="relative"
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
        >
          <div className="w-28 h-28 rounded-full bg-white/15 backdrop-blur flex items-center justify-center shadow-2xl border-2 border-white/30">
            <span className="text-5xl select-none">🌿</span>
          </div>
          {/* Check badge */}
          <motion.div
            className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 16, delay: 0.55 }}
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        {/* LawnRX wordmark */}
        <motion.div
          className="flex gap-[2px]"
          initial="hidden"
          animate="visible"
        >
          {"LawnRX".split("").map((char, i) => (
            <motion.span
              key={i}
              className="text-4xl font-black text-white tracking-tight drop-shadow"
              style={{ display: "inline-block" }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { delay: 0.5 + i * 0.07, type: "spring", stiffness: 320, damping: 20 } },
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Welcome text */}
        <motion.div
          className="space-y-1"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.4 }}
        >
          <p className="text-white text-xl font-semibold">You're all set!</p>
          <p className="text-white/80 text-sm">Let's get your lawn looking great.</p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className="w-48 h-1 rounded-full bg-white/20 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.2, duration: 1.4, ease: "linear" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

function SignOutScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-700 via-slate-600 to-slate-500 overflow-hidden"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.3 } }}
      exit={{ opacity: 0, y: 20, transition: { duration: 0.4, ease: "easeIn" } }}
    >
      {/* Falling leaf particles */}
      {BLADES.map((i) => (
        <motion.div
          key={i}
          className="absolute text-white/20 select-none pointer-events-none"
          style={{ left: `${(i / BLADES.length) * 110 - 5}%`, top: "-10%" }}
          animate={{ y: "120vh", rotate: 360 * (i % 2 === 0 ? 1 : -1), opacity: [0, 0.4, 0] }}
          transition={{ delay: i * 0.08, duration: 2.5 + (i % 4) * 0.4, ease: "easeIn" }}
        >
          {["🍃", "🌿", "🍂"][i % 3]}
        </motion.div>
      ))}

      {/* Fading rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-white/10"
          initial={{ width: 60, height: 60, opacity: 0.5 }}
          animate={{ width: 380, height: 380, opacity: 0 }}
          transition={{ delay: i * 0.4, duration: 1.6, ease: "easeOut", repeat: Infinity, repeatDelay: 0.8 }}
        />
      ))}

      <div className="relative flex flex-col items-center gap-6 px-8 text-center">
        {/* Icon bubble */}
        <motion.div
          className="relative"
          initial={{ scale: 0, rotate: 10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
        >
          <div className="w-28 h-28 rounded-full bg-white/10 backdrop-blur flex items-center justify-center shadow-2xl border-2 border-white/20">
            <LogOut className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* LawnRX wordmark */}
        <motion.div className="flex gap-[2px]" initial="hidden" animate="visible">
          {"LawnRX".split("").map((char, i) => (
            <motion.span
              key={i}
              className="text-4xl font-black text-white tracking-tight drop-shadow"
              style={{ display: "inline-block" }}
              variants={{
                hidden: { opacity: 0, y: -16 },
                visible: { opacity: 1, y: 0, transition: { delay: 0.4 + i * 0.07, type: "spring", stiffness: 300, damping: 22 } },
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Message */}
        <motion.div
          className="space-y-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.4 }}
        >
          <p className="text-white text-xl font-semibold">Signed out successfully</p>
          <p className="text-white/70 text-sm">See you next time! 👋</p>
        </motion.div>

        {/* Draining progress bar */}
        <motion.div className="w-48 h-1 rounded-full bg-white/20 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
          <motion.div
            className="h-full bg-white/60 rounded-full"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ delay: 1.1, duration: 1.3, ease: "linear" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, login, logout } = useAuth();
  const [location] = useLocation();
  const prevAuthed = useRef(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);

  useEffect(() => {
    if (!prevAuthed.current && isAuthenticated) {
      setShowSuccess(true);
    }
    prevAuthed.current = isAuthenticated;
  }, [isAuthenticated]);

  const handleLogout = useCallback(() => {
    setShowSignOut(true);
  }, []);

  const handleSignOutDone = useCallback(() => {
    setShowSignOut(false);
    logout();
  }, [logout]);

  if (location === "/terms") return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <GrassLoader label="Loading LawnRX…" />
      </div>
    );
  }

  if (!isAuthenticated && !showSignOut) {
    return (
      <AnimatePresence>
        <SignInScreen onLogin={login} />
      </AnimatePresence>
    );
  }

  return (
    <LogoutContext.Provider value={handleLogout}>
      <AnimatePresence>
        {showSuccess && <LoginSuccessScreen onDone={() => setShowSuccess(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSignOut && <SignOutScreen onDone={handleSignOutDone} />}
      </AnimatePresence>
      {!showSignOut && children}
    </LogoutContext.Provider>
  );
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
