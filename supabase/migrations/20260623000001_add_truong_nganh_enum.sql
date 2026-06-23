-- ============================================================
-- TNTT v2.0 - Part 1: Add enum value only
-- Must be separate from other changes due to PostgreSQL restriction
-- on using new enum values within the same transaction.
-- ============================================================

-- 1. Add 'truong_nganh' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'truong_nganh';
