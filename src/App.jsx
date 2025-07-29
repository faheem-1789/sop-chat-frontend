// App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      // Auto-select previously uploaded file logic could go here
    }
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', user.uid);

    try {
      const res = await axios.post('https://sop-chat-backend.onrender.com/upload/', formData);
      console.log(res.data);
    } catch (error) {
      console.error('Upload failed', error);
    }
  };

  const handlePrompt = async () => {
    if (!prompt || !user) return;
    try {
      const res = await axios.post('https://sop-chat-backend.onrender.com/chat/', {
        prompt,
        user_id: user.uid,
      });
      const botReply = res.data.response;
      // Format response into numbered list format
      const lines = botReply.split(/(?<=\.|\!|\?)\s+/g);
      const formatted = lines.map((line, idx) => `${idx + 1}. ${line}`).join('\n');
      setResponse(formatted);
    } catch (error) {
      console.error('Prompt failed', error);
    }
  };

  return (
    <div className="App">
      <h1>SOP Chat Assistant</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload SOP</button>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask a question..."
      />
      <button onClick={handlePrompt}>Send</button>
      <pre>{response}</pre>
    </div>
  );
}

export default App;
