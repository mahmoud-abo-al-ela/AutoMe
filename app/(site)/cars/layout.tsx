import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Cars | AutoMe",
  description: "Search and filter our extensive inventory of vehicles. Find the perfect car that matches your needs and budget.",
};

export default function CarsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
