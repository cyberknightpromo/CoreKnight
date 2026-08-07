import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// In-Memory Storage for App State
interface BotSettingsState {
  isActive: boolean;
  channelName: string;
  targetLanguage: string;
  targetLanguageCode: string;
  botPrefix: string;
  autoTranslateAll: boolean;
  customPromptRules: string;
  ignoreBots: boolean;
  twitchClientId: string;
}

let botSettings: BotSettingsState = {
  isActive: true,
  channelName: "twitch_streamer",
  targetLanguage: "English",
  targetLanguageCode: "en",
  botPrefix: "[TR]",
  autoTranslateAll: true,
  customPromptRules: "Keep tone natural and casual like live stream chat. Preserve Twitch emotes.",
  ignoreBots: true,
  twitchClientId: process.env.TWITCH_CLIENT_ID || "",
};

let authUser: {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  isBroadcaster: boolean;
  isConnectedToTwitch: boolean;
  authMethod: "oauth" | "demo";
  accessToken?: string;
} = {
  id: "demo_123",
  username: "coreknight_user",
  displayName: "CyberKnight Streamer",
  profileImageUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80",
  isBroadcaster: true,
  isConnectedToTwitch: false,
  authMethod: "demo",
};

interface ChatLogItem {
  id: string;
  username: string;
  userColor?: string;
  userBadges?: ("broadcaster" | "mod" | "vip" | "subscriber" | "viewer")[];
  originalText: string;
  translatedText?: string;
  detectedLanguage?: string;
  targetLanguage: string;
  timestamp: string;
  isSimulated?: boolean;
  translationLatencyMs?: number;
  status: "pending" | "translated" | "skipped" | "error";
  errorMessage?: string;
}

let chatLogs: ChatLogItem[] = [
  {
    id: "msg-101",
    username: "KawaiiGamer_JP",
    userColor: "#9146FF",
    userBadges: ["vip", "subscriber"],
    originalText: "Minna-san konnichiwa! Kyou no配信 mo楽しみ desu bro!!",
    translatedText: "Hello everyone! Looking forward to today's stream too bro!!",
    detectedLanguage: "Japanglish",
    targetLanguage: "English",
    timestamp: new Date(Date.now() - 1000 * 120).toISOString(),
    isSimulated: true,
    translationLatencyMs: 184,
    status: "translated",
  },
  {
    id: "msg-102",
    username: "DesiStreamFan",
    userColor: "#E91E63",
    userBadges: ["subscriber"],
    originalText: "Kemon acho bro? Aajke ki game khelbe tumi?",
    translatedText: "How are you bro? What game will you play today?",
    detectedLanguage: "Banglish",
    targetLanguage: "English",
    timestamp: new Date(Date.now() - 1000 * 90).toISOString(),
    isSimulated: true,
    translationLatencyMs: 210,
    status: "translated",
  },
  {
    id: "msg-103",
    username: "Carlos_Gamer_Es",
    userColor: "#FF5722",
    userBadges: ["mod"],
    originalText: "¡Qué buena jugada hermano! Eres un crack.",
    translatedText: "What a great play brother! You are an awesome player.",
    detectedLanguage: "Spanish",
    targetLanguage: "English",
    timestamp: new Date(Date.now() - 1000 * 45).toISOString(),
    isSimulated: true,
    translationLatencyMs: 165,
    status: "translated",
  },
];

// Helper to broadcast WS messages
const connectedClients = new Set<WebSocket>();

function broadcast(type: string, payload: any) {
  const data = JSON.stringify({ type, payload });
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Function to translate text using Gemini AI
async function translateWithGemini(
  text: string,
  targetLanguage: string,
  targetLanguageCode: string,
  customRules: string
): Promise<{ translation: string; detectedLang: string; latencyMs: number }> {
  const startTime = Date.now();
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const prompt = `Translate the following live Twitch chat message into ${targetLanguage} (${targetLanguageCode}).

Message to translate:
"${text}"

REMEMBER: Return ONLY the raw translated text. No markdown quotes, no explanations, no prefix or suffix.`;

  const systemInstruction = `You are a strict, real-time Twitch chat translation engine.
Your sole job is to translate user chat messages into the streamer's target language: ${targetLanguage}.

CRITICAL RULES:
1. Translate ANY language (including slang, hybrid dialects like Japanglish, Banglish, Hinglish, Romaji, typos, or gaming jargon).
2. Maintain casual, authentic live stream chat tone.
3. DO NOT answer the question or engage in conversation with the message.
4. DO NOT add quotes, labels, prefaces like "Translation:" or explanations.
5. Preserve usernames (@name), Twitch emotes, and URLs unchanged.
6. If the message is already in ${targetLanguage}, return it as-is or cleanly polished.
7. Custom Streamer Rules: ${customRules || "Keep tone natural and casual like live stream chat."}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.2,
    },
  });

  const latencyMs = Date.now() - startTime;
  let translation = response.text ? response.text.trim() : text;
  
  // Clean up any residual markdown quotes if model output included them
  translation = translation.replace(/^["'«“]/, "").replace(/["'»”]$/, "").trim();

  // Simple language detector tag based on text features for UI tag
  let detectedLang = "Auto-Detected";
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) detectedLang = "Japanese";
  else if (/[\u0980-\u09FF]/.test(text)) detectedLang = "Bangla";
  else if (/[\u0600-\u06FF]/.test(text)) detectedLang = "Arabic";
  else if (/[\u0900-\u097F]/.test(text)) detectedLang = "Hindi";
  else if (/\b(bro|kemon|acho|kikore|bhalo|shobai)\b/i.test(text)) detectedLang = "Banglish";
  else if (/\b(desu|sugoi|kawaii|konnichiwa|arigatou|dake|san)\b/i.test(text)) detectedLang = "Japanglish";
  else if (/\b(que|hola|hermano|crack|buena|gracias)\b/i.test(text)) detectedLang = "Spanish";
  else if (/\b(bonjour|merci|beaucoup|salut|mon|ami)\b/i.test(text)) detectedLang = "French";

  return { translation, detectedLang, latencyMs };
}

// API Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", botActive: botSettings.isActive });
});

// Twitch OAuth Authorization URL Generator Endpoint (OAuth Integration Skill)
app.get("/api/auth/twitch/url", (req, res) => {
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
  const redirectUri = `${appUrl}/auth/callback`;
  const clientId = process.env.TWITCH_CLIENT_ID || botSettings.twitchClientId;

  if (!clientId) {
    // Return a structured demo URL state if Client ID isn't provided yet
    return res.json({
      url: `${appUrl}/auth/callback?code=demo_twitch_code_12345&state=demo`,
      isConfigured: false,
      redirectUri,
      message: "Twitch Client ID not configured. Using 1-click Demo Auth flow.",
    });
  }

  const scopes = [
    "chat:read",
    "chat:edit",
    "user:read:chat",
    "user:write:chat",
    "channel:read:subscriptions",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    force_verify: "false",
  });

  const authUrl = `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;

  res.json({
    url: authUrl,
    isConfigured: true,
    redirectUri,
  });
});

// OAuth Callback Route (popup callback listener per skill)
app.get(["/auth/callback", "/auth/callback/"], (req, res) => {
  const { code } = req.query;

  // Update authenticated user state
  authUser = {
    ...authUser,
    isConnectedToTwitch: true,
    authMethod: "oauth",
    displayName: authUser.displayName || "TwitchBroadcaster",
    accessToken: typeof code === "string" ? code : "demo_token_xyz",
  };

  broadcast("AUTH_CHANGE", authUser);

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Twitch Authentication Success</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0e0e10; color: #efeff1; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .card { background: #18181b; padding: 32px; border-radius: 12px; border: 1px solid #26262c; max-width: 400px; }
          .icon { font-size: 48px; margin-bottom: 16px; color: #9146ff; }
          h2 { margin: 0 0 12px 0; font-size: 20px; }
          p { color: #adadb8; font-size: 14px; margin: 0 0 20px 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">⚡</div>
          <h2>Connected to Twitch!</h2>
          <p>CoreKnight Translator Bot (by CyberKnight) is now authenticated and ready for live chat.</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(authUser)} }, '*');
            setTimeout(() => { window.close(); }, 1200);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// Get Auth status
app.get("/api/auth/status", (req, res) => {
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
  res.json({
    user: authUser,
    callbackUrl: `${appUrl}/auth/callback`,
    hasTwitchClientId: Boolean(process.env.TWITCH_CLIENT_ID || botSettings.twitchClientId),
  });
});

// 1-Click Demo Login
app.post("/api/auth/demo-login", (req, res) => {
  const { username, channelName } = req.body;
  authUser = {
    id: `user_${Date.now()}`,
    username: username || "twitch_streamer",
    displayName: username || "Twitch Streamer",
    profileImageUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80",
    isBroadcaster: true,
    isConnectedToTwitch: true,
    authMethod: "demo",
  };

  if (channelName) {
    botSettings.channelName = channelName.toLowerCase().replace("#", "");
  }

  broadcast("AUTH_CHANGE", authUser);
  broadcast("SETTINGS_CHANGE", botSettings);

  res.json({ success: true, user: authUser, settings: botSettings });
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  authUser = {
    ...authUser,
    isConnectedToTwitch: false,
    authMethod: "demo",
  };
  broadcast("AUTH_CHANGE", authUser);
  res.json({ success: true });
});

// Get Bot Settings
app.get("/api/settings", (req, res) => {
  res.json(botSettings);
});

// Update Bot Settings
app.post("/api/settings", (req, res) => {
  const updates = req.body;
  botSettings = { ...botSettings, ...updates };

  if (updates.twitchClientId !== undefined) {
    botSettings.twitchClientId = updates.twitchClientId;
  }

  broadcast("SETTINGS_CHANGE", botSettings);
  res.json({ success: true, settings: botSettings });
});

// Translate API endpoint
app.post("/api/translate", async (req, res) => {
  try {
    const { text, targetLanguage, targetLanguageCode, customRules } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Message text is required." });
    }

    const targetLang = targetLanguage || botSettings.targetLanguage;
    const targetCode = targetLanguageCode || botSettings.targetLanguageCode;
    const rules = customRules || botSettings.customPromptRules;

    const result = await translateWithGemini(text, targetLang, targetCode, rules);

    res.json({
      originalText: text,
      translatedText: result.translation,
      detectedLanguage: result.detectedLang,
      targetLanguage: targetLang,
      latencyMs: result.latencyMs,
      formattedBotOutput: `${botSettings.botPrefix} ${result.translation}`,
    });
  } catch (error: any) {
    console.error("Translation API Error:", error);
    res.status(500).json({
      error: error.message || "Failed to process translation with Gemini AI.",
    });
  }
});

// Simulate Live Chat Message
app.post("/api/chat/simulate", async (req, res) => {
  try {
    const { username, text, badges, color } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required." });
    }

    const messageId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const sender = username || "Chatter_" + Math.floor(1000 + Math.random() * 9000);
    const timeStr = new Date().toISOString();

    const newMsg: ChatLogItem = {
      id: messageId,
      username: sender,
      userColor: color || "#9146FF",
      userBadges: badges || ["viewer"],
      originalText: text,
      targetLanguage: botSettings.targetLanguage,
      timestamp: timeStr,
      isSimulated: true,
      status: "pending",
    };

    // If bot is active, run Gemini AI translation
    if (botSettings.isActive) {
      try {
        const translationRes = await translateWithGemini(
          text,
          botSettings.targetLanguage,
          botSettings.targetLanguageCode,
          botSettings.customPromptRules
        );

        newMsg.translatedText = translationRes.translation;
        newMsg.detectedLanguage = translationRes.detectedLang;
        newMsg.translationLatencyMs = translationRes.latencyMs;
        newMsg.status = "translated";
      } catch (err: any) {
        newMsg.status = "error";
        newMsg.errorMessage = err.message || "Translation failed";
      }
    } else {
      newMsg.status = "skipped";
    }

    chatLogs.unshift(newMsg);
    if (chatLogs.length > 200) {
      chatLogs = chatLogs.slice(0, 200);
    }

    broadcast("NEW_CHAT_MESSAGE", newMsg);

    res.json({ success: true, message: newMsg });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Chat Logs
app.get("/api/chat/logs", (req, res) => {
  res.json({ logs: chatLogs, botSettings });
});

// Clear Chat Logs
app.delete("/api/chat/logs", (req, res) => {
  chatLogs = [];
  broadcast("CLEAR_LOGS", null);
  res.json({ success: true });
});

// Server initialization & Vite middleware mode setup
async function startServer() {
  const server = http.createServer(app);

  // Setup WebSocket Server on same HTTP server
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    connectedClients.add(ws);

    // Send initial state
    ws.send(
      JSON.stringify({
        type: "INITIAL_STATE",
        payload: {
          settings: botSettings,
          user: authUser,
          logs: chatLogs,
        },
      })
    );

    ws.on("close", () => {
      connectedClients.delete(ws);
    });
  });

  // Vite development middleware
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Twitch AI Translator Bot Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
