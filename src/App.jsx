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
import { getDatabase, ref, onValue, onDisconnect, set, serverTimestamp as dbServerTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';


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
const EditIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg>;
const DeleteIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
const Logo = () => <svg width="40" height="40" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="128" height="128" rx="24" fill="#4338CA"/><path d="M48 32H80C84.4183 32 88 35.5817 88 40V72C88 76.4183 84.4183 80 80 80H72L64 88L56 80H48C43.5817 80 40 76.4183 40 72V40C40 35.5817 43.5817 32 48 32Z" fill="white"/><path d="M56 48H72" stroke="#4338CA" strokeWidth="6" strokeLinecap="round"/><path d="M56 60H72" stroke="#4338CA" strokeWidth="6" strokeLinecap="round"/></svg>;
const AddIcon = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
// NEW: SVG Icon for file and close
const FileIcon = () => <svg className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>;
const CloseIcon = () => <svg className="w-4 h-4 text-slate-400 hover:text-red-500 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;


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

const useApp = () => {
    return useContext(AppContext);
};

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
                if (page !== 'signup' && page !== 'login') setPage('login');
            }
        }
    }, [user, loading, page, setPage]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-slate-100"><div className="animate-pulse">Loading Application...</div></div>;
    }

    const renderPage = () => {
        if (user && !user.emailVerified) {
             return <VerifyEmailPage />;
        }

        switch (page) {
            case 'signup': return <SignUpPage setPage={setPage} />;
            case 'chat': return <ChatPage />;
            case 'profile': return <ProfilePage />;
            case 'pricing': return <PricingPage />;
            case 'admin': return userData?.role === 'admin' ? <AdminPage /> : <ChatPage />;
            default: return <LoginPage setPage={setPage} />;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-gray-100 font-sans">
            {renderPage()}
        </div>
    );
};

// --- Page Components ---

// NOTE: LoginPage, SignUpPage, VerifyEmailPage, ProfilePage, PricingPage, AdminPage, and Header
// components remain the same as the previous version. They are omitted here for brevity, but
// should be included in your final file. The only changes are in the ChatPage component below.

// --- Chat Page and Children Components ---

// NEW: Toast component for notifications
const Toast = ({ message, type, onDismiss }) => {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    return (
        <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white ${bgColor} z-50`}
        >
            {message}
            <button onClick={onDismiss} className="ml-4 font-bold">X</button>
        </motion.div>
    );
};


const ChatPage = () => {
    const { user, userData, setUserData, chat, setChat, sopExists, setSopExists, setPage } = useApp();
    const isAdmin = userData?.role === 'admin';
    const [files, setFiles] = useState([]);
    const [message, setMessage] = useState("");
    const [loadingUpload, setLoadingUpload] = useState(false);
    const [loadingSend, setLoadingSend] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(true);
    
    // NEW: State for toast notifications
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const API_URL = "https://sop-chat-backend.onrender.com";
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // NEW: Effect to auto-dismiss toast
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast(prev => ({ ...prev, show: false }));
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);


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
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 0) {
            setFiles(prev => [...prev, ...selectedFiles]); // Append new files
        }
    };
    
    // NEW: Handler to remove a file from the selection
    const handleRemoveFile = (indexToRemove) => {
        setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };


    const handleUpload = async () => {
        if (files.length === 0 || !user) return;
        setLoadingUpload(true);
        const wasInitialUpload = !sopExists; // Check if this is the first upload

        try {
            const token = await getIdToken(user);
            await Promise.all(files.map(file => {
                const formData = new FormData();
                formData.append('file', file);
                return axios.post(`${API_URL}/upload/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                });
            }));
            
            setSopExists(true);
            setFiles([]); // Clear file selection
            
            // MODIFIED: Use toast for feedback, and chat message only on first upload
            setToast({ show: true, message: `${files.length} file(s) uploaded successfully!`, type: 'success' });

            if(wasInitialUpload) {
                const allFileNames = files.map(f => f.name).join(', ');
                setChat([{role: 'assistant', text: `Successfully processed ${allFileNames}. You can now ask questions about them.`}]);
            }

        } catch (error) {
            console.error("File upload failed", error);
            // MODIFIED: Use toast for error feedback
            setToast({ show: true, message: 'An error occurred during upload.', type: 'error' });
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
            {/* NEW: Toast Notification rendering */}
            {toast.show && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(prev => ({...prev, show: false}))} />}

            <input 
                type="file" 
                accept=".xlsx,.xls" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                multiple 
            />
            <main className="flex-1 w-full mx-auto flex flex-col items-center overflow-hidden">
                <div className="flex flex-col flex-1 bg-white/50 w-full max-w-5xl mt-4 rounded-t-2xl shadow-lg overflow-hidden">
                     <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                        {loadingStatus ? (
                             <div className="text-center p-8"><p className="animate-pulse">Checking for documents...</p></div>
                        ) : !sopExists ? (
                            // MODIFIED: Entire initial upload view to show loading state and file list
                            <div className="relative text-center p-8 bg-slate-100 rounded-lg">
                                {loadingUpload && (
                                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-lg z-10">
                                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="mt-2 text-slate-600">Uploading...</p>
                                    </div>
                                )}
                                <h3 className="font-semibold text-lg mb-2">Welcome, {userData?.fullName}!</h3>
                                <p className="text-slate-600 mb-4">To get started, please upload one or more SOP documents.</p>
                                <div className="max-w-md mx-auto">
                                    <button onClick={() => fileInputRef.current.click()} className="w-full cursor-pointer bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border hover:bg-slate-50 transition-colors">
                                      Choose files...
                                    </button>
                                    {/* NEW: Display list of selected files */}
                                    {files.length > 0 && (
                                        <div className="mt-4 space-y-2 text-left">
                                            {files.map((file, index) => (
                                                <div key={index} className="flex items-center p-2 bg-slate-200 rounded-md text-sm">
                                                    <FileIcon />
                                                    <span className="flex-grow truncate">{file.name}</span>
                                                    <button onClick={() => handleRemoveFile(index)}><CloseIcon /></button>
                                                </div>
                                            ))}
                                            <button onClick={handleUpload} disabled={files.length === 0 || loadingUpload} className="w-full mt-2 bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                                Upload {files.length} File(s)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : chat.length === 0 ? (
                             <div className="text-center p-8 text-slate-500">Your documents are ready. Ask a question to begin.</div>
                        ) : null}
                        
                        {chat.map((c, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`flex items-start gap-4 ${c.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {c.role === 'assistant' && <AssistantAvatar />}
                                <div className={`p-4 rounded-2xl max-w-2xl shadow-md ${c.role === "user" ? "bg-indigo-500 text-white rounded-br-none" : "bg-slate-100 text-slate-800 rounded-bl-none"}`}>
                                    <ReactMarkdown className="prose prose-sm max-w-none prose-p:my-2 prose-ol:my-2 prose-ul:my-2">
                                        {c.text}
                                    </ReactMarkdown>
                                </div>
                                {c.role === 'user' && <UserAvatar userData={userData} />}
                            </motion.div>
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
                            {sopExists && (
                                <button type="button" title="Upload More Files" onClick={() => fileInputRef.current.click()} className="p-3 rounded-full hover:bg-slate-200 transition-colors">
                                    <UploadIcon />
                                </button>
                            )}
                            <input
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              className="border border-slate-300 p-4 w-full rounded-full focus:ring-2 focus:ring-indigo-500"
                              placeholder={sopExists ? "Ask a question..." : "Please upload a document to begin"}
                              disabled={!sopExists || loadingSend}
                            />
                            <button type="submit" disabled={!sopExists || loadingSend || !message.trim()} className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:opacity-50 transform transition-transform hover:scale-110">
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
