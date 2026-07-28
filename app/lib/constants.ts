// ─────────────────────────────────────────────────────────
// constants.ts — Single source of truth for all site data
// Change anything here → reflected across the entire site
// ─────────────────────────────────────────────────────────

// ── Site-wide ──────────────────────────────────────────

export const SITE = {
  name: "THE AGENCY FRAME",
  operatedBy: "THE FOURTH FRAME",
  established: 2024,
  logo: "/images/logo.jpg",
  email: "hellothefourthframe@gmail.com",
  footerEmail: "HELLO@THEFOURTHFRAME.COM",
  footerEmailHref: "mailto:hello@thefourthframe.com",
  location: {
    studio: "Fourth Frame Production Studio",
    city: "Bikaner",
    country: "India",
  },
  badges: ["EST. 2024", "PRODUCTION PARTNER", "PAN-INDIA"],
} as const;

// ── Navigation ─────────────────────────────────────────

export const NAV_ITEMS = [
  { label: "Services", href: "/#services" },
  { label: "Models", href: "/#work" },
] as const;

export const NAV_CTA_MODEL = {
  label: "Contact Us",
  href: "/contactus",
} as const;

export const NAV_CTA = {
  label: "Join as model",
  href: "/submissionform",
} as const;

// ── Social Links ───────────────────────────────────────

export const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/the_fourthframe_/",
    handle: "@the_fourthframe_",
  },
] as const;

// ── Hero Section ───────────────────────────────────────

export const HERO_MEDIA = {
  desktopVideo: "/main/main.mp4",
  mobileVideo: "/main/mianveritical.mp4",
} as const;

// ── Founders Section ───────────────────────────────────

export const FOUNDERS_SECTION = {
  label: "LEADERSHIP",
  title: "The Faces Behind",
  titleAccent: "The Fourth Frame",
  sliderSpeed: 20,
} as const;

export const FOUNDERS = [
  {
    name: "Co-Founder & Producer",
    role: "PRODUCER",
    image: "/main/COP.jpeg",
  },
  {
    name: "Casting Manager",
    role: "CASTING",
    image: "/main/CM.jpeg",
  },
  {
    name: "Co-Founder & DOP",
    role: "DIRECTOR OF PHOTOGRAPHY",
    image: "/main/CFD.jpeg",
  },
] as const;

// ── Services Section ───────────────────────────────────

export const SERVICES_SECTION = {
  label: "OUR EXPERTISE",
  title: "Integrated Production &",
  titleAccent: "Talent Management",
} as const;

export const SERVICES = [
  {
    title: "BACKSTAGE",
    video: "/main/main.mp4",
    image: "/main/S3.jpeg",
  },
  {
    title: "BRAND SHOOT",
    video: "/main/mianveritical.mp4",
    image: "/main/S1.jpeg",
  },
  {
    title: "PROFESSIONAL EDITORS",
    video: "/main/CTABG.mp4",
    image: "/main/S4.jpeg",
  },
  {
    title: "BTS MAN",
    video: "/main/main.mp4",
    image: "/main/S2.jpeg",
  },
] as const;

// ── Models / Portfolio Roster ──────────────────────────

export const MODELS_SECTION = {
  label: "OUR TALENT",
  title: "Models",
  titleAccent: "Roster",
  sliderSpeed: 25,
} as const;

export const MODELS = [
  {
    id: 1,
    name: "Iri",
    height: '162 cm (5\'4")',
    hair: "Dark Brown",
    eyes: "Dark Brown",
    image: "/main/M1.jpeg",
  },
  {
    id: 2,
    name: "Tamannah",
    height: '162 cm (5\'4")',
    hair: "Dark Brown",
    eyes: "Dark Brown",
    image: "/main/M3.png",
  },
  {
    id: 3,
    name: "Bhavika Jain",
    height: '167 cm (5\'5")',
    hair: "Black",
    eyes: "Dark Brown",
    image: "/main/M4.png",
  },
  {
    id: 4,
    name: "Zuber mirza",
    height: '180 cm (5\'9")',
    hair: "Black",
    eyes: "Black",
    image: "/main/M5.png",
  },
] as const;

// ── Contact Section ────────────────────────────────────

export const CONTACT_SECTION = {
  label: "GET IN TOUCH",
  title: "CONNECT WITH",
  titleAccent: "THE FRAME",
  submitButtonText: "Book Your Talent",
  successTitle: "Submission Successful",
  successMessage:
    "Your query has been submitted and our team will connect with you soon.",
} as const;

export const CONTACT_FORM_INTERESTS = [
  "Talent Booking",
  "Production Management",
  "Location Scouting",
  "Full Agency Service",
] as const;

// ── Footer ─────────────────────────────────────────────

export const FOOTER = {
  ctaVideoSrc: "/main/CTABG.mp4",
  ctaHeadline:
    "Build visuals that look premium before production even starts.",
  heading: ["WE COMMAND", "THE STAGE.", "WE CURATE", "THE FACE"],
  description:
    "Premium talent casting for global brands and comprehensive backstage logistics for large-scale fashion shows. We handle the hustle; you take the applause.",
  team: {
    title: "MAIN TEAM FOURTHFRAME",
    marketing: "MARKETING HANDLE BY ZAYRAGENCY",
    members: [
      { name: "AYAN", role: "THEME DIRECTOR" },
      { name: "REHAN", role: "D.O.V" },
      { name: "TANISHA", role: "CASTING DIRECTOR & CHOREOGRAPHER" },
      { name: "AMIT", role: "BTS MAN" },
    ],
  },
  studioLocations: [{ city: "Bikaner", note: "Primary Base" }],
} as const;

// ── Legacy Image Pools ──

export const HERO_BACKGROUND_IMAGE = "/main/S1.jpeg";

export const HERO_PREVIEW_IMAGES = {
  talent: "/main/M1.jpeg",
  production: "/main/S1.jpeg",
  locations: "/main/S3.jpeg",
} as const;

export const TALENT_IMAGE_POOL = [
  "/main/M1.jpeg",
  "/main/M3.png",
  "/main/M4.png",
  "/main/M5.png",
  "/main/COP.jpeg",
  "/main/CM.jpeg",
  "/main/CFD.jpeg",
  "/main/S1.jpeg",
] as const;

export const PORTFOLIO_IMAGE_POOL = [
  "/main/S1.jpeg",
  "/main/S2.jpeg",
  "/main/S3.jpeg",
  "/main/S4.jpeg",
  "/main/COP.jpeg",
  "/main/CM.jpeg",
  "/main/CFD.jpeg",
  "/main/M1.jpeg",
] as const;

export const LOCATION_IMAGE_POOL = [
  "/images/loc1.svg",
  "/images/loc2.svg",
  "/images/loc3.svg",
  "/images/loc4.svg",
  "/main/S1.jpeg",
  "/main/S2.jpeg",
  "/main/S3.jpeg",
  "/main/S4.jpeg",
  "/images/hero.svg",
] as const;
