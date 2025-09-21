# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-09-21

### Phase 1: Comprehensive Refactoring and Robustness Review

This initial version marks a massive overhaul of the entire application to establish a robust, scalable, and maintainable foundation. The focus was on improving code quality, centralizing logic, and enhancing the user experience through a standardized UI and more efficient data handling.

### Added

-   **UI Components**: Integrated `shadcn/ui` to build a comprehensive, consistent, and accessible component library. Added over 25 new UI components including `Button`, `Input`, `Card`, `Table`, `Dialog`, `Toast`, `Sonner` for notifications, and more.
-   **Form Management**: Implemented `react-hook-form` and `zod` for robust, type-safe form validation across the application.
-   **Custom Hooks**:
    -   `useMutatePost`: A centralized hook to handle all logic for creating, updating, and uploading images for posts.
    -   `useSignIn` & `useSignUp`: Dedicated hooks to manage user authentication flows.
    -   `useToast`: A custom hook for displaying toast notifications.
-   **Data Table**: Added a reusable `DataTable` component using `@tanstack/react-table` for displaying, sorting, and paginating posts on the user dashboard.
-   **Validation Schemas**: Created centralized Zod schemas in `lib/validations.ts` for posts and user profiles to ensure data integrity.
-   **Documentation**:
    -   Added this `CHANGELOG.md`.
    -   Added `DATABASE_ALIGNMENT_REPORT.md` and `SUPABASE_TOOLS.md` for database documentation.
-   **Utility Functions**: Added new utilities for slug generation, read time calculation, and date formatting in `lib/utils.ts`.
-   **Supabase Debugging**: Created `lib/debug-supabase.ts` with a suite of tools for testing the connection, schema, auth, and RLS policies.

### Changed

-   **Centralized Database Logic**: Refactored all Supabase queries into a single `DatabaseOperations` class in `lib/database-operations.ts`, creating a dedicated data access layer.
-   **Refactored All Pages**:
    -   **Write Page (`/write`)**: Now uses `useMutatePost` hook, `react-hook-form`, and Zod for a more robust writing and editing experience.
    -   **Dashboard Page (`/dashboard`)**: Replaced the basic post list with the new powerful and reusable `DataTable` component.
    -   **Home Page (`/`)**: Converted from static content to dynamically fetching and displaying the latest posts with loading skeletons.
    -   **Post Page (`/post/[slug]`)**: Optimized data fetching to use a single, efficient query to get the post and author details.
    -   **Explore Page (`/explore`)**: Refactored to use standardized data types and improved data fetching.
    -   **Profile Pages (`/profile` and `/profile/[username]`)**: The editable profile page now uses `react-hook-form` and Zod validation. The public profile page has been updated for more efficient data loading.
-   **Supabase Queries**: Improved Supabase queries to be more explicit and efficient, resolving potential ambiguity in table relationships (e.g., `profiles!posts_author_id_fkey`).
-   **Type Safety**: Significantly improved type safety across the application by using generated Supabase types and Zod schemas.
-   **Error Handling & Notifications**: Replaced `console.log` and basic alerts with the `sonner` toast notification system for a better user experience.

### Fixed

-   **Supabase Query Error**: Fixed a critical runtime error "Could not embed because more than one relationship was found" by specifying the foreign key in Supabase select statements.
-   **Numerous TypeScript Errors**: Resolved a cascade of type errors that arose during the refactoring process.
-   **Data Consistency**: Ensured consistent data types and structures are used across all components and pages.
