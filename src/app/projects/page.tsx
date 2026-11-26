import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import PageHero from '@/components/PageHero';
import PageMotion from '@/components/PageMotion';
import ProjectGallery from '@/components/ProjectGallery';
import { PROJECTS_PAGE, SERVICES } from '@/data/site';
import { projects } from '@/data/projects';

export const metadata: Metadata = {
  title: PROJECTS_PAGE.title,
  description: PROJECTS_PAGE.description,
  alternates: { canonical: PROJECTS_PAGE.path },
  openGraph: { title: PROJECTS_PAGE.title, description: PROJECTS_PAGE.description, type: 'website' },
};

// Projects, in the About page's layout (client, 2026-11-24): navy hero with the first featured project as a wide photo, then
// the gallery on almond, closer under the hero and across the full width (client, 2026-11-26; the Start a project band was
// removed on request).
const lead = projects[0];
const leadAlt = SERVICES.find((s) => s.image.src === lead.image)?.image.alt ?? lead.name;

export default function ProjectsPage() {
  return (
    <PageShell crumbs={[{ label: PROJECTS_PAGE.nav }]} current={PROJECTS_PAGE.path} showCta={false}>
      <PageMotion />
      <article className="pg-v2 pg-projects">
        <PageHero display={PROJECTS_PAGE.nav} h1={PROJECTS_PAGE.h1} tone="deep"
          media={{ kind: 'wide', image: { src: lead.image!, alt: leadAlt }, caption: [lead.name] }} />
        <section className="ab-body ab-body--up gut">
          <div className="ab-rv"><ProjectGallery /></div>
        </section>
      </article>
    </PageShell>
  );
}
