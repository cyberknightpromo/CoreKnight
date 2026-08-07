export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  isBroadcaster: boolean;
  isConnectedToTwitch: boolean;
  authMethod: 'oauth' | 'demo';
}

export interface BotSettings {
  isActive: boolean;
  channelName: string;
  targetLanguage: string;
  targetLanguageCode: string;
  botPrefix: string;
  autoTranslateAll: boolean;
  customPromptRules: string;
  ignoreBots: boolean;
  twitchClientId?: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  userColor?: string;
  userBadges?: ('broadcaster' | 'mod' | 'vip' | 'subscriber' | 'viewer')[];
  originalText: string;
  translatedText?: string;
  detectedLanguage?: string;
  targetLanguage: string;
  timestamp: string;
  isSimulated?: boolean;
  translationLatencyMs?: number;
  status: 'pending' | 'translated' | 'skipped' | 'error';
  errorMessage?: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  exampleText: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', exampleText: 'Hello, how are you?' },
  { code: 'bn', name: 'Bangla', nativeName: 'বাংলা', flag: '🇧🇩', exampleText: 'কেমন আছেন সবাই?' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', exampleText: '¡Hola a todos!' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', exampleText: 'みなさんこんにちは！' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', exampleText: 'Bonjour tout le monde!' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', exampleText: 'Hallo zusammen!' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', exampleText: 'आप सब कैसे हैं?' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', exampleText: 'مرحبا للجميع' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', exampleText: 'Olá a todos!' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', exampleText: 'Всем привет!' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', exampleText: '안녕하세요 여러분!' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文', flag: '🇨🇳', exampleText: '大家好！' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', exampleText: 'Ciao a tutti!' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', exampleText: 'Herkese merhaba!' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', exampleText: 'Xin chào mọi người!' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', exampleText: 'Halo semuanya!' },
];
