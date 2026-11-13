import Logo from './Logo';
import NavLink from './NavLink';

const LINKS = [['projects', 'Projects'], ['process', 'Process'], ['why', 'Why Baldwa'], ['philosophy', 'Philosophy'], ['contact', 'Contact']] as const;

export default function Footer() {
  return (
    <footer className="foot gut">
      <div className="wrap foot-in">
        <NavLink to="home" className="brand" label="Baldwa, back to top"><Logo id="mf" /></NavLink>
        <nav aria-label="Footer">{LINKS.map(([id, label]) => <NavLink key={id} to={id}>{label}</NavLink>)}</nav>
        <small>© {new Date().getFullYear()} Baldwa<br />Architecture &amp; Interiors</small>
      </div>
    </footer>
  );
}
