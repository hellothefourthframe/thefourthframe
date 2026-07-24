"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import type { SectionHeader, Service } from "../lib/types";

const cardReveal = {
  type: "spring",
  stiffness: 170,
  damping: 22,
  mass: 0.8,
} as const;

interface ServicesProps {
  servicesSection: SectionHeader;
  services: Service[];
}

export default function Services({ servicesSection, services }: ServicesProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const visibleServices = services.filter((service) => {
    const videoOrImage = service.video || service.image;
    return service.title.trim() && videoOrImage && videoOrImage.trim();
  });

  return (
    <section className="section bg-white anchor-section" id="services" ref={ref}>
      <div className="page-container">
        <div className="section-center mb-16">
          <motion.span
            className="section-label"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
          >
            {servicesSection.label}
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...cardReveal, delay: 0.1 }}
          >
            {servicesSection.title}{" "}
            <span className="metallic-gold">{servicesSection.titleAccent}</span>
          </motion.h2>
        </div>

        <div className="services-grid-premium">
          {visibleServices.map((s, i) => {
            const mediaSrc = s.video || s.image || "";
            const isVideo = mediaSrc.endsWith(".mp4") || mediaSrc.endsWith(".webm") || mediaSrc.includes("blob");

            return (
              <motion.div
                key={`${s.title}-${mediaSrc}-${i}`}
                className="service-showcase-card group"
                style={{
                  position: "relative",
                  height: "480px",
                  borderRadius: "24px",
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                }}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...cardReveal, delay: 0.16 + i * 0.08 }}
                whileHover={{ y: -8, boxShadow: "0 22px 50px rgba(0,0,0,0.15)" }}
              >
                <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
                  {isVideo ? (
                    <video
                      key={mediaSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    >
                      <source src={mediaSrc} type="video/mp4" />
                    </video>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={mediaSrc}
                      src={mediaSrc}
                      alt={s.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.3) 50%, transparent 100%)",
                    }}
                  />
                </div>

                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    padding: "3rem 2rem 2.5rem 2rem",
                    zIndex: 10,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "clamp(1.4rem, 2vw, 1.8rem)",
                      fontWeight: 600,
                      color: "#ffffff",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                    }}
                  >
                    {s.title}
                  </h3>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
