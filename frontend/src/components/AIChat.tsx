import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
    Send,
    Plus,
    Bot,
    Sparkles,
    HeartPulse,
    Activity,
    Brain,
    MessageSquare,
    Trash2,
    Mic,
    Volume2,
    VolumeX,
    Settings,
    X,
} from "lucide-react";

import "./AIChat.css";

// =====================================================
// TYPES
// =====================================================

interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    emergency?: boolean;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
    updatedAt: number;
}

// =====================================================
// CONSTANTS
// =====================================================

const STORAGE_KEY = "medic_ai_chat_history";

const suggestions = [
    {
        icon: HeartPulse,
        title: "Heart health",
        description: "Understand blood pressure and heart health",
        prompt: "How can I improve my heart health naturally?",
    },
    {
        icon: Activity,
        title: "Understand symptoms",
        description: "Explore symptoms and possible causes",
        prompt: "Help me understand some common health symptoms.",
    },
    {
        icon: Brain,
        title: "Mental wellness",
        description: "Explore stress, sleep and mental wellbeing",
        prompt: "What are some ways to manage stress and improve mental wellness?",
    },
    {
        icon: Sparkles,
        title: "Healthy lifestyle",
        description: "Build healthier daily habits",
        prompt: "Can you suggest a healthy daily routine?",
    },
];

const voiceLanguages = [
    { label: "English (India)", value: "en-IN" },
    { label: "English (US)", value: "en-US" },
    { label: "Malayalam", value: "ml-IN" },
    { label: "Tamil", value: "ta-IN" },
    { label: "Hindi", value: "hi-IN" },
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function generateTitle(message: string) {
    const cleaned = message.trim().replace(/\s+/g, " ");

    return cleaned.length > 35
        ? cleaned.substring(0, 35) + "..."
        : cleaned;
}

function formatChatDate(timestamp: number) {
    const date = new Date(timestamp);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
        date.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}

// Remove Markdown formatting before speech playback.
function getSpeechText(text: string) {
    return text
        .replace(/```[\s\S]*?```/g, "Code block omitted.")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/!\[.*?\]\(.*?\)/g, "")
        .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
        .replace(/#{1,6}\s?/g, "")
        .replace(/(\*\*|__)(.*?)\1/g, "$2")
        .replace(/(\*|_)(.*?)\1/g, "$2")
        .replace(/^\s*[-*+]\s/gm, "")
        .replace(/^\s*\d+\.\s/gm, "")
        .replace(/\n{2,}/g, ". ")
        .trim();
}

// =====================================================
// MAIN COMPONENT
// =====================================================

function AIChat() {

    // -------------------------------------------------
    // CHAT STATES
    // -------------------------------------------------

    const [chats, setChats] = useState<ChatSession[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [activeChatId, setActiveChatId] =
        useState<string | null>(null);

    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    // -------------------------------------------------
    // VOICE STATES
    // -------------------------------------------------

    const [isListening, setIsListening] = useState(false);
    const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
    const [isContinuousVoice, setIsContinuousVoice] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakingMessageId, setSpeakingMessageId] =
        useState<number | null>(null);

    const [voiceSettingsOpen, setVoiceSettingsOpen] =
        useState(false);

    const [voiceLanguage, setVoiceLanguage] =
        useState("en-IN");

    const [voiceError, setVoiceError] =
        useState("");

    const recognitionRef = useRef<any>(null);

    // -------------------------------------------------
    // REFERENCES
    // -------------------------------------------------

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // -------------------------------------------------
    // ACTIVE CHAT
    // -------------------------------------------------

    const activeChat = chats.find(
        (chat) => chat.id === activeChatId
    );

    const messages = activeChat?.messages ?? [];
    const hasMessages = messages.length > 0;

    // =================================================
    // SAVE CHAT HISTORY
    // =================================================

    useEffect(() => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(chats)
            );
        } catch (error) {
            console.error("Unable to save chat history:", error);
        }
    }, [chats]);

    // =================================================
    // AUTO SCROLL
    // =================================================

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages, isTyping]);

    // =================================================
    // CLEAN UP VOICE WHEN COMPONENT UNMOUNTS
    // =================================================

    useEffect(() => {
        return () => {
            recognitionRef.current?.abort();

            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // =================================================
    // VOICE INPUT - SPEECH TO TEXT
    // =================================================

    const startListening = () => {

        setVoiceError("");

        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setVoiceError(
                "Speech recognition is not supported. Please use Chrome or Edge."
            );
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        // Stop existing recognition if present.
        recognitionRef.current?.abort();

        const recognition = new SpeechRecognition();

        recognition.lang = voiceLanguage;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setVoiceError("");
        };

        recognition.onresult = (event: any) => {

            let transcript = "";

            for (
                let i = 0;
                i < event.results.length;
                i++
            ) {
                transcript +=
                    event.results[i][0].transcript;
            }

            setInput(transcript.trim());
        };

        recognition.onerror = (event: any) => {

            setIsListening(false);

            if (event.error === "not-allowed") {
                setVoiceError(
                    "Microphone permission was denied. Please allow microphone access."
                );
            } else if (event.error === "no-speech") {
                setVoiceError(
                    "No speech detected. Please try again."
                );
            } else if (event.error !== "aborted") {
                setVoiceError(
                    "Voice recognition failed. Please try again."
                );
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch (error) {
            console.error("Voice recognition error:", error);
            setIsListening(false);
            setVoiceError("Unable to start microphone.");
        }
    };

    // =================================================
    // VOICE OUTPUT - TEXT TO SPEECH
    // =================================================

    const speakMessage = (
        text: string,
        messageId: number
    ) => {

        if (!("speechSynthesis" in window)) {
            setVoiceError(
                "Voice playback is not supported in this browser."
            );
            return;
        }

        // Stop previous speech.
        window.speechSynthesis.cancel();

        if (speakingMessageId === messageId && isSpeaking) {
            setIsSpeaking(false);
            setSpeakingMessageId(null);
            return;
        }

        const cleanText = getSpeechText(text);

        if (!cleanText) return;

        const utterance =
            new SpeechSynthesisUtterance(cleanText);

        utterance.lang = voiceLanguage;
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => {
            setIsSpeaking(true);
            setSpeakingMessageId(messageId);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setSpeakingMessageId(null);

            if (isContinuousVoice && isVoiceModeOpen) {
                setTimeout(() => {
                    const SpeechRecognition =
                        (window as any).SpeechRecognition ||
                        (window as any).webkitSpeechRecognition;

                    if (!SpeechRecognition) {
                        setVoiceError("Speech recognition is unavailable.");
                        return;
                    }

                    startListening();
                }, 800);
            }
        };

        utterance.onerror = (event) => {
            console.error("Speech playback error:", event);
            setIsSpeaking(false);
            setSpeakingMessageId(null);
        };

        window.speechSynthesis.speak(utterance);
    };

    // =================================================
    // STOP SPEAKING
    // =================================================

    const stopSpeaking = () => {

        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        setIsSpeaking(false);
        setSpeakingMessageId(null);
    };

    // =================================================
    // NEW CHAT
    // =================================================

    const handleNewChat = () => {

        recognitionRef.current?.abort();
        setIsListening(false);

        stopSpeaking();

        setActiveChatId(null);
        setInput("");
        setVoiceError("");

        inputRef.current?.focus();
    };

    // =================================================
    // SELECT CHAT
    // =================================================

    const handleSelectChat = (chatId: string) => {

        recognitionRef.current?.abort();
        setIsListening(false);

        stopSpeaking();

        setActiveChatId(chatId);
        setInput("");
    };

    // =================================================
    // DELETE CHAT
    // =================================================

    const handleDeleteChat = (chatId: string) => {

        setChats((prev) =>
            prev.filter((chat) => chat.id !== chatId)
        );

        if (activeChatId === chatId) {
            setActiveChatId(null);
        }
    };

    // =================================================
    // SEND MESSAGE
    // =================================================

    const handleSend = async (text?: string) => {

        const messageText = (text ?? input).trim();

        if (!messageText || isTyping) return;

        recognitionRef.current?.abort();
        setIsListening(false);

        stopSpeaking();

        const now = Date.now();

        const userMessage: Message = {
            id: now,
            role: "user",
            content: messageText,
        };

        let currentChatId = activeChatId;

        // Create new conversation if necessary.
        if (!currentChatId) {

            currentChatId = crypto.randomUUID();

            const newChat: ChatSession = {
                id: currentChatId,
                title: generateTitle(messageText),
                messages: [userMessage],
                createdAt: now,
                updatedAt: now,
            };

            setChats((prev) => [
                newChat,
                ...prev,
            ]);

            setActiveChatId(currentChatId);

        } else {

            setChats((prev) =>
                prev.map((chat) =>
                    chat.id === currentChatId
                        ? {
                            ...chat,
                            messages: [
                                ...chat.messages,
                                userMessage,
                            ],
                            updatedAt: now,
                        }
                        : chat
                )
            );
        }

        setInput("");
        setIsTyping(true);
        setVoiceError("");

        try {

            // Preserve relevant conversation history.
            // Exclude emergency responses and the user messages
            // that directly triggered those emergency responses.

            const safeHistory = messages
                .filter((msg, index) => {

                    if (msg.emergency) {
                        return false;
                    }

                    const nextMessage =
                        messages[index + 1];

                    if (
                        msg.role === "user" &&
                        nextMessage?.role === "assistant" &&
                        nextMessage.emergency === true
                    ) {
                        return false;
                    }

                    return true;
                })
                .slice(-6)
                .map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                }));

            const response = await sendChatMessage(
                messageText,
                safeHistory
            );

            const assistantMessage: Message = {
                id: Date.now() + 1,
                role: "assistant",
                content:
                    response.answer ||
                    "I couldn't generate a response.",
                emergency: response.emergency === true,
            };
            // Automatically speak the response in Voice Mode.
            if (isVoiceModeOpen && response.emergency !== true) {
                speakMessage(
                    assistantMessage.content,
                    assistantMessage.id
                );
            }
            setChats((prev) =>
                prev.map((chat) =>
                    chat.id === currentChatId
                        ? {
                            ...chat,
                            messages: [
                                ...chat.messages,
                                assistantMessage,
                            ],
                            updatedAt: Date.now(),
                        }
                        : chat
                )
            );

        } catch (error) {

            const errorMessage: Message = {
                id: Date.now() + 1,
                role: "assistant",
                content:
                    error instanceof Error
                        ? error.message
                        : "Something went wrong. Please try again.",
            };

            setChats((prev) =>
                prev.map((chat) =>
                    chat.id === currentChatId
                        ? {
                            ...chat,
                            messages: [
                                ...chat.messages,
                                errorMessage,
                            ],
                            updatedAt: Date.now(),
                        }
                        : chat
                )
            );

        } finally {
            setIsTyping(false);
        }
    };

    // =================================================
    // GROUP CHATS BY DATE
    // =================================================

    const groupedChats = chats.reduce(
        (groups, chat) => {

            const group = formatChatDate(
                chat.updatedAt
            );

            if (!groups[group]) {
                groups[group] = [];
            }

            groups[group].push(chat);

            return groups;
        },
        {} as Record<string, ChatSession[]>
    );

    // =================================================
    // USER INTERFACE
    // =================================================

    return (

        <div className="medic-chat-layout">

            {/* ======================================
                CHAT HISTORY SIDEBAR
            ====================================== */}

            <aside className="medic-chat-history">

                <div className="history-header">

                    <div className="history-section-title">
                        <span>RECENT</span>
                    </div>

                </div>

                <div className="history-list">

                    {chats.length === 0 ? (

                        <div className="history-empty">
                            <MessageSquare size={22} />
                            <p>Your conversations will appear here.</p>
                        </div>

                    ) : (

                        Object.entries(groupedChats).map(
                            ([group, groupChats]) => (

                                <div
                                    className="history-group"
                                    key={group}
                                >

                                    <h4>{group}</h4>

                                    {groupChats.map((chat) => (

                                        <div
                                            key={chat.id}
                                            className={`history-chat-item ${activeChatId === chat.id
                                                ? "active"
                                                : ""
                                                }`}
                                        >

                                            <button
                                                className="history-chat-select"
                                                onClick={() =>
                                                    handleSelectChat(chat.id)
                                                }
                                            >

                                                <MessageSquare size={15} />

                                                <span>
                                                    {chat.title}
                                                </span>

                                            </button>

                                            <button
                                                className="history-delete"
                                                onClick={() =>
                                                    handleDeleteChat(chat.id)
                                                }
                                                title="Delete conversation"
                                            >
                                                <Trash2 size={14} />
                                            </button>

                                        </div>

                                    ))}

                                </div>
                            )
                        )
                    )}

                </div>

            </aside>

            {/* ======================================
                MAIN CHAT
            ====================================== */}

            <div className="medic-chat-main">

                {/* HEADER */}

                <header className="medic-chat-header">

                    <div className="chat-header-info">

                        <div className="chat-header-icon">
                            <Bot size={20} />
                        </div>

                        <div>

                            <h3>AI Health Assistant</h3>

                            <div className="chat-status">

                                <span className="status-dot" />

                                Health intelligence assistant

                            </div>

                        </div>

                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                        }}
                    >
                        {/* OPEN VOICE MODE */}
                        <button
                            type="button"
                            className="medic-voice-mode-trigger"
                            onClick={() => setIsVoiceModeOpen(true)}
                            title="Open voice assistant"
                            aria-label="Open voice assistant"
                        >
                            <Mic size={18} />
                            <span>Voice Mode</span>
                        </button>
                        {/* VOICE SETTINGS BUTTON */}

                        <button
                            className="medic-voice-settings"
                            onClick={() =>
                                setVoiceSettingsOpen(
                                    !voiceSettingsOpen
                                )
                            }
                            title="Voice settings"
                            aria-label="Voice settings"
                        >
                            <Settings size={18} />
                        </button>

                        {/* NEW CHAT */}

                        <button
                            className="chat-header-new"
                            onClick={handleNewChat}
                        >

                            <Plus size={16} />

                            New chat

                        </button>

                    </div>

                </header>

                {/* ======================================
                    VOICE SETTINGS PANEL
                ====================================== */}

                {voiceSettingsOpen && (

                    <div className="medic-voice-settings-panel">

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >

                            <h4>Voice settings</h4>

                            <button
                                onClick={() =>
                                    setVoiceSettingsOpen(false)
                                }
                                aria-label="Close voice settings"
                            >
                                <X size={18} />
                            </button>

                        </div>

                        <label htmlFor="voice-language">
                            Recognition and playback language
                        </label>

                        <select
                            id="voice-language"
                            value={voiceLanguage}
                            onChange={(e) =>
                                setVoiceLanguage(e.target.value)
                            }
                        >

                            {voiceLanguages.map((language) => (

                                <option
                                    key={language.value}
                                    value={language.value}
                                >
                                    {language.label}
                                </option>

                            ))}

                        </select>

                        <p>
                            Language availability depends on your browser
                            and installed voices.
                        </p>

                    </div>

                )}

                {/* ======================================
                    CHAT CONTENT
                ====================================== */}

                <main className="medic-chat-content">

                    {!hasMessages ? (

                        <div className="medic-chat-welcome">

                            <div className="welcome-glow">

                                <div className="welcome-icon">
                                    <Sparkles size={28} />
                                </div>

                            </div>

                            <span className="welcome-eyebrow">
                                PERSONAL HEALTH INTELLIGENCE
                            </span>

                            <h1>
                                Understand your health.
                                <br />
                                <span>
                                    Make informed decisions.
                                </span>
                            </h1>

                            <p className="welcome-description">
                                Explore health questions, understand
                                symptoms, and discover ways to improve
                                your wellbeing.
                            </p>

                            <div className="medic-suggestions">

                                {suggestions.map((suggestion) => {

                                    const Icon = suggestion.icon;

                                    return (

                                        <button
                                            key={suggestion.title}
                                            className="medic-suggestion-card"
                                            onClick={() =>
                                                handleSend(suggestion.prompt)
                                            }
                                        >

                                            <div className="suggestion-icon">
                                                <Icon size={20} />
                                            </div>

                                            <div className="suggestion-content">

                                                <h3>
                                                    {suggestion.title}
                                                </h3>

                                                <p>
                                                    {suggestion.description}
                                                </p>

                                            </div>

                                            <span className="suggestion-arrow">
                                                ↗
                                            </span>

                                        </button>
                                    );
                                })}

                            </div>

                        </div>

                    ) : (

                        <div className="medic-conversation">

                            {messages.map((message) => (

                                <div
                                    key={message.id}
                                    className={`medic-message ${message.role}`}
                                >

                                    {message.role === "assistant" && (

                                        <div className="medic-message-avatar">
                                            <HeartPulse size={18} />
                                        </div>

                                    )}

                                    <div className="medic-message-content">

                                        {message.role === "assistant" ? (

                                            <>

                                                <div className="medic-message-label">
                                                    Medic.AI
                                                </div>

                                                <div className="message-content markdown-content">

                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>

                                                </div>

                                                {/* SPEAKER CONTROL */}

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "8px",
                                                        marginTop: "10px",
                                                    }}
                                                >

                                                    <button
                                                        className={`medic-listen-button ${speakingMessageId === message.id
                                                            ? "active"
                                                            : ""
                                                            }`}
                                                        onClick={() => {

                                                            if (
                                                                speakingMessageId === message.id &&
                                                                isSpeaking
                                                            ) {
                                                                stopSpeaking();
                                                            } else {
                                                                speakMessage(
                                                                    message.content,
                                                                    message.id
                                                                );
                                                            }
                                                        }}
                                                        title={
                                                            speakingMessageId === message.id &&
                                                                isSpeaking
                                                                ? "Stop speaking"
                                                                : "Listen to response"
                                                        }
                                                        aria-label={
                                                            speakingMessageId === message.id &&
                                                                isSpeaking
                                                                ? "Stop speaking"
                                                                : "Listen to response"
                                                        }
                                                    >

                                                        {speakingMessageId === message.id &&
                                                            isSpeaking ? (
                                                            <VolumeX size={17} />
                                                        ) : (
                                                            <Volume2 size={17} />
                                                        )}

                                                    </button>

                                                </div>

                                            </>

                                        ) : (

                                            <div className="medic-message-text">
                                                {message.content}
                                            </div>

                                        )}

                                    </div>

                                </div>

                            ))}

                            {/* TYPING INDICATOR */}

                            {isTyping && (

                                <div className="medic-message assistant">

                                    <div className="medic-message-avatar">
                                        <HeartPulse size={18} />
                                    </div>

                                    <div className="medic-message-content">

                                        <div className="medic-message-label">
                                            Medic.AI
                                        </div>

                                        <div className="medic-typing">
                                            <span />
                                            <span />
                                            <span />
                                        </div>

                                    </div>

                                </div>

                            )}

                            {/* AUTO SCROLL */}

                            <div ref={messagesEndRef} />

                        </div>

                    )}

                </main>

                {/* ======================================
                    CHAT INPUT
                ====================================== */}

                <footer className="medic-chat-footer">

                    {voiceError && (

                        <div
                            role="alert"
                            style={{
                                color: "#DC2626",
                                textAlign: "center",
                                fontSize: "12px",
                                marginBottom: "8px",
                            }}
                        >
                            {voiceError}
                        </div>

                    )}

                    {/* LISTENING STATUS */}

                    {isListening && (

                        <div className="medic-voice-status">

                            <div className="medic-voice-bars">
                                <span />
                                <span />
                                <span />
                                <span />
                            </div>

                            Listening... Speak now

                        </div>

                    )}

                    <div className="medic-input-container">

                        {/* MICROPHONE BUTTON */}

                        <button
                            type="button"
                            className={`medic-voice-button ${isListening ? "listening" : ""
                                }`}
                            onClick={startListening}
                            disabled={isTyping}
                            title={
                                isListening
                                    ? "Stop listening"
                                    : "Start voice input"
                            }
                            aria-label={
                                isListening
                                    ? "Stop listening"
                                    : "Start voice input"
                            }
                        >

                            <Mic size={20} />

                        </button>

                        {/* TEXT INPUT */}

                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Ask Medic.AI anything..."
                            value={input}
                            onChange={(e) =>
                                setInput(e.target.value)
                            }
                            onKeyDown={(e) => {

                                if (
                                    e.key === "Enter" &&
                                    !e.shiftKey
                                ) {
                                    handleSend();
                                }

                            }}
                        />

                        {/* SEND BUTTON */}

                        <button
                            className="medic-send-button"
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isTyping}
                            aria-label="Send message"
                        >

                            <Send size={18} />

                        </button>

                    </div>

                    <p className="medic-chat-disclaimer">
                        AI-generated information is for educational
                        purposes only and does not replace professional
                        medical advice.
                    </p>

                </footer>
                {/* FULL SCREEN VOICE MODE */}
                {isVoiceModeOpen && (
                    <div className="medic-voice-overlay">
                        <div className="medic-voice-modal">

                            <button
                                className="medic-voice-close"
                                onClick={() => {
                                    recognitionRef.current?.abort();
                                    setIsListening(false);
                                    stopSpeaking();
                                    setIsVoiceModeOpen(false);
                                }}
                                aria-label="Close voice mode"
                            >
                                <X size={22} />
                            </button>

                            <div className="medic-voice-heading">
                                <span>MEDIC.AI VOICE ASSISTANT</span>
                                <h2>Let's talk about your health.</h2>
                                <p>Speak naturally. I'm listening.</p>
                            </div>

                            <div className={`medic-voice-orb ${isListening ? "listening" : isSpeaking ? "speaking" : ""
                                }`}>
                                <Mic size={42} />
                            </div>

                            <div className={`medic-voice-wave ${isListening || isSpeaking ? "active" : ""
                                }`}>
                                {Array.from({ length: 24 }).map((_, index) => (
                                    <span key={index} />
                                ))}
                            </div>

                            <p className="medic-voice-label">
                                {isListening
                                    ? "Listening..."
                                    : isTyping
                                        ? "Thinking..."
                                        : isSpeaking
                                            ? "Speaking..."
                                            : "Ready to talk"}
                            </p>

                            {input && (
                                <div className="medic-voice-transcript">
                                    {input}
                                </div>
                            )}
                            <div className="medic-continuous-toggle">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={isContinuousVoice}
                                        onChange={(e) =>
                                            setIsContinuousVoice(e.target.checked)
                                        }
                                    />
                                    <span>Continuous conversation</span>
                                </label>

                                <p>
                                    Automatically listen again after Medic.AI finishes speaking.
                                </p>
                            </div>
                            <div className="medic-voice-actions">
                                <button
                                    className="medic-voice-main-button"
                                    onClick={startListening}
                                    disabled={isTyping}
                                >
                                    <Mic size={20} />
                                    {isListening ? "Stop listening" : "Start speaking"}
                                </button>

                                {input.trim() && (
                                    <button
                                        className="medic-voice-send-button"
                                        onClick={() => handleSend()}
                                        disabled={isTyping}
                                    >
                                        <Send size={18} />
                                        Send message
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                )}

            </div>

        </div>
    );
}

export default AIChat;