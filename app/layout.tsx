import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "./components/NavBar";
//page title and description for SEO
export const metadata: Metadata = {
  title: "AI Career Companion",
  description: "AI-powered job and resume analysis",
};

//root layout component that wraps all pages
//Whatever page the user is currently visiting gets injected here.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <NavBar />

        {/* PAGE CONTENT */}
        <main className="mx-auto max-w-6xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
