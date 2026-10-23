import React, { useState, useRef, useEffect } from 'react';
import { useTheme, PAISAWISE_THEMES, ThemeId } from '@/context/ThemeContext';
import { Palette, Check, ChevronDown, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface ThemeSwitcherProps {
  variant?: 'pill-bar' | 'dropdown' | 'cards';
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  variant = 'dropdown',
  className 
}) => {
  const { activeTheme, themeConfig, allThemes, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // 1. Pill Bar Variant (Directly mirrors the top header in the user's image!)
  if (variant === 'pill-bar') {
    return (
      <div className={clsx('flex flex-wrap items-center justify-center gap-2 p-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-xl', className)}>
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 px-2 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-emerald-400" />
          <span>PaisaWise Themes</span>
        </span>
        
        <div className="flex flex-wrap items-center gap-2">
          {allThemes.map((t) => {
            const isActive = activeTheme === t.id;
            
            // Custom pill styles matching the user's image
            const pillStyles: Record<ThemeId, string> = {
              'professional-carbon': 'border-slate-500/80 text-slate-200 bg-slate-900/90 hover:border-slate-300',
              'crimson-dusk': 'border-rose-600/80 text-rose-200 bg-[#1f0b10] hover:border-rose-400',
              'cobalt-steel': 'border-cyan-500/80 text-cyan-200 bg-[#0a1931] hover:border-cyan-300',
              'ember-glow': 'border-amber-600/80 text-amber-200 bg-[#1f140c] hover:border-amber-400',
              'mint-frost': 'border-emerald-400 text-emerald-950 bg-emerald-100 hover:bg-white',
            };

            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 flex items-center gap-2 shadow-sm',
                  pillStyles[t.id],
                  isActive ? 'ring-2 ring-white/60 scale-105' : 'opacity-85 hover:opacity-100'
                )}
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0" 
                  style={{ backgroundColor: t.accentColor }} 
                />
                <span>{t.name}</span>
                {isActive && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Visual Cards Variant (For Settings page)
  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {allThemes.map((t) => {
          const isActive = activeTheme === t.id;

          const previewBgs: Record<ThemeId, string> = {
            'professional-carbon': 'bg-gradient-to-br from-[#0b0f19] to-[#111827] text-white',
            'crimson-dusk': 'bg-gradient-to-br from-[#14070a] via-[#1f0b10] to-[#2d1017] text-rose-100',
            'cobalt-steel': 'bg-gradient-to-br from-[#050f1e] via-[#0a1931] to-[#10264b] text-cyan-100',
            'ember-glow': 'bg-gradient-to-br from-[#140d08] via-[#1f140c] to-[#2e1e12] text-amber-100',
            'mint-frost': 'bg-gradient-to-br from-[#f0fdf4] via-white to-[#e6f9ed] text-slate-800',
          };

          return (
            <div
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={clsx(
                'relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:scale-[1.02] shadow-md',
                previewBgs[t.id],
                isActive
                  ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-emerald-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
              )}
            >
              <div>
                {/* Header with pill name */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold tracking-tight">
                    {t.name}
                  </span>
                  {isActive ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold opacity-60">
                      {t.mode}
                    </span>
                  )}
                </div>

                {/* Miniature UI Mockup */}
                <div className="rounded-xl p-2.5 bg-black/20 backdrop-blur-xs border border-white/10 space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-2 rounded bg-white/20" />
                    <div className="w-4 h-2 rounded-full" style={{ backgroundColor: t.accentColor }} />
                  </div>
                  <div className="flex gap-1.5">
                    <div className="flex-1 h-7 rounded-lg bg-white/10 p-1 flex flex-col justify-between">
                      <div className="w-6 h-1.5 rounded bg-white/20" />
                      <div className="w-10 h-2 rounded" style={{ backgroundColor: t.accentColor }} />
                    </div>
                    <div className="flex-1 h-7 rounded-lg bg-white/10 p-1 flex flex-col justify-between">
                      <div className="w-6 h-1.5 rounded bg-white/20" />
                      <div className="w-8 h-2 rounded bg-white/30" />
                    </div>
                  </div>
                </div>

                {/* Swatches */}
                <div className="flex items-center gap-1.5 mb-2">
                  {t.swatches.map((color, idx) => (
                    <span
                      key={idx}
                      className="w-4 h-4 rounded-full border border-black/20 shadow-xs"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <p className="text-[11px] opacity-75 leading-tight">
                  {t.tagline}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-bold">
                <span style={{ color: t.accentColor }}>
                  {isActive ? 'Active Theme' : 'Click to Apply'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 3. Dropdown Variant (Default for Top Header)
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-all"
        title="Change PaisaWise Theme"
      >
        <span 
          className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
          style={{ backgroundColor: themeConfig.accentColor }} 
        />
        <span className="hidden sm:inline font-bold">{themeConfig.name}</span>
        <span className="sm:hidden font-bold">Theme</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              PaisaWise Themes
            </span>
            <span className="text-[10px] text-slate-400">5 Styles</span>
          </div>

          <div className="p-1 space-y-1 mt-1">
            {allThemes.map((t) => {
              const isActive = activeTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    'w-full p-2.5 rounded-xl text-left text-xs font-medium transition-all flex items-center justify-between group',
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-emerald-950 dark:text-emerald-200'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-xs group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: t.accentColor }}
                    />
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{t.name}</span>
                        <span className="text-[10px] opacity-60 font-normal capitalize">({t.mode})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                        {t.tagline}
                      </span>
                    </div>
                  </div>

                  {isActive && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
