import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { PwaRegister } from '@/components/layout/PwaRegister';

export const metadata: Metadata = {
  title: 'Antonius — Asisten Pemecah Soal AI',
  description: 'Asisten belajar dan pemecah soal berbasis AI dengan gaya neo-brutalist. Foto soal dan dapatkan pemecahan langkah demi langkah.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Antonius',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
      { url: '/icons/antonius-favicon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/antonius-favicon.png', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#D94336',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-[#FFF7F2] text-[#111111] min-h-[100dvh] antialiased selection:bg-[#FFD447] selection:text-[#111111]">
        <PwaRegister />
        
        {/* Main Mobile App Container */}
        <div className="min-h-[100dvh] flex flex-col justify-between max-w-md mx-auto relative bg-[#FFF7F2] border-x-[3px] border-[#111111]/15 shadow-2xl">
          <main className="flex-1 pb-24 safe-top">
            {children}
          </main>
          
          <BottomNavigation />
        </div>
      </body>
    </html>
  );
}
