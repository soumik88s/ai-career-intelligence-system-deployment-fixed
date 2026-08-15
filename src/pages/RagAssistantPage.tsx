import React, { useState } from "react";
import { Bot, Send, Sparkles, User, FileText, Database, CornerDownLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const RagAssistantPage: React.FC = () => {
  const { user, isAuthenticated, resume } = useAuth();
  const [messages, setMessages] = useState<
    { sender: "user" | "assistant"; text: string; timestamp: string }[]
  >([
    {
      sender: "assistant",
      text: "Hello! I am your RAG Career Advisory Assistant powered by vector context retrieval and Gemini. Ask me any question about your candidate profile, skill gaps, or interview preparation strategies.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");

  const samplePrompts = [
    "What are my strongest skills compared to a Senior AI Engineer position?",
    "How can I prepare for technical viva questions on Sentence-BERT vs TF-IDF?",
    "Which projects should I build to strengthen my candidate profile?",
    "What is the mathematical formula used for hybrid job matching?"
  ];

  const handleSend = (textToSend?: string) => {
    const promptText = textToSend || input;
    if (!promptText.trim()) return;

    const userMsg = {
      sender: "user" as const,
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");

    // Simulate RAG Assistant response
    setTimeout(() => {
      let responseText = "";
      if (promptText.toLowerCase().includes("viva") || promptText.toLowerCase().includes("sentence-bert")) {
        responseText = "For your viva defense: Sentence-BERT uses Siamese neural network architectures to produce dense 384-dimensional vector embeddings. Unlike standard BERT which requires O(N*M) pairwise computations, Sentence-BERT allows pre-computation of embeddings, enabling sub-millisecond vector similarity search using FAISS.";
      } else if (promptText.toLowerCase().includes("formula") || promptText.toLowerCase().includes("hybrid")) {
        responseText = "The system uses a 5-factor weighted formula: Final Score = 0.35 * Semantic Similarity + 0.30 * Skill Match + 0.15 * Experience Match + 0.10 * Education Match + 0.10 * ATS Compatibility.";
      } else if (resume) {
        responseText = `Based on your parsed resume (${resume.fileName}), you currently have ${resume.parsedSkills?.length || 0} extracted skills including ${resume.parsedSkills?.slice(0, 4).join(", ")}. To maximize match scores for AI Engineer roles, consider building projects involving PyTorch, FAISS vector indexing, and SHAP explainability.`;
      } else {
        responseText = "To receive personalized profile recommendations, please upload your resume in the 'Upload Resume' tab or load sample development resume data.";
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 600);
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          RAG-Based Career Advisory Assistant
        </h1>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
          Context-grounded LLM career guidance backed by candidate vector store retrieval and Gemini API.
        </p>
      </div>

      {/* RAG Context Status Bar */}
      <div className="p-3 bg-stone-100 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-500" />
          <span className="font-semibold text-stone-800 dark:text-stone-200">Retrieval Context:</span>
          <span className="text-stone-600 dark:text-stone-400">
            {resume ? `Loaded (${resume.fileName})` : "No Candidate Context (General Advisory)"}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
          Gemini RAG Engine Ready
        </span>
      </div>

      {/* Prompt Suggestions */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
          Suggested Research & Viva Questions
        </span>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-blue-400 dark:hover:border-blue-600 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 min-h-[320px] max-h-[500px] overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 text-xs ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-xl p-4 rounded-xl space-y-1 ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-bl-none"
              }`}
            >
              <p className="leading-relaxed">{msg.text}</p>
              <span
                className={`block text-[9px] text-right ${
                  msg.sender === "user" ? "text-blue-200" : "text-stone-400"
                }`}
              >
                {msg.timestamp}
              </span>
            </div>

            {msg.sender === "user" && (
              <div className="w-8 h-8 rounded-lg bg-stone-800 text-white flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Field */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask a question about job matching, NLP metrics, or viva preparation..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 px-4 py-3 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-stone-900 dark:text-stone-100"
        />
        <button
          onClick={() => handleSend()}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </div>
    </div>
  );
};
