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
import { Pin, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/announcements")({ component: () => <AuthGuard><Page /></AuthGuard> });

function Page() {
  const { user, isStaff } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [pinned, setPinned] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("announcements").insert({ title, body, audience: audience as any, pinned, author_id: user.id });
    if (error) return toast.error(error.message);
    toast.success("Posted");
    setTitle(""); setBody(""); setAudience("all"); setPinned(false); setOpen(false);
    load();
  };

  const togglePin = async (a: any) => {
    await supabase.from("announcements").update({ pinned: !a.pinned }).eq("id", a.id);
    load();
  };
  const remove = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    load();
  };

  return (
    <AppLayout>
      <PageHeader
        title="Announcements"
        description="Updates from coaches and admins."
        action={isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New announcement</DialogTitle></DialogHeader>
              <form onSubmit={create} className="space-y-3">
                <div><Label>Title</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div><Label>Message</Label><Textarea required rows={5} value={body} onChange={(e) => setBody(e.target.value)} /></div>
                <div><Label>Audience</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="parents">Parents</SelectItem>
                      <SelectItem value="jv">JV</SelectItem>
                      <SelectItem value="varsity">Varsity</SelectItem>
                      <SelectItem value="coaches">Coaches</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin to top</label>
                <Button type="submit" className="w-full">Post</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      />

      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
        {items.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                {a.pinned && <Pin className="h-4 w-4 text-primary" />}
                <h3 className="font-display text-lg font-semibold">{a.title}</h3>
                <Badge variant="secondary" className="capitalize">{a.audience}</Badge>
                <span className="ml-auto text-xs text-muted-foreground">{format(new Date(a.created_at), "MMM d, p")}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{a.body}</p>
              {isStaff && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => togglePin(a)}><Pin className="mr-1 h-3 w-3" /> {a.pinned ? "Unpin" : "Pin"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}