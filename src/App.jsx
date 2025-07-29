// src/App.jsx

import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import axios from "axios";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut,
    sendEmailVerification,
    getIdToken
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getDatabase, ref, onValue, onDisconnect, set } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAA6U-oPKefpOdy6IsS6wXVmjgCTj3Jlow",
  authDomain: "sop-assistant-9dc2a.firebaseapp.com",
  projectId: "sop-assistant-9dc2a",
  storageBucket: "sop-assistant-9dc2a.appspot.com",
  messagingSenderId: "672105722476",
  appId: "1:672105722476:web:1d88461fdf6631b168de49",
  databaseURL: "https://sop-assistant-9dc2a-default-rtdb.firebaseio.com" 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// --- SVG Icons ---
const UploadIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>;
const SendIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>;
const UserAvatar = ({ userData }) => <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm flex-shrink-0">{(userData?.fullName || 'U').charAt(0)}</div>;
const AssistantAvatar = () => <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>;

// --- Application State Context ---
const AppContext = createContext();

const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState('login');
    const [chat, setChat] = useState([]);
    const [sopExists, setSopExists] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
            } else {
                setUserData(null);
                setChat([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const value = { user, userData, setUserData, loading, page, setPage, chat, setChat, sopExists, setSopExists };
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const useApp = () => useContext(AppContext);

// --- Main App Component (Router) ---
export default function App() {
    return (
        <AppProvider>
            <AppRouter />
        </AppProvider>
    );
}

const AppRouter = () => {
    const { user, loading, page, setPage, userData } = useApp();

    useEffect(() => {
        if (!loading) {
            if (user) {
                if (user.emailVerified) {
                    if (['login', 'signup', 'verify-email'].includes(page)) setPage('chat');
                } else {
                    if (page !== 'verify-email') setPage('verify-email');
                }
            } else {
                if (page !== 'signup') setPage('login');
            }
        }
    }, [user, loading, page, setPage]);

    if (loading) return <div className="flex items-center justify-center h-screen bg-slate-100">Loading...</div>;

    const renderPage = () => {
        if (user && !user.emailVerified) return <VerifyEmailPage />;
        switch (page) {
            case 'signup': return <SignUpPage setPage={setPage} />;
            case 'chat': return <ChatPage />;
            case 'profile': return <ProfilePage />;
            case 'pricing': return <PricingPage />;
            case 'admin': return userData?.role === 'admin' ? <AdminPage /> : <ChatPage />;
            default: return <LoginPage setPage={setPage} />;
        }
    };
    return <div className="flex flex-col h-screen bg-slate-50 font-sans">{renderPage()}</div>;
};

// --- Page Components ---
// ... (LoginPage, SignUpPage, VerifyEmailPage, ProfilePage, PricingPage, AdminPage remain the same)

const ChatPage = () => {
    const { user, userData, setUserData, chat, setChat, sopExists, setSopExists, setPage } = useApp();
    const isAdmin = userData?.role === 'admin';
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [message, setMessage] = useState("");
    const [loadingUpload, setLoadingUpload] = useState(false);
    const [loadingSend, setLoadingSend] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(true);
    
    const API_URL = "https://sop-chat-backend.onrender.com";
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const checkSopStatus = async () => {
            if (!user) return;
            setLoadingStatus(true);
            try {
                const token = await getIdToken(user);
                const res = await axios.get(`${API_URL}/status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSopExists(res.data.sop_exists);
            } catch (error) {
                console.error("Could not check SOP status", error);
                setSopExists(false);
            } finally {
                setLoadingStatus(false);
            }
        };
        checkSopStatus();
    }, [user, setSopExists]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
        }
    };

    const handleUpload = async () => {
        if (!file || !user) return;
        setLoadingUpload(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = await getIdToken(user);
            await axios.post(`${API_URL}/upload/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            setSopExists(true);
            setFileName("");
            setFile(null);
            setChat([{role: 'assistant', text: `Successfully processed ${fileName}. You can now ask questions about it.`}]);
        } catch (error) {
            console.error("File upload failed", error);
            setChat([{role: 'assistant', text: "Sorry, there was an error processing your file."}]);
        } finally {
            setLoadingUpload(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !user) return;

        const userMsg = { role: "user", text: message };
        setChat(prev => [...prev, userMsg]);
        const currentMessage = message;
        setMessage('');
        setLoadingSend(true);

        try {
            const token = await getIdToken(user);
            const history = chat.reduce((acc, curr, i) => {
                if (curr.role === 'user' && chat[i + 1]?.role === 'assistant') {
                    acc.push([curr.text, chat[i + 1].text]);
                }
                return acc;
            }, []);

            const res = await axios.post(`${API_URL}/chat/`, 
                { prompt: currentMessage, history },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const assistantMsg = { role: "assistant", text: res.data.response };
            setChat(prev => [...prev, assistantMsg]);

            if (!isAdmin) {
                const newCredits = (userData.credits || 0) - 1;
                await updateDoc(doc(db, "users", user.uid), { credits: newCredits });
                setUserData(prev => ({...prev, credits: newCredits}));
            }

        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to get response.";
            setChat(prev => [...prev, { role: 'assistant', text: `Error: ${errorMsg}` }]);
        } finally {
            setLoadingSend(false);
        }
    };

    if (!isAdmin && userData && userData.credits <= 0) {
        setPage('pricing');
        return null;
    }

    return (
        <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-1 w-full mx-auto flex flex-col items-center overflow-hidden">
                <div className="flex flex-col flex-1 bg-white/50 w-full max-w-5xl mt-4 rounded-t-2xl shadow-lg overflow-hidden">
                     <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                        {loadingStatus ? (
                             <div className="text-center p-8"><p className="animate-pulse">Checking for documents...</p></div>
                        ) : !sopExists ? (
                            <div className="text-center p-8 bg-slate-100 rounded-lg">
                                <h3 className="font-semibold text-lg mb-2">Welcome, {userData?.fullName}!</h3>
                                <p className="text-slate-600 mb-4">To get started, please upload an SOP document.</p>
                                <div className="flex items-center justify-center gap-2">
                                    <label className="cursor-pointer bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border hover:bg-slate-50 transition-colors">
                                      {fileName || "Choose a file..."}
                                      <input type="file" accept=".xlsx,.xls" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                    </label>
                                    <button onClick={handleUpload} disabled={!file || loadingUpload} className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                        {loadingUpload ? "Uploading..." : "Upload"}
                                    </button>
                                </div>
                            </div>
                        ) : chat.length === 0 ? (
                             <div className="text-center p-8 text-slate-500">Your documents are ready. Ask a question to begin.</div>
                        ) : null}
                        
                        {chat.map((c, i) => (
                            <div key={i} className={`flex items-start gap-4 ${c.role === "user" ? "justify-end" : "justify-start"}`}>
                                {c.role === 'assistant' && <AssistantAvatar />}
                                <div className={`p-4 rounded-2xl max-w-2xl shadow-md ${c.role === "user" ? "bg-indigo-500 text-white rounded-br-none" : "bg-slate-100 text-slate-800 rounded-bl-none"}`}>
                                    {c.text}
                                </div>
                                {c.role === 'user' && <UserAvatar userData={userData} />}
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
                     <div className="p-4 bg-white/80 border-t">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                            <input
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              className="border border-slate-300 p-4 w-full rounded-full focus:ring-2 focus:ring-indigo-500"
                              placeholder={sopExists ? "Ask a question..." : "Please upload a document to begin"}
                              disabled={!sopExists || loadingSend}
                            />
                            <button type="submit" disabled={!sopExists || loadingSend || !message.trim()} className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:opacity-50">
                                <SendIcon />
                            </button>
                        </form>
                         <p className="text-right mt-2 text-sm font-semibold text-indigo-600">Credits Remaining: {isAdmin ? 'Unlimited' : userData?.credits}</p>
                     </div>
                </div>
            </main>
        </div>
    );
};

const Header = () => {
    const { setPage, userData } = useApp();
    const handleLogout = async () => {
        await signOut(auth);
        setPage('login');
    };

    return (
        <header className="bg-white/80 backdrop-blur-lg shadow-sm p-4 z-10 sticky top-0">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Logo />
                    <h1 className="text-2xl font-bold text-slate-800">SOP Assistant</h1>
                </div>
                <nav className="flex items-center space-x-6">
                    {userData?.role === 'admin' && (
                        <button onClick={() => setPage('admin')} className="font-semibold text-red-600 hover:text-red-700">Admin</button>
                    )}
                    <button onClick={() => setPage('chat')} className="font-semibold text-slate-600 hover:text-indigo-600">Chat</button>
                    <button onClick={() => setPage('profile')} className="font-semibold text-slate-600 hover:text-indigo-600">Profile</button>
                    <button onClick={() => setPage('pricing')} className="font-semibold text-slate-600 hover:text-indigo-600">Pricing</button>
                    <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-md text-sm font-semibold">Logout</button>
                </nav>
            </div>
        </header>
    );
};
