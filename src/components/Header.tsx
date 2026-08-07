import React from 'react';
import { AuthUser, BotSettings, SUPPORTED_LANGUAGES } from '../types';
import { Zap, Globe, LogOut, CheckCircle2, Languages } from 'lucide-react';

interface HeaderProps {
  user: AuthUser;
  settings: BotSettings;
  onToggleBot: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onLanguageChange: (langCode: string, langName: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  settings,
  onToggleBot,
  onOpenAuthModal,
  onLogout,
  onLanguageChange,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-lg shrink-0">
            <Languages className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-100 text-lg tracking-tight">
                CoreKnight
              </h1>
              <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                by CyberKnight
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Twitch Live Chat Translator Bot
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          
          {/* Quick Target Language Selector */}
          <div className="hidden md:flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
            <Globe className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 font-medium">Target:</span>
            <select
              value={settings.targetLanguageCode}
              onChange={(e) => {
                const selected = SUPPORTED_LANGUAGES.find((l) => l.code === e.target.value);
                if (selected) {
                  onLanguageChange(selected.code, selected.name);
                }
              }}
              className="bg-transparent font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-100">
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          {/* On/Off Bot Switch */}
          <button
            onClick={onToggleBot}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              settings.isActive
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900/90'
                : 'bg-amber-950/80 text-amber-300 border-amber-800 hover:bg-amber-900/90'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                settings.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {settings.isActive ? 'CoreKnight Active' : 'CoreKnight Paused'}
          </button>

          {/* Auth Connection Status */}
          {user.isConnectedToTwitch ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-indigo-950/80 border border-indigo-800 text-indigo-300 rounded-lg px-3 py-1.5 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span className="truncate max-w-[120px]">#{settings.channelName || user.displayName}</span>
              </div>
              <button
                onClick={onLogout}
                title="Disconnect Twitch"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Connect Twitch</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
