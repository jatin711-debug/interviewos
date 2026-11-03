import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { UI_PREFS_SCRIPT } from "@/lib/ui-prefs";

export const metadata: Metadata = {
  title: "InterviewOS | Technical interview prep",
  description:
    "An end-to-end technical interview preparation platform: Python, data structures & algorithms, system design, databases and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The inline script may add data-* layout attributes to <html> before hydration.
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: UI_PREFS_SCRIPT }} />
      </head>
      <body className="bg-[#0c1217] text-slate-100 min-h-screen antialiased flex flex-col md:block">
        <Sidebar />
        <main className="min-w-0 flex-1 min-h-screen overflow-y-auto md:ml-[var(--sidebar-w)] md:transition-[margin-left] md:duration-200">
          {children}
        </main>
      </body>
    </html>
  );
}
