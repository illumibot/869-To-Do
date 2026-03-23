export const metadata = {
  title: '869 To Do',
  description: 'Events in St. Kitts and Nevis',
};

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
