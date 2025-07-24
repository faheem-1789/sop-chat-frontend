import React, { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");

  const uploadFile = async () => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    await axios.post("https://sop-chat-backend.onrender.com/upload/", form);
    alert("Uploaded & processed!");
  };

  const sendMessage = async () => {
    setChat([...chat, { role: "user", text: message }]);
    const res = await axios.post("https://sop-chat-backend.onrender.com/chat/", {
      prompt: message,
    });
    setChat((prev) => [...prev, { role: "assistant", text: res.data.response }]);
    setMessage("");
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">SOP Chat Assistant</h1>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button className="btn" onClick={uploadFile}>Upload</button>

      <div className="mt-6 space-y-2">
        {chat.map((c, i) => (
          <div key={i} className={c.role === "user" ? "text-right" : "text-left"}>
            <div className={`inline-block p-2 rounded ${c.role === "user" ? "bg-blue-200" : "bg-gray-200"}`}>
              {c.text}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border p-2 flex-1"
          placeholder="Ask something..."
        />
        <button className="btn" onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;
