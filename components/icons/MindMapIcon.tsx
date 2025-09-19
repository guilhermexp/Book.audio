import React from 'react';

const MindMapIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 100 12h-3a7.5 7.5 0 000-12h3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 9a4.5 4.5 0 110 6h-3a4.5 4.5 0 010-6h3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 8.25H18v3.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 15.75H18v-3.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75h6" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12.75h.75" />
  </svg>
);

export default MindMapIcon;