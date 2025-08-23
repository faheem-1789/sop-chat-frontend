// src/App.jsx

import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import axios from "axios";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    getIdToken
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, addDoc, query, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
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

// --- AdSense Verification Component ---
const AdSenseScript = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7478653994670887";
    script.async = true;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
};


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
    // Use localStorage to persist page state on refresh
    const [page, setPage] = useState(() => localStorage.getItem('currentPage') || 'home');
    const [activeConversationId, setActiveConversationId] = useState(null);
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
                setActiveConversationId(null);
                // On logout, reset page to home
                localStorage.setItem('currentPage', 'home');
                setPage('home');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Effect to update localStorage whenever the page changes
    useEffect(() => {
        localStorage.setItem('currentPage', page);
    }, [page]);

    const value = { user, userData, setUserData, loading, page, setPage, chat, setChat, sopExists, setSopExists, activeConversationId, setActiveConversationId };
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const useApp = () => {
    return useContext(AppContext);
};

// --- Main App Component (Router) ---
export default function App() {
    return (
        <AppProvider>
            <AdSenseScript />
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
                    // If user is logged in and on an auth page, redirect to home (which will show the dashboard)
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
        const pageComponent = () => {
            // If user is logged in and on the home page, show the dashboard instead
            if (user && page === 'home') {
                return <LoggedInDashboard />;
            }
            switch (page) {
                case 'home': return <HomePage />;
                case 'about': return <AboutPage />;
                case 'contact': return <ContactPage />;
                case 'privacy': return <PrivacyPolicyPage />;
                case 'terms': return <TermsOfServicePage />;
                case 'blog': return <BlogPage />;
                case 'faq': return <FAQPage />;
                case 'login': return <LoginPage />;
                case 'signup': return <SignUpPage />;
                case 'verify-email': return <VerifyEmailPage />;
                case 'chat': return user ? <ChatPage /> : <LoginPage />;
                case 'profile': return user ? <ProfilePage /> : <LoginPage />;
                case 'pricing': return user ? <PricingPage /> : <LoginPage />;
                case 'admin': return user && userData?.role === 'admin' ? <AdminPage /> : <ChatPage />;
                default: return <HomePage />;
            }
        };

        return (
             <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
                {user ? <LoggedInHeader /> : <Header />}
                <main className="flex-grow flex flex-col">
                    {pageComponent()}
                </main>
                {!user && <Footer />}
            </div>
        );
    };

    return <AnimatePresence mode="wait">{renderPage()}</AnimatePresence>;
};


// --- Page Components ---

const HomePage = () => {
    const { setPage } = useApp();
    return (
        <div className="text-center py-20 px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
                    Unlock Insights from Your Documents Instantly
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600">
                    FileSense reads and understands your business documents—PDFs, PowerPoints, Excel files, and more—providing immediate, accurate answers to your most complex questions.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={() => setPage('signup')} className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-transform transform hover:scale-105">
                        Get Started for Free
                    </button>
                    <button onClick={() => setPage('login')} className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 transition-transform transform hover:scale-105">
                        Login
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const LoggedInDashboard = () => {
    const { userData, setPage, sopExists } = useApp();

    return (
        <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
            <div className="w-full max-w-4xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
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
                </motion.div>
            </div>
        </div>
    );
};


// --- Static & Blog Pages ---
const GenericPage = ({ title, children }) => (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold text-slate-800 mb-8 border-b pb-4">{title}</h1>
            <div className="prose prose-lg max-w-none text-slate-700">
                {children}
            </div>
        </motion.div>
    </div>
);

// ... (Rest of the static pages like AboutPage, ContactPage, etc. remain unchanged)
const AboutPage = () => <GenericPage title="About Us"><p>Welcome to FileSense. Our mission is to revolutionize how businesses interact with their internal documentation, making knowledge accessible and actionable. We believe that by leveraging the power of AI, we can save teams countless hours, reduce errors, and improve operational efficiency. Our platform is built with security and simplicity in mind, ensuring that your sensitive data is protected while providing an intuitive user experience.</p></GenericPage>;
const ContactPage = () => <GenericPage title="Contact Us"><p>Have questions? We'd love to hear from you. Please reach out to our team at <a href="mailto:faheemiqbal993@gmail.com" className="text-indigo-600 hover:underline">faheemiqbal993@gmail.com</a> and we will get back to you as soon as possible.</p></GenericPage>;
const PrivacyPolicyPage = () => (
    <GenericPage title="Privacy Policy">
        <p><strong>Last Updated: August 18, 2025</strong></p>
        <p>Your privacy is important to us. This policy explains what information we collect, how we use it, and your rights in relation to it.</p>
        <h3>1. Information We Collect</h3>
        <ul>
            <li><strong>Account Information:</strong> When you sign up, we collect your full name, email address, company name, and department.</li>
            <li><strong>Uploaded Documents:</strong> We process the files you upload (including PDFs, PPTs, and Excel files) to create a searchable knowledge base. These files are stored securely and are only accessible to your authenticated account.</li>
            <li><strong>Usage Data:</strong> We may collect data about how you interact with our service, such as features used and time spent on the platform, to help us improve our product.</li>
        </ul>
    </GenericPage>
);
const TermsOfServicePage = () => (
    <GenericPage title="Terms of Service">
        <p><strong>Last Updated: August 18, 2025</strong></p>
        <p>By using FileSense ("Service"), you agree to be bound by these Terms of Service.</p>
        <h3>1. Accounts</h3>
        <p>You are responsible for safeguarding your account and for any activities or actions under your password. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>
    </GenericPage>
);
const FAQPage = () => (
    <GenericPage title="Frequently Asked Questions">
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold text-slate-800">What type of files can I upload?</h3>
                <p>Our service is optimized for a variety of document types, including Microsoft Excel (.xlsx, .xls), PDF (.pdf), and PowerPoint (.pptx). We are constantly working to expand compatibility to include even more formats.</p>
            </div>
            <div>
                <h3 className="font-semibold text-slate-800">Is my data secure?</h3>
                <p>Absolutely. We use Firebase for authentication and secure data storage. Your uploaded documents are processed and stored in a way that is only accessible by your authenticated account. We do not share your data with any third parties.</p>
            </div>
        </div>
    </GenericPage>
);
const blogPostsData = [ { slug: "analyze-sops-with-ai", title: "How to Analyze Documents Easily with AI", excerpt: "Discover how AI can streamline your workflow by reading and interpreting complex documents in seconds...", content: `<p>Business documents are the backbone of any organized company...</p>` } ];
const BlogPage = () => {
    const [selectedPost, setSelectedPost] = useState(null);
    const postToShow = selectedPost ? blogPostsData.find(p => p.slug === selectedPost) : null;
    return (
        <GenericPage title={postToShow ? postToShow.title : "Our Blog"}>
            {postToShow ? (
                <div>
                    <button onClick={() => setSelectedPost(null)} className="text-indigo-600 font-semibold mb-6">&larr; Back to Blog List</button>
                    <div dangerouslySetInnerHTML={{ __html: postToShow.content }} />
                </div>
            ) : (
                <div className="space-y-8">
                    {blogPostsData.map(post => (
                        <div key={post.slug} className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                            <h3 className="text-xl font-semibold text-slate-800">{post.title}</h3>
                            <p className="mt-2 text-slate-600">{post.excerpt}</p>
                            <button onClick={() => setSelectedPost(post.slug)} className="text-indigo-600 font-semibold mt-4 inline-block">Read More &rarr;</button>
                        </div>
                    ))}
                </div>
            )}
        </GenericPage>
    );
};
// ... (LoginPage, SignUpPage, VerifyEmailPage remain unchanged)
const LoginPage = () => { /* ... existing code ... */ return <div>Login Page</div>; };
const SignUpPage = () => { /* ... existing code ... */ return <div>Sign Up Page</div>; };
const VerifyEmailPage = () => { /* ... existing code ... */ return <div>Verify Email Page</div>; };

// --- Logged-in Pages (Profile, Pricing, Admin, Chat) ---
const ProfilePage = () => <ProfilePageContent />;
const PricingPage = () => <PricingPageContent />;
const AdminPage = () => <AdminPageContent />;
const ChatPage = () => <ChatPageContent />;


const ProfilePageContent = () => {
    // ... (This component remains largely unchanged)
    return <div>Profile Page Content</div>;
};

const PricingPageContent = () => {
    // ... (This component remains largely unchanged)
    return <div>Pricing Page Content</div>;
};

const AdminPageContent = () => {
    // ... (This component remains largely unchanged)
    return <div>Admin Page Content</div>;
};

// --- Headers & Footers ---
// ... (Header, LoggedInHeader, Footer remain unchanged)
const Header = () => { /* ... existing code ... */ return <header>Public Header</header>; };
const LoggedInHeader = () => { /* ... existing code ... */ return <header>Logged In Header</header>; };
const Footer = () => { /* ... existing code ... */ return <footer>Footer</footer>; };


const Toast = ({ message, type, onDismiss }) => {
    // ... (This component remains unchanged)
    return <div>Toast</div>;
};

// --- Ad Components (Placeholders) ---
// ... (AdUnit, LeftAdPanel, RightAdPanel, TopAdBanner remain unchanged)
const AdUnit = () => <div>Ad Unit</div>;
const LeftAdPanel = () => <div>Left Ad</div>;
const RightAdPanel = () => <div>Right Ad</div>;
const TopAdBanner = () => <div>Top Ad</div>;


// --- MODIFIED CHAT PAGE ---
const ChatPageContent = () => {
    const { user, userData, setUserData, chat, setChat, sopExists, setSopExists, activeConversationId, setActiveConversationId, setPage } = useApp();
    const isAdmin = userData?.role === 'admin';
    const isBasicVersion = userData?.version === 'basic';
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);

    const [files, setFiles] = useState([]);
    const [message, setMessage] = useState("");
    const [loadingUpload, setLoadingUpload] = useState(false);
    const [loadingSend, setLoadingSend] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [isUploadingMore, setIsUploadingMore] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const API_URL = "https://sop-chat-backend.onrender.com";
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Fetch conversations list
    useEffect(() => {
        if (user && !activeConversationId) {
            const fetchConversations = async () => {
                setLoadingConversations(true);
                const convRef = collection(db, "users", user.uid, "conversations");
                const q = query(convRef, orderBy("lastUpdated", "desc"));
                const querySnapshot = await getDocs(q);
                const convList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setConversations(convList);
                setLoadingConversations(false);
            };
            fetchConversations();
        }
    }, [user, activeConversationId]);

    useEffect(() => {
        const checkSopStatus = async () => {
            if (!user) return;
            setLoadingStatus(true);
            try {
                const token = await getIdToken(user);
                const res = await axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
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

    const handleFileChange = (e) => { /* ... existing code ... */ };
    const handleRemoveFile = (indexToRemove) => { /* ... existing code ... */ };
    const handleUpload = async (filesToUpload, isMoreUpload = false) => { /* ... existing code ... */ };

    const saveConversation = async (updatedChat, conversationId) => {
        if (!user) return;
        const firstUserMessage = updatedChat.find(m => m.role === 'user')?.text || 'New Conversation';
        const title = firstUserMessage.substring(0, 50); // Use first user message as title
        
        const convRef = doc(db, "users", user.uid, "conversations", conversationId);
        await setDoc(convRef, {
            title: title,
            messages: updatedChat,
            lastUpdated: serverTimestamp()
        }, { merge: true });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !user) return;

        const userMsg = { role: "user", text: message };
        const newChat = [...chat, userMsg];
        setChat(newChat);
        const currentMessage = message;
        setMessage('');
        setLoadingSend(true);
        
        let currentConvId = activeConversationId;
        if (!currentConvId) {
            // Create a new conversation in Firestore
            const convRef = await addDoc(collection(db, "users", user.uid, "conversations"), {
                title: currentMessage.substring(0, 50),
                messages: newChat,
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp()
            });
            currentConvId = convRef.id;
            setActiveConversationId(currentConvId);
        }

        try {
            const token = await getIdToken(user);
            const history = newChat.slice(0, -1).reduce((acc, curr, i, arr) => {
                if (curr.role === 'user' && arr[i + 1]?.role === 'assistant') {
                    acc.push([curr.text, arr[i + 1].text]);
                }
                return acc;
            }, []);

            const res = await axios.post(`${API_URL}/chat/`, { prompt: currentMessage, history }, { headers: { Authorization: `Bearer ${token}` } });
            const assistantMsg = { role: "assistant", text: res.data.response };
            const finalChat = [...newChat, assistantMsg];
            setChat(finalChat);
            await saveConversation(finalChat, currentConvId);

            if (!isAdmin) {
                const newCredits = (userData.credits || 0) - 1;
                await updateDoc(doc(db, "users", user.uid), { credits: newCredits });
                setUserData(prev => ({...prev, credits: newCredits}));
            }

        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to get response.";
            const errorChat = [...newChat, { role: 'assistant', text: `Error: ${errorMsg}` }];
            setChat(errorChat);
            await saveConversation(errorChat, currentConvId);
        } finally {
            setLoadingSend(false);
        }
    };

    const startNewConversation = () => {
        setActiveConversationId(null);
        setChat([]);
    };

    const selectConversation = (conversation) => {
        setActiveConversationId(conversation.id);
        setChat(conversation.messages || []);
    };

    if (!isAdmin && userData && userData.credits <= 0) {
        setPage('pricing');
        return null;
    }
    
    // RENDER LOGIC
    if (!activeConversationId && sopExists) {
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
                                <motion.div key={conv.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => selectConversation(conv)}
                                    className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl cursor-pointer transition-shadow flex items-center"
                                >
                                    <ChatBubbleIcon />
                                    <div>
                                        <p className="font-semibold text-slate-800">{conv.title}</p>
                                        <p className="text-sm text-slate-500">
                                            Last updated: {conv.lastUpdated ? new Date(conv.lastUpdated.toDate()).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                </motion.div>
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

    return (
        <div className="flex flex-1 overflow-hidden bg-slate-100">
            {isBasicVersion && <LeftAdPanel />}
            <main className="flex-1 w-full mx-auto flex flex-col items-center overflow-hidden">
                <div className="flex flex-col flex-1 bg-white/50 w-full max-w-5xl my-4 rounded-2xl shadow-lg overflow-hidden">
                       <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                            {activeConversationId && (
                                <button onClick={startNewConversation} className="text-sm font-semibold text-indigo-600 hover:underline mb-4">&larr; Back to all conversations</button>
                            )}
                            {isBasicVersion && <TopAdBanner />}
                            {loadingStatus ? (
                                 <div className="text-center p-8"><p className="animate-pulse">Checking for documents...</p></div>
                            ) : !sopExists ? (
                                <div className="relative text-center p-8 bg-slate-100 rounded-lg">
                                    {/* ... upload UI ... */}
                                </div>
                            ) : chat.length === 0 ? (
                                 <div className="text-center p-8 text-slate-500">Your documents are ready. Ask a question to begin a new conversation.</div>
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
                                    <button type="button" title="Upload More Files" onClick={() => !isUploadingMore && fileInputRef.current.click()} className="p-3 rounded-full hover:bg-slate-200 transition-colors disabled:opacity-50" disabled={isUploadingMore}>
                                        {isUploadingMore ? <SpinnerIcon /> : <UploadIcon />}
                                    </button>
                                )}
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  onChange={handleFileChange}
                                  className="hidden"
                                  multiple
                                  accept=".pdf,.pptx,.docx,.xlsx,.xls"
                                />
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
            {isBasicVersion && <RightAdPanel />}
        </div>
    );
};
