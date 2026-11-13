// Vector redraw of the Baldwa sunrise emblem (original PNG: /public/brand/baldwa-logo.png).
// Each part has a class (m-a … m-g, m-sun, m-word) so the intro can animate it.
// `id` keeps gradient ids unique when the logo appears several times on the page.

const RAY_LENGTH: Record<number, number> = { 168: 132, 146: 150, 123: 158, 90: 186, 57: 158, 34: 150, 12: 132 };

const rays = Object.entries(RAY_LENGTH).map(([deg, r2]) => {
  const cx = 687, cy = 810, a = (Number(deg) * Math.PI) / 180, w = 0.085, r1 = 92;
  const pts = [
    [cx + r2 * Math.cos(a), cy - r2 * Math.sin(a)],
    [cx + r1 * Math.cos(a + w), cy - r1 * Math.sin(a + w)],
    [cx + r1 * Math.cos(a - w), cy - r1 * Math.sin(a - w)],
  ];
  return 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L') + 'Z';
});

export default function Logo({ id, label = 'Baldwa' }: { id: string; label?: string }) {
  const grad = `url(#${id}g)`;
  return (
    <svg viewBox="278 86 822 940" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBCB36" />
          <stop offset="1" stopColor="#F4A30C" />
        </linearGradient>
      </defs>
      <g fill={grad}>
        <path className="m-p m-a" d="M687 97 L735 183 L390 810 L290 810Z" />
        <path className="m-p m-b" d="M752 212 L763 231 L441 810 L429 810Z" />
        <path className="m-p m-c" d="M774 250 L785 269 L487 810 L475 810Z" />
        <path className="m-p m-d" d="M795 287 L1082 810 L982 810 L745 380Z" />
        <path className="m-p m-e" d="M724 416 L944 810 L931 810 L717 429Z" />
        <path className="m-p m-f" d="M705 452 L905 810 L892 810 L698 465Z" />
        <path className="m-p m-g" d="M687 485 L872 810 L503 810Z" fill="#F9B514" />
      </g>
      <g className="m-sun" fill="#EF5A12">
        <path d="M612 810 A75 75 0 0 1 762 810Z" />
        {rays.map((d) => <path key={d} d={d} />)}
      </g>
      <g className="m-word" fill={grad}>
        <rect x="287" y="828" width="800" height="12" />
        <text x="687" y="989" textAnchor="middle" fontFamily="Archivo, 'Arial Black', sans-serif" fontWeight={900} fontSize={170} textLength={796} lengthAdjust="spacingAndGlyphs">BALDWA</text>
        <rect x="287" y="1005" width="806" height="13" />
      </g>
    </svg>
  );
}
