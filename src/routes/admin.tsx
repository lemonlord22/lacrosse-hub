import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/AuthGuard";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({ component: () => <AuthGuard requireAdmin><Page /></AuthGuard> });

const ROLES = ["admin", "coach", "player", "parent"] as const;
const TEAMS = ["jv", "varsity", "parent", "coach", "none"] as const;

function Page() {
  const [users, setUsers] = useState<any[]>([]);

  const load = async () => {
    const { data: profs } = await supabase.from("profiles").select("*").order("full_name");
    const { data: rs } = await supabase.from("user_roles").select("user_id,role");
    const rolesMap: Record<string, string[]> = {};
    (rs ?? []).forEach((r: any) => { rolesMap[r.user_id] = [...(rolesMap[r.user_id] || []), r.role]; });
    setUsers((profs ?? []).map((p: any) => ({ ...p, roles: rolesMap[p.id] || [] })));
  };
  useEffect(() => { load(); }, []);

  const setRole = async (userId: string, role: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
    if (error) return toast.error(error.message);
    toast.success("Role updated");
    load();
  };

  const setTeam = async (userId: string, team: string) => {
    const { error } = await supabase.from("profiles").update({ team_level: team as any }).eq("id", userId);
    if (error) return toast.error(error.message);
    toast.success("Team updated");
    load();
  };

  return (
    <AppLayout>
      <PageHeader title="Admin" description="Manage users, roles, and team assignments." />
      <div className="space-y-3">
        {users.map((u) => (
          <Card key={u.id}>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary font-semibold">
                {u.full_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-[180px]">
                <div className="font-semibold">{u.full_name || "(no name)"}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
                {u.phone && <div className="text-xs text-muted-foreground">{u.phone}</div>}
              </div>
              <div className="flex gap-2">
                {u.roles.map((r: string) => <Badge key={r} variant="secondary">{r}</Badge>)}
              </div>
              <Select value={u.roles[0] || "player"} onValueChange={(v) => setRole(u.id, v)}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={u.team_level} onValueChange={(v) => setTeam(u.id, v)}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>{TEAMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}