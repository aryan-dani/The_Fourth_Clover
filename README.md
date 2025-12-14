# 🍀 The Fourth Clover

> A modern, minimalist blogging platform built for Gen-Z writers and thinkers.

![Status](https://img.shields.io/badge/Status-Phase_1_Complete-success?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-13.5-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)

## 📚 Documentation

- [Roadmap](docs/ROADMAP.md)
- [Changelog](docs/CHANGELOG.md)
- [Supabase Tools](docs/SUPABASE_TOOLS.md)

## ✨ Features

- **🎨 Modern Design**: Clean, minimalist interface inspired by Medium with a circular, monochrome aesthetic
- **✍️ Rich Writing Experience**: Robust editor with `react-hook-form` and `zod` validation.
- **🗂️ Dynamic Data Tables**: User dashboard with sortable, paginated tables via `@tanstack/react-table`.
- **🔔 Notifications**: Sleek, non-intrusive toast notifications with `sonner`.
- **📸 Image Upload**: Seamless image upload and management with Supabase Storage.
- **🔐 Authentication**: Secure Google OAuth integration with Supabase Auth.
- **📱 Responsive**: Beautiful design that works perfectly on all devices.
- **🚀 Performance**: Built with Next.js 13+ for optimal speed and SEO.
- **💾 Real-time**: Live auto-save functionality to never lose your work.
- **🎯 User-Friendly**: Intuitive dashboard for managing drafts and published posts.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/aryan-dani/The-Fourth-Clover.git
   cd The-Fourth-Clover
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Add your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**

   - Go to your Supabase dashboard
   - Run the SQL from `database/setup-storage.sql` in the SQL Editor to set up storage buckets and policies.
   - Run `database/fix-security-issues.sql` and `database/fix-performance-issues.sql` to ensure your database is secure and optimized.
   - Ensure you have the necessary tables created (refer to `database/` folder for schema details).

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [https://thefourthclover.netlify.app](https://thefourthclover.netlify.app)

## 🏗️ Tech Stack

- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Storage**: Supabase Storage for images
- **UI Components**: shadcn/ui
- **Form Management**: React Hook Form & Zod
- **Tables**: TanStack Table
- **Notifications**: Sonner
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Typography**: Charter (content), Playfair Display (headings)

## 📁 Project Structure

```
├── app/                 # Next.js 13+ app directory
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # User dashboard with TanStack Table
│   ├── explore/        # Discover posts
│   ├── post/           # Individual post pages
│   ├── profile/        # User profiles
│   └── write/          # Post editor with React Hook Form
├── components/         # Reusable components
│   ├── auth/           # Auth-related components
│   ├── layout/         # Layout components
│   └── ui/             # UI components (shadcn/ui)
├── lib/                # Utilities and configurations
│   ├── auth-context.tsx
│   ├── database-operations.ts # Centralized Supabase logic
│   ├── supabase.ts
│   ├── utils.ts
│   └── validations.ts  # Zod validation schemas
├── hooks/              # Custom React hooks
    ├── useMutatePost.ts
    ├── useSignIn.ts
    └── useSignUp.ts
```

## 🎨 Design Philosophy

**The Fourth Clover** embraces a Gen-Z aesthetic with:

- **Minimalist Interface**: Clean, distraction-free writing environment
- **Circular Elements**: Rounded buttons, avatars, and cards for modern appeal
- **Monochrome Palette**: Elegant black, white, and gray color scheme
- **Beautiful Typography**: Charter font for exceptional reading experience
- **Subtle Animations**: Smooth, non-intrusive motion design
- **Mobile-First**: Responsive design that looks great everywhere

## 🔧 Configuration

### Environment Variables

| Variable                        | Description                 | Required |
| ------------------------------- | --------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL   | ✅       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | ✅       |

### Database Schema

The platform uses these main tables:

- `posts` - Blog posts with metadata
- `profiles` - User profiles
- `comments` - Post comments
- `likes` - Post likes
- `categories` - Post categories
- `post_categories` - Junction table for posts and categories

## 🚀 Deployment

### Netlify (Recommended)

This project is configured for Netlify deployment via `netlify.toml`.

1. **Connect your repository** to Netlify.
2. **Add environment variables** in the Netlify dashboard.
3. **Deploy** - Netlify will automatically build and deploy your app.

### Vercel

1. **Connect your repository** to Vercel
2. **Add environment variables** in the Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy your app

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** & **Radix UI** for the beautiful component library
- **TanStack Table** for powerful data tables
- **React Hook Form** & **Zod** for robust form validation
- **Supabase** for the amazing backend-as-a-service
- **Medium.com** for design inspiration
- **Charter** and **Playfair Display** for the elegant typography

---

**Built with ❤️ for the next generation of writers and storytellers.**
