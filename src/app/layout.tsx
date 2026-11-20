import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/newsreader/opsz.css";
import "@fontsource-variable/newsreader/opsz-italic.css";
import { Shell } from "@/components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "alive",
  description: "Live intentionally. Track your life. Understand your progress. Become who you want to be.",
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
  appleWebApp: { title: "alive", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#141414",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
