import React, { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);

  const uploadFile = async () => {
    if (!file) return alert("Please select a file first.");
    const form = new FormData();
    form.append("file", file);

    try {
      setLoadingUpload(true);
      await axios.post("https://sop-chat-backend.onrender.com/upload/", form, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      alert("Uploaded & processed successfully!");
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed. Please check file format or try again.");
    } finally {
      setLoadingUpload(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    const userMsg = { role: "user", text: message };
    setChat((prev) => [...prev, userMsg]);
    setMessage("");
    try {
      setLoadingSend(true);
      const res = await axios.post("https://sop-chat-backend.onrender.com/chat/", {
        prompt: message
      });
      const assistantMsg = { role: "assistant", text: res.data.response };
      setChat((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat failed", err);
      alert("Failed to get response. Please try again.");
    } finally {
      setLoadingSend(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">SOP Chat Assistant</h1>

      <div className="mb-4 space-x-2">
        <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files[0])} />
        <button
          className="bg-blue-500 text-white px-4 py-1 rounded disabled:opacity-50"
          onClick={uploadFile}
          disabled={loadingUpload}
        >
          {loadingUpload ? "Uploading..." : "Upload"}
        </button>
      </div>

      <div className="mt-6 space-y-2 border p-2 rounded h-64 overflow-y-auto bg-gray-50">
        {chat.map((c, i) => (
          <div key={i} className={c.role === "user" ? "text-right" : "text-left"}>
            <div className={`inline-block p-2 rounded-lg max-w-xs ${c.role === "user" ? "bg-blue-200" : "bg-gray-300"}`}>
              {c.text}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border p-2 flex-1 rounded"
          placeholder="Ask something..."
        />
        <button
          className="bg-green-500 text-white px-4 py-1 rounded disabled:opacity-50"
          onClick={sendMessage}
          disabled={loadingSend}
        >
          {loadingSend ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;
