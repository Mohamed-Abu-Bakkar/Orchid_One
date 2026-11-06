import type { Metadata, Viewport } from "next";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { PwaServiceWorker } from "@/components/pwa-service-worker";
import { getToken } from "@/lib/auth-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orchid One | HR Management",
  description: "Orchid Flowers workforce and human resource management",
  applicationName: "Orchid One",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Orchid One"
  },
  icons: {
    icon: [{ url: "/icons/orchid-mark.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/orchid-mark.svg", type: "image/svg+xml" }]
  }
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
        <PwaServiceWorker />
        <ConvexClientProvider initialToken={initialToken}>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
