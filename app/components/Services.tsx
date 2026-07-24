"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
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

function ServiceCard({ service, index, isInView }: { service: Service; index: number; isInView: boolean }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const mediaSrc = service.video || service.image || "";
  const isVideo = mediaSrc.endsWith(".mp4") || mediaSrc.endsWith(".webm") || mediaSrc.includes("blob");

  return (
    <motion.div
      className="service-showcase-card cursor-pointer group"
      style={{
        position: "relative",
        height: "500px",
        perspective: "1200px",
        borderRadius: "24px",
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...cardReveal, delay: 0.16 + index * 0.08 }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          borderRadius: "24px",
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* FRONT FACE */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            borderRadius: "24px",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
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
              alt={service.title}
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
                "linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.3) 55%, transparent 100%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              padding: "3rem 2rem 2.2rem 2rem",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "var(--accent-gold)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              TAP TO EXPLORE →
            </span>
            {service.title && service.title.trim() ? (
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
                {service.title}
              </h3>
            ) : null}
          </div>
        </div>

        {/* BACK FACE */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            borderRadius: "24px",
            background: "linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%)",
            border: "1px solid rgba(197, 160, 89, 0.35)",
            padding: "2.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            color: "#ffffff",
            boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
          }}
        >
          <div>
            <span
              style={{
                display: "block",
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.22em",
                color: "var(--accent-gold)",
                marginBottom: "0.8rem",
                textTransform: "uppercase",
              }}
            >
              SERVICE DETAILS
            </span>
            {service.title && service.title.trim() ? (
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "#ffffff",
                  marginBottom: "1rem",
                  textTransform: "uppercase",
                }}
              >
                {service.title}
              </h3>
            ) : null}

            {service.description ? (
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "rgba(255,255,255,0.8)",
                  lineHeight: 1.6,
                  marginBottom: "1.2rem",
                }}
              >
                {service.description}
              </p>
            ) : null}

            {service.includes && Array.isArray(service.includes) && service.includes.length > 0 ? (
              <ul style={{ display: "flex", flexDirection: "column", gap: "0.55rem", listStyle: "none", padding: 0 }}>
                {service.includes.map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: "0.82rem",
                      color: "rgba(255,255,255,0.9)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span style={{ color: "var(--accent-gold)" }}>✦</span> {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            {service.details ? (
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  color: "var(--accent-gold)",
                  borderTop: "1px solid rgba(255,255,255,0.12)",
                  paddingTop: "0.9rem",
                  textTransform: "uppercase",
                }}
              >
                {service.details}
              </div>
            ) : null}
            
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Services({ servicesSection, services }: ServicesProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const visibleServices = services.filter((service) => {
    const videoOrImage = service.video || service.image;
    return Boolean(videoOrImage && videoOrImage.trim());
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
          {visibleServices.map((s, i) => (
            <ServiceCard key={`${s.title}-${i}`} service={s} index={i} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}
