
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'coach', 'player', 'parent');
CREATE TYPE public.team_level AS ENUM ('jv', 'varsity', 'parent', 'coach', 'none');
CREATE TYPE public.chat_room AS ENUM ('parents', 'jv', 'varsity', 'coaches', 'all');
CREATE TYPE public.rsvp_status AS ENUM ('going', 'maybe', 'not_going');
CREATE TYPE public.audience AS ENUM ('all', 'parents', 'jv', 'varsity', 'coaches');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  team_level public.team_level NOT NULL DEFAULT 'none',
  child_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','coach')) $$;

CREATE OR REPLACE FUNCTION public.get_team_level(_user_id UUID)
RETURNS public.team_level LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT team_level FROM public.profiles WHERE id = _user_id $$;

-- Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience public.audience NOT NULL DEFAULT 'all',
  pinned BOOLEAN NOT NULL DEFAULT false,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  location TEXT,
  map_url TEXT,
  audience public.audience NOT NULL DEFAULT 'all',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RSVPs
CREATE TABLE public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.rsvp_status NOT NULL,
  comment TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  file_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room public.chat_room NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, team_level, child_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'team_level')::public.team_level, 'none'),
    NEW.raw_user_meta_data->>'child_name'
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'player'));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER rsvps_updated BEFORE UPDATE ON public.rsvps
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Audience visibility helper
CREATE OR REPLACE FUNCTION public.can_see_audience(_user_id UUID, _audience public.audience)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR _audience = 'all'
    OR (_audience = 'coaches' AND public.is_staff(_user_id))
    OR (_audience = 'parents' AND (public.get_team_level(_user_id) = 'parent' OR public.is_staff(_user_id)))
    OR (_audience = 'jv' AND (public.get_team_level(_user_id) = 'jv' OR public.is_staff(_user_id)))
    OR (_audience = 'varsity' AND (public.get_team_level(_user_id) = 'varsity' OR public.is_staff(_user_id)))
$$;

CREATE OR REPLACE FUNCTION public.can_see_room(_user_id UUID, _room public.chat_room)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR _room = 'all'
    OR (_room = 'coaches' AND public.is_staff(_user_id))
    OR (_room = 'parents' AND (public.get_team_level(_user_id) = 'parent' OR public.is_staff(_user_id)))
    OR (_room = 'jv' AND (public.get_team_level(_user_id) = 'jv' OR public.is_staff(_user_id)))
    OR (_room = 'varsity' AND (public.get_team_level(_user_id) = 'varsity' OR public.is_staff(_user_id)))
$$;

-- RLS Policies

-- profiles
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_admin_delete" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "roles_select_own_or_admin" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- announcements
CREATE POLICY "ann_select" ON public.announcements FOR SELECT TO authenticated
USING (public.can_see_audience(auth.uid(), audience));
CREATE POLICY "ann_insert_staff" ON public.announcements FOR INSERT TO authenticated
WITH CHECK (public.is_staff(auth.uid()) AND author_id = auth.uid());
CREATE POLICY "ann_update_staff" ON public.announcements FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid()));
CREATE POLICY "ann_delete_staff" ON public.announcements FOR DELETE TO authenticated
USING (public.is_staff(auth.uid()));

-- events
CREATE POLICY "events_select" ON public.events FOR SELECT TO authenticated
USING (public.can_see_audience(auth.uid(), audience));
CREATE POLICY "events_insert_staff" ON public.events FOR INSERT TO authenticated
WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "events_update_staff" ON public.events FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid()));
CREATE POLICY "events_delete_staff" ON public.events FOR DELETE TO authenticated
USING (public.is_staff(auth.uid()));

-- rsvps
CREATE POLICY "rsvps_select_own_or_staff" ON public.rsvps FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "rsvps_upsert_own" ON public.rsvps FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "rsvps_update_own" ON public.rsvps FOR UPDATE TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "rsvps_delete_own" ON public.rsvps FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- documents
CREATE POLICY "docs_select" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "docs_insert_staff" ON public.documents FOR INSERT TO authenticated
WITH CHECK (public.is_staff(auth.uid()) AND uploaded_by = auth.uid());
CREATE POLICY "docs_delete_staff" ON public.documents FOR DELETE TO authenticated
USING (public.is_staff(auth.uid()));

-- messages
CREATE POLICY "msgs_select" ON public.messages FOR SELECT TO authenticated
USING (public.can_see_room(auth.uid(), room));
CREATE POLICY "msgs_insert" ON public.messages FOR INSERT TO authenticated
WITH CHECK (public.can_see_room(auth.uid(), room) AND author_id = auth.uid());
CREATE POLICY "msgs_update_own_or_staff" ON public.messages FOR UPDATE TO authenticated
USING (author_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "msgs_delete_own_or_staff" ON public.messages FOR DELETE TO authenticated
USING (author_id = auth.uid() OR public.is_staff(auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('team-documents', 'team-documents', true);

CREATE POLICY "team_docs_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'team-documents');
CREATE POLICY "team_docs_upload_staff" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'team-documents' AND public.is_staff(auth.uid()));
CREATE POLICY "team_docs_delete_staff" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'team-documents' AND public.is_staff(auth.uid()));
