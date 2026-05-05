import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Megaphone, Calendar, MessageSquare, FolderOpen, ClipboardCheck, ShieldCheck } from "lucide-react";
import heroImg from "@/assets/hero-lacrosse.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LaxHub — Team comms for high school lacrosse" },
      { name: "description", content: "Private team app for coaches, players, and parents. Announcements, schedules, RSVPs, group chats, and documents — all in one place." },
    ],
  }),
  component: Index,
});

function Index() {
  const features = [
    { icon: Megaphone, title: "Announcements", desc: "Coach posts hit every parent and player instantly." },
    { icon: Calendar, title: "Schedule", desc: "Games, practices, locations, and live changes." },
    { icon: ClipboardCheck, title: "RSVPs", desc: "Going / maybe / no — coaches see the count in real time." },
    { icon: MessageSquare, title: "Group chats", desc: "Separate rooms for JV, Varsity, Parents, Coaches." },
    { icon: FolderOpen, title: "Documents", desc: "Handbooks, forms, and game day info — one hub." },
    { icon: ShieldCheck, title: "Private & secure", desc: "Role-based access for the whole program." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary">L</span>
          LaxHub
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Join the team</Link>
          </Button>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={heroImg} alt="Lacrosse player at night under stadium lights" width={1600} height={1024} className="h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)", opacity: 0.85 }} />
        </div>
        <div className="mx-auto flex min-h-[600px] max-w-6xl flex-col justify-center px-6 py-32 md:py-40">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white backdrop-blur">
            Built for high school lacrosse
          </span>
          <h1 className="max-w-3xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-white md:text-7xl">
            One app for every player, parent, and coach.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/80 md:text-xl">
            Stop juggling TeamReach, group texts, and Google Classroom. LaxHub puts announcements, schedules, RSVPs, chats, and team docs in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="text-base shadow-lg" style={{ background: "var(--gradient-primary)" }}>
              <Link to="/auth">Create your account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white">
              <Link to="/auth">I already have one</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Everything the program needs.</h2>
          <p className="mt-3 text-muted-foreground">Designed to replace the patchwork of tools coaches and parents are stuck with.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-xl border bg-card p-6 transition-shadow hover:shadow-[var(--shadow-card)]">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t bg-secondary py-8 text-center text-sm text-secondary-foreground/70">
        <p>© LaxHub — Built for the team.</p>
      </footer>
    </div>
  );
}
