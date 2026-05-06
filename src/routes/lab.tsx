import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/AuthGuard";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle2, Circle, Film, Brain, Lock, Play } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/lab")({ component: () => <AuthGuard><Page /></AuthGuard> });

const AUDIENCES = ["all", "varsity", "jv", "parents", "coaches"] as const;

function Page() {
  return (
    <AppLayout>
      <PageHeader title="The Training Lab" description="Daily Drills · Film Room · IQ Tests · Playbook" />
      <Tabs defaultValue="drills" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="drills"><Play className="mr-1 h-3 w-3" />Drills</TabsTrigger>
          <TabsTrigger value="film"><Film className="mr-1 h-3 w-3" />Film</TabsTrigger>
          <TabsTrigger value="iq"><Brain className="mr-1 h-3 w-3" />IQ</TabsTrigger>
          <TabsTrigger value="playbook"><Lock className="mr-1 h-3 w-3" />Playbook</TabsTrigger>
        </TabsList>
        <TabsContent value="drills" className="mt-4"><DrillsTab /></TabsContent>
        <TabsContent value="film" className="mt-4"><FilmTab /></TabsContent>
        <TabsContent value="iq" className="mt-4"><PollsTab /></TabsContent>
        <TabsContent value="playbook" className="mt-4"><PlaybookTab /></TabsContent>
      </Tabs>
    </AppLayout>
  );
}

function DrillsTab() {
  const { user, isStaff } = useAuth();
  const [drills, setDrills] = useState<any[]>([]);
  const [subs, setSubs] = useState<Record<string, any>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", video_url: "", audience: "all", due_at: "" });

  const load = async () => {
    const { data } = await supabase.from("drills").select("*").order("created_at", { ascending: false });
    setDrills(data ?? []);
    if (user) {
      const { data: s } = await supabase.from("drill_submissions").select("*").eq("user_id", user.id);
      const map: Record<string, any> = {};
      (s ?? []).forEach((x: any) => (map[x.drill_id] = x));
      setSubs(map);
    }
  };
  useEffect(() => { load(); }, [user?.id]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("drills").insert({
      ...form,
      due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      created_by: user.id,
      audience: form.audience as any,
    });
    if (error) return toast.error(error.message);
    toast.success("Drill posted");
    setOpen(false);
    setForm({ title: "", description: "", video_url: "", audience: "all", due_at: "" });
    load();
  };

  const markComplete = async (drillId: string) => {
    if (!user) return;
    const { error } = await supabase.from("drill_submissions").upsert(
      { drill_id: drillId, user_id: user.id, status: "complete" },
      { onConflict: "drill_id,user_id" }
    );
    if (error) return toast.error(error.message);
    toast.success("Marked complete");
    load();
  };

  const completedCount = Object.values(subs).filter((s: any) => s.status === "complete").length;
  const pct = drills.length ? Math.round((completedCount / drills.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {!isStaff && drills.length > 0 && (
        <Card className="glassmorphism-dark">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider">
              <span>Training progress</span>
              <span className="font-bold">{completedCount}/{drills.length}</span>
            </div>
            <Progress value={pct} className="h-2" />
          </CardContent>
        </Card>
      )}

      {isStaff && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="kinetic-button"><Plus className="mr-2 h-4 w-4" />Post drill</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New daily drill</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Video URL (YouTube/Vimeo)</Label><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://..." /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Audience</Label>
                  <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Due</Label><Input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full kinetic-button">Post drill</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {drills.length === 0 && <p className="text-sm text-muted-foreground">No drills yet.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {drills.map((d) => {
          const done = subs[d.id]?.status === "complete";
          return (
            <Card key={d.id} className={done ? "border-primary/40" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{d.title}</CardTitle>
                  <Badge variant="outline" className="capitalize">{d.audience}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {d.description && <p className="text-sm text-muted-foreground">{d.description}</p>}
                {d.video_url && (
                  <a href={d.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md border bg-muted/40 p-2 text-xs text-primary hover:bg-muted">
                    <Play className="h-3 w-3" /> Watch drill
                  </a>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {d.due_at ? <span>Due {format(new Date(d.due_at), "MMM d, p")}</span> : <span>No due date</span>}
                  {!isStaff && (
                    <Button size="sm" variant={done ? "secondary" : "default"} className="kinetic-button" onClick={() => markComplete(d.id)} disabled={done}>
                      {done ? <><CheckCircle2 className="mr-1 h-3 w-3" /> Done</> : <><Circle className="mr-1 h-3 w-3" /> Mark complete</>}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function FilmTab() {
  const { user, isStaff } = useAuth();
  const [clips, setClips] = useState<any[]>([]);
  const [activeClip, setActiveClip] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", video_url: "", audience: "all" });
  const [commentText, setCommentText] = useState("");
  const [commentTime, setCommentTime] = useState("0");

  const load = async () => {
    const { data } = await supabase.from("film_clips").select("*").order("created_at", { ascending: false });
    setClips(data ?? []);
    const { data: profs } = await supabase.from("profiles").select("id,full_name");
    const m: Record<string, any> = {};
    (profs ?? []).forEach((p: any) => (m[p.id] = p));
    setProfiles(m);
  };
  useEffect(() => { load(); }, []);

  const loadComments = async (clipId: string) => {
    const { data } = await supabase.from("film_comments").select("*").eq("clip_id", clipId).order("timestamp_seconds");
    setComments(data ?? []);
  };

  useEffect(() => { if (activeClip) loadComments(activeClip.id); }, [activeClip?.id]);

  const createClip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("film_clips").insert({ ...form, created_by: user.id, audience: form.audience as any });
    if (error) return toast.error(error.message);
    toast.success("Film uploaded");
    setOpen(false); setForm({ title: "", description: "", video_url: "", audience: "all" });
    load();
  };

  const addComment = async () => {
    if (!user || !activeClip || !commentText.trim()) return;
    const { error } = await supabase.from("film_comments").insert({
      clip_id: activeClip.id,
      author_id: user.id,
      timestamp_seconds: parseInt(commentTime) || 0,
      body: commentText,
    });
    if (error) return toast.error(error.message);
    setCommentText(""); setCommentTime("0");
    loadComments(activeClip.id);
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      {isStaff && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="kinetic-button"><Plus className="mr-2 h-4 w-4" />Upload film</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New film clip</DialogTitle></DialogHeader>
            <form onSubmit={createClip} className="space-y-3">
              <div><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Video URL</Label><Input required value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://..." /></div>
              <div><Label>Audience</Label>
                <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full kinetic-button">Upload</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {clips.length === 0 && <p className="text-sm text-muted-foreground">No film yet.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {clips.map((c) => (
          <Card key={c.id} className="cursor-pointer hover:border-primary/50" onClick={() => setActiveClip(c)}>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center justify-between">{c.title}<Badge variant="outline" className="capitalize">{c.audience}</Badge></CardTitle></CardHeader>
            <CardContent>
              {c.description && <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
              <div className="mt-2 flex items-center gap-1 text-xs text-primary"><Film className="h-3 w-3" /> Open Film Room</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!activeClip} onOpenChange={(v) => !v && setActiveClip(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{activeClip?.title}</DialogTitle></DialogHeader>
          {activeClip?.video_url && (
            <a href={activeClip.video_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-md bg-secondary p-6 text-secondary-foreground hover:opacity-90">
              <Play className="h-5 w-5" /> Open video
            </a>
          )}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Timestamped notes</h4>
            {comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet.</p>}
            {comments.map((c) => (
              <div key={c.id} className="rounded border p-2 text-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="font-mono">{fmtTime(c.timestamp_seconds)}</Badge>
                  <span>{profiles[c.author_id]?.full_name || "Member"}</span>
                </div>
                <p className="mt-1">{c.body}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t pt-3">
            <Input type="number" min="0" value={commentTime} onChange={(e) => setCommentTime(e.target.value)} placeholder="sec" className="w-20" />
            <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a timestamped note…" onKeyDown={(e) => e.key === "Enter" && addComment()} />
            <Button onClick={addComment} className="kinetic-button">Post</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PollsTab() {
  const { user, isStaff } = useAuth();
  const [polls, setPolls] = useState<any[]>([]);
  const [options, setOptions] = useState<Record<string, any[]>>({});
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [audience, setAudience] = useState("all");
  const [opts, setOpts] = useState<{ label: string; correct: boolean }[]>([{ label: "", correct: false }, { label: "", correct: false }]);

  const load = async () => {
    const { data: ps } = await supabase.from("polls").select("*").order("created_at", { ascending: false });
    setPolls(ps ?? []);
    const { data: os } = await supabase.from("poll_options").select("*").order("sort_order");
    const map: Record<string, any[]> = {};
    (os ?? []).forEach((o: any) => { map[o.poll_id] = [...(map[o.poll_id] || []), o]; });
    setOptions(map);
    if (user) {
      const { data: v } = await supabase.from("poll_votes").select("*").eq("user_id", user.id);
      const m: Record<string, string> = {};
      (v ?? []).forEach((x: any) => (m[x.poll_id] = x.option_id));
      setMyVotes(m);
    }
  };
  useEffect(() => { load(); }, [user?.id]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const validOpts = opts.filter((o) => o.label.trim());
    if (validOpts.length < 2) return toast.error("Need at least 2 options");
    const { data: poll, error } = await supabase.from("polls").insert({ question: q, audience: audience as any, created_by: user.id }).select().single();
    if (error || !poll) return toast.error(error?.message || "Failed");
    await supabase.from("poll_options").insert(validOpts.map((o, i) => ({ poll_id: poll.id, label: o.label, is_correct: o.correct, sort_order: i })));
    toast.success("Poll posted");
    setOpen(false); setQ(""); setOpts([{ label: "", correct: false }, { label: "", correct: false }]);
    load();
  };

  const vote = async (pollId: string, optionId: string) => {
    if (!user) return;
    await supabase.from("poll_votes").upsert({ poll_id: pollId, option_id: optionId, user_id: user.id }, { onConflict: "poll_id,user_id" });
    load();
  };

  return (
    <div className="space-y-4">
      {isStaff && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="kinetic-button"><Plus className="mr-2 h-4 w-4" />New IQ test</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Lacrosse IQ poll</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div><Label>Question</Label><Textarea required value={q} onChange={(e) => setQ(e.target.value)} /></div>
              <div><Label>Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Options (check the correct one)</Label>
                {opts.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="checkbox" checked={o.correct} onChange={(e) => { const c = [...opts]; c.forEach((x, j) => x.correct = j === i ? e.target.checked : false); setOpts(c); }} />
                    <Input value={o.label} onChange={(e) => { const c = [...opts]; c[i].label = e.target.value; setOpts(c); }} />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setOpts([...opts, { label: "", correct: false }])}>Add option</Button>
              </div>
              <Button type="submit" className="w-full kinetic-button">Post</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {polls.length === 0 && <p className="text-sm text-muted-foreground">No IQ tests yet.</p>}
      {polls.map((p) => {
        const ops = options[p.id] || [];
        const voted = myVotes[p.id];
        return (
          <Card key={p.id}>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Brain className="h-4 w-4 text-primary" />{p.question}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {ops.map((o) => {
                const isMine = voted === o.id;
                const showResult = !!voted;
                const correct = o.is_correct;
                return (
                  <button
                    key={o.id}
                    disabled={!!voted}
                    onClick={() => vote(p.id, o.id)}
                    className={`w-full rounded-md border p-3 text-left text-sm transition-colors ${isMine ? "border-primary bg-primary/10" : "hover:bg-muted"} ${showResult && correct ? "border-green-500 bg-green-500/10" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{o.label}</span>
                      {showResult && correct && <Badge className="bg-green-600">Correct</Badge>}
                      {showResult && isMine && !correct && <Badge variant="destructive">Your pick</Badge>}
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function PlaybookTab() {
  const { user, isStaff } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", diagram_url: "", audience: "varsity" });

  const load = async () => {
    const { data } = await supabase.from("playbook_items").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("playbook_items").insert({ ...form, created_by: user.id, audience: form.audience as any });
    if (error) return toast.error(error.message);
    toast.success("Play added");
    setOpen(false); setForm({ title: "", description: "", diagram_url: "", audience: "varsity" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs">
        <Lock className="h-4 w-4 text-primary" /> Restricted: Varsity & Coaches only.
      </div>
      {isStaff && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="kinetic-button"><Plus className="mr-2 h-4 w-4" />Add play</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New playbook entry</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Diagram URL (image)</Label><Input value={form.diagram_url} onChange={(e) => setForm({ ...form, diagram_url: e.target.value })} placeholder="https://..." /></div>
              <div><Label>Restriction</Label>
                <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="varsity">Varsity</SelectItem>
                    <SelectItem value="jv">JV</SelectItem>
                    <SelectItem value="coaches">Coaches only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full kinetic-button">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {items.length === 0 && <p className="text-sm text-muted-foreground">No plays yet.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center justify-between">{p.title}<Badge variant="outline" className="capitalize">{p.audience}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {p.diagram_url && <img src={p.diagram_url} alt={p.title} className="w-full rounded-md border" />}
              {p.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.description}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}