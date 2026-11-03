import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TableScout — Boston Reserve Edition",
  description: "Boston restaurant reservations, vibes and insider tips.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
