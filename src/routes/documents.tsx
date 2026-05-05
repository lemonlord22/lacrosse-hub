import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/AuthGuard";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Search } from "lucide-react";
import { format } from "date-fns";

const CATEGORIES = ["Practice plans", "Player handbook", "Team rules", "Travel", "Parent forms", "Game day", "School docs", "General"];

export const Route = createFileRoute("/documents")({ component: () => <AuthGuard><Page /></AuthGuard> });

function Page() {
  const { user, isStaff } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
    setDocs(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;
    setBusy(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("team-documents").upload(path, file);
    if (upErr) { setBusy(false); return toast.error(upErr.message); }
    const { error } = await supabase.from("documents").insert({ name: name || file.name, category, file_path: path, uploaded_by: user.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Uploaded");
    setFile(null); setName(""); setCategory("General"); setOpen(false);
    load();
  };

  const download = async (d: any) => {
    const { data } = supabase.storage.from("team-documents").getPublicUrl(d.file_path);
    window.open(data.publicUrl, "_blank");
  };

  const remove = async (d: any) => {
    await supabase.storage.from("team-documents").remove([d.file_path]);
    await supabase.from("documents").delete().eq("id", d.id);
    load();
  };

  const filtered = docs.filter((d) => (filter === "all" || d.category === filter) && d.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppLayout>
      <PageHeader
        title="Documents"
        description="Handbooks, forms, practice plans, and game day info."
        action={isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Upload className="mr-2 h-4 w-4" /> Upload</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload document</DialogTitle></DialogHeader>
              <form onSubmit={upload} className="space-y-3">
                <div><Label>File</Label><Input type="file" required onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
                <div><Label>Display name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="(optional)" /></div>
                <div><Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>Upload</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No documents.</p>}
        {filtered.map((d) => (
          <Card key={d.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
              <div className="flex-1 min-w-0">
                <button onClick={() => download(d)} className="block w-full truncate text-left text-sm font-semibold hover:text-primary">{d.name}</button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">{d.category}</Badge>
                  <span>{format(new Date(d.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>
              {isStaff && <Button size="icon" variant="ghost" onClick={() => remove(d)}><Trash2 className="h-4 w-4" /></Button>}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}