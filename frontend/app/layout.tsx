import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AmplifyConfigProvider } from "./AmplifyConfigProvider";

export const metadata: Metadata = {
  title: "CincyMuse - Cincinnati Museum Center Digital Guide",
  description: "Your bilingual digital guide for Cincinnati Museum Center. Get information about exhibits, collections, events, tickets, and memberships.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AmplifyConfigProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AmplifyConfigProvider>
      </body>
    </html>
  );
}
