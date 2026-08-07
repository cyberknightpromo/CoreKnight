import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatSimulatorProps {
  onSimulateChat: (text: string, username: string, badges: any[], color: string) => Promise<void>;
  targetLanguage: string;
}

const PRESET_MESSAGES = [
  {
    label: '🇯🇵 Japanglish',
    text: 'Minna-san konnichiwa! Kyou no配信 mo楽しみ desu bro!!',
    user: 'Kawaii_Gamer',
    color: '#EC4899',
    badges: ['vip', 'subscriber'],
  },
  {
    label: '🇧🇩 Banglish',
    text: 'Kemon acho bro? Aajke ki game khelbe tumi?',
    user: 'DhakaGamer_007',
    color: '#3B82F6',
    badges: ['subscriber'],
  },
  {
    label: '🇪🇸 Spanish Slang',
    text: '¡Qué buena jugada hermano! Eres un crack total en este juego.',
    user: 'Carlos_Pro_Es',
    color: '#F97316',
    badges: ['mod'],
  },
  {
    label: '🇫🇷 French Chat',
    text: 'Merci beaucoup pour ce stream incroyable, à demain tout le monde!',
    user: 'Pierre_FPS',
    color: '#22C55E',
    badges: ['viewer'],
  },
  {
    label: '🎮 Gaming Slang',
    text: 'gg poggers clutch play sus imposter zero diff chat is wild today!!',
    user: 'ClutchGod99',
    color: '#A855F7',
    badges: ['broadcaster'],
  },
];

export const ChatSimulator: React.FC<ChatSimulatorProps> = ({
  onSimulateChat,
  targetLanguage,
}) => {
  const [inputText, setInputText] = useState('');
  const [usernameInput, setUsernameInput] = useState('LiveViewer_X');
  const [userBadge, setUserBadge] = useState<string>('subscriber');
  const [userColor, setUserColor] = useState('#818CF8');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    await onSimulateChat(inputText.trim(), usernameInput.trim(), [userBadge], userColor);
    setInputText('');
    setIsSending(false);
  };

  const handlePresetClick = (preset: typeof PRESET_MESSAGES[0]) => {
    setInputText(preset.text);
    setUsernameInput(preset.user);
    setUserColor(preset.color);
    setUserBadge(preset.badges[0] || 'viewer');
  };

  return (
    <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100">Chat Simulator & Tester</h3>
          <p className="text-xs text-slate-400">Test how CoreKnight translates chat into {targetLanguage}</p>
        </div>

        <span className="text-[11px] bg-slate-900 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-md font-semibold">
          Live Tester
        </span>
      </div>

      {/* Preset Dialect Buttons */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Quick Test Dialects
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_MESSAGES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetClick(preset)}
              className="text-xs bg-slate-900 hover:bg-slate-750 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Controls */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Simulated Username</label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="e.g. GamerTag"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Badge Role</label>
            <select
              value={userBadge}
              onChange={(e) => setUserBadge(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="broadcaster" className="bg-slate-900">Broadcaster 🎥</option>
              <option value="mod" className="bg-slate-900">Moderator 🗡️</option>
              <option value="vip" className="bg-slate-900">VIP 💎</option>
              <option value="subscriber" className="bg-slate-900">Subscriber ⭐</option>
              <option value="viewer" className="bg-slate-900">Viewer</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Name Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={userColor}
                onChange={(e) => setUserColor(e.target.value)}
                className="w-8 h-7 bg-slate-950 rounded border border-slate-700 cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-400">{userColor}</span>
            </div>
          </div>
        </div>

        {/* Input Text Box */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type chat message (e.g., Japanglish, Banglish, Spanish)...`}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? 'Sending...' : 'Test Message'}</span>
          </button>
        </div>
      </form>

    </div>
  );
};
