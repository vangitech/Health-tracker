import { IonIcon } from '@ionic/react';
import { logoGithub, logoTwitter, logoInstagram, heartOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';

const platform = Capacitor.getPlatform();
const isNative = platform === 'ios' || platform === 'android';

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

export default function Footer({ minimal = false }) {
  if (isNative) {
    return (
      <footer className="w-full border-t border-zinc-800/40 bg-zinc-900/80 backdrop-blur-xl px-4 py-4">
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

  return (
    <footer className="w-full border-t border-zinc-800/40 bg-zinc-900/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6">
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <svg
                width="28"
                height="28"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="footer-logo" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38bdf8" />
                    <stop offset="1" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
                <rect width="36" height="36" rx="10" fill="url(#footer-logo)" fillOpacity="0.15" />
                <path
                  d="M18 24c-5.523 0-10-4.477-10-10S12.477 4 18 4s10 4.477 10 10-4.477 10-10 10z"
                  fill="#38bdf8" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1.2"
                />
                <path
                  d="M18 20c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"
                  fill="#38bdf8" fillOpacity="0.15" stroke="#38bdf8" strokeWidth="0.8"
                />
                <circle cx="18" cy="14" r="2" fill="#60a5fa" />
                <line x1="18" y1="6" x2="18" y2="0" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="11" y1="14" x2="8" y2="14" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="25" y1="14" x2="28" y2="14" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-white tracking-tight">SugarTrack</span>
                <span className="text-[8px] font-medium text-zinc-500 uppercase tracking-[0.15em]">Glucose Tracker</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
              Track your blood glucose levels with ease. Smart insights for better diabetes management.
            </p>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.12em] mb-3">
              Product
            </h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">Features</a></li>
              <li><a href="#" className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">Pricing</a></li>
              <li><a href="#" className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">Changelog</a></li>
              <li><a href="#" className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">Roadmap</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.12em] mb-3">
              Resources
            </h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">Documentation</a></li>
              <li><a href="#" className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">API Reference</a></li>
              <li><a href="#" className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">Blog</a></li>
              <li><a href="#" className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">Community</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.12em] mb-3">
              Legal
            </h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 pt-6 border-t border-zinc-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-zinc-600 hover:text-zinc-300 transition-colors"
                aria-label={link.label}
              >
                <IonIcon icon={link.icon} className="size-4" />
              </a>
            ))}
          </div>
          <p className="text-[10px] text-zinc-600 font-medium flex items-center gap-1">
            &copy; {currentYear} SugarTrack. All rights reserved.
            <span className="hidden sm:inline-flex items-center gap-1 ml-1">
              Made with <IonIcon icon={heartOutline} className="size-2.5 text-rose-500" /> for better health
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
