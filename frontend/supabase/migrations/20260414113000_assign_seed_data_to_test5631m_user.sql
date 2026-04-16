DO $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id
  INTO target_user_id
  FROM auth.users
  WHERE lower(email) = lower('test5631m@gmail.com')
  ORDER BY created_at ASC
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found in auth.users', 'test5631m@gmail.com';
  END IF;

  -- Assign only pre-existing unowned records.
  UPDATE public.categories
  SET user_id = target_user_id
  WHERE user_id IS NULL;

  UPDATE public.brands
  SET user_id = target_user_id
  WHERE user_id IS NULL;

  UPDATE public.products
  SET user_id = target_user_id
  WHERE user_id IS NULL;

  UPDATE public.sales
  SET user_id = target_user_id
  WHERE user_id IS NULL;

  UPDATE public.purchases
  SET user_id = target_user_id
  WHERE user_id IS NULL;
END $$;