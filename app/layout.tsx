import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { DirectionProvider } from "@/components/ui/direction";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "بيان",
  description:
    "حوّل كتبك إلى محادثات تفاعلية بالذكاء الاصطناعي. ارفع ملفات PDF وتحدث مع كتبك باستخدام الصوت.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} relative font-sans antialiased`}
    >
      <body>
        <DirectionProvider dir="rtl" direction="rtl">
          {children}
        </DirectionProvider>
      </body>
    </html>
  );
}
