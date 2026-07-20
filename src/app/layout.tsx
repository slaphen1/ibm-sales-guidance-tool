import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "IBM Sales Guidance Tool",
  description: "AI-powered sales guidance using IBM AskSales and WatsonX",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-ibm-gray-100 font-sans antialiased">
        <header className="border-b border-ibm-gray-20 px-6 py-4 flex items-center gap-8">
          <Link
            href="/"
            className="text-base font-semibold text-ibm-gray-100 hover:text-ibm-blue"
          >
            IBM Sales Guidance
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/roadmap" className="hover:text-ibm-blue transition-colors">
              Client Roadmap
            </Link>
            <Link href="/guidance" className="hover:text-ibm-blue transition-colors">
              Deal Guidance
            </Link>
            <Link href="/chat" className="hover:text-ibm-blue transition-colors">
              AI Assistant
            </Link>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
