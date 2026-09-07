import type { Metadata, Viewport } from "next";
import "./globals.css";
import LoadingScreen from "@/components/LoadingScreen";

export const metadata: Metadata = {
  title: {
    default: "ReflexRHYTHM - Music & Reflex Arcade Game",
    template: "%s | ReflexRHYTHM",
  },
  description:
    "ReflexRHYTHM adalah game ritme & refleks berbasis web yang menguji kecepatan jari dan akurasi ketukan musik interaktif.",
  keywords: [
    "ReflexRHYTHM",
    "Rhythm Game",
    "Reflex Game",
    "Web Arcade",
    "OSU Style Game",
    "Game Musik",
  ],
  icons: {
    icon: "/assets/picture/new-logo.png",
    shortcut: "/assets/picture/new-logo.png",
    apple: "/assets/picture/new-logo.png",
  },
  openGraph: {
    title: "ReflexRHYTHM - Music & Reflex Arcade Game",
    description: "Uji batas refleks dan ketukan musikmu di ReflexRHYTHM!",
    siteName: "ReflexRHYTHM",
    images: [
      {
        url: "/assets/picture/new-logo.png",
        width: 512,
        height: 512,
        alt: "ReflexRHYTHM Logo",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        {/* CSS Vanilla — copy dari css/ ke public/css/ */}
        <link rel="stylesheet" href="/css/base.css" />
        <link rel="stylesheet" href="/css/home-new.css" />
        <link rel="stylesheet" href="/css/lobby-new.css" />
        <link rel="stylesheet" href="/css/basic-mode.css" />
        <link rel="stylesheet" href="/css/popups.css" />
        <link rel="stylesheet" href="/css/profile.css" />
        <link rel="stylesheet" href="/css/responsive.css" />
        {/* CDN */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://cdn.boxicons.com/3.0.8/fonts/basic/boxicons.min.css" rel="stylesheet" />
        <link href="https://cdn.boxicons.com/3.0.8/fonts/filled/boxicons-filled.min.css" rel="stylesheet" />
        <link href="https://cdn.boxicons.com/3.0.8/fonts/brands/boxicons-brands.min.css" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bangers&family=Orbitron:wght@400;700;900&family=Russo+One&display=swap" />
        <link rel="icon" type="image/png" href="/assets/picture/new-logo.png" />
      </head>
      {/*
        suppressHydrationWarning di body karena className-nya di-set
        client-side via useEffect di tiap page component.
        Ini pattern standar Next.js untuk body class per-page.
      */}
      <body suppressHydrationWarning>
        <LoadingScreen />
        {children}
      </body>
    </html>
  );
}