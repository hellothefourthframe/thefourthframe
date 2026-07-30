"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

import { formatMediaUrl, isVideoUrl } from "../lib/video";

interface PreloaderProps {
  logo?: string;
  siteName?: string;
  mediaToPreload?: string[];
}

export default function Preloader({
  logo = "/images/logo.jpg",
  siteName = "THE FOURTH FRAME",
  mediaToPreload = [],
}: PreloaderProps) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Unique list of formatted image & video URLs to preload
    const rawUrls = Array.from(new Set([logo, ...mediaToPreload])).filter(
      (url): url is string => Boolean(url) && typeof url === "string" && url.trim().length > 0
    );

    if (rawUrls.length === 0) {
      setProgress(100);
      const t = setTimeout(() => setLoading(false), 400);
      return () => clearTimeout(t);
    }

    let loadedCount = 0;
    const total = rawUrls.length;
    let isMounted = true;

    const updateProgress = () => {
      if (!isMounted) return;
      loadedCount++;
      const currentPct = Math.min(100, Math.round((loadedCount / total) * 100));
      setProgress(currentPct);

      if (loadedCount >= total) {
        setTimeout(() => {
          if (isMounted) setLoading(false);
        }, 400);
      }
    };

    // Preload each image/video
    rawUrls.forEach((rawUrl) => {
      const url = formatMediaUrl(rawUrl);
      const isVideo = isVideoUrl(rawUrl) || isVideoUrl(url);

      if (isVideo) {
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";

        let done = false;
        const onVideoLoaded = () => {
          if (!done) {
            done = true;
            updateProgress();
          }
        };

        video.oncanplaythrough = onVideoLoaded;
        video.onloadeddata = onVideoLoaded;
        video.onerror = onVideoLoaded;

        video.src = url;
        video.load();
      } else {
        const img = new window.Image();
        img.referrerPolicy = "no-referrer";

        let done = false;
        const onImgLoaded = () => {
          if (!done) {
            done = true;
            updateProgress();
          }
        };

        img.onload = onImgLoaded;
        img.onerror = onImgLoaded;
        img.src = url;
      }
    });

    // Safety fallback timeout (Max 4 seconds max wait)
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setProgress(100);
        setLoading(false);
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [logo, mediaToPreload]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.05,
            transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] },
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center pointer-events-none select-none"
          style={{ background: "#0a0a0a" }}
        >
          {/* Subtle Ambient Golden Glow */}
          <div
            style={{
              position: "absolute",
              width: "320px",
              height: "320px",
              background: "radial-gradient(circle, rgba(197,160,89,0.2) 0%, transparent 70%)",
              borderRadius: "50%",
              filter: "blur(40px)",
            }}
          />

          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="flex flex-col items-center gap-6 relative z-10"
          >
            {/* Logo Wrapper */}
            <div
              className="relative w-24 h-24 md:w-28 md:h-28 overflow-hidden rounded-full shadow-2xl"
              style={{
                border: "1px solid rgba(197, 160, 89, 0.4)",
                boxShadow: "0 0 35px rgba(197, 160, 89, 0.2)",
              }}
            >
              <Image
                src={logo}
                alt={siteName}
                fill
                priority
                sizes="(max-width: 768px) 96px, 112px"
                className="object-cover"
              />
            </div>

            {/* Brand Title */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  letterSpacing: "0.28em",
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                {siteName}
              </span>
              <span
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "0.3em",
                  color: "var(--accent-gold)",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                PRODUCTION & MODELING
              </span>
            </div>

            {/* Progress Bar Line & Percentage */}
            <div className="flex flex-col items-center gap-2 mt-1">
              <div
                style={{
                  width: "140px",
                  height: "3px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, var(--accent-gold) 0%, #ffffff 100%)",
                    transition: "width 0.25s ease-out",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  color: "var(--accent-gold)",
                }}
              >
                {progress}%
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
