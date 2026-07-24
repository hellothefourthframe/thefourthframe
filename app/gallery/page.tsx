"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import type { SiteContent } from "@/app/lib/types";

const defaultGalleryItems = [
  {
    src: "/main/S1.jpeg",
    title: "Editorial Bridal",
    category: "Photography",
    size: "portrait",
    description: "Soft bridal styling with cleaner direction and premium natural light.",
  },
  {
    src: "/main/S4.jpeg",
    title: "Cinematic Reel",
    category: "Film",
    size: "landscape",
    description: "Motion-first campaign coverage designed for reels, launches, and web headers.",
  },
  {
    src: "/main/M1.jpeg",
    title: "High-Fashion Frame",
    category: "Fashion",
    size: "square",
    description: "Sharper silhouettes and stronger image rhythm for visual campaigns.",
  },
  {
    src: "/main/S2.jpeg",
    title: "Studio BTS",
    category: "BTS",
    size: "portrait",
    description: "Behind-the-scenes coverage that still looks polished enough to publish.",
  },
  {
    src: "/main/M3.png",
    title: "Modern Portrait",
    category: "Photography",
    size: "square",
    description: "Portrait sets built for cleaner color, tighter framing, and stronger recall.",
  },
  {
    src: "/main/S3.jpeg",
    title: "Ceremony Tale",
    category: "Film",
    size: "landscape",
    description: "Emotion-led sequence work that feels elevated without becoming heavy.",
  },
  {
    src: "/main/M4.png",
    title: "Vogue Street",
    category: "Fashion",
    size: "portrait",
    description: "Location-based fashion work with stronger posture, shape, and attitude.",
  },
  {
    src: "/main/CM.jpeg",
    title: "Studio Lighting",
    category: "BTS",
    size: "square",
    description: "Production moments that still support the brand story after the shoot wraps.",
  },
];

const categories = ["All", "Photography", "Film", "Fashion", "BTS"];

export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [galleryItems, setGalleryItems] = useState(defaultGalleryItems);
  const deferredTab = useDeferredValue(activeTab);

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SiteContent | null) => {
        if (!data) return;

        const dynamicItems = [...defaultGalleryItems];

        // Override default service images with updated ones from admin database
        if (data.services && data.services.length > 0) {
          data.services.forEach((s, idx) => {
            const mediaSrc = s.video || s.image;
            if (mediaSrc && dynamicItems[idx]) {
              dynamicItems[idx] = {
                ...dynamicItems[idx],
                title: s.title || dynamicItems[idx].title,
                src: mediaSrc,
              };
            }
          });
        }

        // Override model images if available
        if (data.models && data.models.length > 0) {
          data.models.forEach((m, idx) => {
            const targetIdx = 2 + idx; // map to fashion/portrait slots
            if (m.image && dynamicItems[targetIdx]) {
              dynamicItems[targetIdx] = {
                ...dynamicItems[targetIdx],
                title: m.name ? `${m.name} Showcase` : dynamicItems[targetIdx].title,
                src: m.image,
              };
            }
          });
        }

        setGalleryItems(dynamicItems);
      })
      .catch(() => {
        /* fallback to defaults */
      });
  }, []);

  const filteredItems =
    deferredTab === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.category === deferredTab);

  return (
    <>
      <section className="page-hero page-hero-grid">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="section-label">Gallery Portfolio</span>
          <h1>
            Bespoke <span className="accent-text">narratives</span> with cleaner visual
            pacing.
          </h1>
          <p>
            A tighter selection of frames, reels, and BTS moments that show how we
            handle composition, motion, and mood across different project types.
          </p>
        </motion.div>

        <motion.aside
          className="gallery-note-card"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
        >
          <span className="section-label">What You&apos;re Seeing</span>
          <p style={{ marginBottom: "1rem" }}>
            The gallery mixes polished client-facing work with production-side moments
            so you can judge both the aesthetic and the process behind it.
          </p>
          <div className="page-hero-meta">
            <div>
              <span className="page-hero-meta-value">4</span>
              <span className="page-hero-meta-label">Core Categories</span>
            </div>
            <div>
              <span className="page-hero-meta-value">20+</span>
              <span className="page-hero-meta-label">Recent Projects</span>
            </div>
          </div>
        </motion.aside>
      </section>

      <section className="section section-tight">
        <div className="page-container">
          <div className="gallery-toolbar">
            <div>
              <div className="gallery-count">
                {filteredItems.length} pieces in view / {activeTab}
              </div>
            </div>

            <div className="gallery-filters">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    startTransition(() => setActiveTab(category));
                  }}
                  className={`gallery-filter ${activeTab === category ? "active" : ""}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <motion.div layout className="gallery-grid">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.article
                  key={`${item.title}-${item.src}`}
                  layout
                  className={`gallery-card gallery-card-${item.size}`}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{
                    type: "spring",
                    stiffness: 190,
                    damping: 24,
                    mass: 0.84,
                    delay: index * 0.02,
                  }}
                >
                  <div className="gallery-media">
                    <Image
                      key={item.src}
                      src={item.src}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="gallery-card-copy">
                    <span>{item.category}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="page-container">
          <div className="gallery-note-card gallery-cta">
            <div>
              <span className="section-label">Need A Similar Look?</span>
              <h2 className="section-title">
                Let&apos;s build visuals that feel more deliberate and more consistent.
              </h2>
            </div>
            <Link href="/contact" className="btn-main">
              Start the Conversation
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
