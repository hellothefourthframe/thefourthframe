"use client";

import { useEffect, useRef } from "react";
import { formatMediaUrl } from "../lib/video";
import type { HeroMedia } from "../lib/types";

interface HeroVideoProps {
  heroMedia: HeroMedia;
}

export default function HeroVideo({ heroMedia }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Always prioritize the hero video set in admin (desktopVideo or mobileVideo)
  const videoSrc =
    heroMedia.desktopVideo?.trim() || heroMedia.mobileVideo?.trim() || "";
  const formattedUrl = formatMediaUrl(videoSrc);

  // Programmatic play trigger to ensure iOS Safari & Chrome mobile start video immediately
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        /* Ignore browser autoplay restrictions if muted */
      });
    }
  }, [formattedUrl]);

  if (!formattedUrl) return null;

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
      src={formattedUrl}
    >
      <source src={formattedUrl} type="video/mp4" />
    </video>
  );
}
