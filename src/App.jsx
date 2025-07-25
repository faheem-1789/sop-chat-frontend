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
            <p className="text-slate-500 mb-8 max-w-md">Upload an SOP file (.xlsx or .xls) to begin an intelligent conversation with your documents.</p>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg">
                <label className="cursor-pointer bg-slate-100 text-slate-700 font-semibold py-3 px-5 rounded-lg hover:bg-slate-200 transition-colors w-full block mb-4">
                  {fileName || "Choose a file..."}
                  <input type="file" accept=".xlsx,.xls" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </label>
                <button
                  className="w-full bg-indigo-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  onClick={uploadFile}
                  disabled={loadingUpload || !file}
                >
                  <UploadIcon />
                  {loadingUpload ? "Processing..." : "Upload & Start"}
                </button>
            </div>
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
```
