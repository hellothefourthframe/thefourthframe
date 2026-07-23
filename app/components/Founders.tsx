"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import Image from "next/image";
import type { SectionHeader, Founder } from "../lib/types";

const cardReveal = {
  type: "spring",
  stiffness: 170,
  damping: 22,
  mass: 0.8,
} as const;

interface FoundersProps {
  foundersSection: SectionHeader;
  founders: Founder[];
}

export default function Founders({ foundersSection, founders }: FoundersProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="section bg-white anchor-section" id="founders" ref={ref}>
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
            transition={{ ...cardReveal, delay: 0.1 }}
          >
            {foundersSection.title}{" "}
            <span className="accent-text" style={{ fontStyle: "italic" }}>{foundersSection.titleAccent}</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12" style={{ perspective: "1200px" }}>
          {founders.map((founder, i) => (
            <motion.div
              key={`${founder.role}-${founder.image}-${i}`}
              className="group relative h-[520px] w-full overflow-hidden cursor-pointer"
              style={{ borderRadius: "var(--radius-xl)", transformStyle: "preserve-3d" }}
              initial={{ opacity: 0, y: 40, rotateX: 15 }}
              animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
              transition={{ ...cardReveal, delay: 0.12 + i * 0.08 }}
              whileHover={{
                scale: 1.02,
                rotateY: i === 0 ? 5 : i === 2 ? -5 : 0,
                rotateX: 4,
                boxShadow: "var(--shadow-strong)"
              }}
            >
              <div className="absolute inset-0 z-0">
                <Image
                  key={founder.image}
                  src={founder.image}
                  alt={founder.name}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/20 to-transparent opacity-60 group-hover:opacity-85 transition-opacity duration-500" />
              </div>

              <div
                className="absolute bottom-0 left-0 w-full z-10"
                style={{
                  padding: "7rem 2.5rem 3rem 2.5rem",
                  background: "linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.6) 50%, transparent 100%)",
                  borderRadius: "0 0 30px 30px",
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
