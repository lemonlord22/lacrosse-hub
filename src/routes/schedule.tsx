import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/AuthGuard";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, MapPin, Trash2, Check, X, HelpCircle } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/schedule")({ component: () => <AuthGuard><Page /></AuthGuard> });

type RsvpStatus = "going" | "maybe" | "not_going";

function Page() {
  const { user, isStaff } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, RsvpStatus>>({});
  const [counts, setCounts] = useState<Record<string, { going: number; maybe: number; not_going: number }>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", start_at: "", location: "", map_url: "", audience: "all", notes: "" });

  const load = async () => {
    const { data: ev } = await supabase.from("events").select("*").order("start_at");
    setEvents(ev ?? []);
    if (user) {
      const { data: rs } = await supabase.from("rsvps").select("event_id,status").eq("user_id", user.id);
      const map: Record<string, RsvpStatus> = {};
      (rs ?? []).forEach((r: any) => (map[r.event_id] = r.status));
      setRsvps(map);
    }
    const { data: all } = await supabase.from("rsvps").select("event_id,status");
    const c: Record<string, any> = {};
    (all ?? []).forEach((r: any) => {
      c[r.event_id] = c[r.event_id] || { going: 0, maybe: 0, not_going: 0 };
      c[r.event_id][r.status]++;
    });
    setCounts(c);
  };
  useEffect(() => { load(); }, [user]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("events").insert({
      title: form.title, description: form.description, start_at: new Date(form.start_at).toISOString(),
      location: form.location, map_url: form.map_url, audience: form.audience as any, notes: form.notes, created_by: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Event created");
    setForm({ title: "", description: "", start_at: "", location: "", map_url: "", audience: "all", notes: "" });
    setOpen(false);
    load();
  };

  const rsvp = async (eventId: string, status: RsvpStatus) => {
    if (!user) return;
    const { error } = await supabase.from("rsvps").upsert({ event_id: eventId, user_id: user.id, status }, { onConflict: "event_id,user_id" });
    if (error) return toast.error(error.message);
    setRsvps((r) => ({ ...r, [eventId]: status }));
    load();
  };

  const remove = async (id: string) => { await supabase.from("events").delete().eq("id", id); load(); };

  return (
    <AppLayout>
      <PageHeader
        title="Schedule"
        description="Games, practices, and team events."
        action={isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add event</Button></DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>New event</DialogTitle></DialogHeader>
              <form onSubmit={create} className="space-y-3">
                <div><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Date & time</Label><Input type="datetime-local" required value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} /></div>
                <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                <div><Label>Map link</Label><Input value={form.map_url} onChange={(e) => setForm({ ...form, map_url: e.target.value })} placeholder="https://maps.google.com/..." /></div>
                <div><Label>Audience</Label>
                  <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="jv">JV</SelectItem>
                      <SelectItem value="varsity">Varsity</SelectItem>
                      <SelectItem value="parents">Parents</SelectItem>
                      <SelectItem value="coaches">Coaches</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Coach notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      />

      <div className="space-y-4">
        {events.length === 0 && <p className="text-sm text-muted-foreground">No events scheduled.</p>}
        {events.map((e) => {
          const c = counts[e.id] || { going: 0, maybe: 0, not_going: 0 };
          const my = rsvps[e.id];
          return (
            <Card key={e.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
                    <div className="text-center text-primary-foreground">
                      <div className="text-[10px] uppercase">{format(new Date(e.start_at), "MMM")}</div>
                      <div className="text-xl font-bold leading-none">{format(new Date(e.start_at), "d")}</div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-semibold">{e.title}</h3>
                      <Badge variant="secondary" className="capitalize">{e.audience}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{format(new Date(e.start_at), "EEE, MMM d · p")}</p>
                    {e.location && (
                      <p className="mt-1 flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" /> {e.map_url ? <a href={e.map_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{e.location}</a> : e.location}
                      </p>
                    )}
                    {e.description && <p className="mt-2 text-sm">{e.description}</p>}
                    {e.notes && <p className="mt-2 rounded-md bg-accent/40 p-2 text-xs"><strong>Coach: </strong>{e.notes}</p>}
                  </div>
                  {isStaff && <Button size="icon" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4" /></Button>}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
                  <span className="text-xs text-muted-foreground mr-2">RSVP:</span>
                  <Button size="sm" variant={my === "going" ? "default" : "outline"} onClick={() => rsvp(e.id, "going")}><Check className="mr-1 h-3 w-3" /> Going · {c.going}</Button>
                  <Button size="sm" variant={my === "maybe" ? "default" : "outline"} onClick={() => rsvp(e.id, "maybe")}><HelpCircle className="mr-1 h-3 w-3" /> Maybe · {c.maybe}</Button>
                  <Button size="sm" variant={my === "not_going" ? "default" : "outline"} onClick={() => rsvp(e.id, "not_going")}><X className="mr-1 h-3 w-3" /> No · {c.not_going}</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
}