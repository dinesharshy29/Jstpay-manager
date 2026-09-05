import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "AI Risk Manager",
  description: "A focused workspace for risk operations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
