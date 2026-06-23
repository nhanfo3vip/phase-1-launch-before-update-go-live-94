-- ============================================================
-- TNTT v2.0 - Part 2: Tables, Schema, Functions & Policies
-- (Run after 20260623000001_add_truong_nganh_enum.sql)
-- ============================================================

-- ============================================================
-- 1. Create branches table
-- ============================================================
CREATE TABLE public.branches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    academic_year_id uuid NOT NULL,
    leader_catechist_id uuid,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT branches_pkey PRIMARY KEY (id),
    CONSTRAINT branches_academic_year_id_fkey FOREIGN KEY (academic_year_id)
        REFERENCES public.academic_years(id) ON DELETE CASCADE,
    CONSTRAINT branches_leader_catechist_id_fkey FOREIGN KEY (leader_catechist_id)
        REFERENCES public.catechists(id) ON DELETE SET NULL,
    CONSTRAINT branches_name_year_unique UNIQUE (name, academic_year_id)
);

CREATE TRIGGER update_branches_updated_at
    BEFORE UPDATE ON public.branches
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- 2. Add branch_id to classes table
-- ============================================================
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.classes ADD CONSTRAINT classes_branch_id_fkey
    FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


-- ============================================================
-- 3. Update learning_materials: make class_id nullable, add branch_id
-- ============================================================
ALTER TABLE public.learning_materials ALTER COLUMN class_id DROP NOT NULL;
ALTER TABLE public.learning_materials ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.learning_materials ADD CONSTRAINT learning_materials_branch_id_fkey
    FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


-- ============================================================
-- 4. Update is_staff() to include truong_nganh
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'truong_nganh', 'glv')
  )
$$;


-- ============================================================
-- 5. Helper function: get branches that a truong_nganh leads
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_led_branches(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT b.id
  FROM public.branches b
  JOIN public.catechists c ON b.leader_catechist_id = c.id
  WHERE c.user_id = _user_id
$$;


-- ============================================================
-- 6. RLS: Enable RLS on branches table
-- ============================================================
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage branches"
    ON public.branches
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Everyone can view branches"
    ON public.branches
    FOR SELECT
    TO authenticated
    USING (true);


-- ============================================================
-- 7. RLS: Truong nganh - classes in their branch
-- ============================================================
CREATE POLICY "Truong nganh can view their branch classes"
    ON public.classes
    FOR SELECT
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'truong_nganh'::public.app_role)
        AND branch_id IN (SELECT public.get_led_branches(auth.uid()))
    );


-- ============================================================
-- 8. RLS: Truong nganh - students in their branch classes
-- ============================================================
CREATE POLICY "Truong nganh can view students in their branches"
    ON public.students
    FOR SELECT
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'truong_nganh'::public.app_role)
        AND class_id IN (
            SELECT id FROM public.classes
            WHERE branch_id IN (SELECT public.get_led_branches(auth.uid()))
        )
    );


-- ============================================================
-- 9. RLS: Truong nganh - attendance in their branches
-- ============================================================
CREATE POLICY "Truong nganh can view attendance in their branches"
    ON public.attendance_records
    FOR SELECT
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'truong_nganh'::public.app_role)
        AND class_id IN (
            SELECT id FROM public.classes
            WHERE branch_id IN (SELECT public.get_led_branches(auth.uid()))
        )
    );

CREATE POLICY "Truong nganh can view attendance sessions in their branches"
    ON public.attendance_sessions
    FOR SELECT
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'truong_nganh'::public.app_role)
        AND class_id IN (
            SELECT id FROM public.classes
            WHERE branch_id IN (SELECT public.get_led_branches(auth.uid()))
        )
    );

CREATE POLICY "Truong nganh can view mass attendance in their branches"
    ON public.mass_attendance
    FOR SELECT
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'truong_nganh'::public.app_role)
        AND student_id IN (
            SELECT id FROM public.students
            WHERE class_id IN (
                SELECT id FROM public.classes
                WHERE branch_id IN (SELECT public.get_led_branches(auth.uid()))
            )
        )
    );


-- ============================================================
-- 10. RLS: Truong nganh - scores in their branches
-- ============================================================
CREATE POLICY "Truong nganh can view scores in their branches"
    ON public.scores
    FOR SELECT
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'truong_nganh'::public.app_role)
        AND class_id IN (
            SELECT id FROM public.classes
            WHERE branch_id IN (SELECT public.get_led_branches(auth.uid()))
        )
    );


-- ============================================================
-- 11. RLS: Learning materials - branch-based access
-- Drop old "Everyone can view materials" policy, replace with smarter one
-- ============================================================
DROP POLICY IF EXISTS "Everyone can view materials" ON public.learning_materials;

CREATE POLICY "Staff can view relevant materials"
    ON public.learning_materials
    FOR SELECT
    TO authenticated
    USING (
        -- Admin: see everything
        public.has_role(auth.uid(), 'admin'::public.app_role)
        -- Truong nganh: their branch materials + Chung (branch_id IS NULL)
        OR (
            public.has_role(auth.uid(), 'truong_nganh'::public.app_role)
            AND (
                branch_id IS NULL
                OR branch_id IN (SELECT public.get_led_branches(auth.uid()))
            )
        )
        -- GLV: Chung + their branch + their specific classes
        OR (
            public.has_role(auth.uid(), 'glv'::public.app_role)
            AND (
                branch_id IS NULL
                OR class_id IN (
                    SELECT cc.class_id
                    FROM public.class_catechists cc
                    JOIN public.catechists c ON cc.catechist_id = c.id
                    WHERE c.user_id = auth.uid()
                )
                OR branch_id IN (
                    SELECT cl.branch_id
                    FROM public.classes cl
                    JOIN public.class_catechists cc2 ON cc2.class_id = cl.id
                    JOIN public.catechists cat ON cc2.catechist_id = cat.id
                    WHERE cat.user_id = auth.uid()
                    AND cl.branch_id IS NOT NULL
                )
            )
        )
    );


-- ============================================================
-- 12. Auto-create 6 default branches when academic year is created
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_academic_year()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    branch_names text[] := ARRAY['Chiên Con', 'Ấu Nhi', 'Thiếu Nhi', 'Nghĩa Sĩ', 'Hiệp Sĩ', 'Dự Trưởng'];
    branch_name text;
BEGIN
    FOREACH branch_name IN ARRAY branch_names LOOP
        INSERT INTO public.branches (name, academic_year_id)
        VALUES (branch_name, NEW.id)
        ON CONFLICT (name, academic_year_id) DO NOTHING;
    END LOOP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_academic_year_created
    AFTER INSERT ON public.academic_years
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_academic_year();
