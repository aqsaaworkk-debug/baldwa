'use client';
import { useState, type FormEvent } from 'react';

// PLACEHOLDER: real studio details.
const DETAILS = [
  ['Studio', '[Studio address]'],
  ['Phone', '[Phone number]'],
  ['Email', '[Email address]'],
  ['Hours', '[Working hours]'],
];
const TYPES = ['Residence', 'Villa', 'Interiors', 'Commercial', 'Other'];

type Note = { kind: 'ok' | 'err'; text: string } | null;

export default function Contact() {
  const [note, setNote] = useState<Note>(null);

  // Validates but does NOT send yet. Connect it to a route handler (src/app/api/enquiry/route.ts)
  // or a form service (Formspree, Web3Forms, Resend…) at the TODO.
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (!data.name?.trim() || !data.phone?.trim()) {
      setNote({ kind: 'err', text: 'Please add your name and phone number so we can reach you.' });
      (form.elements.namedItem(data.name?.trim() ? 'phone' : 'name') as HTMLInputElement).focus();
      return;
    }
    // TODO: await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    console.info('Enquiry (not sent yet):', data);
    setNote({ kind: 'ok', text: `Thank you, ${data.name.trim().split(' ')[0]}. This form is not connected yet, so please call or email the studio for now.` });
  };

  return (
    <section id="contact" className="contact gut">
      <div className="wrap contact-in">
        <div className="rv">
          <p className="eyebrow">Start a project</p>
          <h2 style={{ marginTop: 18 }}>Bring us a plot and a <em>conversation</em></h2>
          <p className="lede" style={{ marginTop: 24 }}>Tell us about the site and how you want to live. We will set up a first meeting to walk through your brief.</p>
          <dl className="details">
            {DETAILS.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd className={v.startsWith('[') ? 'ph' : undefined}>{v}</dd></div>)}
          </dl>
        </div>
        <form className="enq rv" onSubmit={onSubmit} noValidate>
          <div className="fld"><label htmlFor="f-name">Your name</label><input id="f-name" name="name" autoComplete="name" required /></div>
          <div className="fld"><label htmlFor="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" autoComplete="tel" required /></div>
          <div className="fld full"><label htmlFor="f-email">Email</label><input id="f-email" name="email" type="email" autoComplete="email" /></div>
          <div className="fld full">
            <span className="fld-l">Project type</span>
            <div className="chips" role="radiogroup" aria-label="Project type">
              {TYPES.map((t, i) => (
                <span key={t}><input type="radio" name="type" id={`t${i}`} value={t} defaultChecked={i === 0} /><label htmlFor={`t${i}`}>{t}</label></span>
              ))}
            </div>
          </div>
          <div className="fld"><label htmlFor="f-loc">Plot location</label><input id="f-loc" name="location" /></div>
          <div className="fld"><label htmlFor="f-size">Plot size</label><input id="f-size" name="size" placeholder="e.g. 60 × 90 ft" /></div>
          <div className="fld full"><label htmlFor="f-msg">About the project</label><textarea id="f-msg" name="message" rows={3} /></div>
          <div className="submit">
            <button className="btn-dark" type="submit">Send enquiry <svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M0 5h20M16 1l4 4-4 4" /></svg></button>
            <p className={`form-note${note ? ' ' + note.kind : ''}`} aria-live="polite">{note?.text}</p>
          </div>
        </form>
      </div>
    </section>
  );
}
