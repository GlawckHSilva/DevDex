import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const description = "Aprenda programação resolvendo missões com código real.";

  return {
    metadataBase: new URL(`${protocol}://${host}`),
    title: { default: "DevDex", template: "%s · DevDex" },
    description,
    icons: { icon: "/og.png" },
    openGraph: { title: "DevDex", description, images: [{ url: "/og-rpg.png", width: 1664, height: 936, alt: "DevDex — Bosque dos Fundamentos" }] },
    twitter: { card: "summary_large_image", title: "DevDex", description, images: ["/og-rpg.png"] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
