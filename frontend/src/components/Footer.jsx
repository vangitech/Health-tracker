import { IonIcon } from '@ionic/react';
import { logoGithub, logoTwitter, logoInstagram } from 'ionicons/icons';

const currentYear = new Date().getFullYear();

const socialLinks = [
  { icon: logoGithub, href: '#', label: 'GitHub' },
  { icon: logoTwitter, href: '#', label: 'Twitter' },
  { icon: logoInstagram, href: '#', label: 'Instagram' },
];

const footerLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'Help Center', href: '#' },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800/40 bg-zinc-900/80 backdrop-blur-xl px-4 pt-3 pb-[env(safe-area-inset-bottom,12px)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="10" fill="url(#footer-logo-native)" fillOpacity="0.15" />
            <path d="M18 24c-5.523 0-10-4.477-10-10S12.477 4 18 4s10 4.477 10 10-4.477 10-10 10z" fill="#38bdf8" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1.2" />
            <circle cx="18" cy="14" r="2" fill="#60a5fa" />
            <defs>
              <linearGradient id="footer-logo-native" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="1" stopColor="#818cf8" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-xs font-semibold text-white">SugarTrack</span>
        </div>
        <div className="flex items-center gap-3">
          {footerLinks.slice(0, 3).map((link) => (
            <a key={link.label} href={link.href} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[9px] text-zinc-600">v1.0 &copy; {currentYear} SugarTrack</p>
        <div className="flex items-center gap-2">
          {socialLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-zinc-600 hover:text-zinc-300 transition-colors" aria-label={link.label}>
              <IonIcon icon={link.icon} className="size-3" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
