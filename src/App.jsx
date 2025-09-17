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
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, addDoc, query, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';


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
const FileIcon = () => <svg className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>;
const CloseIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;
const MenuIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>;
const SpinnerIcon = () => <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const ChatBubbleIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>;


// --- Application State Context ---
const AppContext = createContext();

const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(() => localStorage.getItem('currentPage') || 'home');
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [chat, setChat] = useState([]);
    const [sopExists, setSopExists] = useState(false);
    const [isStartingNewChat, setIsStartingNewChat] = useState(false);

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
                setActiveConversationId(null);
                localStorage.setItem('currentPage', 'home');
                setPage('home');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        localStorage.setItem('currentPage', page);
    }, [page]);

    const value = { user, userData, setUserData, loading, page, setPage, chat, setChat, sopExists, setSopExists, activeConversationId, setActiveConversationId, isStartingNewChat, setIsStartingNewChat };
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
                if (!user.emailVerified) {
                    setPage('verify-email');
                } else if (['login', 'signup', 'verify-email'].includes(page)) {
                    setPage('home');
                }
            } else {
                const appPages = ['chat', 'profile', 'pricing', 'admin'];
                if (appPages.includes(page)) {
                    setPage('login');
                }
            }
        }
    }, [user, loading, page, setPage]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-slate-100"><div className="animate-pulse">Loading Application...</div></div>;
    }

    const renderPage = () => {
        let PageComponent;
        if (user && page === 'home') {
            PageComponent = LoggedInDashboard;
        } else {
            switch (page) {
                case 'home': PageComponent = HomePage; break;
                case 'about': PageComponent = AboutPage; break;
                case 'contact': PageComponent = ContactPage; break;
                case 'privacy': PageComponent = PrivacyPolicyPage; break;
                case 'terms': PageComponent = TermsOfServicePage; break;
                case 'blog': PageComponent = BlogPage; break;
                case 'faq': PageComponent = FAQPage; break;
                case 'login': PageComponent = LoginPage; break;
                case 'signup': PageComponent = SignUpPage; break;
                case 'verify-email': PageComponent = VerifyEmailPage; break;
                case 'chat': PageComponent = user ? ChatPage : LoginPage; break;
                case 'profile': PageComponent = user ? ProfilePage : LoginPage; break;
                case 'pricing': PageComponent = user ? PricingPage : LoginPage; break;
                case 'admin': PageComponent = user && userData?.role === 'admin' ? AdminPage : ChatPage; break;
                default: PageComponent = HomePage;
            }
        }

        return (
             <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
                {user ? <LoggedInHeader /> : <Header />}
                <main className="flex-grow flex flex-col">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={page}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex-grow flex flex-col"
                        >
                            <PageComponent />
                        </motion.div>
                    </AnimatePresence>
                </main>
                {!user && <Footer />}
            </div>
        );
    };

    return renderPage();
};

// --- Page Components ---

const HomePage = () => {
    const { setPage } = useApp();
    return (
        <div className="text-center py-20 px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
                AI Document Assistant: Chat with Your PDFs, Excel, and SOPs Instantly
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600">
                FileSense reads and understands your business documents, providing immediate, accurate answers to your most complex questions. Stop searching, start knowing.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={() => setPage('signup')} className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-transform transform hover:scale-105">
                    Get Started for Free
                </button>
                <button onClick={() => setPage('login')} className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 transition-transform transform hover:scale-105">
                    Login
                </button>
            </div>
        </div>
    );
};

const LoggedInDashboard = () => {
    const { userData, setPage, sopExists } = useApp();
    return (
        <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
            <div className="w-full max-w-4xl">
                <h1 className="text-4xl font-bold text-slate-800">Welcome back, {userData?.fullName}!</h1>
                <p className="mt-2 text-lg text-slate-600">Your AI assistant is ready. What would you like to do?</p>
                
                <div className="mt-8 text-center">
                    <button 
                        onClick={() => setPage('chat')} 
                        className="px-10 py-4 bg-indigo-600 text-white font-semibold text-lg rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-transform transform hover:scale-105">
                        Go to Your Chat Assistant
                    </button>
                </div>

                <div className="mt-12 grid md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="font-bold text-slate-800 text-lg">Account Status</h3>
                        <div className="mt-4 space-y-3 text-slate-600">
                            <p><strong>Plan:</strong> <span className="capitalize font-medium text-indigo-600">{userData?.version}</span></p>
                            <p><strong>Credits Remaining:</strong> <span className="font-medium text-indigo-600">{userData?.version === 'pro' ? 'Unlimited' : userData?.credits}</span></p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="font-bold text-slate-800 text-lg">Knowledge Base</h3>
                         <div className="mt-4 space-y-3 text-slate-600">
                            <p><strong>Status:</strong> 
                                <span className={`font-medium ${sopExists ? 'text-green-600' : 'text-amber-600'}`}>
                                    {sopExists ? ' Ready' : ' No Documents Uploaded'}
                                </span>
                            </p>
                            <button onClick={() => setPage('chat')} className="text-sm font-semibold text-indigo-600 hover:underline">
                                {sopExists ? 'Upload More Documents →' : 'Upload Your First Document →'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GenericPage = ({ title, children, className }) => (
    <div className={`max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
        <h1 className="text-3xl font-bold text-slate-800 mb-8 border-b pb-4">{title}</h1>
        <div className="prose prose-lg max-w-none text-slate-700">
            {children}
        </div>
    </div>
);

const AboutPage = () => <GenericPage title="About Us">{/* ... */}</GenericPage>;
const ContactPage = () => <GenericPage title="Contact Us">{/* ... */}</GenericPage>;
const PrivacyPolicyPage = () => <GenericPage title="Privacy Policy">{/* ... */}</GenericPage>;
const TermsOfServicePage = () => <GenericPage title="Terms of Service">{/* ... */}</GenericPage>;
const FAQPage = () => <GenericPage title="Frequently Asked Questions">{/* ... */}</GenericPage>;

const blogPostsData = [ /* ... blog posts ... */ ];

const BlogPage = () => { /* ... blog page logic ... */ };

const LoginPage = () => { /* ... login page logic ... */ };
const SignUpPage = () => { /* ... sign up page logic ... */ };
const VerifyEmailPage = () => { /* ... verify email page logic ... */ };
const PricingPage = () => { /* ... pricing page logic ... */ };
const ProfilePage = () => { /* ... profile page logic ... */ };

const AdminPage = () => {
    const { user } = useApp();
    const [users, setUsers] = useState([]);
    const [onlineStatus, setOnlineStatus] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!user) return;
            setLoading(true);
            setError('');
            try {
                const token = await getIdToken(user);
                const res = await axios.get("https://sop-chat-backend.onrender.com/admin/users", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsers(res.data);
            } catch (err) {
                setError("Could not load user data.");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [user]);

    useEffect(() => {
        const statusRef = ref(rtdb, 'status/');
        const unsubscribe = onValue(statusRef, (snapshot) => {
            const data = snapshot.val() || {};
            setOnlineStatus(data);
        });
        return () => unsubscribe();
    }, []);

    // ... admin page handlers ...

    return (
        <div className="flex-1 p-8 bg-slate-100">
            <h2 className="text-3xl font-bold">Admin Dashboard</h2>
            {/* ... rest of admin page JSX ... */}
             <table className="w-full text-left">
                <thead>
                    <tr className="border-b">
                        <th className="p-2">Status</th>
                        {/* ... other headers ... */}
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.uid} className="border-b hover:bg-slate-50">
                            <td className="p-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${onlineStatus[u.uid]?.state === 'online' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                                    {onlineStatus[u.uid]?.state === 'online' ? 'Online' : 'Offline'}
                                </span>
                            </td>
                            {/* ... other user data cells ... */}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ChatPage = () => {
    const { user, isStartingNewChat, setIsStartingNewChat, activeConversationId, setActiveConversationId, setChat } = useApp();
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);

    useEffect(() => {
        if (user && !activeConversationId && !isStartingNewChat) {
            const fetchConversations = async () => {
                setLoadingConversations(true);
                const convRef = collection(db, "users", user.uid, "conversations");
                const q = query(convRef, orderBy("lastUpdated", "desc"));
                try {
                    const querySnapshot = await getDocs(q);
                    const convList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setConversations(convList);
                } catch (error) {
                    console.error("Firestore Query Failed. This is likely an indexing issue.", error);
                }
                setLoadingConversations(false);
            };
            fetchConversations();
        }
    }, [user, activeConversationId, isStartingNewChat]);

    const startNewConversation = () => {
        setActiveConversationId(null);
        setChat([]);
        setIsStartingNewChat(true);
    };

    const selectConversation = (conversation) => {
        setActiveConversationId(conversation.id);
        setChat(conversation.messages || []);
        setIsStartingNewChat(false);
    };
    
    if (!activeConversationId && !isStartingNewChat) {
        return (
            <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
                <div className="w-full max-w-4xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-slate-800">Your Conversations</h2>
                        <button onClick={startNewConversation} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700">
                            <AddIcon /> New Chat
                        </button>
                    </div>
                    {loadingConversations ? (
                        <p>Loading conversations...</p>
                    ) : conversations.length > 0 ? (
                        <div className="space-y-4">
                            {conversations.map(conv => (
                                <div key={conv.id} onClick={() => selectConversation(conv)} className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl cursor-pointer transition-shadow flex items-center">
                                    <ChatBubbleIcon />
                                    <div>
                                        <p className="font-semibold text-slate-800">{conv.title}</p>
                                        <p className="text-sm text-slate-500">
                                            Last updated: {conv.lastUpdated ? new Date(conv.lastUpdated.toDate()).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-slate-50 rounded-lg">
                            <p className="text-slate-600">You have no saved conversations.</p>
                            <button onClick={startNewConversation} className="mt-4 text-indigo-600 font-semibold">Start your first one now &rarr;</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return <ChatPageContent />;
};

const ChatPageContent = () => {
    // ... all chat logic and JSX as before
    const { user, userData, setUserData, chat, setChat, sopExists, setSopExists, activeConversationId, setActiveConversationId, setIsStartingNewChat } = useApp();
    
    // ... the rest of the existing ChatPageContent component
    return (
        <div className="flex flex-1 overflow-hidden bg-slate-100">
            <main className="flex-1 w-full mx-auto flex flex-col items-center overflow-hidden">
                <div className="flex flex-col flex-1 bg-white/50 w-full max-w-5xl my-4 rounded-2xl shadow-lg overflow-hidden">
                       <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                            {(activeConversationId || isStartingNewChat) && (
                                <button onClick={() => { setActiveConversationId(null); setIsStartingNewChat(false); }} className="text-sm font-semibold text-indigo-600 hover:underline mb-4">&larr; Back to all conversations</button>
                            )}
                            {/* ... rest of chat UI */}
                        </div>
                        {/* ... chat input form */}
                </div>
            </main>
        </div>
    );
};

// --- Headers & Footers ---
const Header = () => { /* ... */ };
const LoggedInHeader = () => { /* ... */ };
const Footer = () => { /* ... */ };
