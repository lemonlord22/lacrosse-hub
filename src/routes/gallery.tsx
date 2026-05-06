import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/AuthGuard";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Check, X, Download, Camera } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/gallery")({ component: () => <AuthGuard><Page /></AuthGuard> });

function Page() {
  const { isStaff } = useAuth();
  return (
    <AppLayout>
      <PageHeader title="The Sideline Gallery" description="The community album — uploads moderated by coaches." />
      <Tabs defaultValue="approved">
        <TabsList>
          <TabsTrigger value="approved">Live Gallery</TabsTrigger>
          {isStaff && <TabsTrigger value="pending">Moderation</TabsTrigger>}
        </TabsList>
        <TabsContent value="approved" className="mt-4"><Approved /></TabsContent>
        {isStaff && <TabsContent value="pending" className="mt-4"><Pending /></TabsContent>}
      </Tabs>
    </AppLayout>
  );
}

const TAGS = ["Varsity", "JV", "Senior Night", "Game Day", "Practice", "General"];

function urlFor(path: string) {
  return supabase.storage.from("gallery-photos").getPublicUrl(path).data.publicUrl;
}

function Approved() {
  const { user, profile } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tag, setTag] = useState("General");
  const [active, setActive] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from("photos").select("*").eq("status", "approved").order("created_at", { ascending: false });
    setPhotos(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const autoTag = () => {
    if (profile?.team_level === "varsity") return "Varsity";
    if (profile?.team_level === "jv") return "JV";
    return tag;
  };

  const upload = async (files: FileList) => {
    if (!user) return;
    setBusy(true);
    const list = Array.from(files).slice(0, 10);
    const inferredTag = autoTag();
    for (const f of list) {
      const path = `${user.id}/${Date.now()}-${f.name}`;
      const { error: e1 } = await supabase.storage.from("gallery-photos").upload(path, f);
      if (e1) { toast.error(e1.message); continue; }
      await supabase.from("photos").insert({ uploader_id: user.id, file_path: path, tag: inferredTag, status: "pending" });
    }
    setBusy(false);
    toast.success(`${list.length} photo(s) submitted for approval`);
    setOpen(false); setTag("General");
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadWatermarked = async (p: any) => {
    const url = urlFor(p.file_path);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const fontSize = Math.max(24, Math.round(img.width / 28));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.strokeStyle = "rgba(0,33,71,0.7)";
      ctx.lineWidth = fontSize / 12;
      const text = "JENSEN BEACH LACROSSE";
      const x = img.width - ctx.measureText(text).width - 20;
      const y = img.height - 20;
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `jb-lax-${p.id}.jpg`;
        a.click();
      }, "image/jpeg", 0.92);
    };
    img.onerror = () => { window.open(url, "_blank"); };
    img.src = url;
  };

  return (
    <div className="relative">
      {photos.length === 0 && <p className="text-sm text-muted-foreground">No approved photos yet.</p>}
      <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
        {photos.map((p) => (
          <button key={p.id} onClick={() => setActive(p)} className="mb-3 block w-full overflow-hidden rounded-lg border bg-card transition-transform hover:scale-[1.01]">
            <img src={urlFor(p.file_path)} alt={p.caption || "photo"} className="w-full" loading="lazy" />
            {p.tag && <div className="p-2 text-left"><Badge variant="secondary" className="text-[10px]">{p.tag}</Badge></div>}
          </button>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="kinetic-button fixed bottom-24 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_40px_-10px_var(--primary)] md:bottom-8"
        aria-label="Upload photos"
      >
        <Camera className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload to Sideline Gallery</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Pick up to 10 photos. They'll go to the moderation queue for coaches to approve.</p>
            <select className="w-full rounded-md border bg-background p-2 text-sm" value={tag} onChange={(e) => setTag(e.target.value)}>
              {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => e.target.files && upload(e.target.files)} className="block w-full text-sm" />
            {busy && <p className="text-xs text-muted-foreground">Uploading…</p>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <DialogContent className="max-w-3xl">
          {active && (
            <div className="space-y-3">
              <img src={urlFor(active.file_path)} alt="" className="w-full rounded-md" />
              <div className="flex items-center justify-between">
                {active.tag && <Badge variant="secondary">{active.tag}</Badge>}
                <Button onClick={() => downloadWatermarked(active)} className="kinetic-button"><Download className="mr-2 h-4 w-4" />Download (HD)</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Pending() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from("photos").select("*").eq("status", "pending").order("created_at", { ascending: false });
    setPhotos(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const decide = async (p: any, status: "approved" | "rejected") => {
    const patch: any = { status };
    if (status === "approved" && user) { patch.approved_by = user.id; patch.approved_at = new Date().toISOString(); }
    const { error } = await supabase.from("photos").update(patch).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Approved" : "Rejected");
    load();
  };

  return (
    <div>
      {photos.length === 0 && <p className="text-sm text-muted-foreground">Inbox zero — no photos pending.</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-lg border bg-card">
            <img src={urlFor(p.file_path)} alt="" className="w-full" loading="lazy" />
            <div className="flex items-center justify-between p-2">
              <Badge variant="outline">{p.tag || "—"}</Badge>
              <div className="flex gap-1">
                <Button size="icon" variant="outline" onClick={() => decide(p, "rejected")} className="kinetic-button"><X className="h-4 w-4" /></Button>
                <Button size="icon" onClick={() => decide(p, "approved")} className="kinetic-button"><Check className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}