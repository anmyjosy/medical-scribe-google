import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
});

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
    title: "MedScribe AI",
    description: "AI-Powered Medical Scribe",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${plusJakarta.variable} ${outfit.variable}`}>
                {children}
            </body>
        </html>
    );
}
