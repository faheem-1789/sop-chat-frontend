// src/App.jsx

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

// --- Helper Components ---

// Icon for the upload button
const UploadIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
  </svg>
);

// Icon for the send button
const SendIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
  </svg>
);

// A simple notification component for feedback
const Notification = ({ message, type, onDismiss }) => {
  if (!message) return null;
  const baseClasses = "p-4 rounded-lg mb-4 text-center text-white shadow-lg transition-opacity duration-300";
  const typeClasses = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000); // Auto-dismiss after 5 seconds
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      {message}
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

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // API endpoint - change this if your backend is hosted elsewhere
  const API_URL = "https://sop-chat-backend.onrender.com";

  // Automatically scroll to the latest message
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
      const res = await axios.post(`https://sop-chat-backend.onrender.com/upload/`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showNotification(res.data.message || "File processed successfully!", "success");
      setIsReadyToChat(true);
      setChat([]); // Clear previous chat on new upload
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Upload failed. Please check the file or try again.";
      showNotification(errorMsg);
      setIsReadyToChat(false);
    } finally {
      setLoadingUpload(false);
      setFile(null); // Reset file input after upload
      setFileName("");
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || loadingSend) return;
    
    const userMsg = { role: "user", text: message };
    setChat((prev) => [...prev, userMsg]);
    setMessage("");
    setLoadingSend(true);

    try {
      const res = await axios.post(`https://sop-chat-backend.onrender.com/chat/`, { prompt: message });
      const assistantMsg = { role: "assistant", text: res.data.response };
      setChat((prev) => [...prev, userMsg, assistantMsg]);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to get response. Please try again.";
      const errorBubble = { role: "assistant", text: `Error: ${errorMsg}` };
      setChat((prev) => [...prev, userMsg, errorBubble]);
    } finally {
      setLoadingSend(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-white shadow-md p-4 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">SOP Chat Assistant</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col">
        <Notification 
          message={notification.message} 
          type={notification.type}
          onDismiss={() => setNotification({ message: '', type: '' })}
        />

        {/* Upload Section */}
        {!isReadyToChat && (
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Get Started</h2>
            <p className="text-gray-500 mb-6">Upload an SOP file (.xlsx or .xls) to begin chatting.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <label className="cursor-pointer bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors w-full sm:w-auto text-center">
                {fileName || "Choose a file..."}
                <input type="file" accept=".xlsx,.xls" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              </label>
              <button
                className="bg-blue-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full sm:w-auto"
                onClick={uploadFile}
                disabled={loadingUpload || !file}
              >
                <UploadIcon />
                {loadingUpload ? "Processing..." : "Upload & Start"}
              </button>
            </div>
          </div>
        )}

        {/* Chat Section */}
        {isReadyToChat && (
          <div className="flex flex-col flex-1 bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Chat Messages */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              {chat.length === 0 && (
                <div className="text-center text-gray-500">
                  <p>File processed. You can now ask questions about the SOP.</p>
                </div>
              )}
              {chat.map((c, i) => (
                <div key={i} className={`flex ${c.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-3 rounded-xl max-w-lg whitespace-pre-wrap ${c.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}>
                    {c.text}
                  </div>
                </div>
              ))}
              {loadingSend && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-xl bg-gray-200 text-gray-800">
                    <span className="animate-pulse">Typing...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-gray-50 border-t">
              <form onSubmit={sendMessage} className="flex items-center gap-4">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="border p-3 flex-1 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  placeholder="Ask a question about the SOP..."
                  disabled={!isReadyToChat}
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
