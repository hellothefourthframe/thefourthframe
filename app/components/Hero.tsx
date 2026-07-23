import HeroVideo from "./HeroVideo";
import type { HeroMedia } from "../lib/types";

interface HeroProps {
  heroMedia: HeroMedia;
}

export default function Hero({ heroMedia }: HeroProps) {
  return (
    <section className="hero-fullscreen">
      <div className="hero-video-container" aria-hidden="true">
        <HeroVideo heroMedia={heroMedia} />
      </div>

      <div className="page-container hero-content-wrapper">
        <div className="hero-content">
          <div className="hero-dual-cta" />
        </div>
      </div>
    </section>
  );
}
