import { useState } from "react";
import { useCaptureLead } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Phone, Mail, MapPin, User, CheckCircle2, Loader2, Building2 } from "lucide-react";

interface ContactProModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diagnosisId?: string;
  diagnosisTitle?: string;
  prefillName?: string;
  prefillEmail?: string;
}

export function ContactProModal({
  open,
  onOpenChange,
  diagnosisId,
  diagnosisTitle,
  prefillName = "",
  prefillEmail = "",
}: ContactProModalProps) {
  const { toast } = useToast();
  const captureLead = useCaptureLead();

  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [consented, setConsented] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const canSubmit =
    consented &&
    name.trim().length >= 2 &&
    email.trim().length > 3 &&
    zipCode.trim().length >= 5 &&
    !captureLead.isPending;

  function handleClose(value: boolean) {
    if (!value) {
      setSubmitted(false);
      setSuccessMessage("");
      setPhone("");
      setAddress("");
      setZipCode("");
      setConsented(false);
    }
    onOpenChange(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      const result = await captureLead.mutateAsync({
        data: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          zipCode: zipCode.trim(),
          diagnosisId,
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full max-h-[90dvh] overflow-y-auto rounded-2xl">
        {submitted ? (
          <div className="flex flex-col items-center text-center gap-4 py-6 px-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Request Sent!</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{successMessage}</p>
            </div>
            <Button
              className="w-full rounded-xl mt-2"
              onClick={() => handleClose(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="pb-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Leaf className="w-5 h-5 text-primary" />
                </div>
                <DialogTitle className="text-lg font-bold leading-tight">
                  Contact a Local Professional
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm text-muted-foreground">
                {diagnosisTitle
                  ? `Get expert help with "${diagnosisTitle}" from a vetted lawn care pro in your area.`
                  : "Connect with a vetted lawn care professional in your area."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-1">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="cp-name" className="text-sm font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  Your name
                </Label>
                <Input
                  id="cp-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  minLength={2}
                  className="rounded-xl"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="cp-email" className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  Email address
                </Label>
                <Input
                  id="cp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                  className="rounded-xl"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="cp-phone" className="text-sm font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  Phone
                  <span className="text-xs text-muted-foreground font-normal">(optional — helps pros reach you faster)</span>
                </Label>
                <Input
                  id="cp-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="rounded-xl"
                />
              </div>

              {/* ZIP */}
              <div className="space-y-1.5">
                <Label htmlFor="cp-zip" className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  ZIP code
                </Label>
                <Input
                  id="cp-zip"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="30301"
                  required
                  minLength={5}
                  maxLength={10}
                  className="rounded-xl"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label htmlFor="cp-address" className="text-sm font-medium flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  Address
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="cp-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St"
                  className="rounded-xl"
                />
              </div>

              {/* Consent checkbox */}
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/40 border border-border/60">
                <Checkbox
                  id="cp-consent"
                  checked={consented}
                  onCheckedChange={(checked) => setConsented(checked === true)}
                  className="mt-0.5 shrink-0"
                />
                <Label
                  htmlFor="cp-consent"
                  className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
                >
                  I agree that LawnRX may share my contact information and lawn diagnosis details
                  with local lawn care professionals for the purpose of providing service estimates
                  and assistance.
                </Label>
              </div>

              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-xl py-6 text-base gap-2"
              >
                {captureLead.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending request…
                  </>
                ) : (
                  <>
                    <Leaf className="w-4 h-4" />
                    Connect with a Local Pro
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
