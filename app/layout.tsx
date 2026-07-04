import type { Metadata } from "next";
import { IBM_Plex_Sans_Hebrew, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import SiteNav from "./components/SiteNav";

const plexHebrew = IBM_Plex_Sans_Hebrew({
  variable: "--font-plex-hebrew",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rtl8192eu-site.vercel.app"),
  title: {
    default: "RTL8192EU — נתיחה חיה של צ'יפ Wi-Fi",
    template: "%s · RTL8192EU",
  },
  description:
    "מדריך אינטראקטיבי ולימודי לצ'יפ ה-Wi-Fi‏ RTL8192EU — ארכיטקטורה, מפת זיכרון, רגיסטרים וכתיבת firmware, שנבנה כולו מהנדסה-לאחור חיה של הסיליקון, בלי datasheet. כל ערך נמדד על הצ'יפ הפיזי.",
  keywords: [
    "RTL8192EU", "Realtek", "reverse engineering", "8051", "firmware",
    "Wi-Fi", "הנדסה לאחור", "USB", "0BDA:818B",
  ],
  authors: [{ name: "egozkokus" }],
  openGraph: {
    type: "website",
    locale: "he_IL",
    title: "RTL8192EU — נתיחה חיה של צ'יפ Wi-Fi",
    description:
      "ארכיטקטורה, מפת זיכרון וכתיבת firmware לצ'יפ RTL8192EU — הכול נמדד חי מהסיליקון, בלי datasheet.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="he"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${plexHebrew.variable} ${plexMono.variable} antialiased`}
    >
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
