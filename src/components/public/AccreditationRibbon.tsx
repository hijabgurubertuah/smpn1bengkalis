import React from 'react';
import { SchoolConfig } from '../../types';
import { Sparkles, Award } from 'lucide-react';

interface AccreditationRibbonProps {
  config: SchoolConfig;
}

export const AccreditationRibbon: React.FC<AccreditationRibbonProps> = ({ config }) => {
  const { identity } = config;

  const customText = identity.accreditationTickerText?.trim();
  const hasContent = Boolean(customText || identity.akreditasi || identity.npsn);

  if (identity.accreditationTickerEnabled === false || !hasContent) {
    return null;
  }

  // Determine speed
  const getSpeedDuration = () => {
    switch (identity.accreditationTickerSpeed) {
      case 'slow':
        return '48s';
      case 'fast':
        return '18s';
      case 'normal':
      default:
        return '30s';
    }
  };

  // Parse items from custom text or dynamic fields
  let tickerItems: Array<{ badge?: string; text: string; highlight?: string }> = [];

  if (customText) {
    // Check if delimited by bullets (•), pipes (|), or newlines
    const rawParts = customText.split(/[•|\n]/).map((s) => s.trim()).filter(Boolean);
    if (rawParts.length > 0) {
      tickerItems = rawParts.map((item, index) => {
        // Check if starts with [BADGE] or BADGE:
        const badgeMatch = item.match(/^\[(.*?)\]\s*(.*)$/) || item.match(/^([A-Z0-9\-\/]{2,10}):\s*(.*)$/);
        if (badgeMatch) {
          return {
            badge: badgeMatch[1].trim(),
            text: badgeMatch[2].trim(),
          };
        }
        return {
          text: item,
          badge: index === 0 ? 'INFO' : undefined,
        };
      });
    } else {
      tickerItems = [{ text: customText, badge: 'INFO' }];
    }
  } else {
    // Dynamically build from actual non-empty identity fields
    if (identity.akreditasi) {
      tickerItems.push({
        badge: 'AKREDITASI',
        text: `Status: ${identity.akreditasi}`,
      });
    }
    if (identity.npsn) {
      tickerItems.push({
        badge: 'NPSN',
        text: `Nomor Registrasi / NPSN: ${identity.npsn}`,
      });
    }
    if (identity.name) {
      tickerItems.push({
        badge: 'INSTANSI',
        text: identity.name,
      });
    }
  }

  const customBg = identity.accreditationTickerBgColor;

  return (
    <section
      id="akreditasi-running-text"
      className={`relative z-20 text-white border-y border-white/10 shadow-xs overflow-hidden w-full max-w-full py-2.5 sm:py-3.5 ${
        customBg ? '' : 'bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 border-blue-800/40'
      }`}
      style={customBg ? { backgroundColor: customBg } : undefined}
    >
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Full-width Running Text Marquee Track */}
        <div className="overflow-hidden whitespace-nowrap w-full min-w-0 relative">
          <div
            className="inline-flex items-center gap-8 animate-marquee hover:pause"
            style={{ animationDuration: getSpeedDuration() }}
          >
            {/* Repeat items twice for seamless infinite scrolling loop */}
            {[...tickerItems, ...tickerItems].map((item, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-200 shrink-0"
              >
                {item.badge && (
                  <span className="text-[10px] sm:text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 shadow-xs">
                    {item.badge}
                  </span>
                )}
                <span className="text-slate-200 font-medium">
                  {item.text}
                </span>
                {item.highlight && (
                  <span className="inline-flex items-center gap-1 text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 text-xs">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    {item.highlight}
                  </span>
                )}
                <span className="text-blue-500/80 mx-2 font-black">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};


