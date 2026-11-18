import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import ProjectGallery from '@/components/ProjectGallery';
import { PROJECTS_PAGE } from '@/data/site';

export const metadata: Metadata = {
  title: PROJECTS_PAGE.title,
  description: PROJECTS_PAGE.description,
  alternates: { canonical: PROJECTS_PAGE.path },
  openGraph: { title: PROJECTS_PAGE.title, description: PROJECTS_PAGE.description, type: 'website' },
};

export default function ProjectsPage() {
  return (
    <PageShell crumbs={[{ label: PROJECTS_PAGE.nav }]} current={PROJECTS_PAGE.path}>
      <article className="pg-art pg-projects gut">
        <div className="wrap">
          <header className="pg-head">
            <p className="eyebrow">Baldwa &amp; Associates</p>
            <h1>{PROJECTS_PAGE.h1}</h1>
          </header>
          <ProjectGallery />
        </div>
      </article>
    </PageShell>
  );
}
