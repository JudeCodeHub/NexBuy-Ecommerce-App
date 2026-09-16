import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerkAppearance";

const outfit = Outfit({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-outfit",
});

export const metadata = {
    title: "NexBuy. - Shop smarter",
    description: "NexBuy. - Shop smarter",
};

export default function RootLayout({ children }) {
    return (
        <ClerkProvider appearance={clerkAppearance}>
        <html lang="en">
            <body className={`${outfit.className} ${outfit.variable} antialiased bg-neutral-950 text-slate-100`}>
                <StoreProvider>
                    <Toaster />
                    {children}
                </StoreProvider>
            </body>
        </html>
        </ClerkProvider>
    );
}
