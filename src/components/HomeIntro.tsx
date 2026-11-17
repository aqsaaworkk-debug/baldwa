import Link from 'next/link';
import { ABOUT, BRAND, HOME } from '@/data/site';

// The homepage introduction from the SEO brief, woven between the Real Work photos.
export default function HomeIntro() {
  return (
    <section id="about" className="intro-sec gut" aria-label={`About ${BRAND.long}`}>
      <div className="wrap intro-in">
        <p className="eyebrow rv">{BRAND.name} · {BRAND.city}, {BRAND.region}</p>
        <p className="intro-lead rv">{HOME.intro[0]}</p>
        <p className="intro-text rv">{HOME.intro[1]}</p>
        <Link className="text-link rv" href={ABOUT.path}>More about {BRAND.long} <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}
