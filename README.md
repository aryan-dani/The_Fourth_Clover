# The Fourth Clover

> A modern, minimalist blogging platform built for writers and thinkers.

![Status](https://img.shields.io/badge/Status-Phase_2_Complete-success?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-13.5-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)

## Documentation

- [Roadmap](docs/ROADMAP.md)
- [Changelog](CHANGELOG.md)
- [Supabase Tools](docs/SUPABASE_TOOLS.md)

## Features

### Core Features
- **Modern Design**: Clean, minimalist interface with a circular, monochrome aesthetic
- **Rich Writing Experience**: Robust editor with react-hook-form and zod validation
- **Dynamic Data Tables**: User dashboard with sortable, paginated tables via TanStack Table
- **Notifications**: Sleek, non-intrusive toast notifications with sonner
- **Image Upload**: Seamless image upload and management with Supabase Storage
- **Authentication**: Secure Google OAuth integration with Supabase Auth
- **Responsive**: Beautiful design that works perfectly on all devices
- **Performance**: Built with Next.js 13+ for optimal speed and SEO
- **Real-time**: Live auto-save functionality to prevent data loss
- **User-Friendly**: Intuitive dashboard for managing drafts and published posts

### Social Features (Phase 2)
- **Commenting System**: Threaded comments with nested replies
- **Like System**: Like/unlike posts with real-time updates
- **Social Sharing**: Share posts to Twitter, WhatsApp, or copy link
- **Enhanced Profiles**: User statistics and social links display
- **Username Validation**: Robust validation to ensure URL-safe usernames

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/aryan-dani/The-Fourth-Clover.git
   cd The-Fourth-Clover/web
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
   - Run the SQL from `database/setup-storage.sql` in the SQL Editor to set up storage buckets and policies
   - Run `database/fix-security-issues.sql` and `database/fix-performance-issues.sql` to ensure your database is secure and optimized
   - Ensure you have the necessary tables created (refer to `database/` folder for schema details)

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Tech Stack

### Frontend
- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui (Radix UI)
- **Form Management**: React Hook Form & Zod
- **Tables**: TanStack Table
- **Notifications**: Sonner
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Typography**: Charter (content), Playfair Display (headings)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Storage**: Supabase Storage for images
- **Row Level Security**: Custom RLS policies for data protection

## Project Structure

```
The-Fourth-Clover/
├── web/                      # Main application code
│   ├── src/
│   │   ├── app/              # Next.js 13+ App Router pages
│   │   │   ├── auth/         # Authentication pages
│   │   │   ├── dashboard/    # User dashboard
│   │   │   ├── explore/      # Post discovery page
│   │   │   ├── post/         # Individual post pages
│   │   │   ├── profile/      # User profiles
│   │   │   └── write/        # Post editor
│   │   ├── components/       # Reusable components
│   │   │   ├── comments/     # Comment system components
│   │   │   ├── layout/       # Header, Footer
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions and configurations
│   │   │   ├── auth-context.tsx # Authentication context
│   │   │   ├── database-operations.ts # Centralized database queries
│   │   │   ├── database-types.ts # TypeScript type definitions
│   │   │   └── validations.ts   # Zod validation schemas
│   │   └── styles/           # Global styles
│   ├── database/             # Database setup and migration scripts
│   └── public/               # Static assets
├── docs/                     # Project documentation
└── supabase/                 # Supabase edge functions
```

## Database Schema

### Tables
- `profiles` - User profiles with social links
- `posts` - Blog posts with tags and read time
- `comments` - Threaded comments system
- `likes` - Post likes/reactions

### Key Features
- Row Level Security (RLS) policies on all tables
- Optimized indexes for performance
- Foreign key constraints for data integrity
- Real-time subscriptions support

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Testing Database Operations

Use the Supabase debugging tools:

```bash
node database/inspect-schema.js
```

## Deployment

The application is deployed on Netlify. To deploy your own instance:

1. Fork this repository
2. Connect your Netlify account to GitHub
3. Set environment variables in Netlify dashboard
4. Deploy

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with Next.js and Supabase
- UI components from shadcn/ui
- Inspired by Medium and modern minimalist design principles

## Roadmap

See [ROADMAP.md](docs/ROADMAP.md) for planned features and development phases.

## Support

For support, email support@thefourthclover.com or open an issue on GitHub.
