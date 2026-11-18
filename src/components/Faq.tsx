import { FAQ } from '@/data/site';

// SEO-friendly FAQs from the brief. Native <details> so every answer is in the page text (and works without JS);
// the same questions are published as FAQPage structured data from page.tsx.
export default function Faq() {
  return (
    <section id="faq" className="faq gut" aria-labelledby="faq-title">
      <div className="wrap faq-in">
        <div className="faq-head">
          <p className="eyebrow rv">FAQ</p>
          <h2 id="faq-title" className="rv">Frequently asked questions</h2>
        </div>
        <div className="faq-list">
          {FAQ.map((f, i) => (
            <details key={f.q} className="faq-item" open={i === 0}>
              <summary><h3>{f.q}</h3><span className="faq-icon" aria-hidden="true" /></summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
