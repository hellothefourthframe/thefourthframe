"use client";

import { useEffect, useRef, useState } from "react";
import { formatMediaUrl } from "../lib/video";
import type { HeroMedia } from "../lib/types";

interface HeroVideoProps {
  heroMedia: HeroMedia;
}

export default function HeroVideo({ heroMedia }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeSrc, setActiveSrc] = useState<string>(() => {
    const mobile = heroMedia.mobileVideo?.trim();
    const desktop = heroMedia.desktopVideo?.trim();
    return desktop || mobile || "";
  });

  useEffect(() => {
    const updateSrc = () => {
      const isMobile = window.innerWidth <= 767;
      const mobileVideo = heroMedia.mobileVideo?.trim();
      const desktopVideo = heroMedia.desktopVideo?.trim();

      // If mobile view but no separate mobile video uploaded, seamlessly fall back to desktop video
      const chosen = isMobile && mobileVideo ? mobileVideo : (desktopVideo || mobileVideo || "");
      setActiveSrc(chosen);
    };

    updateSrc();
    window.addEventListener("resize", updateSrc);
    return () => window.removeEventListener("resize", updateSrc);
  }, [heroMedia.desktopVideo, heroMedia.mobileVideo]);

  // Programmatic play trigger to ensure iOS Safari & Chrome mobile start video immediately
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        /* Ignore browser autoplay restrictions if muted */
      });
    }
  }, [activeSrc]);

  if (!activeSrc) return null;

  const formattedUrl = formatMediaUrl(activeSrc);

  return (
    <video
      ref={videoRef}
      key={formattedUrl}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className="hero-video-placeholder"
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    >
      <source src={formattedUrl} type="video/mp4" />
    </video>
  );
}
