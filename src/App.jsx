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
    const [page, setPage] = useState(() => localStorage.getItem('currentPage') || 'home');
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [chat, setChat] = useState([]);
    const [sopExists, setSopExists] = useState(false);
    const [workspace, setWorkspace] = useState(null); // New: Workspace data

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserData(userData);
                    // Fetch workspace data
                    if (userData.companyName) {
                        const workspaceQuery = query(
                            collection(db, "workspaces"),
                            orderBy("companyName"),
                            where("companyName", "==", userData.companyName)
                        );
                        const workspaceDocs = await getDocs(workspaceQuery);
                        if (!workspaceDocs.empty) {
                            const workspaceData = workspaceDocs.docs[0].data();
                            workspaceData.id = workspaceDocs.docs[0].id;
                            setWorkspace(workspaceData);
                        }
                    }
                }
            } else {
                setUserData(null);
                setWorkspace(null);
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

    const value = { user, userData, setUserData, loading, page, setPage, chat, setChat, sopExists, setSopExists, activeConversationId, setActiveConversationId, workspace, setWorkspace };
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
    const { user, loading, page, setPage, userData, workspace } = useApp();

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
        const pageComponent = () => {
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
    const { userData, setPage, sopExists, workspace } = useApp();

    return (
        <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
            <div className="w-full max-w-4xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1 className="text-4xl font-bold text-slate-800">Welcome back, {userData?.fullName}!</h1>
                    {workspace && (
                        <p className="mt-2 text-lg text-slate-600">Workspace: {workspace.workspaceName} ({workspace.members[userData.uid]?.role})</p>
                    )}
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

const AboutPage = () => <GenericPage title="About Us"><p>Welcome to FileSense. Our mission is to revolutionize how businesses interact with their internal documentation, making knowledge accessible and actionable. We believe that by leveraging the power of AI, we can save teams countless hours, reduce errors, and improve operational efficiency. Our platform is built with security and simplicity in mind, ensuring that your sensitive data is protected while providing an intuitive user experience.</p></GenericPage>;
const ContactPage = () => <GenericPage title="Contact Us"><p>Have questions? We'd love to hear from you. Please reach out to our team at <a href="mailto:faheemiqbal993@gmail.com" className="text-indigo-600 hover:underline">faheemiqbal993@gmail.com</a> and we will get back to you as soon as possible.</p></GenericPage>;
const PrivacyPolicyPage = () => (
    <GenericPage title="Privacy Policy">
        <p><strong>Last Updated: August 18, 2025</strong></p>
        <p>Your privacy is important to us. This policy explains what information we collect, how we use it, and your rights in relation to it.</p>
        <h3>1. Information We Collect</h3>
        <ul>
            <li><strong>Account Information:</strong> When you sign up, we collect your full name, email address, company name, and department.</li>
            <li><strong>Uploaded Documents:</strong> We process the files you upload (including PDFs, PPTs, and Excel files) to create a searchable knowledge base. These files are stored securely and are only accessible to your authenticated account or workspace members.</li>
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
                <p>Absolutely. We use Firebase for authentication and secure data storage. Your uploaded documents are processed and stored in a way that is only accessible by your authenticated account or workspace members. We do not share your data with any third parties.</p>
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

const LoginPage = () => {
    const { setPage } = useApp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg"
            >
                <div className="text-center">
                    <button onClick={() => setPage('home')} className="text-sm text-indigo-600 hover:underline mb-4">&larr; Back to Home</button>
                    <h2 className="text-3xl font-bold text-slate-800">Welcome Back!</h2>
                </div>
                {error && <p className="text-red-500 text-center text-sm bg-red-100 p-3 rounded-md">{error}</p>}
                <div className="space-y-4">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                    <button onClick={handleLogin} disabled={loading} className="w-full px-4 py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 font-semibold disabled:bg-indigo-400 transform transition-transform hover:scale-105">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </div>
                <p className="text-center text-sm text-slate-600">
                    Don't have an account? <button onClick={() => setPage('signup')} className="font-semibold text-indigo-600 hover:underline">Sign Up</button>
                </p>
            </motion.div>
        </div>
    );
};

const SignUpPage = () => {
    const { setPage } = useApp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [department, setDepartment] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);

            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                fullName,
                email,
                companyName,
                department,
                credits: 10,
                version: 'basic',
                createdAt: serverTimestamp(),
            });
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100">
             <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg"
            >
                <div className="text-center">
                    <button onClick={() => setPage('home')} className="text-sm text-indigo-600 hover:underline mb-4">&larr; Back to Home</button>
                    <h2 className="text-3xl font-bold text-slate-800">Create an Account</h2>
                </div>
                {error && <p className="text-red-500 text-center text-sm bg-red-100 p-3 rounded-md">{error}</p>}
                <div className="space-y-4">
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" required className="w-full px-4 py-3 border rounded-md" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-3 border rounded-md" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min. 6 characters)" required className="w-full px-4 py-3 border rounded-md" />
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company Name" className="w-full px-4 py-3 border rounded-md" />
                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" className="w-full px-4 py-3 border rounded-md" />
                    <button onClick={handleSignUp} disabled={loading} className="w-full px-4 py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 font-semibold disabled:bg-indigo-400 transform transition-transform hover:scale-105">
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </div>
                <p className="text-center text-sm text-slate-600">
                    Already have an account? <button onClick={() => setPage('login')} className="font-semibold text-indigo-600 hover:underline">Login</button>
                </p>
            </motion.div>
        </div>
    );
};

const VerifyEmailPage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-4 bg-slate-100">
            <motion.div
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-10 rounded-2xl shadow-lg max-w-lg"
            >
                <h2 className="text-3xl font-bold mb-4 text-slate-800">Verify Your Email</h2>
                <p className="text-slate-600 mb-6">A verification link has been sent to <strong>{auth.currentUser?.email}</strong>. Please check your inbox (and spam folder) and click the link to activate your account.</p>
                <button onClick={() => signOut(auth)} className="w-full px-4 py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 font-semibold">
                    Go to Login
                </button>
            </motion.div>
        </div>
    );
};

// --- Logged-in Pages ---
const ProfilePage = () => <ProfilePageContent />;
const PricingPage = () => <PricingPageContent />;
const AdminPage = () => <AdminPageContent />;
const ChatPage = () => <ChatPageContent />;

const ProfilePageContent = () => {
    const { user, userData, setUserData, setSopExists, setChat, setPage, workspace } = useApp();
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [department, setDepartment] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (userData) {
            setFullName(userData.fullName || '');
            setCompanyName(userData.companyName || '');
            setDepartment(userData.department || '');
            setContactNumber(userData.contactNumber || '');
        }
    }, [userData]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!user) return;
        setMessage('');
        try {
            const userRef = doc(db, "users", user.uid);
            const updatedData = { fullName, companyName, department, contactNumber };
            await updateDoc(userRef, updatedData);
            setUserData(prev => ({...prev, ...updatedData}));
            setMessage('Profile updated successfully!');
            setIsEditing(false);
        } catch (err) {
            setMessage('Error updating profile.');
        }
    };

    const handleClearMemory = async () => {
        if (!user) return;
        if (workspace?.members[user.uid]?.role !== 'admin') {
            setMessage('Only workspace admins can clear workspace data.');
            return;
        }
        try {
            const token = await getIdToken(user);
            await axios.delete("https://sop-chat-backend.onrender.com/clear_memory", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSopExists(false);
            setChat([]);
            setShowConfirm(false);
            setPage('chat');
        } catch (error) {
            console.error("Failed to clear memory:", error);
            setMessage("Error clearing workspace data.");
            setShowConfirm(false);
        }
    };

    return (
        <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
            <div className="w-full max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-800">Profile</h2>
                    <button onClick={() => setIsEditing(!isEditing)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                    </button>
                </div>
                {message && <p className={`text-${message.includes('Error') ? 'red' : 'green'}-500 mb-4 bg-${message.includes('Error') ? 'red' : 'green'}-100 p-3 rounded-md`}>{message}</p>}
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <div className="flex items-center space-x-6 mb-8">
                        <img src={`https://placehold.co/100x100/e0e7ff/6366f1?text=${(userData?.fullName || 'U').charAt(0)}`} alt="Profile" className="w-24 h-24 rounded-full" />
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800">{userData?.fullName}</h3>
                            <p className="text-slate-500">{userData?.email}</p>
                            {workspace && <p className="text-slate-500">Workspace Role: {workspace.members[user.uid]?.role}</p>}
                        </div>
                    </div>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-slate-50" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Department</label>
                            <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-slate-50" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Company</label>
                            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-slate-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" value={userData?.email || ''} disabled className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-slate-50" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                            <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-slate-50" />
                        </div>
                        {isEditing && <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-md font-semibold">Save Changes</button>}
                    </form>
                </div>

                {workspace?.members[user.uid]?.role === 'admin' && (
                    <div className="mt-8 bg-white p-8 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold mb-4 text-slate-800">Danger Zone</h3>
                        <div className="border-t pt-4">
                            <button onClick={() => setShowConfirm(true)} className="px-5 py-2 bg-red-600 text-white rounded-md font-semibold">Clear All Workspace Data</button>
                            <p className="text-sm text-slate-500 mt-2">This will permanently delete all uploaded documents and learned knowledge for your workspace. This action cannot be undone.</p>
                        </div>
                    </div>
                )}
            </div>
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl">
                        <h3 className="text-lg font-bold">Are you sure?</h3>
                        <p className="my-4">This will delete all your workspace data permanently.</p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded-md">Cancel</button>
                            <button onClick={handleClearMemory} className="px-4 py-2 bg-red-600 text-white rounded-md">Yes, Clear Data</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PricingPageContent = () => {
    const creditPlans = [
        { name: 'Basic', credits: 20, price: '1,500 PKR' },
        { name: 'Standard', credits: 50, price: '5,000 PKR' },
        { name: 'Premium', credits: 100, price: '9,000 PKR', popular: true },
        { name: 'Ultra', credits: 'Unlimited', price: '25,000 PKR/mo' },
    ];

    return (
        <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
            <div className="w-full max-w-6xl text-center">
                <div className="mb-16">
                     <h2 className="text-3xl font-bold mb-2">Upgrade to Pro</h2>
                     <p className="text-gray-600 mb-8">Enjoy an ad-free experience with a one-time payment.</p>
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md mx-auto p-8 border-2 border-indigo-500 rounded-2xl shadow-2xl bg-white text-center"
                     >
                         <h3 className="text-2xl font-bold">Pro Version</h3>
                         <p className="text-5xl font-extrabold my-4">40,000 PKR</p>
                         <p className="text-lg font-semibold text-slate-600">One-Time Payment</p>
                         <ul className="text-left my-6 space-y-2">
                            <li>✅ Ad-Free Interface</li>
                            <li>✅ Priority Support</li>
                            <li>✅ All Features Included</li>
                         </ul>
                         <p className="mt-6 text-sm text-slate-700">
                            To purchase, please email your registered account ID to:<br/>
                            <strong className="text-indigo-600">faheemiqbal993@gmail.com</strong>
                         </p>
                     </motion.div>
                </div>
                 <div>
                    <h2 className="text-3xl font-bold mb-2">Purchase Credits (for Basic Users)</h2>
                    <p className="text-gray-600 mb-8">Keep the ads and top up your credits to continue the conversation.</p>
                    <div className="grid md:grid-cols-4 gap-8">
                        {creditPlans.map((plan, index) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`p-6 border rounded-lg shadow-lg text-center ${plan.popular ? 'border-indigo-500 scale-105 bg-white' : 'bg-white/50'}`}
                            >
                                <h3 className="text-2xl font-bold">{plan.name}</h3>
                                <p className="text-4xl font-extrabold my-4">{plan.price}</p>
                                <p className="text-lg font-semibold">{plan.credits} Credits</p>
                                <button className="mt-6 w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transform transition-transform hover:scale-105">Purchase</button>
                            </motion.div>
                        ))}
                    </div>
                     <p className="mt-12 text-lg text-slate-700">
                        For payment details, contact: <strong className="text-indigo-600">faheemiqbal993@gmail.com</strong>
                    </p>
                </div>
            </div>
        </div>
    );
};

const AdminPageContent = () => {
    const { user, workspace } = useApp();
    const [users, setUsers] = useState([]);
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ name: '', email: '', company: '', department: '' });
    const [editingUser, setEditingUser] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', fullName: '', credits: 10 });
    const [newWorkspace, setNewWorkspace] = useState({ companyName: '', workspaceName: '' });
    const [newMember, setNewMember] = useState({ email: '', role: 'viewer' });

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
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setError("Could not load user data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkspaces = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'workspaces'));
            const workspaceList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWorkspaces(workspaceList);
        } catch (error) {
            console.error("Failed to fetch workspaces:", error);
            setError("Could not load workspace data.");
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchWorkspaces();
    }, [user]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDelete = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            try {
                const token = await getIdToken(user);
                await axios.delete(`https://sop-chat-backend.onrender.com/admin/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchUsers();
            } catch (error) {
                console.error("Failed to delete user:", error);
                alert("Failed to delete user.");
            }
        }
    };

    const handleEdit = (user) => {
        setEditingUser({...user});
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            const token = await getIdToken(user);
            await axios.put(`https://sop-chat-backend.onrender.com/admin/users/${editingUser.uid}`, {
                fullName: editingUser.fullName,
                companyName: editingUser.companyName,
                department: editingUser.department,
                credits: parseInt(editingUser.credits, 10),
                version: editingUser.version,
                workspaceRole: editingUser.workspaceRole,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error("Failed to update user:", error);
            alert("Failed to update user.");
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault
