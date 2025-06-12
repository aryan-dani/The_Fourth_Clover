import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'The Fourth Clover - Minimalist Blogging Platform',
  description: 'A minimalist blogging platform for thoughtful writers. Share your stories and connect with readers who value quality content.',
  keywords: ['blog', 'writing', 'platform', 'minimalist', 'elegant'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            {children}
            <Toaster 
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}