-- Fix Performance Issues (RLS InitPlan, Multiple Permissive Policies, Duplicate Indexes)
-- -----------------------------------------------------------------------------
-- 1. Drop Duplicate Indexes
-- -----------------------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_posts_author;
DROP INDEX IF EXISTS public.posts_author_id_idx;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_slug_unique;
-- -----------------------------------------------------------------------------
-- 2. Drop Duplicate Policies
-- -----------------------------------------------------------------------------
-- Profiles
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
-- Dropping the one without dot
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
-- Posts
DROP POLICY IF EXISTS "Users can view published posts" ON public.posts;
-- -----------------------------------------------------------------------------
-- 3. Fix RLS InitPlan (Wrap auth.uid() in select) & Consolidate
-- -----------------------------------------------------------------------------
-- Profiles
-- Fix: "Users can insert their own profile."
ALTER POLICY "Users can insert their own profile." ON public.profiles WITH CHECK (
    (
        select auth.uid()
    ) = id
);
-- Fix: "Users can update own profile."
ALTER POLICY "Users can update own profile." ON public.profiles USING (
    (
        select auth.uid()
    ) = id
);
-- Comments
-- Fix: "Authenticated users can create comments"
ALTER POLICY "Authenticated users can create comments" ON public.comments WITH CHECK (
    (
        select auth.uid()
    ) = author_id
);
-- Likes
-- Fix: "Users can create likes"
ALTER POLICY "Users can create likes" ON public.likes WITH CHECK (
    (
        select auth.uid()
    ) = user_id
);
-- Fix: "Users can delete their own likes"
ALTER POLICY "Users can delete their own likes" ON public.likes USING (
    (
        select auth.uid()
    ) = user_id
);
-- Posts
-- Fix: "Published posts are viewable by everyone"
-- Redefining to include author visibility to ensure coverage and fix initplan
ALTER POLICY "Published posts are viewable by everyone" ON public.posts USING (
    status = 'published'
    OR (
        select auth.uid()
    ) = author_id
);
-- Fix: "Users can create their own posts"
ALTER POLICY "Users can create their own posts" ON public.posts WITH CHECK (
    (
        select auth.uid()
    ) = author_id
);
-- Fix: "Users can update their own posts"
ALTER POLICY "Users can update their own posts" ON public.posts USING (
    (
        select auth.uid()
    ) = author_id
);
-- Fix: "Users can delete their own posts"
ALTER POLICY "Users can delete their own posts" ON public.posts USING (
    (
        select auth.uid()
    ) = author_id
);
-- Post Categories
-- Fix: "Users can manage categories of their own posts"
-- Problem: It was likely FOR ALL, causing "Multiple permissive policies" for SELECT.
-- Solution: Drop and recreate as separate policies for INSERT, UPDATE, DELETE.
DROP POLICY IF EXISTS "Users can manage categories of their own posts" ON public.post_categories;
CREATE POLICY "Users can insert categories of their own posts" ON public.post_categories FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.posts
            WHERE posts.id = post_id
                AND posts.author_id = (
                    select auth.uid()
                )
        )
    );
CREATE POLICY "Users can update categories of their own posts" ON public.post_categories FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.posts
            WHERE posts.id = post_id
                AND posts.author_id = (
                    select auth.uid()
                )
        )
    );
CREATE POLICY "Users can delete categories of their own posts" ON public.post_categories FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.posts
        WHERE posts.id = post_id
            AND posts.author_id = (
                select auth.uid()
            )
    )
);