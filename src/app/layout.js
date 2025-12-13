import { Inter } from 'next/font/google';
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "Student Elections 2026 - SST College",
  description: "College Election Voting System - Cast your vote securely",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="/css/main.css" />
        <link rel="stylesheet" href="/css/cards.css" />
        <link rel="stylesheet" href="/css/pages.css" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
