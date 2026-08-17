import { Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import LoadingProvider from "@/components/LoadingProvider";
import { StreamChatProvider } from "@/components/StreamChat";
import QueryProvider from "@/components/providers/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoMe",
  description: "Find your dream car",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} scroll-smooth h-full`}>
        <body className={`${inter.className} flex flex-col min-h-screen`}>
          <LoadingProvider>
            <QueryProvider>
              <StreamChatProvider>
                {children}
              </StreamChatProvider>
            </QueryProvider>
          </LoadingProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
