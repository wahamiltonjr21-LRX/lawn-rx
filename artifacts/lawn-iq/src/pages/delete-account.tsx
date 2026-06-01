import { useState } from "react";
import { Trash2, ShieldAlert, LogIn } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
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

async function deleteAccount() {
  await fetch("/api/user/me", { method: "DELETE", credentials: "include" });
  window.location.href = "/";
}

export default function DeleteAccount() {
  const { isAuthenticated, login } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="max-w-lg mx-auto py-12 px-4 flex flex-col items-center gap-8 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Delete Your LawnRX Account</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          You can permanently delete your LawnRX account and all associated data at any time. Once requested, your account is deactivated immediately and all personal data is fully removed within <strong className="text-foreground">90 days</strong>.
        </p>
      </div>

      <div className="w-full rounded-xl border border-border bg-muted/40 p-5 text-left space-y-3">
        <p className="text-sm font-semibold">What gets deleted within 90 days:</p>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>Your account and profile information</li>
          <li>All saved lawn diagnosis plans</li>
          <li>Treatment logs and care history</li>
          <li>Community posts and comments</li>
          <li>Yard size and settings</li>
        </ul>
        <p className="text-xs text-muted-foreground pt-1">
          Payment records are retained by Stripe per their data retention policy. Stripe data is not controlled by LawnRX.
        </p>
      </div>

      {isAuthenticated ? (
        <Button
          variant="destructive"
          size="lg"
          className="w-full"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete My Account &amp; Data
        </Button>
      ) : (
        <div className="w-full space-y-3">
          <p className="text-sm text-muted-foreground">Sign in first to delete your account.</p>
          <Button variant="outline" size="lg" className="w-full" onClick={login}>
            <LogIn className="w-4 h-4 mr-2" />
            Sign In to Continue
          </Button>
        </div>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
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
    </div>
  );
}
