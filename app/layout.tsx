import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bolsillos - Tu dinero, organizado",
  description: "Controla tus gastos familiares con el método de bolsillos. Organiza tu dinero de forma sencilla y alcanza tus metas de ahorro.",
  keywords: ["finanzas personales", "control de gastos", "presupuesto familiar", "método de sobres", "ahorro"],
  authors: [{ name: "Bolsillos" }],
  openGraph: {
    title: "Bolsillos - Tu dinero, organizado",
    description: "Controla tus gastos familiares con el método de bolsillos.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${outfit.variable} font-sans antialiased`} style={{ fontFamily: 'Outfit, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
