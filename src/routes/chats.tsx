import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/AuthGuard";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Pin, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const ROOMS = [
  { id: "all", label: "All Program" },
  { id: "varsity", label: "Varsity" },
  { id: "jv", label: "JV" },
  { id: "parents", label: "Parents" },
  { id: "coaches", label: "Coaches" },
] as const;

export const Route = createFileRoute("/chats")({
  validateSearch: (s: Record<string, unknown>) => ({ room: (s.room as string) || "all" }),
  component: () => <AuthGuard><Page /></AuthGuard>,
});

function Page() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { user, profile, isStaff, roles } = useAuth();
  const [room, setRoom] = useState<string>(search.room);
  const [messages, setMessages] = useState<any[]>([]);
  const [authors, setAuthors] = useState<Record<string, any>>({});
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // restrict rooms by role
  const visibleRooms = ROOMS.filter((r) => {
    if (roles.includes("admin")) return true;
    if (r.id === "all") return true;
    if (r.id === "coaches") return isStaff;
    if (r.id === "parents") return profile?.team_level === "parent" || isStaff;
    if (r.id === "jv") return profile?.team_level === "jv" || isStaff;
    if (r.id === "varsity") return profile?.team_level === "varsity" || isStaff;
    return false;
  });

  const load = async () => {
    const { data, error } = await supabase.from("messages").select("*").eq("room", room as any).order("created_at");
    if (error) return;
    setMessages(data ?? []);
    const ids = [...new Set((data ?? []).map((m: any) => m.author_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,full_name,team_level").in("id", ids);
      const map: Record<string, any> = {};
      (profs ?? []).forEach((p: any) => (map[p.id] = p));
      setAuthors(map);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`room:${room}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `room=eq.${room}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [room]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    const { error } = await supabase.from("messages").insert({ room: room as any, body: text.trim(), author_id: user.id });
    if (error) return toast.error(error.message);
    setText("");
  };

  const togglePin = async (m: any) => { await supabase.from("messages").update({ pinned: !m.pinned }).eq("id", m.id); };
  const remove = async (id: string) => { await supabase.from("messages").delete().eq("id", id); };

  const pinned = messages.filter((m) => m.pinned);

  return (
    <AppLayout>
      <PageHeader title="Group Chats" description="Talk with your team in real time." />
      <div className="grid gap-4 md:grid-cols-[200px_1fr]">
        <div className="flex flex-row gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {visibleRooms.map((r) => (
            <button
              key={r.id}
              onClick={() => { setRoom(r.id); navigate({ search: { room: r.id } }); }}
              className={cn(
                "shrink-0 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                room === r.id ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex h-[70vh] flex-col rounded-xl border bg-card">
          {pinned.length > 0 && (
            <div className="border-b bg-accent/30 p-2 text-xs">
              <Pin className="mr-1 inline h-3 w-3" /> {pinned.length} pinned
            </div>
          )}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && <p className="text-center text-sm text-muted-foreground">No messages yet — say hi!</p>}
            {messages.map((m) => {
              const mine = m.author_id === user?.id;
              const author = authors[m.author_id];
              return (
                <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                  <div className={cn("max-w-[80%] rounded-2xl px-3 py-2", mine ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    {!mine && <div className="text-[10px] font-semibold opacity-70">{author?.full_name || "Member"}</div>}
                    <div className="whitespace-pre-wrap text-sm">{m.body}</div>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{format(new Date(m.created_at), "p")}</span>
                    {m.pinned && <Pin className="h-3 w-3 text-primary" />}
                    {(mine || isStaff) && (
                      <>
                        {isStaff && <button onClick={() => togglePin(m)} className="hover:text-foreground">{m.pinned ? "unpin" : "pin"}</button>}
                        <button onClick={() => remove(m.id)} className="hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <form onSubmit={send} className="flex gap-2 border-t p-3">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message..." />
            <Button type="submit"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}