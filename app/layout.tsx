import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet-context";

export const metadata: Metadata = {
  title: "FundKeep — Lock Your Savings. Reach Your Goals.",
  description:
    "FundKeep helps you lock USDC toward a savings goal on Stellar. Your funds stay secure and are only withdrawable when your target is reached or the deadline passes — enforced on-chain, not by trust.",
  keywords: ["savings", "USDC", "Stellar", "Soroban", "blockchain", "DeFi", "goal"],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "FundKeep — Lock Your Savings. Reach Your Goals.",
    description: "On-chain savings goals powered by Stellar & Soroban.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
