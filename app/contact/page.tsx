"use client";

import { motion } from "motion/react";
import { type FormEvent, useState } from "react";

const contactCards = [
  {
    label: "Enquiries",
    title: "hellothefourthframe@gmail.com",
    description: "Best for shoot requests, campaign conversations, and brand collaborations.",
    href: "mailto:hellothefourthframe@gmail.com",
  },
  {
    label: "Instagram",
    title: "@the_fourthframe_",
    description: "If you want a quicker first touch, message us here and we will follow up properly.",
    href: "https://www.instagram.com/the_fourthframe_/",
  },

];

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      interest: formData.get("interest") as string,
      timeline: formData.get("timeline") as string,
      message: formData.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* <section className="footer-top-band flex-center-vertical" style={{ position: "relative", overflow: "hidden", minHeight: "80vh" }}>
      
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            zIndex: 0,
          }}
        >
          <source src="/main/BG.mp4" type="video/mp4" />
        </video>
       
        <div
          style={{
            position: "absolute",
            inset: 0,

            zIndex: 1,
          }}
        />
       

      </section> */}

      <section className="page-hero page-hero-grid">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="section-label">Contact</span>
          <h1>
            Connect with the <span className="accent-text">team</span> behind the frame.
          </h1>
          <p>
            Share the project, the campaign, or the problem you are trying to solve.
            We will reply with a clearer direction and the right next step.
          </p>
        </motion.div>

        <motion.aside
          className="page-hero-card"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
        >
          <span className="section-label">Quick Snapshot</span>
          <p style={{ marginBottom: "1rem" }}>
            Most enquiries start with bridal editorials, personal brand shoots, or
            recurring reel content for social growth.
          </p>
          <div className="page-hero-meta">
            <div>
              <span className="page-hero-meta-value">24 hrs</span>
              <span className="page-hero-meta-label">Typical Reply Window</span>
            </div>
            <div>
              <span className="page-hero-meta-value">India</span>
              <span className="page-hero-meta-label">Primary Base</span>
            </div>
          </div>
        </motion.aside>
      </section>

      <section className="section section-tight">
        <div className="page-container">
          <div className="contact-grid">
            <motion.div
              className="contact-stack"
              initial={{ opacity: 0, x: -22 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.12 }}
            >
              {contactCards.map((card) => (
                <div key={card.label} className="contact-card">
                  <span className="contact-card-label">{card.label}</span>
                  <h3>{card.title}</h3>
                  {card.href ? (
                    <a
                      href={card.href}
                      target={card.href.startsWith("http") ? "_blank" : undefined}
                      rel={card.href.startsWith("http") ? "noreferrer" : undefined}
                      className="btn-ghost"
                    >
                      Reach out
                    </a>
                  ) : null}
                  <p style={{ marginTop: card.href ? "1rem" : "0" }}>{card.description}</p>
                </div>
              ))}

              <div className="contact-card">
                <span className="contact-card-label">How We Work</span>
                <h3>Clear scope. Strong pacing. Cleaner delivery.</h3>
                <p>
                  If you already know the shoot type, budget band, or target timeline,
                  include that in the form. It helps us reply with something useful
                  instead of sending generic questions back.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="contact-form-card"
              initial={{ opacity: 0, x: 22 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <span className="section-label">Project Brief</span>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="contact-form-grid">
                  <div className="contact-field">
                    <label htmlFor="name">Your Name</label>
                    <input id="name" name="name" type="text" placeholder="John Doe" required />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="interest">Primary Interest</label>
                    <input
                      id="interest"
                      name="interest"
                      type="text"
                      placeholder="Photography / Film / Strategy"
                      required
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="timeline">Target Timeline</label>
                    <input id="timeline" name="timeline" type="text" placeholder="Next 2-4 weeks" required />
                  </div>

                  <div className="contact-field contact-field-full">
                    <label htmlFor="message">About the Project</label>
                    <textarea
                      id="message"
                      name="message"
                      placeholder="Tell us what needs to happen, what is not working right now, and what kind of final look you want."
                      required
                    />
                  </div>
                </div>

                {errorMsg ? (
                  <div style={{ color: "#dc2626", fontSize: "0.85rem", marginTop: "1rem", fontWeight: 600 }}>
                    {errorMsg}
                  </div>
                ) : null}

                {submitted ? (
                  <div className="contact-status" style={{ marginTop: "1rem" }}>
                    Thanks. Your message is ready for follow-up and we&apos;ll get back to
                    you shortly.
                  </div>
                ) : null}

                <button type="submit" className="btn-main" style={{ width: "100%", marginTop: "1.2rem" }} disabled={submitting || submitted}>
                  {submitting ? "Sending..." : submitted ? "Message Sent ✓" : "Send Message"}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-container">
          <div className="contact-map-shell">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d51510.72085144021!2d73.2783407296867!3d28.021401806710703!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x393fdd7bd90bbb89%3A0x4ce3121a7664816b!2sBikaner%2C%20Rajasthan!5e1!3m2!1sen!2sin!4v1774951006683!5m2!1sen!2sin"
              width="100%"
              height="500"

              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Bikaner Location Map"
            ></iframe>
          </div>
        </div>
      </section>
    </>
  );
}
