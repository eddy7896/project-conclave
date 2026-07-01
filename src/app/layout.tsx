import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Project Conclave — 6-Axis Arm Controller',
  description:
    'Web-based dashboard for controlling a modular 6+ axis robotic arm with real-time 3D visualization, inverse kinematics, and Firebase cloud communication.',
  keywords: ['robotics', 'robotic arm', '6-axis', 'controller', 'ESP32', '3D visualization'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={inter.variable}>
        {children}
      </body>
    </html>
  );
}
