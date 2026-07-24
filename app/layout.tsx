import type { Metadata } from "next";
import { Pacifico, Great_Vibes, Playfair_Display, Cormorant_Garamond, Cinzel } from "next/font/google";
import "./globals.css";
import HashScrollManager from "./components/HashScrollManager";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { getSiteContent } from "./lib/data";

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pacifico",
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-greatvibes",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-cormorant",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

export const metadata: Metadata = {
  title: "THE FOURTH FRAME | Luxury Modeling, Talent & Production",
  description:
    "An ultra-luxury, high-end Modeling, Talent, and Production Agency. Managing the frame, elevating every vision with elite models and prime locations.",
  keywords: [
    "modeling agency",
    "talent management",
    "production studio",
    "luxury fashion",
    "bridal production",
    "prime locations",
    "THE AGENCY FRAME",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let content = null;
  try {
    content = await getSiteContent();
  } catch {
    // DB not seeded yet — fallback handled in components
  }

  const selectedFontKey = content?.site?.headingFont || "serif";

  const fontVariableMap: Record<string, string> = {
    pacifico: pacifico.style.fontFamily,
    "great-vibes": greatVibes.style.fontFamily,
    cormorant: cormorant.style.fontFamily,
    cinzel: cinzel.style.fontFamily,
    serif: playfair.style.fontFamily,
    playfair: playfair.style.fontFamily,
  };

  const activeHeadingFontFamily = fontVariableMap[selectedFontKey] || playfair.style.fontFamily;

  return (
    <html
      lang="en"
      className={`${pacifico.variable} ${greatVibes.variable} ${playfair.variable} ${cormorant.variable} ${cinzel.variable}`}
      style={
        {
          "--font-heading": activeHeadingFontFamily,
          "--font-serif": activeHeadingFontFamily,
        } as React.CSSProperties
      }
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="antialiased">
        <HashScrollManager />
        {content && <Navbar site={content.site} />}
        {children}
        {content && (
          <Footer
            site={content.site}
            socialLinks={content.socialLinks}
            footer={content.footer}
          />
        )}
      </body>
    </html>
  );
}
