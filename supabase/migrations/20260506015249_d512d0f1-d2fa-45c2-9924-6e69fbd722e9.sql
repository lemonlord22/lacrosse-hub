-- Training Lab tables

CREATE TABLE public.drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  audience public.audience NOT NULL DEFAULT 'all',
  due_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.drills ENABLE ROW LEVEL SECURITY;
CREATE POLICY drills_select ON public.drills FOR SELECT TO authenticated USING (public.can_see_audience(auth.uid(), audience));
CREATE POLICY drills_insert_staff ON public.drills FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());
CREATE POLICY drills_update_staff ON public.drills FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY drills_delete_staff ON public.drills FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.drill_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_id UUID NOT NULL REFERENCES public.drills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'complete',
  clip_url TEXT,
  note TEXT,
  coach_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(drill_id, user_id)
);
ALTER TABLE public.drill_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ds_select ON public.drill_submissions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY ds_insert ON public.drill_submissions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY ds_update ON public.drill_submissions FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY ds_delete ON public.drill_submissions FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TABLE public.film_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  audience public.audience NOT NULL DEFAULT 'all',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.film_clips ENABLE ROW LEVEL SECURITY;
CREATE POLICY film_select ON public.film_clips FOR SELECT TO authenticated USING (public.can_see_audience(auth.uid(), audience));
CREATE POLICY film_insert_staff ON public.film_clips FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());
CREATE POLICY film_update_staff ON public.film_clips FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY film_delete_staff ON public.film_clips FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.film_clip_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID NOT NULL REFERENCES public.film_clips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  UNIQUE(clip_id, user_id)
);
ALTER TABLE public.film_clip_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY fct_select ON public.film_clip_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY fct_write_staff ON public.film_clip_tags FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.film_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID NOT NULL REFERENCES public.film_clips(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  timestamp_seconds INTEGER NOT NULL DEFAULT 0,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.film_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY fc_select ON public.film_comments FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.film_clip_tags WHERE clip_id = film_comments.clip_id AND user_id = auth.uid())
  OR author_id = auth.uid()
);
CREATE POLICY fc_insert ON public.film_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY fc_delete ON public.film_comments FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.is_staff(auth.uid()));

-- Polls
CREATE TABLE public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  audience public.audience NOT NULL DEFAULT 'all',
  closes_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY polls_select ON public.polls FOR SELECT TO authenticated USING (public.can_see_audience(auth.uid(), audience));
CREATE POLICY polls_write_staff ON public.polls FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());

CREATE TABLE public.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY po_select ON public.poll_options FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.can_see_audience(auth.uid(), p.audience))
);
CREATE POLICY po_write_staff ON public.poll_options FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY pv_select ON public.poll_votes FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY pv_insert ON public.poll_votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY pv_update ON public.poll_votes FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY pv_delete ON public.poll_votes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Playbook
CREATE TABLE public.playbook_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  diagram_url TEXT,
  audience public.audience NOT NULL DEFAULT 'varsity',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.playbook_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY pb_select ON public.playbook_items FOR SELECT TO authenticated USING (public.can_see_audience(auth.uid(), audience));
CREATE POLICY pb_write_staff ON public.playbook_items FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());

-- Sideline Gallery
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  caption TEXT,
  tag TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY photos_select ON public.photos FOR SELECT TO authenticated USING (
  status = 'approved' OR uploader_id = auth.uid() OR public.is_staff(auth.uid())
);
CREATE POLICY photos_insert ON public.photos FOR INSERT TO authenticated WITH CHECK (uploader_id = auth.uid());
CREATE POLICY photos_update_staff_or_own ON public.photos FOR UPDATE TO authenticated USING (uploader_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY photos_delete_staff_or_own ON public.photos FOR DELETE TO authenticated USING (uploader_id = auth.uid() OR public.is_staff(auth.uid()));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery-photos', 'gallery-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('drill-clips', 'drill-clips', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('film-videos', 'film-videos', false) ON CONFLICT DO NOTHING;

-- gallery-photos: anyone authenticated can upload to their own folder; everyone reads
CREATE POLICY gallery_read ON storage.objects FOR SELECT USING (bucket_id = 'gallery-photos');
CREATE POLICY gallery_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY gallery_update_own_or_staff ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'gallery-photos' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff(auth.uid())));
CREATE POLICY gallery_delete_own_or_staff ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery-photos' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff(auth.uid())));

-- drill-clips: players upload to their own folder; everyone authenticated reads
CREATE POLICY clips_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'drill-clips');
CREATE POLICY clips_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'drill-clips' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY clips_delete_own_or_staff ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'drill-clips' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff(auth.uid())));

-- film-videos: staff only
CREATE POLICY film_read_authenticated ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'film-videos');
CREATE POLICY film_write_staff ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'film-videos' AND public.is_staff(auth.uid()));
CREATE POLICY film_delete_staff ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'film-videos' AND public.is_staff(auth.uid()));

CREATE TRIGGER ds_touch BEFORE UPDATE ON public.drill_submissions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();