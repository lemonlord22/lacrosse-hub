import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — LaxHub" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  // Sign in
  const [siEmail, setSiEmail] = useState("");
  const [siPass, setSiPass] = useState("");

  // Sign up
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPass, setSuPass] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suRole, setSuRole] = useState<"player" | "parent" | "coach">("player");
  const [suTeam, setSuTeam] = useState<"jv" | "varsity" | "parent" | "coach" | "none">("jv");
  const [suChild, setSuChild] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: siEmail, password: siPass });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Welcome back!"); navigate({ to: "/dashboard" }); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (suPass.length < 6) return toast.error("Password must be at least 6 characters.");
    setBusy(true);
    const team_level = suRole === "parent" ? "parent" : suRole === "coach" ? "coach" : suTeam;
    const { error } = await supabase.auth.signUp({
      email: suEmail,
      password: suPass,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: suName, phone: suPhone, role: suRole, team_level, child_name: suChild },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Account created!"); navigate({ to: "/dashboard" }); }
  };

  const handleForgot = async () => {
    if (!siEmail) return toast.error("Enter your email above first.");
    const { error } = await supabase.auth.resetPasswordForEmail(siEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Check your email for a reset link.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-xl">
        <Link to="/" className="mb-6 flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">L</span>
          LaxHub
        </Link>
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="mt-4 space-y-3">
              <div><Label>Email</Label><Input type="email" required value={siEmail} onChange={(e) => setSiEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" required value={siPass} onChange={(e) => setSiPass(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign in</Button>
              <button type="button" onClick={handleForgot} className="block w-full text-center text-xs text-muted-foreground hover:text-foreground">Forgot password?</button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="mt-4 space-y-3">
              <div><Label>Full name</Label><Input required value={suName} onChange={(e) => setSuName(e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" required value={suEmail} onChange={(e) => setSuEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" required value={suPass} onChange={(e) => setSuPass(e.target.value)} /></div>
              <div><Label>Phone (optional)</Label><Input type="tel" value={suPhone} onChange={(e) => setSuPhone(e.target.value)} /></div>
              <div>
                <Label>I am a</Label>
                <Select value={suRole} onValueChange={(v) => setSuRole(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">Player</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {suRole === "player" && (
                <div>
                  <Label>Team</Label>
                  <Select value={suTeam} onValueChange={(v) => setSuTeam(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jv">JV</SelectItem>
                      <SelectItem value="varsity">Varsity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {suRole === "parent" && (
                <div><Label>Athlete's name</Label><Input value={suChild} onChange={(e) => setSuChild(e.target.value)} /></div>
              )}
              <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create account</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}