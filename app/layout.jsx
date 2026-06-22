import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import LoadingProvider from "@/components/LoadingProvider";
import { StreamChatProvider } from "@/components/StreamChat";
import QueryProvider from "@/components/providers/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AutoMe",
  description: "Find your dream car",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className="scroll-smooth h-full">
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
