import React from "react";

export function CloverMark({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Architectural Quatrefoil / Four-Leaf Botanical Colophon */}
      <path
        d="M12 11.2C12 7.8 9.6 4.2 6.8 4.2C4.6 4.2 3.2 5.7 3.2 7.8C3.2 10.6 6.8 12 10.8 12"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 11.2C12 7.8 14.4 4.2 17.2 4.2C19.4 4.2 20.8 5.7 20.8 7.8C20.8 10.6 17.2 12 13.2 12"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 12.8C12 16.2 9.6 19.8 6.8 19.8C4.6 19.8 3.2 18.3 3.2 16.2C3.2 13.4 6.8 12 10.8 12"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 12.8C12 16.2 14.4 19.8 17.2 19.8C19.4 19.8 20.8 18.3 20.8 16.2C20.8 13.4 17.2 12 13.2 12"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}
