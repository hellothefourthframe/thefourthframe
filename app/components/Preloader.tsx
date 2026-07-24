"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

interface PreloaderProps {
  logo?: string;
  siteName?: string;
}

export default function Preloader({ logo = "/images/logo.jpg", siteName = "THE FOURTH FRAME" }: PreloaderProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hide loader after 1.4 seconds for a swift, high-end entry
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

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
              width: "300px",
              height: "300px",
              background: "radial-gradient(circle, rgba(197,160,89,0.18) 0%, transparent 70%)",
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

            {/* Subtle Progress Bar Line */}
            <motion.div
              style={{
                width: "120px",
                height: "2px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "2px",
                overflow: "hidden",
                marginTop: "0.5rem",
              }}
            >
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, var(--accent-gold) 0%, #ffffff 100%)",
                }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
