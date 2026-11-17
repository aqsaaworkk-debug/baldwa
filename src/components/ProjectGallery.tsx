'use client';

import { useState } from 'react';
import { projects, type Project } from '@/data/projects';

const CATEGORIES = ['All', 'Industrial', 'Residential', 'Commercial', 'Hospitality'] as const;
type Category = (typeof CATEGORIES)[number];

/* eslint-disable @next/next/no-img-element */
export default function ProjectGallery() {
  const [active, setActive] = useState<Category>('All');
  const visible = projects.filter((project) => active === 'All' || project.category === active);

  return (
    <section className="project-index" aria-labelledby="project-index-title">
      <div className="project-index-top">
        <div>
          <p className="eyebrow">Selected work</p>
          <h2 id="project-index-title">Explore by category</h2>
        </div>
        <nav className="project-filters" aria-label="Project categories">
          {CATEGORIES.map((category) => (
            <button
              type="button"
              key={category}
              className={active === category ? 'is-active' : undefined}
              aria-pressed={active === category}
              onClick={() => setActive(category)}
            >
              {category}
            </button>
          ))}
        </nav>
      </div>

      {visible.length ? (
        <div className="project-grid">
          {visible.map((project, index) => <ProjectCard key={project.name} project={project} index={index} />)}
        </div>
      ) : (
        <p className="project-empty">No projects are listed in this category yet.</p>
      )}
    </section>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <article className="project-card">
      <figure>
        {project.image && <img src={project.image} alt={project.name} loading={index > 1 ? 'lazy' : 'eager'} />}
      </figure>
      <div className="project-card-copy">
        <div className="project-card-meta"><span>{project.category}</span><span>{project.type}</span></div>
        <h3>{project.name}</h3>
        <p>{project.text}</p>
      </div>
    </article>
  );
}
