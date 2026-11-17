import type { Metadata, Viewport } from 'next';

// Self-hosted fonts (no request to Google at runtime)
import '@fontsource-variable/manrope';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/archivo/800.css';
import '@fontsource/archivo/900.css';
import '@fontsource/luckiest-guy/400.css';
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource-variable/imbue';

import '@/styles/base.css';
import '@/styles/intro.css';
import '@/styles/header.css';
import '@/styles/menu.css';
import '@/styles/journey.css';
import '@/styles/projects.css';
import '@/styles/villa-plan.css';
import '@/styles/process.css';
import '@/styles/why.css';
import '@/styles/philosophy.css';
import '@/styles/contact.css';
import '@/styles/footer.css';
import '@/styles/responsive.css';

export const metadata: Metadata = {
  title: 'Baldwa | Architecture & Interiors',
  description: 'Baldwa designs homes, pavilions and workplaces shaped by sun, shade and the way people live. Architecture, interiors and site supervision under one roof.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

// Runs before first paint so the page starts hidden behind the logo intro.
// Intro.tsx removes these classes; the timeout is a safety net if scripts fail.
const introGate = `(function(){var D=document.documentElement;D.classList.add('js','intro-on','intro-lock','brand-wait');setTimeout(function(){D.classList.remove('intro-on','intro-lock','brand-wait');var i=document.getElementById('intro');if(i)i.style.display='none';},6000);})();`;

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
