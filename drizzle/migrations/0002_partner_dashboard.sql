CREATE OR REPLACE FUNCTION public.grant_owner_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND lower(NEW.email) = 'odinga.billy@lucene.co' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.my_inquiries()
RETURNS TABLE (id uuid, organization text, project_needs text, fleet_size text, status text, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.id, i.organization, i.project_needs, i.fleet_size, i.status, i.created_at, i.updated_at
  FROM public.partnership_inquiries i
  JOIN auth.users u ON u.id = auth.uid()
  WHERE u.email_confirmed_at IS NOT NULL AND lower(i.email) = lower(u.email)
  ORDER BY i.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.my_inquiry_replies()
RETURNS TABLE (id uuid, inquiry_id uuid, body text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.inquiry_id, a.body, a.created_at
  FROM public.inquiry_activity a
  JOIN public.partnership_inquiries i ON i.id = a.inquiry_id
  JOIN auth.users u ON u.id = auth.uid()
  WHERE a.kind = 'reply' AND u.email_confirmed_at IS NOT NULL AND lower(i.email) = lower(u.email)
  ORDER BY a.created_at ASC
$$;

REVOKE EXECUTE ON FUNCTION public.my_inquiries() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.my_inquiry_replies() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_inquiries() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_inquiry_replies() TO authenticated;