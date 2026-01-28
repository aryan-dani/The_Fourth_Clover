import Link from "next/link";
import { Heart, Github, Twitter, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/copyright" className="flex items-center space-x-3 mb-4 w-fit hover:opacity-80 transition-opacity">
              <div className="circle-logo">
                <span className="text-sm font-bold">🍀</span>
              </div>
              <span className="brand-text text-lg tracking-tight">
                THE FOURTH CLOVER
              </span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-md leading-relaxed text-sm">
              A minimalist blogging platform designed for thoughtful writers.
              Share your stories, connect with readers, and build your
              community.
            </p>
            <div className="flex items-center space-x-4">
              <Link
                href="https://github.com/aryan-dani/The-Fourth-Clover"
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-5 h-5" />
              </Link>
              <Link
                href="https://twitter.com/thefourthclover"
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="w-5 h-5" />
              </Link>
              <Link
                href="mailto:hello@thefourthclover.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold mb-4 brand-text">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/explore"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Explore
                </Link>
              </li>
              <li>
                <Link
                  href="/write"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Start Writing
                </Link>
              </li>
              <li>
                <Link
                  href="/trending"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Trending
                </Link>
              </li>
              <li>
                <Link
                  href="/topics"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Topics
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4 brand-text">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-border my-4" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <Link href="/copyright" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
            © 2026 The Fourth Clover. All rights reserved.
          </Link>
          <p className="text-muted-foreground text-sm flex items-center mt-4 md:mt-0">
            Made by{" "}
            <Link
              href="/about"
              className="font-medium hover:text-foreground transition-colors ml-1 underline underline-offset-4"
            >
              Aryan Dani
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
