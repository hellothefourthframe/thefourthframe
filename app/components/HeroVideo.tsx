"use client";

import { useEffect, useState } from "react";
import type { HeroMedia } from "../lib/types";

interface HeroVideoProps {
  heroMedia: HeroMedia;
}

export default function HeroVideo({ heroMedia }: HeroVideoProps) {
  const [activeSrc, setActiveSrc] = useState(heroMedia.desktopVideo);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const updateSrc = () => {
      const mobileVideo = heroMedia.mobileVideo.trim();
      const desktopVideo = heroMedia.desktopVideo.trim();
      setActiveSrc(mediaQuery.matches && mobileVideo ? mobileVideo : desktopVideo);
    };

    updateSrc();
    mediaQuery.addEventListener("change", updateSrc);
    return () => mediaQuery.removeEventListener("change", updateSrc);
  }, [heroMedia.desktopVideo, heroMedia.mobileVideo]);

  if (!activeSrc) return null;

  return (
    <video
      key={activeSrc}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className="hero-video-placeholder"
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
      src={activeSrc}
    />
  );
}
