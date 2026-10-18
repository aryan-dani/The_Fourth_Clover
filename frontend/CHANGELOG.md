# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-10-18

### Phase 3: CSI Tech Blog, Editorial Review Workflow, and Rich Markdown Engine

This release introduces the dedicated CSI MIT-WPU Tech Blog publication (`/csi`), a multi-role editorial review workflow (`draft -> in_review -> published`), sanitized Markdown rendering with syntax highlighting, and inline multi-image uploads.

### Added

- **Publications & Review Schema (`supabase/migrations/20261018150000_add_csi_publications.sql`)**:
  - Added `publications` and `publication_members` (`writer` and `editor` roles) tables with RLS policies and seeded the `csi` publication.
  - Extended `posts` with `publication_id`, `review_note`, and `in_review` status, backed by restrictive RLS policies and a `BEFORE INSERT OR UPDATE` trigger preventing writers from self-publishing publication posts.
  - Extended `notifications.type` with `review_submitted`, `review_approved`, and `changes_requested`.
- **CSI Tech Blog Routes**:
  - `/csi`: Landing page with mission hero, featured technical post, tag filter chips, paginated post grid, and an "Our Writers" member strip.
  - `/csi/[slug]`: Technical article view with sticky Table of Contents (`h2`/`h3`), syntax-highlighted code blocks, responsive figures with captions, author card, and "More from CSI" recommendations.
  - `/csi/write`: Member-gated editor supporting draft saves and one-click submission to the CSI editorial review queue.
  - `/csi/review`: Editor-only queue for CSI Technical Leads and Secretaries to inspect rendered Markdown, approve and publish, or return drafts with editorial notes.
  - `/csi/feed.xml`: Dedicated RSS 2.0 feed for published CSI articles.
- **Rich Markdown Renderer & Inline Image Uploads**:
  - Built `PostBodyRenderer` using `react-markdown`, `remark-gfm`, `rehype-sanitize`, and `rehype-highlight`, with automatic fallback to paragraph blocks for legacy plain-text posts.
  - Added an "Insert image" toolbar button, drag-and-drop, and clipboard image paste in `WriteEditorForm` with a required alt-text dialog and a live `Write | Preview` toggle.

### Changed

- **Navigation, Dashboard, and Admin**:
  - Added `CSI` navigation links to `Header` and `Footer`.
  - Updated `DashboardClient` with an `In Review` tab, `CSI` publication badges, and review-aware status actions.
  - Updated `AdminPage` with a `CSI Members` tab to assign or remove CSI writers and editors.
  - Updated `sitemap.ts` and `robots.ts` to index `/csi` and `/csi/[slug]` while disallowing `/write`, `/csi/write`, and `/csi/review`.

---

## [1.1.0] - 2026-05-10

### Phase 2: Performance Output & Render Architecture

This release focuses heavily on stripping JavaScript payload bloat, fixing layout shift algorithms, and ensuring Next.js strict adherence regarding Server & Client boundaries.

### Added

- **Global `LazyMotion` Infrastructure**: Animated framer components were wrapped and migrated to `<m.div>` tags fed by `domAnimation`, slicing the main thread payload size aggressively.
- **Image Shift Stabilization**: Re-engineered `<Image>` blocks across all feed and profile pages to properly load sizing vectors with `bg-muted/30` fallbacks, eliminating Cumulative Layout Shift (CLS) popping while assets stream in.
- **Server Action Paginators**: Replaced client-sided chunking queries with native secure server action payloads `loadMoreExplorePostsAction` via Supabase to keep large computations away from client devices.

### Changed

- **Navigation Shells Restructured**: Offloaded the common `<Header>` and `<Footer>` wrappers from the individual page roots into native App Router Server `<Layout>` trees.
- **Dashboard Hooks**: Extracted and centralized cross-navigation cache hydration within the dashboard stats views inside clean `useEffect` pipelines.
- **TypeScript Compatibility**: Bumped core TS config `target` bounds from `es5` up to `es2015` native, fixing deprecation flags and allowing native ECMA iterables.

---

## [1.0.0] - 2025-09-21

### Phase 1: Comprehensive Refactoring and Robustness Review

This initial version marks a massive overhaul of the entire application to establish a robust, scalable, and maintainable foundation. The focus was on improving code quality, centralizing logic, and enhancing the user experience through a standardized UI and more efficient data handling.

### Added

- **UI Components**: Integrated `shadcn/ui` to build a comprehensive, consistent, and accessible component library. Added over 25 new UI components including `Button`, `Input`, `Card`, `Table`, `Dialog`, `Toast`, `Sonner` for notifications, and more.
- **Form Management**: Implemented `react-hook-form` and `zod` for robust, type-safe form validation across the application.
- **Custom Hooks**:
  - `useMutatePost`: A centralized hook to handle all logic for creating, updating, and uploading images for posts.
  - `useSignIn` & `useSignUp`: Dedicated hooks to manage user authentication flows.
  - `useToast`: A custom hook for displaying toast notifications.
- **Data Table**: Added a reusable `DataTable` component using `@tanstack/react-table` for displaying, sorting, and paginating posts on the user dashboard.
- **Validation Schemas**: Created centralized Zod schemas in `lib/validations.ts` for posts and user profiles to ensure data integrity.
- **Documentation**:
  - Added this `CHANGELOG.md`.
- **Utility Functions**: Added new utilities for slug generation, read time calculation, and date formatting in `lib/utils.ts`.
- **Supabase Debugging**: Created `lib/debug-supabase.ts` with a suite of tools for testing the connection, schema, auth, and RLS policies.

### Changed

- **Centralized Database Logic**: Refactored all Supabase queries into a single `DatabaseOperations` class in `lib/database-operations.ts`, creating a dedicated data access layer.
- **Refactored All Pages**:
  - **Write Page (`/write`)**: Now uses `useMutatePost` hook, `react-hook-form`, and Zod for a more robust writing and editing experience.
  - **Dashboard Page (`/dashboard`)**: Replaced the basic post list with the new powerful and reusable `DataTable` component.
  - **Home Page (`/`)**: Converted from static content to dynamically fetching and displaying the latest posts with loading skeletons.
  - **Post Page (`/post/[slug]`)**: Optimized data fetching to use a single, efficient query to get the post and author details.
  - **Explore Page (`/explore`)**: Refactored to use standardized data types and improved data fetching.
  - **Profile Pages (`/profile` and `/profile/[username]`)**: The editable profile page now uses `react-hook-form` and Zod validation. The public profile page has been updated for more efficient data loading.
- **Supabase Queries**: Improved Supabase queries to be more explicit and efficient, resolving potential ambiguity in table relationships (e.g., `profiles!posts_author_id_fkey`).
- **Type Safety**: Significantly improved type safety across the application by using generated Supabase types and Zod schemas.
- **Error Handling & Notifications**: Replaced `console.log` and basic alerts with the `sonner` toast notification system for a better user experience.

### Fixed

- **Supabase Query Error**: Fixed a critical runtime error "Could not embed because more than one relationship was found" by specifying the foreign key in Supabase select statements.
- **Numerous TypeScript Errors**: Resolved a cascade of type errors that arose during the refactoring process.
- **Data Consistency**: Ensured consistent data types and structures are used across all components and pages.
