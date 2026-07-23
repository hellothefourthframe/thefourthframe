import Hero from "./components/Hero";
import Services from "./components/Services";
import Founders from "./components/Founders";
import PortfolioExplorer from "./components/PortfolioExplorer";
import ContactSection from "./components/ContactSection";
import { getSiteContent } from "./lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const content = await getSiteContent();

  return (
    <main>
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
