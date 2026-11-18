// Site copy and SEO, taken from the client's SEO brief ("Baldwa project.pdf", 2026-11-17).
// Keep wording as supplied; only obvious typos were corrected ("Form early" -> "From early", "Why I hire" -> "Why should I hire").

export const BRAND = {
  name: 'Baldwa & Associates',
  long: 'Baldwa and Associates',
  city: 'Udaipur',
  region: 'Rajasthan',
  country: 'India',
  summary: 'A cross-functional architecture and design organisation based in Udaipur, Rajasthan.',
};

// ---------- Homepage ----------
export const HOME = {
  title: 'Architecture & Interior Design Company in Udaipur | Baldwa & Associates',
  description: 'Looking for architecture and interior design services in Udaipur? Baldwa & Associates offers architectural consultancy, BIM engineering and interior design solutions.',
  focusKeyword: 'Architecture firm in Udaipur',
  keywords: [
    'Architecture firm in Udaipur', 'Architects in Udaipur', 'Best architecture enterprise in Udaipur', 'Interior designers in Udaipur',
    'BIM engineering services', 'Architectural consultancy in Udaipur', 'Interior design company in Rajasthan', 'Building design consultants',
    'Professional architecture services', 'Project management consultants',
  ],
  h1: 'Architecture and interior design solutions in Udaipur',
  intro: [
    'At Baldwa and Associates, we believe every great space commences with a verified idea and converts meaningfully with the help of strategic design. As a cross-functional architecture and design organisation in Udaipur, we combine originality, practical accuracy and attention to detail to bring your vision to the real-world.',
    'Whether you are planning a new development from the ground up or renovating a present property, our team offers functional, aesthetically striking and well-planned spaces personalised to your precise requirements.',
  ],
  servicesH2: 'Our Professional services',
  why: {
    h2: 'Why Choose Baldwa and Associates?',
    points: [
      { title: 'Cross-functional expertise', text: 'All-in-one addition of architecture, engineering and interior design under one roof.' },
      { title: 'Creative and real-world design method', text: 'Every plan and material choice is personalised around your objectives, funds and timeline.' },
      { title: 'Precision and Quality', text: 'From initial 3D modelling to final implementation, we focus on long-lasting structural integrity and refined aesthetics.' },
    ],
  },
  thoughtful: {
    h2: 'Creating Thoughtful Spaces Through Design',
    text: 'At Baldwa & Associates, we continue that model design extends beyond surface aesthetics. Our aim is to engineer spaces which operate with efficiency, encourage comfort and articulate a different architectural vision.',
    support: 'By incorporating architecture planning, interior design and building information modelling (BIM) engineering, we distribute inclusive support across every phase of your project development.',
  },
};

// ---------- About ----------
export const ABOUT = {
  path: '/about',
  nav: 'About Us',
  title: 'About Baldwa and Associates | Architecture and Design Excellence in Udaipur',
  description: 'Baldwa and Associates is a cross-functional architecture and design practice in Udaipur, Rajasthan, uniting architecture, interior design, BIM engineering, PMC and 3D walkthroughs.',
  h1: 'About Baldwa and Associates – Architecture and Design Excellence',
  body: [
    'Baldwa and Associates is a cross-functional architecture and design practice enthusiastic to distributing creative and durable three-dimensional solutions. Headquartered in Udaipur, Rajasthan, our firm unites architectural expertise, interior design, advanced BIM engineering, project management consultancy (PMC) and immersive 3D project walkthroughs to achieve various residential, financial and established requirements.',
    'Our practice complements creative exploration with severe technical accuracy. Through this balanced approach, we advance environments that seamlessly combine structural functionality, aesthetic modification and practical implementation.',
    'We function on the value that every instruction warrants a custom-made strategy, wherein architectural design, visualisation and engineering disciplines attention to accomplishes measurable and meaningful results.',
  ],
};

// ---------- Service pages ----------
// home: the short H3 copy shown on the homepage (only the three services the brief lists there).
export type Service = {
  slug: string; nav: string; keyword: string; title: string; description: string; h1: string; body: string;
  home?: { h3: string; text: string };
  image: { src: string; alt: string };
};

export const SERVICES: Service[] = [
  {
    slug: 'architecture', nav: 'Architecture', keyword: 'Architecture Firm in Udaipur',
    title: 'Premier Architecture Firm in Udaipur | Baldwa & Associates',
    description: 'As a recognised architecture firm in Udaipur, Baldwa and Associates delivers end-to-end architectural planning, theoretical growth and implementation oversight.',
    h1: 'Premier Architecture Firm in Udaipur',
    body: 'As a recognised architecture firm in Udaipur, Baldwa and Associates delivers end-to-end architectural planning, theoretical growth and implementation oversight. We design sustainable, structurally complete and visually compelling building personalised to the exclusive eco-friendly and cultural framework of Rajasthan. From early location analysis to final construction documentation, our architects ensure precision at every stage.',
    home: { h3: 'Architecture Design and Consultancy', text: 'End-to-end preparation, conceptual design and operational management for residential, financial and institutional projects.' },
    image: { src: '/images/projects/residence-exterior.jpg', alt: 'Three-storey residence designed by Baldwa and Associates, with stepped volumes, a stone-clad entrance and a perforated jaali screen' },
  },
  {
    slug: 'interior-design', nav: 'Interior Design', keyword: 'Interior designers in Udaipur',
    title: 'Bespoke Interior Designers in Udaipur | Baldwa & Associates',
    description: 'Our team of interior designers in Udaipur crafts advanced, functional interiors for residences, corporate offices and hospitality spaces.',
    h1: 'Bespoke Interior Designers in Udaipur',
    body: 'Recognised among the important interior designers in Udaipur, our team crafts advanced, functional interiors for residences, corporate offices and hospitality spaces. We focus on three-dimensional optimisation, material selection, lighting design and custom detailing to generate environments which reflect your effective requirements and aesthetic standards.',
    home: { h3: 'Interior Designing Services', text: 'Modified, practical and modern interior solutions constructed to reflect your personal style or brand uniqueness.' },
    image: { src: '/images/projects/living-dining.jpg', alt: 'Interior design by Baldwa and Associates: a living room with curved seating, arched openings and soft wall lighting' },
  },
  {
    slug: 'bim-engineering', nav: 'BIM Engineering', keyword: 'BIM engineering services',
    title: 'Advanced BIM Engineering Services | Baldwa & Associates',
    description: 'Baldwa and Associates delivers specialised BIM engineering services: intelligent 3D modelling, clash discovery and data-rich documentation.',
    h1: 'Advanced BIM Engineering Services',
    body: 'Baldwa and Associates delivers specialised BIM engineering services to update project delivery and improve cross-functional coordination. Utilising intelligent 3D modeling, clash discovery and data-rich documentation, we reduce construction risks, measure resource distribution and improve collaboration among architects, engineers and contractors.',
    home: { h3: 'BIM Engineering services', text: 'Advanced construction modelling to restructure project plans, reduce difficulties and assess construction productivity.' },
    image: { src: '/images/projects/industrial-plant-services.webp', alt: 'Industrial plant services yard with scrubbers, a cooling tower and colour-coded pipework, coordinated through BIM engineering' },
  },
  {
    slug: 'architectural-consultancy', nav: 'Architectural Consultancy', keyword: 'Architectural consultancy in Udaipur',
    title: 'Inclusive Architectural Consultancy in Udaipur | Baldwa & Associates',
    description: 'Strategic architectural consultancy in Udaipur for property owners, developers and institutional clients: viability studies, master planning and design audits.',
    h1: 'Inclusive Architectural Consultancy in Udaipur',
    body: 'Our firm delivers strategic architectural consultancy in Udaipur for property owners, developers and institutional clients. We provide viability studies, master planning, regulatory policy rule and design audits to ensure your project remains commercially feasible, structurally compliant and combined with long-term goals.',
    image: { src: '/images/projects/poolside-villa.jpg', alt: 'Two-storey villa with a lawn, a shaped pool and a shaded cabana, an architectural consultancy project by Baldwa and Associates' },
  },
  {
    slug: 'project-management-consultancy', nav: 'Project Management (PMC)', keyword: 'Project management consultant in Udaipur',
    title: 'Dedicated Project Management Consultancy (PMC) in Udaipur | Baldwa & Associates',
    description: 'As a trusted project management consultant in Udaipur, Baldwa and Associates oversees every phase of construction for timely, cost-effective, quality-assured delivery.',
    h1: 'Dedicated Project Management Consultancy (PMC) in Udaipur',
    body: 'As a trusted project management consultant in Udaipur, Baldwa and Associates oversees every phase of construction to safeguard timely, cost-effective and quality-assured distribution. Our PMC services involve vendor coordination, budget control, schedule tracking, quality declaration audits.',
    image: { src: '/images/projects/residence-construction.webp', alt: 'Residence under construction with concrete frames and brick walls, managed through project management consultancy' },
  },
];

export const servicePath = (s: Service) => `/services/${s.slug}`;

// ---------- Projects and Contact ----------
export const PROJECTS_PAGE = {
  path: '/projects',
  nav: 'Projects',
  title: 'Architecture and Interior Design Projects | Baldwa & Associates',
  description: 'Explore selected architecture and interior design work by Baldwa and Associates.',
  h1: 'Projects shaped through design and detail',
};

export const CONTACT_PAGE = {
  path: '/contact',
  nav: 'Contact',
  title: 'Contact Baldwa and Associates | Start a Project',
  description: 'Start a conversation with Baldwa and Associates about architecture, interior design, BIM engineering or project management.',
  h1: 'Start with a site and a conversation',
};

// ---------- FAQ (on-page, also published as FAQPage structured data) ----------
export const FAQ = [
  { q: 'What services does Baldwa and Associates offer?', a: 'Baldwa and Associates delivers end-to-end architectural planning, BIM engineering, interior design, Vastu consultation and project management services for residential and financial spaces.' },
  { q: 'Where is Baldwa and Associates located?', a: 'Our main studio is resided in Udaipur, Rajasthan, India and we implement architectural, interior and BIM projects across Rajasthan and nationwide.' },
  { q: 'What are BIM engineering services?', a: 'Building information modeling (BIM) utilises intelligent 3D digital models to streamline architectural design, clash detection, cost estimation and on-site construction management.' },
  { q: 'Why should I hire a professional architecture firm in Udaipur?', a: 'A licensed architecture firm safeguards your project meets resident Udaipur building bylaws, enhances space and natural light, stays within budget and balances structural security with aesthetics.' },
  { q: 'Does Baldwa and Associates handle both architecture and interior design?', a: 'Yes. We provide incorporated architecture and interior design services, handling everything from initial structural plans and 3D advancements to material selection and turnkey interior implementation.' },
];

// ---------- Navigation: the pages, plus the one in-page link kept from before (Start a project) ----------
export const HOME_FOOTER_LINKS = [
  { href: ABOUT.path, label: ABOUT.nav },
  ...SERVICES.map((s) => ({ href: servicePath(s), label: s.nav })),
];

export const PAGE_LINKS = [
  { href: ABOUT.path, label: ABOUT.nav },
  { href: PROJECTS_PAGE.path, label: PROJECTS_PAGE.nav },
  ...SERVICES.map((s) => ({ href: servicePath(s), label: s.nav })),
  { href: CONTACT_PAGE.path, label: CONTACT_PAGE.nav },
];

// Structured data for search engines (organisation, from the brief's brand facts only).
export const ORG_LD = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: BRAND.long,
  alternateName: BRAND.name,
  description: BRAND.summary,
  address: { '@type': 'PostalAddress', addressLocality: BRAND.city, addressRegion: BRAND.region, addressCountry: 'IN' },
  areaServed: [BRAND.region, BRAND.country],
  knowsAbout: ['Architecture', 'BIM Engineering', 'Interior Designing', 'Architecture Consulting', 'Project Management Consultancy'],
};

export const FAQ_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};
