import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TwitchAuthModal } from './components/TwitchAuthModal';
import { BotControlPanel } from './components/BotControlPanel';
import { LiveChatStream } from './components/LiveChatStream';
import { ChatSimulator } from './components/ChatSimulator';
import { BotCommandGuide } from './components/BotCommandGuide';
import { AuthUser, BotSettings, ChatMessage, SUPPORTED_LANGUAGES } from './types';
import { Globe, Languages } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<AuthUser>({
    id: 'demo_123',
    username: 'coreknight_user',
    displayName: 'CyberKnight Streamer',
    profileImageUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    isBroadcaster: true,
    isConnectedToTwitch: false,
    authMethod: 'demo',
  });

  const [settings, setSettings] = useState<BotSettings>({
    isActive: true,
    channelName: 'twitch_streamer',
    targetLanguage: 'English',
    targetLanguageCode: 'en',
    botPrefix: '[TR]',
    autoTranslateAll: true,
    customPromptRules: 'Keep tone natural and casual like live stream chat. Preserve Twitch emotes.',
    ignoreBots: true,
  });

  const [logs, setLogs] = useState<ChatMessage[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stream' | 'settings' | 'commands'>('stream');

  useEffect(() => {
    fetchInitialData();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'INITIAL_STATE') {
            if (data.payload.settings) setSettings(data.payload.settings);
            if (data.payload.user) setUser(data.payload.user);
            if (data.payload.logs) setLogs(data.payload.logs);
          } else if (data.type === 'NEW_CHAT_MESSAGE') {
            setLogs((prev) => [data.payload, ...prev].slice(0, 200));
          } else if (data.type === 'SETTINGS_CHANGE') {
            setSettings(data.payload);
          } else if (data.type === 'AUTH_CHANGE') {
            setUser(data.payload);
          } else if (data.type === 'CLEAR_LOGS') {
            setLogs([]);
          }
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };
    } catch (err) {
      console.error('WebSocket connection failed:', err);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const [authRes, logsRes, settingsRes] = await Promise.all([
        fetch('/api/auth/status'),
        fetch('/api/chat/logs'),
        fetch('/api/settings'),
      ]);

      if (authRes.ok) {
        const authData = await authRes.json();
        setUser(authData.user);
      }
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs);
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  };

  const handleToggleBot = async () => {
    const updatedStatus = !settings.isActive;
    const newSettings = { ...settings, isActive: updatedStatus };
    setSettings(newSettings);

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: updatedStatus }),
      });
    } catch (e) {
      console.error('Failed to update bot active state:', e);
    }
  };

  const handleUpdateSettings = async (updates: Partial<BotSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  const handleLanguageChange = (langCode: string, langName: string) => {
    handleUpdateSettings({
      targetLanguageCode: langCode,
      targetLanguage: langName,
    });
  };

  const handleSimulateChat = async (text: string, username: string, badges: any[], color: string) => {
    try {
      const res = await fetch('/api/chat/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, username, badges, color }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to simulate chat message');
      }
    } catch (e) {
      console.error('Error simulating chat:', e);
    }
  };

  const handleClearLogs = async () => {
    setLogs([]);
    try {
      await fetch('/api/chat/logs', { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to clear logs:', e);
    }
  };

  const handleDemoLogin = async (username: string, channelName: string) => {
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, channelName }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSettings(data.settings);
      }
    } catch (e) {
      console.error('Demo login error:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser((prev) => ({ ...prev, isConnectedToTwitch: false }));
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white">
      
      {/* Header */}
      <Header
        user={user}
        settings={settings}
        onToggleBot={handleToggleBot}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onLanguageChange={handleLanguageChange}
      />

      {/* Main Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Status Bar */}
        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400 shrink-0">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-100 text-sm">
                  Channel: #{settings.channelName || 'twitch_streamer'}
                </span>
                <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-md">
                  Target Language: {settings.targetLanguage}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                CoreKnight live Twitch chat translator created by CyberKnight.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!user.isConnectedToTwitch && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Connect Twitch
              </button>
            )}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700/80">
              <button
                onClick={() => setActiveTab('stream')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'stream'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Live Stream Chat
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bot Settings
              </button>
              <button
                onClick={() => setActiveTab('commands')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'commands'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Chat Commands
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Live Stream & Chat Tester */}
        {activeTab === 'stream' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Live Chat Translation Stream */}
            <div className="lg:col-span-7">
              <LiveChatStream
                logs={logs}
                settings={settings}
                onClearLogs={handleClearLogs}
              />
            </div>

            {/* Right Column: Chat Simulator Sandbox */}
            <div className="lg:col-span-5 space-y-6">
              <ChatSimulator
                onSimulateChat={handleSimulateChat}
                targetLanguage={settings.targetLanguage}
              />
              
              {/* Quick Language Switcher */}
              <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    Target Language Switcher
                  </span>
                  <span className="text-xs text-indigo-300 font-bold">{settings.targetLanguage}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUPPORTED_LANGUAGES.slice(0, 8).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code, lang.name)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                        settings.targetLanguageCode === lang.code
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      {lang.flag} {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Bot Settings */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <BotControlPanel
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          </div>
        )}

        {/* Tab 3: Chat Commands Reference */}
        {activeTab === 'commands' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <BotCommandGuide />
          </div>
        )}

      </main>

      {/* Twitch Auth Modal */}
      <TwitchAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onDemoLogin={handleDemoLogin}
        onRefreshAuthStatus={fetchInitialData}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">CoreKnight Translator</span>
            <span>•</span>
            <span>By CyberKnight</span>
          </div>
          <div>
            <span>Powered by Gemini 3.6 Flash</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
