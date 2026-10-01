import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cinder Bound — AI-Powered Criminal Network Analysis",
  description: "Transform fragmented police evidence, FIRs, CDRs, and bank statements into interactive connected intelligence graphs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Client-side PDF extraction engine */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-[#080C14] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
