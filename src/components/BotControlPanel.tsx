import React, { useState } from 'react';
import { BotSettings, SUPPORTED_LANGUAGES } from '../types';
import { Globe, Radio, MessageSquare, Check, Save, Sliders } from 'lucide-react';

interface BotControlPanelProps {
  settings: BotSettings;
  onUpdateSettings: (updates: Partial<BotSettings>) => void;
}

export const BotControlPanel: React.FC<BotControlPanelProps> = ({ settings, onUpdateSettings }) => {
  const [channelInput, setChannelInput] = useState(settings.channelName || '');
  const [prefixInput, setPrefixInput] = useState(settings.botPrefix || '[TR]');
  const [customPrompt, setCustomPrompt] = useState(settings.customPromptRules || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateSettings({
      channelName: channelInput.toLowerCase().replace('#', '').trim(),
      botPrefix: prefixInput.trim(),
      customPromptRules: customPrompt,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const selectedLanguage = SUPPORTED_LANGUAGES.find((l) => l.code === settings.targetLanguageCode) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 space-y-6 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100">CoreKnight Translator Settings</h2>
          <p className="text-xs text-slate-400">Configure target language, channel parameters, and translation rules</p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-xs cursor-pointer"
        >
          {isSaved ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? 'Settings Saved!' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Target Language Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Select Target Language</span>
          </label>
          <span className="text-xs text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-2.5 py-0.5 rounded-md font-semibold">
            Active: {selectedLanguage.flag} {selectedLanguage.name}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = settings.targetLanguageCode === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  onUpdateSettings({
                    targetLanguageCode: lang.code,
                    targetLanguage: lang.name,
                  });
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/90 border-indigo-500 text-indigo-200 font-medium'
                    : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-600 hover:bg-slate-850'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">{lang.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{lang.nativeName}</div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Channel & Message Prefix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-700/80">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span>Twitch Channel Name</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-bold">#</span>
            <input
              type="text"
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              placeholder="e.g. streamer_name"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">The Twitch channel CoreKnight will join.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Bot Chat Prefix</span>
          </label>
          <input
            type="text"
            value={prefixInput}
            onChange={(e) => setPrefixInput(e.target.value)}
            placeholder="e.g. [TR] or [EN]"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <p className="text-[11px] text-slate-400 mt-1">Added to the front of translated messages in chat.</p>
        </div>
      </div>

      {/* Custom AI Translation Rules */}
      <div className="space-y-2 pt-3 border-t border-slate-700/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Translation Prompt Instructions</span>
          </label>
          <span className="text-[11px] text-slate-400 font-mono">Custom Rules</span>
        </div>

        <textarea
          rows={3}
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="e.g. Strictly translate any input language into the target language. Keep casual live stream chat tone, preserve gaming slang, emotes, and usernames."
          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
        />

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() =>
              setCustomPrompt(
                'Strictly translate any input language (including Japanglish, Banglish, Hinglish, gaming slang, and typos) into ' +
                  selectedLanguage.name +
                  '. Preserve Twitch emotes, usernames, and URLs. Output ONLY the translated message.'
              )
            }
            className="text-[11px] bg-slate-900 hover:bg-slate-750 text-slate-300 border border-slate-700 px-3 py-1 rounded-md transition-colors cursor-pointer"
          >
            Preset: Japanglish & Banglish Slang Strict
          </button>
          <button
            type="button"
            onClick={() =>
              setCustomPrompt(
                'Translate input into clean ' +
                  selectedLanguage.name +
                  '. Keep translation concise and suitable for fast-scrolling Twitch stream chat.'
              )
            }
            className="text-[11px] bg-slate-900 hover:bg-slate-750 text-slate-300 border border-slate-700 px-3 py-1 rounded-md transition-colors cursor-pointer"
          >
            Preset: Fast Stream Chat Mode
          </button>
        </div>
      </div>

    </div>
  );
};
