export const metadata = {
  title: '869 To Do',
  description: 'Events in St. Kitts and Nevis',
};

import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>

      {/* Google Analytics */}
      <GoogleAnalytics gaId="G-KZ8CCT3P5E" />
    </html>
  );
}
