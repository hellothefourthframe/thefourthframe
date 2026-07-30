import Hero from "./components/Hero";
import Services from "./components/Services";
import Founders from "./components/Founders";
import PortfolioExplorer from "./components/PortfolioExplorer";
import ContactSection from "./components/ContactSection";
import Preloader from "./components/Preloader";
import { getSiteContent } from "./lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const content = await getSiteContent();

  const mediaToPreload: string[] = [];
  if (content.site?.logo) mediaToPreload.push(content.site.logo);
  if (content.heroMedia?.desktopVideo) mediaToPreload.push(content.heroMedia.desktopVideo);
  if (content.heroMedia?.mobileVideo) mediaToPreload.push(content.heroMedia.mobileVideo);
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
