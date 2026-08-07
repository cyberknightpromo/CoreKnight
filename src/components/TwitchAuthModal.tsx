import React, { useState, useEffect } from 'react';
import { AuthUser, BotSettings } from '../types';
import { Zap, Copy, Check, ExternalLink, ShieldCheck, X, Key, Radio } from 'lucide-react';

interface TwitchAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  settings: BotSettings;
  onUpdateSettings: (updates: Partial<BotSettings>) => void;
  onDemoLogin: (username: string, channelName: string) => Promise<void>;
  onRefreshAuthStatus: () => Promise<void>;
}

export const TwitchAuthModal: React.FC<TwitchAuthModalProps> = ({
  isOpen,
  onClose,
  user,
  settings,
  onUpdateSettings,
  onDemoLogin,
  onRefreshAuthStatus,
}) => {
  const [copied, setCopied] = useState(false);
  const [customClientId, setCustomClientId] = useState(settings.twitchClientId || '');
  const [streamerChannel, setStreamerChannel] = useState(settings.channelName || 'twitch_streamer');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authUrlInfo, setAuthUrlInfo] = useState<{ url: string; redirectUri: string; isConfigured: boolean } | null>(null);

  const [oauthTokenInput, setOauthTokenInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAuthUrlInfo();

      // Set up BroadcastChannel listener for OAuth popup completion
      let bc: BroadcastChannel | null = null;
      try {
        bc = new BroadcastChannel('coreknight_auth_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
            setIsAuthLoading(false);
            onRefreshAuthStatus();
            onClose();
          }
        };
      } catch (e) {}

      // Storage event listener fallback
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'coreknight_auth_success') {
          setIsAuthLoading(false);
          onRefreshAuthStatus();
          onClose();
        }
      };
      window.addEventListener('storage', handleStorageChange);

      // Window postMessage listener
      const handleWindowMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          setIsAuthLoading(false);
          onRefreshAuthStatus();
          onClose();
        }
      };
      window.addEventListener('message', handleWindowMessage);

      return () => {
        if (bc) bc.close();
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('message', handleWindowMessage);
      };
    }
  }, [isOpen, customClientId]);

  const fetchAuthUrlInfo = async () => {
    try {
      const res = await fetch('/api/auth/twitch/url');
      if (res.ok) {
        const data = await res.json();
        setAuthUrlInfo(data);
      }
    } catch (e) {
      console.error('Failed to fetch Twitch Auth URL:', e);
    }
  };

  if (!isOpen) return null;

  const currentCallbackUrl = authUrlInfo?.redirectUri || `${window.location.origin}/auth/callback`;

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(currentCallbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTwitchOAuthConnect = async () => {
    setIsAuthLoading(true);
    try {
      const res = await fetch('/api/auth/twitch/url');
      const data = await res.json();

      if (data.url) {
        // If not configured, complete instant auth directly
        if (!data.isConfigured) {
          await fetch('/api/auth/twitch/verify-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: 'instant_public_oauth_token', channelName: streamerChannel }),
          });
          setIsAuthLoading(false);
          await onRefreshAuthStatus();
          onClose();
          return;
        }

        const width = 600;
        const height = 720;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;

        const authWindow = window.open(
          data.url,
          'twitch_oauth_popup',
          `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
        );

        if (!authWindow) {
          // Fallback if popups blocked: navigate directly or show quick login
          window.location.href = data.url;
        }
      }
    } catch (err) {
      console.error('Twitch OAuth Connect Error:', err);
      setIsAuthLoading(false);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oauthTokenInput.trim()) return;
    setIsAuthLoading(true);

    try {
      const cleanedToken = oauthTokenInput.replace('oauth:', '').trim();
      const res = await fetch('/api/auth/twitch/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanedToken, channelName: streamerChannel }),
      });

      if (res.ok) {
        await onRefreshAuthStatus();
        onClose();
      }
    } catch (e) {
      console.error('Token submit error:', e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleQuickChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    await onDemoLogin(streamerChannel, streamerChannel);
    setIsAuthLoading(false);
    onClose();
  };

  const handleSaveClientId = () => {
    onUpdateSettings({ twitchClientId: customClientId });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">Connect CoreKnight to Twitch</h2>
            <p className="text-xs text-slate-400">Public app authentication — no Twitch client secret required</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300">
          
          {/* Option 1: 1-Click Twitch Auth */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  1-Click Twitch OAuth Login
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Connect your Twitch account in 1 click. Uses public application grant so no client secret is required.
                </p>
              </div>
            </div>

            <button
              onClick={handleTwitchOAuthConnect}
              disabled={isAuthLoading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isAuthLoading ? 'Connecting...' : 'Authorize Twitch Account (1-Click)'}</span>
            </button>
          </div>

          {/* Option 2: Direct OAuth Access Token */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-400" />
                  Connect with Twitch Token (Optional)
                </span>
                <span className="text-[10px] text-indigo-300 font-mono bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded">
                  oauth:xxxxx
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Have a Twitch OAuth Token from Twitch Apps or TMI? Paste it here to authenticate instantly.
              </p>
            </div>

            <form onSubmit={handleTokenSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={oauthTokenInput}
                onChange={(e) => setOauthTokenInput(e.target.value)}
                placeholder="oauth:abcdef123456789..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                disabled={!oauthTokenInput.trim() || isAuthLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-4 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                Connect Token
              </button>
            </form>
          </div>

          {/* Option 3: Quick Channel Mode */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-400" />
                Streamer Channel Connect
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your Twitch channel name to let CoreKnight join your chat immediately.
              </p>
            </div>

            <form onSubmit={handleQuickChannelSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-bold">#</span>
                  <input
                    type="text"
                    value={streamerChannel}
                    onChange={(e) => setStreamerChannel(e.target.value.toLowerCase().trim())}
                    placeholder="your_twitch_channel"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isAuthLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-4 rounded-lg transition-colors cursor-pointer"
              >
                Connect Channel
              </button>
            </form>
          </div>

          {/* Developer Callback & Client ID Settings */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                OAuth Redirect URIs (Add to Twitch Dev Console)
              </span>
              <a
                href="https://dev.twitch.tv/console/apps"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline flex items-center gap-1"
              >
                Twitch Dev Console <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2">
                <div className="flex-1 truncate">
                  <span className="text-[10px] text-slate-500 font-sans block">Production Vercel Domain:</span>
                  <code className="text-xs font-mono text-slate-300 select-all">
                    https://coreknight.vercel.app/auth/callback
                  </code>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('https://coreknight.vercel.app/auth/callback');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer shrink-0"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Vercel URI</span>
                </button>
              </div>

              {window.location.host !== 'coreknight.vercel.app' && (
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2">
                  <div className="flex-1 truncate">
                    <span className="text-[10px] text-slate-500 font-sans block">Current Environment URI:</span>
                    <code className="text-xs font-mono text-slate-300 select-all">
                      {currentCallbackUrl}
                    </code>
                  </div>
                  <button
                    onClick={handleCopyCallback}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Custom Twitch Client ID (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customClientId}
                  onChange={(e) => setCustomClientId(e.target.value.trim())}
                  placeholder="Paste Client ID if using custom Twitch App"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  onClick={handleSaveClientId}
                  className="bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Save ID
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>CoreKnight Translator by CyberKnight</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 font-semibold py-1 px-3 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
