import type { Metadata } from 'next';
import { Crimson_Pro, JetBrains_Mono, Manrope } from 'next/font/google';
import './globals.css';

const crimson = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-crimson',
  display: 'swap',
  weight: ['400', '600', '700'],
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Feedback Widget · Dashboard',
  description: 'Manage your conversational feedback widgets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${crimson.variable} ${jetbrains.variable} ${manrope.variable}`}>
      <body className="font-sans bg-ink text-paper antialiased">
        {children}
      </body>
    </html>
  );
}
