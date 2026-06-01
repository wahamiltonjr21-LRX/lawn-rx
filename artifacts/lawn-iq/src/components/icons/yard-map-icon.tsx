import { type SVGProps } from "react";

export default function YardMapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Yard boundary polygon */}
      <polygon points="3,18 7,5 17,4 21,15 14,21 6,20" />
      {/* Small tree / plant inside */}
      <line x1="12" y1="14" x2="12" y2="17" />
      <circle cx="12" cy="11.5" r="2.5" />
      {/* Measurement dot in corner */}
      <circle cx="7" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="4" r="1" fill="currentColor" stroke="none" />
      <circle cx="21" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="21" r="1" fill="currentColor" stroke="none" />
      <circle cx="6" cy="20" r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
