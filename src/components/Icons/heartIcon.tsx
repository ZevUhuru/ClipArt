import React from 'react';

interface HeartIconProps {
  className?: string;
}

const HeartIcon: React.FC<HeartIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364l-1.2 1.2-1.2-1.2a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);

export default HeartIcon;
