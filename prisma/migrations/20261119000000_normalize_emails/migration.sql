-- The API now lower-cases and trims every email it receives, so stored ones
-- must match or their owners could no longer sign in, and a block on
-- "foo@x.com" would miss an existing "Foo@x.com".
--
-- Rows whose normalized email already belongs to another row are left as they
-- are instead of failing the migration (which runs on every deploy and would
-- keep the API from starting). Find them afterwards with:
--   SELECT lower(trim(email)), count(*) FROM "Org"
--   GROUP BY 1 HAVING count(*) > 1;

UPDATE "Org" AS o
SET "email" = lower(trim(o."email"))
WHERE o."email" <> lower(trim(o."email"))
  AND NOT EXISTS (
    SELECT 1 FROM "Org" AS other
    WHERE other."id" <> o."id"
      AND lower(trim(other."email")) = lower(trim(o."email"))
  );

UPDATE "BlockedContact" AS b
SET "value" = lower(trim(b."value"))
WHERE b."kind" = 'Email'
  AND b."value" <> lower(trim(b."value"))
  AND NOT EXISTS (
    SELECT 1 FROM "BlockedContact" AS other
    WHERE other."id" <> b."id"
      AND other."kind" = 'Email'
      AND lower(trim(other."value")) = lower(trim(b."value"))
  );
