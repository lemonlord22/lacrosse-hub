import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthGuard } from "@/components/AuthGuard";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Calendar, MessageSquare, FolderOpen, Pin } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard")({ component: () => <AuthGuard><Dashboard /></AuthGuard> });

function Dashboard() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(4).then(({ data }) => setAnnouncements(data ?? []));
    supabase.from("events").select("*").gte("start_at", new Date().toISOString()).order("start_at").limit(4).then(({ data }) => setEvents(data ?? []));
    supabase.from("documents").select("*").order("created_at", { ascending: false }).limit(4).then(({ data }) => setDocs(data ?? []));
  }, []);

  return (
    <AppLayout>
      <PageHeader title={`Welcome, ${profile?.full_name?.split(" ")[0] || "Team"}`} description="Here's what's happening with the program." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-4 w-4 text-primary" /> Latest announcements</CardTitle>
            <Link to="/announcements" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
            {announcements.map((a) => (
              <div key={a.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  {a.pinned && <Pin className="h-3 w-3 text-primary" />}
                  <h3 className="font-semibold text-sm">{a.title}</h3>
                  <Badge variant="secondary" className="ml-auto text-xs capitalize">{a.audience}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-primary" /> Upcoming events</CardTitle>
            <Link to="/schedule" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 && <p className="text-sm text-muted-foreground">Nothing on the schedule yet.</p>}
            {events.map((e) => (
              <div key={e.id} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-primary">
                  <div className="text-center">
                    <div className="text-[10px] uppercase">{format(new Date(e.start_at), "MMM")}</div>
                    <div className="text-lg font-bold leading-none">{format(new Date(e.start_at), "d")}</div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold truncate">{e.title}</h3>
                  <p className="text-xs text-muted-foreground">{format(new Date(e.start_at), "p")} · {e.location || "TBD"}</p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">{e.audience}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base"><FolderOpen className="h-4 w-4 text-primary" /> Recent documents</CardTitle>
            <Link to="/documents" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {docs.length === 0 && <p className="text-sm text-muted-foreground">No documents yet.</p>}
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span className="truncate">{d.name}</span>
                <Badge variant="outline" className="text-xs">{d.category}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4 text-primary" /> Quick chats</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {["all", "varsity", "jv", "parents"].map((r) => (
              <Link key={r} to="/chats" search={{ room: r } as any} className="rounded-md border p-3 text-sm capitalize transition-colors hover:bg-accent">
                {r === "all" ? "All program" : r}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}