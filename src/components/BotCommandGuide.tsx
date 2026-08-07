import React from 'react';
import { Copy, Check } from 'lucide-react';

export const BotCommandGuide: React.FC = () => {
  const [copiedCmd, setCopiedCmd] = React.useState<string | null>(null);

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 1500);
  };

  const commands = [
    {
      cmd: '!translate <text>',
      alias: '!tr <text>',
      level: 'Everyone',
      desc: 'Translates any chat message into the active target language instantly.',
      example: '!tr Otsukaresama deshita minna-san!',
    },
    {
      cmd: '!trlang <language>',
      alias: '!setlang <lang>',
      level: 'Moderator / Broadcaster',
      desc: 'Changes the active target translation language on the fly.',
      example: '!trlang English or !trlang Bangla',
    },
    {
      cmd: '!botstatus',
      alias: '!trstatus',
      level: 'Everyone',
      desc: 'Displays CoreKnight translator status and current active target language.',
      example: '!botstatus',
    },
    {
      cmd: '!trrules',
      alias: '!prompt',
      level: 'Moderator',
      desc: 'Shows current translation rules and instructions.',
      example: '!trrules',
    },
  ];

  return (
    <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 space-y-4 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100">CoreKnight Twitch Chat Commands</h3>
          <p className="text-xs text-slate-400">Commands available directly in your stream chat</p>
        </div>

        <span className="text-[11px] bg-slate-900 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-md font-semibold">
          Chat Commands
        </span>
      </div>

      {/* Commands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {commands.map((c, idx) => (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-700/60 rounded-xl p-3.5 space-y-2 relative hover:border-slate-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <code className="text-xs font-bold text-indigo-300 font-mono bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded-md">
                  {c.cmd}
                </code>
                <span className="text-[10px] text-slate-400 font-mono">{c.alias}</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                {c.level}
              </span>
            </div>

            <p className="text-xs text-slate-300">{c.desc}</p>

            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-2 text-[11px] font-mono text-slate-400">
              <span className="truncate">Ex: {c.example}</span>
              <button
                onClick={() => handleCopy(c.cmd)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              >
                {copiedCmd === c.cmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
