import type { Metadata, Viewport } from 'next';

// Self-hosted fonts (no request to Google at runtime). One family for the whole site (weight + optical size axes);
// Archivo is only for the BALDWA wordmark inside the logo.
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource/archivo/900.css';

import { BRAND, HOME } from '@/data/site';
import '@/styles/base.css';
import '@/styles/intro.css';
import '@/styles/header.css';
import '@/styles/menu.css';
import '@/styles/journey.css';
import '@/styles/projects.css';
import '@/styles/villa-plan.css';
import '@/styles/process.css';
import '@/styles/realwork.css';
import '@/styles/why.css';
import '@/styles/philosophy.css';
import '@/styles/contact.css';
import '@/styles/footer.css';
import '@/styles/pages.css';
import '@/styles/services.css';
import '@/styles/responsive.css';

// Defaults are the homepage's SEO title and description (SEO brief); inner pages set their own.
export const metadata: Metadata = {
  title: HOME.title,
  description: HOME.description,
  keywords: HOME.keywords,
  applicationName: BRAND.name,
  openGraph: { title: HOME.title, description: HOME.description, siteName: BRAND.name, type: 'website', locale: 'en_IN' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f2ede7',
};

// Runs before first paint so the homepage starts hidden behind the logo intro (inner pages only get the js class).
// Intro.tsx removes these classes; the timeout is a safety net if scripts fail.
const introGate = `(function(){var D=document.documentElement;D.classList.add('js');if(location.pathname!=='/')return;D.classList.add('intro-on','intro-lock','brand-wait');setTimeout(function(){D.classList.remove('intro-on','intro-lock','brand-wait');var i=document.getElementById('intro');if(i)i.style.display='none';},6000);})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introGate }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
