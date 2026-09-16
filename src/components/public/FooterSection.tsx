import React, { useState, useEffect } from 'react';
import { SchoolConfig } from '../../types';
import {
  School,
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  ArrowUp,
  Shield,
  Eye,
} from 'lucide-react';
import { initRealtimeVisitorCounter } from '../../lib/analytics';

interface FooterSectionProps {
  config: SchoolConfig;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ config }) => {
  const { identity, footer, navMenus, themeConfig } = config;
  const footerBg = themeConfig?.footerBgColor || themeConfig?.headerBgColor;

  // Real-time Visitor counter & active online users synced via Firebase Firestore
  const [totalVisits, setTotalVisits] = useState<number>(15420);
  const [onlineUsers, setOnlineUsers] = useState<number>(1);

  useEffect(() => {
    const unsubscribe = initRealtimeVisitorCounter(({ totalVisits: visits, onlineUsers: online }) => {
      setTotalVisits(visits);
      setOnlineUsers(online);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      id="kontak"
      style={footerBg ? { backgroundColor: footerBg } : undefined}
      className={`text-slate-300 border-t border-slate-900 ${!footerBg ? 'bg-slate-950' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-900">
          
          {/* Col 1: Brand & About (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-700/80 flex items-center justify-center shrink-0 p-1 shadow-xs">
                {identity.logoUrl ? (
                  <img
                    src={identity.logoUrl}
                    alt={identity.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <School className="w-7 h-7 text-blue-400" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight leading-tight">
                  {identity.name}
                </h3>
                <p className="text-xs text-blue-400 font-medium">NPSN: {identity.npsn}</p>
              </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              {footer.aboutText}
            </p>

            {/* Social Media Links */}
            <div className="pt-2 flex items-center gap-3">
              {footer.socialLinks.instagram && (
                <a
                  href={footer.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-pink-600/80 hover:text-white text-slate-400 border border-slate-800 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {footer.socialLinks.youtube && (
                <a
                  href={footer.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-red-600/80 hover:text-white text-slate-400 border border-slate-800 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {footer.socialLinks.facebook && (
                <a
                  href={footer.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-blue-600/80 hover:text-white text-slate-400 border border-slate-800 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {footer.socialLinks.twitter && (
                <a
                  href={footer.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-sky-500/80 hover:text-white text-slate-400 border border-slate-800 transition-colors"
                  aria-label="Twitter / X"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Col 2: Quick Links (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">
              Tautan Cepat
            </h4>
            <ul className="space-y-2.5 text-sm">
              {navMenus
                .filter((m) => m.enabled)
                .map((m) => (
                  <li key={m.id}>
                    <a
                      href={m.path}
                      className="text-slate-400 hover:text-blue-400 transition-colors inline-block"
                    >
                      {m.label}
                    </a>
                  </li>
                ))}
            </ul>
          </div>

          {/* Col 3: Contact Details (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">
              Kontak &amp; Layanan
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-1" />
                <span>{footer.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{footer.phone}</span>
              </li>
              {footer.whatsapp && (
                <li className="flex items-center gap-3">
                  <span className="w-4 h-4 text-emerald-400 font-bold text-xs shrink-0 flex items-center justify-center">
                    WA
                  </span>
                  <span>{footer.whatsapp}</span>
                </li>
              )}
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{footer.email}</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{footer.openingHours}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright, stats counter (symbols + numbers only), & back to top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>{footer.copyright}</p>

          {/* Visitor & Online Stats Counter (Symbols + Numbers only without text labels) */}
          <div className="flex items-center gap-3.5 bg-slate-900/90 border border-slate-800/90 px-3.5 py-1.5 rounded-full text-slate-300 font-mono text-xs shadow-inner">
            <div className="flex items-center gap-1.5" title="Total Kunjungan">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>{totalVisits.toLocaleString('id-ID')}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5" title="Pengunjung Online Saat Ini">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{onlineUsers}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
            >
              <span>Ke Atas</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
