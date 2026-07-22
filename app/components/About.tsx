"use client";

import { motion, useInView } from "motion/react";
import Image from "next/image";
import { useRef } from "react";

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      title: "Storytelling",
      text: "Cinematic narratives for luxury brands and personal moments that need stronger visual memory.",
      icon: "01",
    },
    {
      title: "Production",
      text: "Full-scale professional shoot planning, pacing, and delivery without the usual chaos.",
      icon: "02",
    },
    {
      title: "Strategy",
      text: "A sharper digital approach so your visuals feel premium on every platform, not only on set.",
      icon: "03",
    },
  ];

  return (
    <section className="section" id="about" ref={ref}>
      <div className="page-container">
        <div className="split-layout">
          <motion.div
            className="media-panel about-visual"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1 }}
          >
            <Image
              src="/main/CFD.jpeg"
              alt="Studio portrait setup"
              fill
              className="about-image"
              sizes="(max-width: 1024px) 100vw, 46vw"
            />
            <div className="about-visual-note">
              <strong className="section-label" style={{ marginBottom: "0.35rem" }}>
                Est. 2024
              </strong>
              <p>Built for visual brands that need cleaner art direction and tighter execution.</p>
            </div>
          </motion.div>

          <div className="about-copy">
            <motion.span
              className="section-label"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
            >
              Our Philosophy
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              We handle the <span className="accent-text">visuals</span> and the
              account pressure behind them.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ marginBottom: "1.5rem", maxWidth: "34rem" }}
            >
              The work is not just making a frame look beautiful. It is shaping a
              consistent brand impression across shoot days, reels, edits, and the way
              people remember your business after they scroll away.
            </motion.p>

            <motion.div
              className="feature-list"
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {features.map((feature) => (
                <div key={feature.title} className="feature-item">
                  <span className="feature-number">{feature.icon}</span>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
