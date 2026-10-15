import type { Metadata } from "next";
import { Hind_Siliguri, Inter } from "next/font/google";
import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: "সাশ্রয়ী দাম | Sashroyi Daam (SashroyiDam) — সাশ্রয়ী দামে সেরা পণ্য",
    template: "%s | সাশ্রয়ী দাম (SashroyiDam)",
  },
  description:
    "সাশ্রয়ী দাম | Sashroyi Daam (@sashroyidaam) — বাংলাদেশের প্রতিটি পরিবারের জন্য সাশ্রয়ী মূল্যে হোম ও কিচেন, গ্যাজেট এক্সেসরিজ এবং লাইফস্টাইল পণ্যের নির্ভরযোগ্য অনলাইন শপ।",
  openGraph: {
    type: "website",
    locale: "bn_BD",
    siteName: "সাশ্রয়ী দাম | Sashroyi Daam",
    title: "সাশ্রয়ী দাম | Sashroyi Daam — আপনার পছন্দ, সাশ্রয়ী দামে অশেষ সম্ভাবনা",
    description:
      "সঠিক বিবরণ, যাচাইকৃত মান এবং সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধায় কেনাকাটা করুন সাশ্রয়ী দাম (SashroyiDam) থেকে।",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="bn"
      className={`${hindSiliguri.variable} ${inter.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
