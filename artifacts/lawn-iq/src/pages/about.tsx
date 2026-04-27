import { Link } from "wouter";
import { Sparkles, Brain, Leaf, ArrowRight, ShieldCheck, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroImg from "@/assets/images/about-hero.png";
import { useSubscription, useOpenPortal } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { UpgradeModal } from "@/components/upgrade-modal";

export default function About() {
  const { data: subData, isLoading: subLoading } = useSubscription();
  const isPro = subData?.isPro === true;
  const openPortal = useOpenPortal();
  const { toast } = useToast();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleManageBilling = async () => {
    try {
      const { url } = await openPortal.mutateAsync();
      if (url) window.location.href = url;
    } catch {
      toast({ title: "Couldn't open billing portal", description: "Please try again.", variant: "destructive" });
    }
  };
  return (
    <div className="space-y-12 max-w-3xl mx-auto pb-20">
      
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="w-full aspect-[21/9] rounded-3xl overflow-hidden shadow-xl border-4 border-background relative">
          <img src={heroImg} alt="Vibrant healthy lawn covered in morning dew" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
              Your Lawn's Best Friend
            </h1>
          </div>
        </div>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          LawnRX combines advanced visual recognition with deep horticultural expertise to diagnose issues and help you grow the yard you've always wanted.
        </p>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg">1. Snap & Tell</h3>
              <p className="text-sm text-muted-foreground">Take a photo of the problem area and give us a quick description of what you're seeing.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg">2. AI Analysis</h3>
              <p className="text-sm text-muted-foreground">Our vision model identifies stress signs, diseases, pest damage, and nutrient deficiencies.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg">3. Custom Plan</h3>
              <p className="text-sm text-muted-foreground">Get a structured, step-by-step recovery plan tailored to your specific grass type and issue.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Example Cases */}
      <section className="bg-muted/50 rounded-3xl p-8 border border-border/50 space-y-6">
        <h2 className="text-2xl font-bold text-center mb-8">What We Catch</h2>
        
        <div className="space-y-4">
          <div className="flex gap-4 items-start bg-background p-4 rounded-2xl shadow-sm border border-border">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold">Fungal Diseases (Brown Patch, Dollar Spot)</h4>
              <p className="text-sm text-muted-foreground mt-1">We identify the circular patterns and leaf lesions typical of fungus, adjusting watering advice immediately.</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-start bg-background p-4 rounded-2xl shadow-sm border border-border">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-xl">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold">Nutrient Deficiencies</h4>
              <p className="text-sm text-muted-foreground mt-1">Yellowing (chlorosis) often means low nitrogen or iron. We'll tell you exactly what kind of fertilizer to look for.</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-start bg-background p-4 rounded-2xl shadow-sm border border-border">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold">Environmental Stress</h4>
              <p className="text-sm text-muted-foreground mt-1">Drought stress looks different from heat dormancy. We help you adjust irrigation schedules rather than throwing chemicals at the problem.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Status */}
      <section>
        <Card className={`border-2 ${isPro ? "border-primary/30 bg-primary/5" : "border-border"}`}>
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Membership</h3>
                {isPro && (
                  <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                    Pro
                  </span>
                )}
              </div>
              {subLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Checking status...
                </div>
              ) : isPro ? (
                <p className="text-sm text-muted-foreground">You have unlimited AI analyses and full access to care alerts.</p>
              ) : (
                <p className="text-sm text-muted-foreground">Free plan · 5 AI analyses included</p>
              )}
            </div>
            {isPro ? (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={openPortal.isPending}
                className="shrink-0 rounded-xl"
              >
                {openPortal.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Manage Billing
              </Button>
            ) : (
              <Button
                onClick={() => setShowUpgrade(true)}
                className="shrink-0 rounded-xl"
              >
                <Sparkles className="w-4 h-4 mr-2" /> Upgrade to Pro
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="text-center pt-4">
        <h2 className="text-2xl font-bold mb-4">Ready to save your grass?</h2>
        <Link href="/">
          <Button size="lg" className="rounded-xl px-8 py-6 text-lg h-auto shadow-md">
            Start a Diagnosis <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </section>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

    </div>
  );
}