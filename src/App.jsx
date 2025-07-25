// src/App.jsx

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

// --- SVG Icons for a more polished look ---
const UploadIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>;
const SendIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>;
const BrainIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const SourceIcon = () => <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const DocumentTextIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const UserAvatar = () => <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">You</div>;
const AssistantAvatar = () => <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>;
const ChatIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>;


// --- Helper Components ---

const Notification = ({ message, type, onDismiss }) => {
  if (!message) return null;
  const baseClasses = "absolute top-20 left-1/2 -translate-x-1/2 p-4 rounded-lg text-center text-white shadow-lg transition-all duration-300 z-50";
  const typeClasses = type === 'success' ? 'bg-green-600' : 'bg-red-600';

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(), 5000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};

const SourceDisplay = ({ sources }) => {
    if (!sources || sources.length === 0) return null;
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mt-3 border-t border-indigo-200 pt-2">
            <button onClick={() => setIsOpen(!isOpen)} className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center">
                <SourceIcon />
                {isOpen ? 'Hide Sources' : `Show ${sources.length} Sources`}
            </button>
            {isOpen && (
                <div className="mt-2 space-y-2">
                    {sources.map((source, index) => (
                        <div key={index} className="p-3 border rounded-md bg-indigo-50 text-xs text-slate-700">
                            <p className="font-bold text-indigo-800 mb-1">Source from: {source.source}</p>
                            <p className="whitespace-pre-wrap font-mono">"{source.content}"</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SummaryModal = ({ summary, onClose, isLoading }) => {
    if (!summary && !isLoading) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full transform transition-all">
                <h2 className="text-2xl font-bold mb-4 text-slate-800">Conversation Summary</h2>
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="flex items-center space-x-2 text-slate-500">
                            <span className="text-2xl animate-pulse">✨</span>
                            <span>Generating summary...</span>
                        </div>
                    </div>
                ) : (
                    <p className="whitespace-pre-wrap text-slate-600 bg-slate-50 p-4 rounded-lg">{summary}</p>
                )}
                <button onClick={onClose} className="mt-6 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
                    Close
                </button>
            </div>
        </div>
    );
};


// --- Main App Component ---

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isReadyToChat, setIsReadyToChat] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [sopExists, setSopExists] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  const API_URL = "https://sop-chat-backend.onrender.com";

  useEffect(() => {
    const checkSopStatus = async () => {
        try {
            const res = await axios.get(`${API_URL}/status`);
            setSopExists(res.data.sop_exists);
        } catch (error) {
            console.error("Could not check SOP status", error);
            setSopExists(false);
        } finally {
            setLoadingStatus(false);
        }
    };
    checkSopStatus();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const showNotification = (msg, type = 'error') => {
    setNotification({ message: msg, type });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
        showNotification("Invalid file type. Please select an .xlsx or .xls file.");
        setFile(null);
        setFileName("");
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const uploadFile = async () => {
    if (!file) return showNotification("Please select a file first.");
    
    const form = new FormData();
    form.append("file", file);

    setLoadingUpload(true);
    showNotification("Uploading and processing file... This may take a moment.", "success");

    try {
      const res = await axios.post(`${API_URL}/upload/`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showNotification(res.data.message || "File processed successfully!", "success");
      setIsReadyToChat(true);
      setChat([]);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Upload failed. Please check the file or try again.";
      showNotification(errorMsg);
      setIsReadyToChat(false);
    } finally {
      setLoadingUpload(false);
      setFile(null);
      setFileName("");
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startChatWithExisting = async () => {
    setLoadingUpload(true); // Reuse the same loader state
    showNotification("Initializing chat with existing documents...", "success");
    try {
        await axios.post(`${API_URL}/initialize_chat`);
        setIsReadyToChat(true);
        setChat([]);
    } catch (err) {
        const errorMsg = err.response?.data?.detail || "Failed to initialize chat.";
        showNotification(errorMsg, "error");
        setIsReadyToChat(false);
    } finally {
        setLoadingUpload(false);
    }
  };
  
  const callGeminiAPI = async (prompt) => {
      let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = { contents: chatHistory };
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      try {
          const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          const result = await response.json();
          if (result.candidates && result.candidates.length > 0 &&
              result.candidates[0].content && result.candidates[0].content.parts &&
              result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
          } else {
            console.error("Unexpected Gemini API response structure:", result);
            return "Sorry, I couldn't generate a response right now.";
          }
      } catch (error) {
          console.error("Error calling Gemini API:", error);
          return "Sorry, there was an error connecting to the AI service.";
      }
  };

  const getSuggestions = async () => {
      setLoadingSuggestions(true);
      const conversationContext = chat.slice(-4).map(c => `${c.role}: ${c.text}`).join('\n');
      const prompt = `Based on the following conversation context, suggest three relevant follow-up questions an agent might ask about an SOP document. Return only a numbered list of questions.

Context:
${conversationContext}

Suggested Questions:`;
      
      const resultText = await callGeminiAPI(prompt);
      const suggestedQuestions = resultText.split('\n').filter(q => q.match(/^\d+\./)).map(q => q.replace(/^\d+\.\s*/, ''));
      setSuggestions(suggestedQuestions);
      setLoadingSuggestions(false);
  };

  const getSummary = async () => {
      setLoadingSummary(true);
      const conversationText = chat.map(c => `${c.role === 'user' ? 'Agent' : 'Assistant'}: ${c.text}`).join('\n\n');
      const prompt = `Please provide a concise summary of the following conversation between an Agent and an SOP Assistant.

Conversation:
---
${conversationText}
---

Summary:`;
      const summary = await callGeminiAPI(prompt);
      setSummaryText(summary);
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loadingSend) return;
    
    const userMsg = { role: "user", text: text };
    setChat((prev) => [...prev, userMsg]);
    setMessage("");
    setSuggestions([]);
    setLoadingSend(true);

    const history = chat.reduce((acc, current, index) => {
        if (current.role === 'user' && chat[index + 1]?.role === 'assistant') {
            acc.push([current.text, chat[index + 1].text]);
        }
        return acc;
    }, []);

    try {
      const res = await axios.post(`${API_URL}/chat/`, { 
        prompt: text,
        history: history
      });
      const assistantMsg = { role: "assistant", text: res.data.response, sources: res.data.sources };
      setChat((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to get response. Please try again.";
      const errorBubble = { role: "assistant", text: `Error: ${errorMsg}`, sources: [] };
      setChat((prev) => [...prev.slice(0, -1), userMsg, errorBubble]);
    } finally {
      setLoadingSend(false);
    }
  };

  const handleFormSubmit = (e) => {
      e.preventDefault();
      sendMessage(message);
  }

  const handleTeachClick = () => {
    setMessage("Correction: ");
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
      <header className="bg-white/80 backdrop-blur-lg shadow-sm p-4 z-10 sticky top-0">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">SOP Chat Assistant</h1>
          {isReadyToChat && (
              <button 
                onClick={getSummary}
                className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-colors"
                title="Summarize this conversation"
              >
                  <DocumentTextIcon />
              </button>
          )}
        </div>
      </header>

      <SummaryModal summary={summaryText} isLoading={loadingSummary} onClose={() => setSummaryText("")} />

      <main className="flex-1 w-full mx-auto flex flex-col items-center">
        <Notification 
          message={notification.message} 
          type={notification.type}
          onDismiss={() => setNotification({ message: '', type: '' })}
        />

        {!isReadyToChat && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <img src="https://placehold.co/400x300/e0e7ff/6366f1?text=SOP+Assistant" alt="SOP Assistant illustration" className="w-80 h-60 object-cover rounded-2xl mb-8 shadow-lg" />
            <h2 className="text-3xl font-bold mb-4 text-slate-800">Welcome!</h2>
            
            {loadingStatus ? (
                <p className="text-slate-500 animate-pulse">Checking for existing documents...</p>
            ) : (
                <>
                    <p className="text-slate-500 mb-8 max-w-md">Upload a new SOP file or start a session with your existing knowledge base.</p>
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg space-y-4">
                        {sopExists && (
                            <div>
                                <button
                                  className="w-full bg-green-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                  onClick={startChatWithExisting}
                                  disabled={loadingUpload}
                                >
                                  <ChatIcon />
                                  Start Chat with Existing SOPs
                                </button>
                                <div className="my-4 text-center text-slate-400 text-sm font-semibold">OR</div>
                            </div>
                        )}
                        <div>
                            <label className="cursor-pointer bg-slate-100 text-slate-700 font-semibold py-3 px-5 rounded-lg hover:bg-slate-200 transition-colors w-full block mb-4 text-center">
                              {fileName || "Choose a new or updated file..."}
                              <input type="file" accept=".xlsx,.xls" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            </label>
                            <button
                              className="w-full bg-indigo-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              onClick={uploadFile}
                              disabled={loadingUpload || !file}
                            >
                              <UploadIcon />
                              {loadingUpload && !fileName ? "Initializing..." : loadingUpload && fileName ? "Processing..." : "Upload & Start"}
                            </button>
                        </div>
                    </div>
                </>
            )}
          </div>
        )}

        {isReadyToChat && (
          <div className="flex flex-col flex-1 bg-white/50 backdrop-blur-xl rounded-t-2xl shadow-2xl overflow-hidden w-full max-w-5xl mt-4">
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {chat.length === 0 && (
                <div className="text-center text-slate-500 p-8">
                  <p className="font-semibold">Your document is ready.</p>
                  <p>You can now ask questions about the SOP.</p>
                </div>
              )}
              {chat.map((c, i) => (
                <div key={i} className={`flex items-start gap-4 ${c.role === "user" ? "justify-end" : "justify-start"}`}>
                  {c.role === 'assistant' && <AssistantAvatar />}
                  <div className={`p-4 rounded-2xl max-w-2xl whitespace-pre-wrap shadow-md ${c.role === "user" ? "bg-indigo-500 text-white rounded-br-none" : "bg-slate-100 text-slate-800 rounded-bl-none"}`}>
                    {c.text}
                    {c.role === 'assistant' && <SourceDisplay sources={c.sources} />}
                  </div>
                   {c.role === 'user' && <UserAvatar />}
                </div>
              ))}
              {loadingSend && (
                <div className="flex items-start gap-4">
                    <AssistantAvatar />
                    <div className="p-4 rounded-2xl bg-slate-100 text-slate-800">
                        <div className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-0"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></span>
                        </div>
                    </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            {suggestions.length > 0 && (
                <div className="p-4 border-t bg-white/80 flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                        <button key={i} onClick={() => sendMessage(s)} className="bg-purple-100 text-purple-800 text-sm px-3 py-1.5 rounded-full hover:bg-purple-200 font-semibold transition-colors">
                            {s}
                        </button>
                    ))}
                </div>
            )}

            <div className="p-4 bg-white/80 border-t backdrop-blur-lg">
              <form onSubmit={handleFormSubmit} className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={handleTeachClick}
                    className="p-3 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-colors"
                    title="Teach the bot a new fact or correction"
                >
                    <BrainIcon />
                </button>
                <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="border border-slate-300 p-4 w-full rounded-full focus:ring-2 focus:ring-indigo-500 focus:outline-none transition pr-14"
                      placeholder="Ask a question or teach me something..."
                      disabled={!isReadyToChat}
                    />
                    {message.length > 5 && (
                        <button 
                            type="button" 
                            onClick={getSuggestions} 
                            disabled={loadingSuggestions}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200"
                            title="Suggest related questions"
                        >
                           {loadingSuggestions ? <span className="animate-spin">✨</span> : '✨'}
                        </button>
                    )}
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loadingSend || !message.trim()}
                >
                  <SendIcon />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
