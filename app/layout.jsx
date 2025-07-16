import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import LoadingProvider from "@/components/LoadingProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AutoMe",
  description: "Find your dream car",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className="scroll-smooth">
        <body className={inter.className}>
          <LoadingProvider>{children}</LoadingProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
