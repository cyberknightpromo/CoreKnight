import React, { useState } from 'react';
import { ChatMessage, BotSettings } from '../types';
import { MessageSquare, Copy, Check, Trash2, Search, Clock, ShieldAlert } from 'lucide-react';

interface LiveChatStreamProps {
  logs: ChatMessage[];
  settings: BotSettings;
  onClearLogs: () => void;
}

export const LiveChatStream: React.FC<LiveChatStreamProps> = ({
  logs,
  settings,
  onClearLogs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'translated' | 'error'>('all');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredLogs = logs.filter((msg) => {
    const matchesSearch =
      msg.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.originalText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.translatedText && msg.translatedText.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterStatus === 'translated') return matchesSearch && msg.status === 'translated';
    if (filterStatus === 'error') return matchesSearch && msg.status === 'error';
    return matchesSearch;
  });

  return (
    <div className="bg-slate-800 border border-slate-700/80 rounded-2xl flex flex-col h-[540px] shadow-sm overflow-hidden">
      
      {/* Stream Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">Live Twitch Chat Stream</h3>
              <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                {filteredLogs.length} messages
              </span>
            </div>
            <p className="text-xs text-slate-400">Real-time translations by CoreKnight</p>
          </div>
        </div>

        {/* Filter and Clear Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search chat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-44"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="all">All Logs</option>
            <option value="translated">Translated</option>
            <option value="error">Errors</option>
          </select>

          <button
            onClick={onClearLogs}
            title="Clear Chat Logs"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans bg-slate-900/50">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
            <MessageSquare className="w-8 h-8 opacity-40 text-slate-400" />
            <p className="text-xs font-semibold text-slate-300">No chat messages in live feed yet.</p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Use the tester box on the right or connect your Twitch channel to start seeing CoreKnight translations.
            </p>
          </div>
        ) : (
          filteredLogs.map((msg) => (
            <div
              key={msg.id}
              className="bg-slate-900 border border-slate-700/60 rounded-xl p-3.5 space-y-2 shadow-xs hover:border-slate-600 transition-colors"
            >
              {/* Sender Metadata Header */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Twitch Badges */}
                  {msg.userBadges?.map((badge, idx) => (
                    <span
                      key={idx}
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                        badge === 'broadcaster'
                          ? 'bg-red-950/80 text-red-300 border-red-800'
                          : badge === 'mod'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                          : badge === 'vip'
                          ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                          : badge === 'subscriber'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {badge}
                    </span>
                  ))}

                  {/* Username */}
                  <span
                    className="font-bold text-xs"
                    style={{ color: msg.userColor || '#818CF8' }}
                  >
                    {msg.username}
                  </span>

                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Detected Language Tag & Latency */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {msg.detectedLanguage && (
                    <span className="text-[10px] font-semibold bg-indigo-950/80 border border-indigo-800 text-indigo-300 px-2 py-0.5 rounded-md">
                      {msg.detectedLanguage}
                    </span>
                  )}
                  {msg.translationLatencyMs && (
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded-md">
                      <Clock className="w-2.5 h-2.5 text-slate-500" />
                      {msg.translationLatencyMs}ms
                    </span>
                  )}
                </div>
              </div>

              {/* Original Text */}
              <div className="text-xs text-slate-200 bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                <p className="leading-relaxed break-words select-text font-normal">
                  "{msg.originalText}"
                </p>
              </div>

              {/* CoreKnight Translation Output */}
              {msg.status === 'translated' && msg.translatedText && (
                <div className="bg-indigo-950/70 border border-indigo-800/80 rounded-lg p-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2 flex-wrap flex-1">
                    <span className="font-mono font-bold text-indigo-400 text-xs shrink-0">
                      {settings.botPrefix}
                    </span>
                    <span className="text-indigo-100 font-semibold leading-relaxed break-words flex-1">
                      {msg.translatedText}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(msg.id, `${settings.botPrefix} ${msg.translatedText}`)}
                    title="Copy CoreKnight Translation"
                    className="text-slate-400 hover:text-indigo-300 p-1 rounded hover:bg-indigo-900/50 transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {msg.status === 'error' && (
                <div className="bg-red-950/80 border border-red-800 rounded-lg p-2 text-xs text-red-300 flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{msg.errorMessage || 'Translation failed.'}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};
