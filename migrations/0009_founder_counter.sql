-- 0009: Atomic founder-number counter.
--
-- Problem (found by the 1,000-signup load test on a throwaway copy, and
-- reproduced locally with 50 parallel sign-ups -> only 39 distinct
-- numbers): sign-up assigned founder numbers with a read-then-insert
-- COUNT(*)+1, so parallel sign-ups read the same count and received the
-- SAME Founder number (408 duplicates in 1,000).
--
-- Fix: a single counter row in `settings`. Sign-up claims a number with
-- one atomic UPDATE ... RETURNING (see src/app/api/auth/route.ts,
-- claimFounderSlot), which serialises parallel claims on the row lock —
-- two sign-ups can never receive the same number. The counter stores the
-- NEXT number to hand out; this seed initialises it from the highest
-- founder number already issued so existing accounts keep their numbers.
-- Idempotent: re-running never resets an existing counter.
INSERT INTO settings (key, value)
SELECT 'founder_counter',
       jsonb_build_object('next', COALESCE(MAX(founder_number), 0) + 1)
  FROM users
ON CONFLICT (key) DO NOTHING;
