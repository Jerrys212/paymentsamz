import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const lexend = Lexend({
    variable: "--font-lexend",
    subsets: ["latin"],
    weight: ["400", "600"],
});

export const metadata: Metadata = {
    title: "Payments",
    description: "Gestión de pagos",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="es" className={`${lexend.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col">
                <TooltipProvider>
                    <main className="flex-1">{children}</main>
                    <Toaster />
                </TooltipProvider>
            </body>
        </html>
    );
}
