"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import Image from "next/image";
import type { SectionHeader, Founder } from "../lib/types";

interface FoundersProps {
  foundersSection: SectionHeader;
  founders: Founder[];
}

export default function Founders({ foundersSection, founders }: FoundersProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const speedDuration = foundersSection.sliderSpeed && foundersSection.sliderSpeed > 0
    ? foundersSection.sliderSpeed
    : 20;

  // Duplicate items for continuous seamless loop
  const displayFounders = [...founders, ...founders, ...founders];

  return (
    <section className="section bg-white anchor-section overflow-hidden" id="founders" ref={ref}>
      <div className="page-container">
        <div className="section-center mb-16">
          <motion.span
            className="section-label"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
          >
            {foundersSection.label}
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: "spring", stiffness: 170, damping: 22, delay: 0.1 }}
          >
            {foundersSection.title}{" "}
            <span className="accent-text" style={{ fontStyle: "italic" }}>{foundersSection.titleAccent}</span>
          </motion.h2>
        </div>
      </div>

      {/* Continuous Seamless Full-Bleed Slider (No Gap, No Rounded Corners) */}
      <div
        style={{
          width: "100%",
          overflow: "hidden",
          position: "relative",
          padding: "1rem 0 2rem 0",
        }}
      >
        <motion.div
          style={{
            display: "flex",
            gap: "0px",
            width: "max-content",
            willChange: "transform",
            transform: "translateZ(0)",
          }}
          animate={{ x: ["0%", "-33.333%"] }}
          transition={{
            ease: "linear",
            duration: speedDuration,
            repeat: Infinity,
          }}
        >
          {displayFounders.map((founder, i) => (
            <div
              key={`${founder.role}-${founder.image}-${i}`}
              className="group"
              style={{
                position: "relative",
                height: "540px",
                width: "380px",
                flexShrink: 0,
                overflow: "hidden",
                borderRadius: "0px",
                cursor: "pointer",
              }}
            >
              <div className="absolute inset-0 z-0">
                <Image
                  key={founder.image}
                  src={founder.image}
                  alt={founder.name}
                  fill
                  quality={95}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="380px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/20 to-transparent opacity-65 group-hover:opacity-85 transition-opacity duration-500" />
              </div>

              <div
                className="absolute bottom-0 left-0 w-full z-10"
                style={{
                  padding: "7rem 2rem 2.5rem 2rem",
                  background: "linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.6) 50%, transparent 100%)",
                  borderRadius: "0px",
                }}
              >
                <span
                  style={{
                    display: "block",
                    color: "var(--accent-gold)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    marginBottom: "0.6rem",
                  }}
                >
                  {founder.role}
                </span>
                <h4
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)",
                    fontWeight: 500,
                    lineHeight: 1.2,
                    color: "#fff",
                    textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  }}
                >
                  {founder.name}
                </h4>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
