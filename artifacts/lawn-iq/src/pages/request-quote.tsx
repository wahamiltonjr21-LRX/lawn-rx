import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCaptureLead } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Scissors, Sprout, Zap, Wind, Bug, Droplets, Trees, Trash2, HelpCircle,
  Camera, Upload, X, ChevronRight, ChevronLeft, CheckCircle2, Loader2,
  MapPin, Phone, Mail, User, Building2, Leaf,
} from "lucide-react";

const SERVICE_TYPES = [
  { id: "Lawn Mowing",   label: "Lawn Mowing",   icon: Scissors,   description: "Cutting & edging",        color: "text-green-600",   bg: "bg-green-50 dark:bg-green-950/30" },
  { id: "Fertilization", label: "Fertilization", icon: Sprout,     description: "Nutrients for growth",    color: "text-lime-600",    bg: "bg-lime-50 dark:bg-lime-950/30"   },
  { id: "Weed Control",  label: "Weed Control",  icon: Zap,        description: "Protect your grass",      color: "text-yellow-600",  bg: "bg-yellow-50 dark:bg-yellow-950/30" },
  { id: "Aeration",      label: "Aeration",      icon: Wind,       description: "Improve soil airflow",    color: "text-sky-600",     bg: "bg-sky-50 dark:bg-sky-950/30"     },
  { id: "Pest Control",  label: "Pest Control",  icon: Bug,        description: "Grubs & insects",         color: "text-orange-600",  bg: "bg-orange-50 dark:bg-orange-950/30" },
  { id: "Irrigation",    label: "Irrigation",    icon: Droplets,   description: "Sprinkler setup & repair",color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950/30"   },
  { id: "Landscaping",   label: "Landscaping",   icon: Trees,      description: "Design & planting",       color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  { id: "Yard Cleanup",  label: "Yard Cleanup",  icon: Trash2,     description: "Leaves & debris",         color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950/30" },
  { id: "Other",         label: "Other",         icon: HelpCircle, description: "Tell us what you need",   color: "text-purple-600",  bg: "bg-purple-50 dark:bg-purple-950/30" },
];

const STEP_LABELS = ["Select Service", "Lawn Details", "Contact Info"];

export default function RequestQuote() {
  const { user } = useAuth();
  const { toast } = useToast();
  const captureLead = useCaptureLead();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [consented, setConsented] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (user) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
      if (fullName) setName(fullName);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const clearPhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectedService = SERVICE_TYPES.find((s) => s.id === serviceType);

  const canSubmit =
    consented &&
    name.trim().length >= 2 &&
    email.trim().length > 3 &&
    zipCode.trim().length >= 5 &&
    !captureLead.isPending;

  async function handleSubmit() {
    if (!canSubmit) return;
    try {
      const noteParts: string[] = [];
      if (description.trim()) noteParts.push(description.trim());
      if (photoPreview) noteParts.push("[Customer uploaded a photo of their lawn]");

      const result = await captureLead.mutateAsync({
        data: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          zipCode: zipCode.trim(),
          serviceType,
          notes: noteParts.join("\n\n") || undefined,
        },
      });
      setSuccessMessage(result.message ?? "Your request has been sent!");
      setSubmitted(true);
    } catch {
      toast({
        title: "Submission failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }

  function handleReset() {
    setSubmitted(false);
    setStep(1);
    setServiceType("");
    setPhotoPreview(null);
    setDescription("");
    setZipCode("");
    setConsented(false);
    setPhone("");
    setAddress("");
  }

  if (submitted) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-center max-w-sm w-full px-4"
          >
            <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Quote Request Sent!</h2>
            <p className="text-muted-foreground text-sm mb-2">{successMessage}</p>
            {selectedService && (
              <p className="text-sm mb-1">
                Service: <span className="font-semibold text-foreground">{selectedService.label}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mb-8">
              Check your email for confirmation. A local pro will be in touch soon with pricing.
            </p>
            <Button className="w-full rounded-xl mb-3" onClick={handleReset}>
              Request Another Service
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        {/* Header + progress */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">Get a Free Quote</h1>
              <p className="text-sm text-muted-foreground">Matched with a vetted local pro</p>
            </div>
          </div>

          {/* Step progress */}
          <div className="flex gap-2 mb-1.5">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step > i + 1
                      ? "bg-primary"
                      : step === i + 1
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {STEP_LABELS.map((label, i) => (
              <span
                key={label}
                className={`text-[10px] font-medium transition-colors ${
                  step === i + 1 ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Service selection ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.18 }}
            >
              <h2 className="text-lg font-semibold mb-1">What do you need help with?</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Select the service you'd like a quote for.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SERVICE_TYPES.map(({ id, label, icon: Icon, description: desc, color, bg }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setServiceType(id); setStep(2); }}
                    className={`flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      serviceType === id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/20"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <span className="text-sm font-semibold leading-tight">{label}</span>
                    <span className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Photo + description ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              {/* Selected service pill */}
              {selectedService && (
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${selectedService.bg} ${selectedService.color}`}>
                    <selectedService.icon className="w-4 h-4" />
                    {selectedService.label}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-muted-foreground underline underline-offset-2"
                  >
                    Change
                  </button>
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold mb-0.5">Tell us about your lawn</h2>
                <p className="text-sm text-muted-foreground">
                  A photo and description help pros give you an accurate quote.
                </p>
              </div>

              {/* Photo upload */}
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-muted-foreground" />
                  Add a photo
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </p>
                {photoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border">
                    <img
                      src={photoPreview}
                      alt="Lawn preview"
                      className="w-full h-44 object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-36 rounded-2xl border-2 border-dashed border-border hover:border-primary/60 hover:bg-muted/20 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors"
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-sm font-medium">Upload a photo of your lawn</span>
                    <span className="text-xs">Tap to browse or take a photo</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Describe what you need</Label>
                <Textarea
                  placeholder={`e.g. My lawn has bare patches and weeds along the fence line. It's about 2,000 sq ft. Looking for a quote on ${serviceType.toLowerCase()}.`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="rounded-xl resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button className="flex-1 rounded-xl" onClick={() => setStep(3)}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Contact info ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg font-semibold mb-0.5">Your contact info</h2>
                <p className="text-sm text-muted-foreground">
                  A local pro will reach out with a personalised quote.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rq-name" className="text-sm font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" /> Your name
                </Label>
                <Input
                  id="rq-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  minLength={2}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rq-email" className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email address
                </Label>
                <Input
                  id="rq-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rq-phone" className="text-sm font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone
                  <span className="text-xs text-muted-foreground font-normal">(optional — speeds up contact)</span>
                </Label>
                <Input
                  id="rq-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rq-zip" className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> ZIP code
                </Label>
                <Input
                  id="rq-zip"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="30301"
                  required
                  minLength={5}
                  maxLength={10}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rq-address" className="text-sm font-medium flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Address
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="rq-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St"
                  className="rounded-xl"
                />
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/40 border border-border/60">
                <Checkbox
                  id="rq-consent"
                  checked={consented}
                  onCheckedChange={(c) => setConsented(c === true)}
                  className="mt-0.5 shrink-0"
                />
                <Label
                  htmlFor="rq-consent"
                  className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
                >
                  I agree that LawnRX may share my contact information and lawn details with local
                  lawn care professionals for the purpose of providing service quotes and assistance.
                </Label>
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  className="flex-1 rounded-xl py-6 text-base"
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                >
                  {captureLead.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Leaf className="w-4 h-4 mr-2" />
                      Get My Quote
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
