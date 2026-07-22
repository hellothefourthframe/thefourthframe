"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import Image from "next/image";
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
  const visibleServices = services.filter(
    (service) => service.title.trim() && service.image.trim()
  );

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
            <motion.div
              key={`${s.title}-${s.image}-${i}`}
              className="service-showcase-card"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...cardReveal, delay: 0.16 + i * 0.08 }}
              whileHover={{ y: -6 }}
            >
              <div className="service-flip">
                <div className="service-flip-inner">
                  {/* FRONT */}
                  <div className="service-face service-front">
                    <div className="service-media">
                      <Image
                        src={s.image}
                        alt={s.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="service-showcase-image"
                      />
                      <div className="service-media-overlay" />
                    </div>

                    <div className="service-front-overlay">
                      <h3 className="service-showcase-title">{s.title}</h3>

                      <div className="service-front-mobile-details">
                        <p className="service-showcase-desc">{s.description}</p>
                        <div className="service-showcase-meta">{s.details}</div>

                        {s.includes && Array.isArray(s.includes) && s.includes.length > 0 ? (
                          <ul className="service-showcase-list">
                            {s.includes.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* BACK */}
                  <div className="service-face service-back">
                    <div className="service-back-shell">
                      <div className="service-back-top">
                        <span className="service-showcase-kicker">WHAT WE PROVIDE</span>
                        <h3 className="service-back-title">{s.title}</h3>
                        <p className="service-back-desc">{s.description}</p>
                      </div>

                      {s.includes && Array.isArray(s.includes) && s.includes.length > 0 ? (
                        <ul className="service-showcase-list">
                          {s.includes.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : null}

                      <div className="service-back-meta">{s.details}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
