"use client";

import React, { useEffect, useState } from "react";
import { X, ZoomIn } from "lucide-react";

export type ImageLightboxProps = {
  src: string;
  alt?: string;
  caption?: string | null;
  children: React.ReactNode;
};

export function ImageLightbox({
  src,
  alt = "Article visual",
  caption,
  children,
}: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className="group/lightbox relative cursor-zoom-in"
        title="Click to view full-resolution diagram"
      >
        {children}
        <div className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity duration-200 group-hover/lightbox:opacity-100 pointer-events-none">
          <ZoomIn className="h-3.5 w-3.5" />
        </div>
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close zoom overlay"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Full-resolution Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center max-h-[90vh] max-w-[95vw]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-h-[82vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
            {caption && (
              <p className="mt-3 text-center font-serif text-sm italic text-zinc-300 max-w-2xl px-4">
                {caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
