import type { HeroMedia } from "../lib/types";

interface HeroProps {
  heroMedia: HeroMedia;
}

export default function Hero({ heroMedia }: HeroProps) {
  return (
    <section className="hero-fullscreen">
      <div className="hero-video-container" aria-hidden="true">
        <video
          key={`${heroMedia.desktopVideo}-${heroMedia.mobileVideo}`}
          autoPlay
          loop
          muted
          playsInline
          className="hero-video-placeholder"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        >
          <source
            key={heroMedia.mobileVideo}
            media="(max-width: 767px)"
            src={heroMedia.mobileVideo}
            type="video/mp4"
          />
          <source
            key={heroMedia.desktopVideo}
            src={heroMedia.desktopVideo}
            type="video/mp4"
          />
        </video>
      </div>

      <div className="page-container hero-content-wrapper">
        <div className="hero-content">
          <div className="hero-dual-cta" />
        </div>
      </div>
    </section>
  );
}
