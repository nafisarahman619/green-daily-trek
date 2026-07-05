CREATE TABLE public.tree_plantings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tree_plantings TO authenticated;
GRANT ALL ON public.tree_plantings TO service_role;
ALTER TABLE public.tree_plantings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tree plantings" ON public.tree_plantings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can view all tree plantings" ON public.tree_plantings FOR SELECT TO authenticated USING (true);