import type { Metadata } from "next";
import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { Inter, Satisfy } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const satisfy = Satisfy({ weight: "400", subsets: ["latin"], variable: "--font-accent" });

export const metadata: Metadata = {
  title: {
    default: "Contr.studio",
    template: "%s | Contr.studio",
  },
  description: "Agency operations, approvals, analytics, and client reporting for Contr.studio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${satisfy.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <NuqsAdapter>
          {children}
          <Toaster position="top-right" richColors />
        </NuqsAdapter>
      </body>
    </html>
  );
}
