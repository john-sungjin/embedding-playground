import { Toaster } from "@/components/ui/toaster";
import NoSsr from "@/components/NoSsr";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LayoutInner } from "./layout_inner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Embedding Playground",
  description: "A place to test embeddings!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NoSsr>
          <LayoutInner>{children}</LayoutInner>
        </NoSsr>
        <Toaster />
      </body>
    </html>
  );
}
