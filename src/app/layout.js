import { Inter } from 'next/font/google';
import "./globals.css";
import AuthProvider from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'College Election Voting System',
  description: 'A secure voting system for college elections',
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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
