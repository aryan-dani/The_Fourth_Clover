# 🍀 The Fourth Clover: Development Roadmap

This document outlines the planned development phases for The Fourth Clover, a modern, minimalist blogging platform.

---

### Phase 1: Core Blogging Platform (MVP) - ✅ Complete

This phase establishes the foundational features of a functional, modern blogging platform.

- [x] **User Authentication**: Secure signup, login, and logout.
- [x] **Post Management**: Create, edit, and delete posts.
- [x] **Drafts & Publishing**: Save posts as drafts or publish them publicly.
- [x] **Autosave**: Automatically save work in the editor to prevent data loss.
- [x] **Core Editor Features**:
  - [x] Auto-generated, SEO-friendly slugs.
  - [x] Automatic read-time estimation.
- [x] **Content Discovery**:
  - [x] A home feed/explore page to view published posts.
  - [x] Tag support for post categorization.
- [x] **Design & UI/UX**:
  - [x] Clean, minimalist, and modern UI.
  - [x] Mobile-first responsive design.
  - [x] Dark mode toggle (defaulting to dark).
  - [x] Subtle animations for a Gen-Z aesthetic.
- [x] **Public Profiles**: Basic user profiles displaying bio and information.
- [x] **Security & Performance**:
  - [x] Database function security hardening.
  - [x] RLS policy optimization.
  - [x] Index optimization.

---

### Phase 2: Social Engagement & Interaction - ✅ Complete

This phase focuses on building community and making the platform more interactive. The database is already prepared for these features.

- [x] **Commenting System**:
  - [x] Implement UI for posting comments on articles.
  - [x] Add support for nested replies to create threaded conversations.
  - [x] Allow users to edit or delete their own comments.
- [x] **Like System**:
  - [x] Add the ability for users to "like" or "heart" posts.
  - [x] Display the total like count on each post.
- [x] **Social Sharing**:
  - [x] Implement share buttons on post pages (Copy Link, Twitter, WhatsApp).
- [x] **Enhanced Profiles**:
  - [x] Display a list of the user's published posts on their profile page.
  - [x] Add fields for social links (e.g., Twitter, GitHub, personal website).
  - [x] Display user statistics (total posts, likes, comments).
- [x] **UI/UX Improvements**:
  - [x] Comprehensive UI polish across all pages.
  - [x] Enhanced card designs with premium hover effects.
  - [x] Improved comment section with elegant cards and animations.
  - [x] Better loading states with skeleton loaders.
  - [x] Clickable post cards throughout the platform.
- [x] **Data Validation**:
  - [x] Username validation to prevent spaces and special characters.
  - [x] URL decoding for existing usernames with spaces.
  - [x] Real-time input sanitization during signup.

---

### Phase 3: Enhanced Discovery & User Experience

This phase will improve content discovery and refine the user experience.

- [ ] **Post Scheduling**:
  - [ ] Add `scheduled_at` field to database.
  - [ ] Implement datetime picker in Write page.
  - [ ] Create scheduled posts section in dashboard.
  - [ ] Implement auto-publish functionality.
- [ ] **Advanced Feed Filtering**:
  - [ ] Implement robust filters on the home feed: "Latest," "Trending," and "My Posts."
  - [ ] Develop a basic algorithm to determine "Trending" posts (e.g., based on recent likes and comments).
- [ ] **Search Functionality**:
  - [ ] Implement full-text search across all posts.
- [ ] **Notifications**:
  - [ ] Create an in-app notification center for new comments and likes.
- [ ] **UX Refinements**:
  - [ ] Implement "Load More" functionality for post feeds instead of traditional pagination.
  - [ ] Enhance image loading with placeholders and optimization.

---

### Phase 4: Moderation & Long-Term Growth

This phase introduces features for maintaining a healthy community and ensuring the platform's long-term viability.

- [ ] **Admin Panel (Optional)**:
  - [ ] A secure dashboard for admins to manage users and content.
  - [ ] Functionality to review and act on reported posts or comments.
- [ ] **User Settings**:
  - [ ] A dedicated page for users to manage their profile, account, and notification preferences.
- [ ] **Email Integration**:
  - [ ] Set up transactional emails for password resets.
  - [ ] (Optional) Email notifications for user interactions.
