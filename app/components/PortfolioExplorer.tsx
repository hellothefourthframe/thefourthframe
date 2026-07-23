"use client";

import Image from "next/image";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import type { SectionHeader, Model } from "../lib/types";

const cardReveal = {
  type: "spring",
  stiffness: 170,
  damping: 22,
  mass: 0.8,
} as const;

interface PortfolioExplorerProps {
  modelsSection: SectionHeader;
  models: Model[];
}

export default function PortfolioExplorer({ modelsSection, models }: PortfolioExplorerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="section bg-white anchor-section" id="work" ref={ref}>
      <div className="page-container">
        <div className="section-center mb-16">
          <motion.span
            className="section-label"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
          >
            {modelsSection.label}
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...cardReveal, delay: 0.1 }}
          >
            {modelsSection.title}{" "}
            <span className="accent-text" style={{ fontStyle: "italic" }}>
              {modelsSection.titleAccent}
            </span>
          </motion.h2>
        </div>

        <div className="models-grid">
          {models.map((model, i) => (
            <motion.div
              key={`${model.id}-${model.image}-${i}`}
              className="group"
              style={{
                position: "relative",
                height: "520px",
                width: "100%",
                overflow: "hidden",
                borderRadius: "30px",
                cursor: "pointer",
              }}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...cardReveal, delay: 0.12 + i * 0.08 }}
              whileHover={{
                y: -14,
                boxShadow: "0 28px 60px rgba(0,0,0,0.18)",
              }}
            >
              <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
                <Image
                  key={model.image}
                  src={model.image}
                  alt={model.name}
                  fill
                  quality={90}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div
                  className="transition-opacity duration-500"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.4) 45%, transparent 100%)",
                    opacity: 0.65,
                  }}
                />
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  padding: "6rem 2rem 2.5rem 2rem",
                  background:
                    "linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.6) 55%, transparent 100%)",
                  borderRadius: "0 0 30px 30px",
                  zIndex: 10,
                }}
              >
                <h4
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "1.6rem",
                    fontWeight: 500,
                    color: "#fff",
                    marginBottom: "1rem",
                    textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {model.name}
                </h4>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.6rem 1.2rem",
                  }}
                >
                  <DetailItem label="HEIGHT" value={model.height} />
                  <DetailItem label="HAIR" value={model.hair} />
                  <DetailItem label="EYES" value={model.eyes} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span
        style={{
          display: "block",
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.2em",
          color: "var(--accent-gold)",
          marginBottom: "0.15rem",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "0.82rem",
          color: "rgba(255,255,255,0.85)",
          fontWeight: 400,
        }}
      >
        {value}
      </span>
    </div>
  );
}
