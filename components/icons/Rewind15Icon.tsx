
import React from 'react';

const Rewind15Icon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || 'w-6 h-6'}>
    <path d="M11.5,12C11.5,13.93 12.08,15.68 13.06,17.06L11.18,18.94C9.87,17.22 9,14.76 9,12C9,9.24 9.87,6.78 11.18,5.06L13.06,6.94C12.08,8.32 11.5,10.07 11.5,12M18,12C18,10.07 17.42,8.32 16.44,6.94L18.32,5.06C19.63,6.78 20.5,9.24 20.5,12C20.5,14.76 19.63,17.22 18.32,18.94L16.44,17.06C17.42,15.68 18,13.93 18,12M5,15.5V8.5L1,12L5,15.5M13,9.5H16.5V8H11V16H13V9.5Z" />
  </svg>
);

export default Rewind15Icon;
