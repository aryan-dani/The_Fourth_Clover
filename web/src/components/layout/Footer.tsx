"use client";

import Link from "next/link";
import { Github, Twitter } from "lucide-react";
import { motion } from "framer-motion";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border-t border-border/40"
    >
      <div className="w-full px-6 py-5">
        <div className="grid grid-cols-3 items-center">
          {/* Copyright - left aligned */}
          <p className="text-xs text-muted-foreground">
            © 2026 The Fourth Clover
          </p>

          {/* Links - center aligned */}
          <nav className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <Link
              href="/about"
              className="hover:text-foreground transition-colors duration-150"
            >
              About
            </Link>
            <Link
              href="/explore"
              className="hover:text-foreground transition-colors duration-150"
            >
              Explore
            </Link>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors duration-150"
            >
              Privacy
            </Link>
          </nav>

          {/* Social - right aligned */}
          <div className="flex items-center justify-end gap-2">
            <motion.a
              href="https://github.com/aryan-dani/The-Fourth-Clover"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/20 transition-colors duration-150"
            >
              <Github className="w-3.5 h-3.5" />
            </motion.a>
            <motion.a
              href="https://twitter.com/thefourthclover"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/20 transition-colors duration-150"
            >
              <Twitter className="w-3.5 h-3.5" />
            </motion.a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
