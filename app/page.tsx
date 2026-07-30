import Hero from "./components/Hero";
import Services from "./components/Services";
import Founders from "./components/Founders";
import PortfolioExplorer from "./components/PortfolioExplorer";
import ContactSection from "./components/ContactSection";
import Preloader from "./components/Preloader";
import { getSiteContent } from "./lib/data";
import { formatMediaUrl } from "./lib/video";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const content = await getSiteContent();

  const heroVideoSrc =
    content.heroMedia?.desktopVideo?.trim() ||
    content.heroMedia?.mobileVideo?.trim() ||
    "";
  const formattedHeroUrl = formatMediaUrl(heroVideoSrc);

  const mediaToPreload: string[] = [];
  if (heroVideoSrc) mediaToPreload.push(heroVideoSrc);
  if (content.site?.logo) mediaToPreload.push(content.site.logo);
  if (content.footer?.ctaVideoSrc) mediaToPreload.push(content.footer.ctaVideoSrc);

  content.founders?.forEach((f) => {
    if (f.image) mediaToPreload.push(f.image);
  });
  content.services?.forEach((s) => {
    const src = s.video || s.image;
    if (src) mediaToPreload.push(src);
  });
  content.models?.forEach((m) => {
    if (m.image) mediaToPreload.push(m.image);
  });

  return (
    <main>
      {formattedHeroUrl ? (
        <link
          rel="preload"
          href={formattedHeroUrl}
          as="fetch"
          crossOrigin="anonymous"
        />
      ) : null}
      <Preloader
        logo={content.site.logo}
        siteName={content.site.name}
        mediaToPreload={mediaToPreload}
      />
      <Hero heroMedia={content.heroMedia} />
      <Founders
        foundersSection={content.foundersSection}
        founders={content.founders}
      />
      <Services
        servicesSection={content.servicesSection}
        services={content.services}
      />
      <PortfolioExplorer
        modelsSection={content.modelsSection}
        models={content.models}
      />
      <ContactSection
        site={content.site}
        socialLinks={content.socialLinks}
        contactSection={content.contactSection}
        contactFormInterests={content.contactFormInterests}
      />
    </main>
  );
}
