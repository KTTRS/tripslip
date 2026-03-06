DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tgname FROM pg_trigger t 
    WHERE t.tgrelid = 'public.permission_slips'::regclass
    AND NOT t.tgisinternal
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON permission_slips';
    RAISE NOTICE 'Dropped trigger: %', r.tgname;
  END LOOP;
END $$;
