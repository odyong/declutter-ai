import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { 
  Upload, 
  Sparkles, 
  MessageSquare, 
  X, 
  Send, 
  Image as ImageIcon, 
  Trash2, 
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface AnalysisResult {
  summary: string;
  suggestions: string[];
  priorityItems: string[];
}

// --- Constants ---
const MODEL_NAME = "gemini-3.1-pro-preview";

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null); // Reset analysis for new image
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const base64Data = image.split(',')[1];
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data,
              },
            },
            {
              text: "Analyze this room photo and provide professional decluttering and organization suggestions. Format your response in Markdown. Include: 1. A brief summary of the current state. 2. Specific decluttering actions (what to remove or hide). 3. Organization tips (how to arrange remaining items). 4. A 'Quick Wins' section for immediate impact.",
            },
          ],
        },
      });

      setAnalysis(response.text || "Sorry, I couldn't analyze this image.");
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysis("An error occurred during analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendChatMessage = async () => {
    if (!currentInput.trim() || isSendingChat) return;

    const userMessage: ChatMessage = { role: 'user', text: currentInput };
    setChatMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsSendingChat(true);

    try {
      const chat = ai.chats.create({
        model: MODEL_NAME,
        config: {
          systemInstruction: "You are a professional home organizer and decluttering expert. Help the user with their questions about organizing their space, choosing storage solutions, and maintaining a tidy home. Be encouraging, practical, and minimalist-focused.",
        },
      });

      // Include history context if needed, but for simplicity we'll just send the current message
      // In a real app, we'd pass the full message history to chat.sendMessage
      const response = await chat.sendMessage({ message: currentInput });
      
      setChatMessages(prev => [...prev, { role: 'model', text: response.text || "I'm not sure how to answer that." }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const resetApp = () => {
    setImage(null);
    setAnalysis(null);
    setChatMessages([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-olive rounded-full flex items-center justify-center text-white">
              <Sparkles size={20} />
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-tight text-brand-olive">Declutter AI</h1>
          </div>
          <button 
            onClick={resetApp}
            className="text-sm font-medium text-slate-500 hover:text-brand-olive transition-colors flex items-center gap-1"
          >
            <Trash2 size={16} />
            Reset
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Left Column: Upload & Preview */}
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-medium">Transform your space</h2>
              <p className="text-slate-600">Upload a photo of any room to get personalized organization advice from our AI expert.</p>
            </div>

            {!image ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-slate-300 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 bg-white hover:border-brand-olive hover:bg-brand-olive/5 transition-all cursor-pointer aspect-square max-w-md mx-auto lg:mx-0"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-brand-olive/10 group-hover:text-brand-olive transition-colors">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="font-medium text-slate-900">Click to upload or drag and drop</p>
                  <p className="text-sm text-slate-500">JPG, PNG or WebP (max. 5MB)</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-square bg-slate-100">
                  <img 
                    src={image} 
                    alt="Room preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => setImage(null)}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                {!analysis && (
                  <button
                    onClick={analyzeImage}
                    disabled={isAnalyzing}
                    className={cn(
                      "w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all",
                      isAnalyzing 
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                        : "bg-brand-olive text-white hover:bg-brand-olive/90 shadow-lg shadow-brand-olive/20"
                    )}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        Analyzing space...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Get AI Suggestions
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Right Column: Analysis Results */}
          <section className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4"
                >
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-brand-olive/20 border-t-brand-olive rounded-full animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-olive" size={24} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-serif font-medium">Scanning your room...</h3>
                    <p className="text-slate-500 max-w-xs">Our AI is identifying clutter patterns and finding organizational opportunities.</p>
                  </div>
                </motion.div>
              ) : analysis ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-full overflow-y-auto"
                >
                  <div className="flex items-center gap-2 mb-6 text-brand-olive">
                    <CheckCircle2 size={24} />
                    <h3 className="text-2xl font-serif font-bold">AI Analysis Complete</h3>
                  </div>
                  <div className="markdown-body">
                    <Markdown>{analysis}</Markdown>
                  </div>
                  
                  <div className="mt-10 p-6 bg-brand-beige rounded-2xl border border-brand-olive/10">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-brand-olive">
                        <Info size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-brand-olive mb-1">Need more specific help?</h4>
                        <p className="text-sm text-slate-600 mb-4">Ask our AI organizer about specific storage products or maintenance routines.</p>
                        <button 
                          onClick={() => setIsChatOpen(true)}
                          className="text-sm font-bold text-brand-olive flex items-center gap-1 hover:underline"
                        >
                          Open Chat Assistant <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <ImageIcon size={32} />
                  </div>
                  <p className="max-w-xs">Upload a photo to see AI-powered suggestions here.</p>
                </div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      {/* Chatbot Toggle Button */}
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-brand-olive text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40 group"
      >
        <MessageSquare size={28} />
        <span className="absolute right-full mr-4 bg-white text-slate-900 px-4 py-2 rounded-xl shadow-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-100">
          Ask an Expert
        </span>
      </button>

      {/* Chat Sidebar/Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-brand-olive text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg">AI Organizer</h3>
                    <p className="text-xs text-white/70">Always online</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 bg-brand-beige rounded-full flex items-center justify-center mx-auto text-brand-olive">
                      <MessageSquare size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">How can I help you today?</p>
                      <p className="text-sm text-slate-500 px-10">Ask about storage ideas, decluttering methods, or how to organize specific items.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 px-4">
                      {["Best way to organize a closet?", "How to start decluttering?", "Kitchen storage ideas"].map((hint) => (
                        <button 
                          key={hint}
                          onClick={() => setCurrentInput(hint)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-full transition-colors"
                        >
                          {hint}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "flex flex-col max-w-[85%]",
                      msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-brand-olive text-white rounded-tr-none" 
                        : "bg-slate-100 text-slate-800 rounded-tl-none"
                    )}>
                      {msg.role === 'model' ? (
                        <div className="markdown-body prose prose-sm max-w-none">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
                    </span>
                  </div>
                ))}
                
                {isSendingChat && (
                  <div className="flex flex-col items-start mr-auto max-w-[85%]">
                    <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 border-t border-slate-100">
                <div className="relative">
                  <input 
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Type your question..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-4 pr-14 focus:outline-none focus:ring-2 focus:ring-brand-olive/20 focus:border-brand-olive transition-all"
                  />
                  <button 
                    onClick={sendChatMessage}
                    disabled={!currentInput.trim() || isSendingChat}
                    className="absolute right-2 top-2 bottom-2 w-10 h-10 bg-brand-olive text-white rounded-xl flex items-center justify-center hover:bg-brand-olive/90 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <p className="text-[10px] text-center text-slate-400 mt-4 uppercase tracking-widest">
                  Powered by Gemini 3.1 Pro
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-slate-500">© 2026 Declutter AI. Your personal space, reimagined.</p>
        </div>
      </footer>
    </div>
  );
}
