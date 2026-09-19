import React from 'react';
import './globals.css';

export const metadata = {
  title: 'SAIL Maritime Freight Command Center',
  description: 'AI-driven maritime freight decision support and what-if scenario optimization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0b1120] text-slate-100 antialiased">{children}</body>
    </html>
  );
}

