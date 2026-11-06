import type { Metadata, Viewport } from "next";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { getToken } from "@/lib/auth-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orchid One | HR Management",
  description: "Orchid Flowers workforce and human resource management"
};

export const viewport: Viewport = {
  themeColor: "#5a285f",
  width: "device-width",
  initialScale: 1
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const initialToken = await getToken();

  return (
    <html lang="en">
      <body>
        <ConvexClientProvider initialToken={initialToken}>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
