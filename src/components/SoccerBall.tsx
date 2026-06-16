import React from "react";

export const SoccerBall: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 12l3-2.5v-4.5L12 3 9 5v4.5z" />
    <path d="M12 12l-4 3-2.5-1.5L4 10" />
    <path d="M12 12l4 3 2.5-1.5L20 10" />
    <path d="M8 15v5.5" />
    <path d="M16 15v5.5" />
  </svg>
);
