import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orchid One | HR Management",
  description: "Orchid Flowers workforce and human resource management"
};
export const viewport: Viewport = { themeColor: "#5a285f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
