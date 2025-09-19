import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import axios from "axios";
// FIX: Corrected Firebase imports for a React environment
import { initializeApp } from "firebase/app";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    sendEmailVerification,
    getIdToken
} from "firebase/auth";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    serverTimestamp, 
    collection, 
    addDoc, 
    query, 
    getDocs, 
    orderBy, 
    where, 
    writeBatch, 
    onSnapshot 
} from "firebase/firestore";
import { getDatabase, ref, onValue } from "firebase/database";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';


// --- Firebase Configuration ---
// Reverted to hardcoded config as the issue is related to app logic, not the key itself.
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
const WorkspaceIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0v-4a2 2 0 012-2h6a2 2 0 012 2v4m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5m0 16v-2m-6-14v-2m-6 14v-2"></path></svg>;
const UsersIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.965 5.965 0 0112 13a5.965 5.965 0 013 1.803"></path></svg>;
const UploadIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>;
const SendIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>;
const UserAvatar = ({ userData }) => <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm flex-shrink-0">{(userData?.fullName || 'U').charAt(0)}</div>;
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
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>;

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
    const [workspace, setWorkspace] = useState(null);
    const [userRole, setUserRole] = useState('viewer');

    useEffect(() => {
        let unsubUser = () => {};
        let unsubWorkspace = () => {};
        let unsubMember = () => {};

        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            // Clean up previous listeners to prevent memory leaks
            unsubUser();
            unsubWorkspace();
            unsubMember();
            
            setUser(firebaseUser);

            if (firebaseUser) {
                const userDocRef = doc(db, "users", firebaseUser.uid);
                unsubUser = onSnapshot(userDocRef, (userDoc) => {
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserData(data);

                        if (data.workspaceId) {
                            const workspaceDocRef = doc(db, "workspaces", data.workspaceId);
                            unsubWorkspace = onSnapshot(workspaceDocRef, (workspaceDoc) => {
                                if (workspaceDoc.exists()) {
                                    setWorkspace({ id: workspaceDoc.id, ...workspaceDoc.data() });
                                    const memberRef = doc(db, "workspaces", workspaceDoc.id, "members", firebaseUser.uid);
                                    unsubMember = onSnapshot(memberRef, (memberDoc) => {
                                        if (memberDoc.exists()) {
                                            setUserRole(memberDoc.data().role);
                                        }
                                        // FIX: Set loading to false only after the deepest data fetch is complete
                                        setLoading(false);
                                    });
                                } else {
                                    // User has a stale workspace ID.
                                    setWorkspace(null);
                                    setUserRole('viewer');
                                    setLoading(false);
                                }
                            });
                        } else {
                            // User exists but has no workspace ID. This is a final state.
                            setWorkspace(null);
                            setUserRole('viewer');
                            setLoading(false);
                        }
                    } else {
                        // Auth is ready, but user document doesn't exist (e.g., mid-signup). Final state.
                        setUserData(null);
                        setLoading(false);
                    }
                }, (error) => {
                    console.error("Error fetching user document:", error);
                    setLoading(false);
                });
            } else {
                // User is not logged in. This is a final state.
                setUserData(null);
                setChat([]);
                setActiveConversationId(null);
                setWorkspace(null);
                setUserRole('viewer');
                localStorage.setItem('currentPage', 'home');
                setPage('home');
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubUser();
            unsubWorkspace();
            unsubMember();
        };
    }, []); 

    useEffect(() => {
        localStorage.setItem('currentPage', page);
    }, [page]);

    const value = { user, userData, setUserData, loading, page, setPage, chat, setChat, sopExists, setSopExists, activeConversationId, setActiveConversationId, isStartingNewChat, setIsStartingNewChat, workspace, setWorkspace, userRole };
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
        // FIX: This entire block is now gated by the loading state.
        // It will NOT run until the AppProvider has finished all its async data fetching.
        if (loading) return; 

        if (!user) {
            const protectedPages = ['chat', 'profile', 'workspace', 'workspace-setup', 'admin'];
            if (protectedPages.includes(page)) {
                setPage('login');
            }
            return;
        }

        if (!user.emailVerified) {
            if (page !== 'verify-email') setPage('verify-email');
        } else if (!userData?.workspaceId) {
            if (page !== 'workspace-setup') setPage('workspace-setup');
        } else {
            if (['login', 'signup', 'verify-email', 'workspace-setup'].includes(page)) {
                setPage('home');
            }
        }
    }, [user, userData, loading, page, setPage]);


    useEffect(() => {
        let descriptionTag = document.querySelector('meta[name="description"]');
        if (!descriptionTag) {
            descriptionTag = document.createElement('meta');
            descriptionTag.setAttribute('name', 'description');
            document.head.appendChild(descriptionTag);
        }

        if (page === 'home') {
            document.title = 'FileSense | AI Document Chat Assistant for PDFs, Excel & SOPs';
            descriptionTag.setAttribute('content', 'Stop searching, start knowing. FileSense is a powerful AI assistant that reads your business documents and provides instant, accurate answers. Perfect for SOPs, manuals, and data files.');
        } else {
            const titlePage = page.charAt(0).toUpperCase() + page.slice(1).replace(/-/g, ' ');
            document.title = `${titlePage} | FileSense`;
            descriptionTag.setAttribute('content', `Learn more about ${titlePage} at FileSense, your AI-powered document assistant.`);
        }
    }, [page]);


    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-slate-100"><div className="animate-pulse">Loading Application...</div></div>;
    }

    const renderPage = () => {
        let PageComponent;

        if (!user) {
             switch (page) {
                case 'home': PageComponent = HomePage; break;
                case 'blog': PageComponent = BlogPage; break;
                case 'faq': PageComponent = FAQPage; break;
                case 'contact': PageComponent = ContactPage; break;
                case 'privacy': PageComponent = PrivacyPolicyPage; break;
                case 'terms': PageComponent = TermsOfServicePage; break;
                case 'ai-document-analysis-guide': PageComponent = PillarPage; break;
                case 'login': PageComponent = LoginPage; break;
                case 'signup': PageComponent = SignUpPage; break;
                default: PageComponent = LoginPage; 
            }
        } else {
            if (!user.emailVerified) {
                PageComponent = VerifyEmailPage;
            } else if (!userData?.workspaceId) {
                PageComponent = WorkspaceSetupPage;
            } else {
                 switch (page) {
                    case 'home': PageComponent = LoggedInDashboard; break;
                    case 'workspace-setup': PageComponent = LoggedInDashboard; break; 
                    case 'workspace': PageComponent = WorkspacePage; break;
                    case 'chat': PageComponent = ChatPage; break;
                    case 'profile': PageComponent = ProfilePage; break;
                    case 'pricing': PageComponent = PricingPage; break;
                    case 'admin': PageComponent = userData?.role === 'admin' ? AdminPage : LoggedInDashboard; break;
                    case 'blog': PageComponent = BlogPage; break;
                    case 'faq': PageComponent = FAQPage; break;
                    case 'contact': PageComponent = ContactPage; break;
                    case 'privacy': PageComponent = PrivacyPolicyPage; break;
                    case 'terms': PageComponent = TermsOfServicePage; break;
                    case 'ai-document-analysis-guide': PageComponent = PillarPage; break;
                    default: PageComponent = LoggedInDashboard;
                }
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
                           {PageComponent ? <PageComponent /> : null}
                        </motion.div>
                    </AnimatePresence>
                </main>
                {!user && <Footer />}
            </div>
        );
    };

    return renderPage();
};

const WorkspaceSetupPage = () => {
    // FIX: Destructure state setters to manually update context after creation
    const { user, userData, setUserData, setWorkspace, setPage } = useApp();
    const [workspaceName, setWorkspaceName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateWorkspace = async (e) => {
        e.preventDefault();
        if (!workspaceName.trim() || !user || !userData) return;
        setLoading(true);
        setError('');
        try {
            const batch = writeBatch(db);
            const workspaceRef = doc(collection(db, "workspaces"));
            
            const newWorkspaceData = {
                name: workspaceName,
                companyName: userData.companyName || 'Default Company',
                createdAt: serverTimestamp(),
                createdBy: user.uid
            };
            batch.set(workspaceRef, newWorkspaceData);

            const memberRef = doc(db, "workspaces", workspaceRef.id, "members", user.uid);
            batch.set(memberRef, { role: 'admin', joinedAt: serverTimestamp() });
            
            const userRef = doc(db, "users", user.uid);
            batch.update(userRef, { workspaceId: workspaceRef.id });
            
            await batch.commit();
            
            // This manual update is kept for immediate UI feedback but the onSnapshot listener is the source of truth
            setUserData(prev => ({ ...prev, workspaceId: workspaceRef.id }));
            setWorkspace({ id: workspaceRef.id, ...newWorkspaceData });
            setPage('home');

        } catch (err) {
            console.error(err);
            setError('Failed to create workspace. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center flex-1 bg-slate-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg text-center">
                <h2 className="text-3xl font-bold text-slate-800">Setup Your Workspace</h2>
                <p className="text-slate-600">Create a shared workspace for your team to collaborate on documents.</p>
                {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded-md">{error}</p>}
                <form onSubmit={handleCreateWorkspace} className="space-y-4">
                    <input type="text" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="e.g., Marketing Team" required className="w-full px-4 py-3 border rounded-md"/>
                    <button type="submit" disabled={loading} className="w-full px-4 py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                        {loading ? 'Creating...' : 'Create Workspace'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// ... Rest of the components remain unchanged ...
// --- OMITTED FOR BREVITY ---
const WorkspacePage = () => {
    const { workspace, user, userRole } = useApp();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!workspace) return;
        setLoading(true);
        const membersRef = collection(db, "workspaces", workspace.id, "members");
        const unsubscribe = onSnapshot(membersRef, async (snapshot) => {
            const memberPromises = snapshot.docs.map(async (memberDoc) => {
                const userRef = doc(db, "users", memberDoc.id);
                const userDoc = await getDoc(userRef);
                return userDoc.exists() ? { uid: userDoc.id, ...userDoc.data(), role: memberDoc.data().role } : null;
            });
            const resolvedMembers = (await Promise.all(memberPromises)).filter(Boolean);
            setMembers(resolvedMembers);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError("Failed to load members.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [workspace]);

    if (!workspace) return <div className="flex items-center justify-center h-full"><p>Loading workspace...</p></div>;

    return (
        <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Workspace: {workspace.name}</h1>
                <p className="text-slate-600 mt-1">Manage your team and shared documents.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center"><UsersIcon /> Team Members</h2>
                    {userRole === 'admin' && (
                        <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700">
                            Invite Member
                        </button>
                    )}
                </div>
                {loading ? <p>Loading members...</p> : error ? <p className="text-red-500">{error}</p> :
                    <div className="space-y-4">
                        {members.map(member => (
                            <div key={member.uid} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <UserAvatar userData={member} />
                                    <div>
                                        <p className="font-semibold text-slate-800">{member.fullName}</p>
                                        <p className="text-sm text-slate-500">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                     <span className="px-3 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-full capitalize">{member.role}</span>
                                     {userRole === 'admin' && member.uid !== user.uid && (
                                        <button className="text-sm text-red-500 hover:underline">Remove</button>
                                     )}
                                </div>
                            </div>
                        ))}
                    </div>
                }
            </div>
        </div>
    );
};
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
    const { userData, setPage, sopExists, workspace } = useApp();
    return (
        <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
            <div className="w-full max-w-4xl">
                <h1 className="text-4xl font-bold text-slate-800">Welcome back, {userData?.fullName}!</h1>
                <p className="mt-2 text-lg text-slate-600">You are currently in the <strong className="text-indigo-600">{workspace?.name}</strong> workspace.</p>
                
                <div className="mt-8 text-center">
                    <button 
                        onClick={() => setPage('chat')} 
                        className="px-10 py-4 bg-indigo-600 text-white font-semibold text-lg rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-transform transform hover:scale-105">
                        Go to Your Workspace Chat
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
                                {sopExists ? 'Manage Documents →' : 'Upload First Document →'}
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
const AboutPage = () => <GenericPage title="About Us"><p>Welcome to FileSense. Our mission is to revolutionize how businesses interact with their internal documentation, making knowledge accessible and actionable. We believe that by leveraging the power of AI, we can save teams countless hours, reduce errors, and improve operational efficiency. Our platform is built with security and simplicity in mind, ensuring that your sensitive data is protected while providing an intuitive user experience.</p></GenericPage>;
const ContactPage = () => <GenericPage title="Contact Us"><p>Have questions? We'd love to hear from you. Please reach out to our team at <a href="mailto:faheemiqbal993@gmail.com" className="text-indigo-600 hover:underline">faheemiqbal993@gmail.com</a> and we will get back to you as soon as possible.</p></GenericPage>;
const PrivacyPolicyPage = () => <GenericPage title="Privacy Policy"><p><strong>Last Updated: August 18, 2025</strong>...</p></GenericPage>;
const TermsOfServicePage = () => <GenericPage title="Terms of Service"><p><strong>Last Updated: August 18, 2025</strong>...</p></GenericPage>;
const FAQPage = () => <GenericPage title="Frequently Asked Questions"><div>...</div></GenericPage>;
const PillarPage = () => <GenericPage title="The Ultimate Guide to AI-Powered Document Analysis"><div>...</div></GenericPage>;
const BlogPage = () => <GenericPage title="Our Blog"><div>...</div></GenericPage>;
const LoginPage = () => {
    const { setPage } = useApp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center flex-1 bg-slate-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
                <div className="text-center">
                    <button onClick={() => setPage('home')} className="text-sm text-indigo-600 hover:underline mb-4">&larr; Back to Home</button>
                    <h2 className="text-3xl font-bold text-slate-800">Welcome Back!</h2>
                </div>
                {error && <p className="text-red-500 text-center text-sm bg-red-100 p-3 rounded-md">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-3 border rounded-md" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-3 border rounded-md" />
                    <button type="submit" disabled={loading} className="w-full px-4 py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="text-center text-sm">
                    Don't have an account? <button onClick={() => setPage('signup')} className="font-semibold text-indigo-600 hover:underline">Sign Up</button>
                </p>
            </div>
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
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center flex-1 bg-slate-100">
             <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
                <div className="text-center">
                    <button onClick={() => setPage('home')} className="text-sm text-indigo-600 hover:underline mb-4">&larr; Back to Home</button>
                    <h2 className="text-3xl font-bold text-slate-800">Create an Account</h2>
                </div>
                {error && <p className="text-red-500 text-center text-sm bg-red-100 p-3 rounded-md">{error}</p>}
                <form onSubmit={handleSignUp} className="space-y-4">
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" required className="w-full px-4 py-3 border rounded-md" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-3 border rounded-md" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-3 border rounded-md" />
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company Name (Optional)" className="w-full px-4 py-3 border rounded-md" />
                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department (Optional)" className="w-full px-4 py-3 border rounded-md" />
                    <button type="submit" disabled={loading} className="w-full px-4 py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
                <p className="text-center text-sm">
                    Already have an account? <button onClick={() => setPage('login')} className="font-semibold text-indigo-600 hover:underline">Login</button>
                </p>
            </div>
        </div>
    );
};
const VerifyEmailPage = () => (
    <div className="flex flex-col items-center justify-center flex-1 text-center p-4 bg-slate-100">
        <div className="bg-white p-10 rounded-2xl shadow-lg max-w-lg">
            <h2 className="text-3xl font-bold mb-4 text-slate-800">Verify Your Email</h2>
            <p className="text-slate-600 mb-6">A verification link has been sent to <strong>{auth.currentUser?.email}</strong>. Please check your inbox and click the link to activate your account.</p>
            <button onClick={() => signOut(auth)} className="w-full px-4 py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                Go to Login
            </button>
        </div>
    </div>
);
const PricingPage = () => { return(<div>...</div>)};
const AdminPage = () => { return(<div>...</div>)};
const ProfilePage = () => {
    const { user, userData, setUserData, setSopExists, setChat, setPage, workspace } = useApp();
    const [fullName, setFullName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [department, setDepartment] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [roleInCompany, setRoleInCompany] = useState('');

    useEffect(() => {
        if (userData) {
            setFullName(userData.fullName || '');
            setCompanyName(userData.companyName || '');
            setDepartment(userData.department || '');
            setContactNumber(userData.contactNumber || '');
            setRoleInCompany(userData.roleInCompany || '');
        }
    }, [userData]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!user) return;
        try {
            const userRef = doc(db, "users", user.uid);
            const updatedData = { fullName, companyName, department, contactNumber, roleInCompany };
            await updateDoc(userRef, updatedData);
            setUserData(prev => ({...prev, ...updatedData }));
            setMessage('Profile updated successfully!');
            setIsEditing(false);
        } catch (err) {
            setMessage('Error updating profile.');
        }
    };

    const handleClearMemory = async () => {
        if (!user || !workspace) return;
        setShowConfirm(false);
        try {
            const token = await getIdToken(user);
            await axios.delete(`https://sop-chat-backend.onrender.com/clear_memory?workspace_id=${workspace.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSopExists(false);
            setChat([]);
            setPage('chat');
        } catch (error) {
            setMessage("Error clearing memory.");
        }
    };

    return (
        <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
            <div className="w-full max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-800">Profile</h2>
                    <button onClick={() => setIsEditing(!isEditing)} className="text-sm font-semibold text-indigo-600">
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                    </button>
                </div>
                {message && <p className="text-green-500 mb-4 bg-green-100 p-3 rounded-md">{message}</p>}
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <div className="flex items-center space-x-6 mb-8">
                        <img src={`https://placehold.co/100x100/e0e7ff/6366f1?text=${(userData?.fullName || 'U').charAt(0)}`} alt="Profile" className="w-24 h-24 rounded-full" />
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800">{userData?.fullName}</h3>
                            <p className="text-slate-500">{userData?.email}</p>
                            {userData?.roleInCompany && <p className="text-indigo-600 font-semibold mt-1">{userData.roleInCompany}</p>}
                        </div>
                    </div>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Name</label>
                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 border rounded-md disabled:bg-slate-50" />
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
                            <label className="block text-sm font-medium text-gray-700">Role / Designation</label>
                            <input type="text" value={roleInCompany} onChange={(e) => setRoleInCompany(e.target.value)} disabled={!isEditing} placeholder="e.g., Marketing Manager" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-slate-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Email</label>
                            <input type="email" value={userData?.email || ''} disabled className="mt-1 block w-full px-3 py-2 border rounded-md bg-slate-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                            <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-slate-50" />
                        </div>
                        {isEditing && <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-md">Save Changes</button>}
                    </form>
                </div>

                <div className="mt-8 bg-white p-8 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-bold mb-4">Danger Zone</h3>
                    <div className="border-t pt-4">
                        <button onClick={() => setShowConfirm(true)} className="px-5 py-2 bg-red-600 text-white rounded-md">Clear Workspace Documents</button>
                        <p className="text-sm text-slate-500 mt-2">This will permanently delete all uploaded documents in your workspace. This action cannot be undone.</p>
                    </div>
                </div>
            </div>
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl">
                        <h3 className="text-lg font-bold">Are you sure?</h3>
                        <p className="my-4">This will delete all workspace data permanently.</p>
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
const ChatPage = () => {
    const { user, workspace, isStartingNewChat, setIsStartingNewChat, activeConversationId, setActiveConversationId, setChat } = useApp();
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);

    useEffect(() => {
        if (user && workspace && !activeConversationId && !isStartingNewChat) {
            const fetchConversations = async () => {
                setLoadingConversations(true);
                const convRef = collection(db, "workspaces", workspace.id, "conversations");
                const q = query(convRef, orderBy("lastUpdated", "desc"));
                const unsub = onSnapshot(q, (querySnapshot) => {
                    const convList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setConversations(convList);
                    setLoadingConversations(false);
                }, (error) => {
                     console.error("Firestore Query Failed.", error);
                     setLoadingConversations(false);
                });
                return () => unsub();
            };
            fetchConversations();
        }
    }, [user, workspace, activeConversationId, isStartingNewChat]);

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
                        <h2 className="text-3xl font-bold text-slate-800">Workspace Conversations</h2>
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
                            <p className="text-slate-600">This workspace has no saved conversations.</p>
                            <button onClick={startNewConversation} className="mt-4 text-indigo-600 font-semibold">Start the first one now &rarr;</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return <ChatPageContent />;
};
const ChatPageContent = () => {
    const { user, userData, setUserData, chat, setChat, sopExists, setSopExists, activeConversationId, setActiveConversationId, setIsStartingNewChat, workspace, userRole } = useApp();
    const [files, setFiles] = useState([]);
    const [message, setMessage] = useState("");
    const [loadingUpload, setLoadingUpload] = useState(false);
    const [loadingSend, setLoadingSend] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [uploadError, setUploadError] = useState("");


    useEffect(() => {
        if (user && workspace && activeConversationId) {
             const unsub = onSnapshot(doc(db, "workspaces", workspace.id, "conversations", activeConversationId), (doc) => {
                if (doc.exists()) {
                    const newMessages = doc.data().messages || [];
                    if (JSON.stringify(newMessages) !== JSON.stringify(chat)) {
                       setChat(newMessages);
                    }
                }
            });
            return () => unsub();
        }
    }, [user, workspace, activeConversationId, chat]);


    useEffect(() => {
        const checkSopStatus = async () => {
            if (!user || !workspace) return;
            setLoadingStatus(true);
            try {
                const token = await getIdToken(user);
                const res = await axios.get(`https://sop-chat-backend.onrender.com/status?workspace_id=${workspace.id}`, { headers: { Authorization: `Bearer ${token}` } });
                setSopExists(res.data.sop_exists);
            } catch (error) {
                console.error("Could not check SOP status", error);
                setSopExists(false);
            }
            setLoadingStatus(false);
        };
        checkSopStatus();
    }, [user, workspace]);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);
    
    const handleFileChange = (e) => setFiles(Array.from(e.target.files));

    const handleUpload = async () => {
        if (files.length === 0 || !user || !workspace) return;
        setLoadingUpload(true);
        setUploadError("");
        try {
            const token = await getIdToken(user);
            const formData = new FormData();
            files.forEach(file => formData.append('file', file));
            await axios.post(`https://sop-chat-backend.onrender.com/upload/?workspace_id=${workspace.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            setSopExists(true);
            setFiles([]);
        } catch (error) {
            setUploadError(error.response?.data?.detail || "File upload failed.");
        }
        setLoadingUpload(false);
    };

    const saveConversation = async (updatedChat, conversationId) => {
        if (!user || !workspace) return;
        const firstUserMessage = updatedChat.find(m => m.role === 'user')?.text || 'New Conversation';
        const title = firstUserMessage.substring(0, 50);
        
        const convRef = doc(db, "workspaces", workspace.id, "conversations", conversationId);
        await setDoc(convRef, {
            title: title,
            messages: updatedChat,
            lastUpdated: serverTimestamp()
        }, { merge: true });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !user || !workspace) return;

        const userMsg = { role: "user", text: message, sender: { name: userData.fullName, uid: user.uid } };
        const newChat = [...chat, userMsg];
        setChat(newChat);
        const currentMessage = message;
        setMessage('');
        setLoadingSend(true);
        
        let currentConvId = activeConversationId;
        if (!currentConvId) {
            const convRef = await addDoc(collection(db, "workspaces", workspace.id, "conversations"), {
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

            const res = await axios.post("https://sop-chat-backend.onrender.com/chat/", { 
                prompt: currentMessage, 
                history,
                workspaceId: workspace.id
            }, { headers: { Authorization: `Bearer ${token}` } });

            const assistantMsg = { role: "assistant", text: res.data.response };
            const finalChat = [...newChat, assistantMsg];
            // No need to setChat here, onSnapshot will handle it.
            await saveConversation(finalChat, currentConvId);

            const newCredits = (userData.credits || 0) - 1;
            await updateDoc(doc(db, "users", user.uid), { credits: newCredits });
            
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to get response.";
            const errorChat = [...newChat, { role: 'assistant', text: `Error: ${errorMsg}` }];
            await saveConversation(errorChat, currentConvId);
        }
        setLoadingSend(false);
    };
    
    const canUpload = userRole === 'admin' || userRole === 'editor';
    
    return (
        <div className="flex flex-1 overflow-hidden bg-slate-100">
            <main className="flex-1 w-full mx-auto flex flex-col items-center overflow-hidden">
                <div className="flex flex-col flex-1 bg-white/50 w-full max-w-5xl my-4 rounded-2xl shadow-lg overflow-hidden">
                        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                            {(activeConversationId || isStartingNewChat) && (
                                <button onClick={() => { setActiveConversationId(null); setIsStartingNewChat(false); }} className="text-sm font-semibold text-indigo-600 hover:underline mb-4">&larr; Back to all conversations</button>
                            )}
                            
                            {loadingStatus ? (
                                 <div className="text-center p-8"><p className="animate-pulse">Checking workspace documents...</p></div>
                            ) : !sopExists ? (
                                <div className="text-center p-8 bg-slate-100 rounded-lg">
                                    <h3 className="font-semibold text-lg mb-2">Welcome to your Workspace!</h3>
                                    <p className="text-slate-600 mb-4">To get started, upload documents for your team to access.</p>
                                    {canUpload ? (
                                        <div className="max-w-md mx-auto">
                                            <button onClick={() => fileInputRef.current.click()} className="w-full bg-white text-slate-700 py-2 px-4 rounded-lg border hover:bg-slate-50">
                                              Choose files...
                                            </button>
                                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept=".pdf,.pptx,.docx,.xlsx,.xls" />
                                            {files.length > 0 && (
                                                <div className="mt-4 space-y-2 text-left">
                                                    {files.map((file, index) => (
                                                        <div key={index} className="flex items-center p-2 bg-slate-200 rounded-md text-sm">
                                                            <FileIcon />
                                                            <span className="flex-grow truncate">{file.name}</span>
                                                            <button onClick={() => setFiles(files.filter((_, i) => i !== index))}><CloseIcon /></button>
                                                        </div>
                                                    ))}
                                                    {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
                                                    <button onClick={handleUpload} disabled={loadingUpload} className="w-full mt-2 bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-indigo-700">
                                                        {loadingUpload ? 'Uploading...' : `Upload ${files.length} File(s)`}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-amber-700 bg-amber-100 p-3 rounded-md">You don't have permission to upload documents. Please contact an admin.</p>
                                    )}
                                </div>
                            ) : chat.length === 0 ? (
                                 <div className="text-center p-8 text-slate-500">Workspace documents are ready. Ask a question to begin.</div>
                            ) : null}

                            {chat.map((c, i) => (
                                <div key={i} className={`flex items-start gap-4 ${c.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {c.role === 'assistant' && <AssistantAvatar />}
                                    <div className={`p-4 rounded-2xl max-w-2xl shadow-md ${c.role === "user" ? "bg-indigo-500 text-white rounded-br-none" : "bg-slate-100 text-slate-800 rounded-bl-none"}`}>
                                        <ReactMarkdown className="prose prose-sm max-w-none">{c.text}</ReactMarkdown>
                                        {c.role === 'user' && <p className="text-xs text-indigo-200 mt-2 opacity-80">- {c.sender?.name}</p>}
                                    </div>
                                    {c.role === 'user' && <UserAvatar userData={{fullName: c.sender?.name}} />}
                                </div>
                            ))}
                             {loadingSend && (
                                <div className="flex items-start gap-4">
                                    <AssistantAvatar />
                                    <div className="p-4 rounded-2xl bg-slate-100 text-slate-800">
                                        <div className="flex items-center space-x-1">
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></span>
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
                                {canUpload &&
                                <button type="button" title="Upload More Files" onClick={() => fileInputRef.current.click()} className="p-3 rounded-full hover:bg-slate-200">
                                    <UploadIcon />
                                </button>
                                }
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept=".pdf,.pptx,.docx,.xlsx,.xls" />
                                <input
                                  value={message}
                                  onChange={(e) => setMessage(e.target.value)}
                                  className="border border-slate-300 p-4 w-full rounded-full"
                                  placeholder={sopExists ? "Ask a question..." : "Please upload a document to begin"}
                                  disabled={!sopExists || loadingSend}
                                />
                                <button type="submit" disabled={!sopExists || loadingSend || !message.trim()} className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:opacity-50">
                                    <SendIcon />
                                </button>
                            </form>
                             <p className="text-right mt-2 text-sm text-indigo-600">Credits Remaining: {userData?.credits}</p>
                           </div>
                </div>
            </main>
        </div>
    );
};
const Header = () => {
    const { setPage } = useApp();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const NavLink = ({ page, children }) => (
        <button onClick={() => { setPage(page); setIsMenuOpen(false); }} className="font-semibold text-slate-600 hover:text-indigo-600 w-full text-left py-2 md:w-auto md:text-center md:py-0">
            {children}
        </button>
    );

    return (
        <header className="bg-white/80 backdrop-blur-lg shadow-sm p-4 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage('home')}>
                    <Logo />
                    <h1 className="text-2xl font-bold text-slate-800">FileSense</h1>
                </div>
                <nav className="hidden md:flex items-center space-x-6">
                    <NavLink page="home">Home</NavLink>
                    <NavLink page="blog">Blog</NavLink>
                    <NavLink page="faq">FAQ</NavLink>
                    <NavLink page="contact">Contact</NavLink>
                </nav>
                <div className="hidden md:flex items-center gap-4">
                     <button onClick={() => setPage('login')} className="font-semibold text-slate-600 hover:text-indigo-600">Login</button>
                     <button onClick={() => setPage('signup')} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold">Sign Up</button>
                </div>
                <div className="md:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)}><MenuIcon /></button>
                </div>
            </div>
            {isMenuOpen && (
                <div className="md:hidden mt-4 p-4 bg-white rounded-lg shadow-lg">
                    <nav className="flex flex-col space-y-2">
                        <NavLink page="home">Home</NavLink>
                        <NavLink page="blog">Blog</NavLink>
                        <NavLink page="faq">FAQ</NavLink>
                        <NavLink page="contact">Contact</NavLink>
                        <div className="border-t my-2"></div>
                        <button onClick={() => { setPage('login'); setIsMenuOpen(false); }} className="w-full text-left font-semibold text-slate-600 py-2">Login</button>
                        <button onClick={() => { setPage('signup'); setIsMenuOpen(false); }} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold">Sign Up</button>
                    </nav>
                </div>
            )}
        </header>
    );
};
const LoggedInHeader = () => {
    const { setPage, userData } = useApp();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const handleLogout = () => {
        signOut(auth);
        setPage('home');
    };
    const NavLink = ({ page, children, className = '' }) => (
        <button onClick={() => { setPage(page); setIsMenuOpen(false); }} className={`font-semibold text-slate-600 hover:text-indigo-600 w-full text-left py-2 md:w-auto md:text-center md:py-0 ${className}`}>
            {children}
        </button>
    );

    return (
        <header className="bg-white/80 backdrop-blur-lg shadow-sm p-4 z-40 sticky top-0">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                 <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage('home')}>
                    <Logo />
                    <h1 className="text-2xl font-bold text-slate-800">FileSense</h1>
                </div>
                <nav className="hidden md:flex items-center space-x-6">
                    <NavLink page="home">Home</NavLink>
                    <NavLink page="blog">Blog</NavLink>
                    <div className="h-6 w-px bg-slate-200"></div>
                    {userData?.role === 'admin' && (
                        <NavLink page="admin" className="!text-red-600">Admin</NavLink>
                    )}
                    <NavLink page="workspace">Workspace</NavLink>
                    <NavLink page="chat">Chat</NavLink>
                    <NavLink page="profile">Profile</NavLink>
                    <NavLink page="pricing">Pricing</NavLink>
                    <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-md text-sm font-semibold">Logout</button>
                </nav>
                 <div className="md:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)}><MenuIcon /></button>
                </div>
            </div>
            {isMenuOpen && (
                <div className="md:hidden mt-4 p-4 bg-white rounded-lg shadow-lg">
                    <nav className="flex flex-col space-y-2">
                        <NavLink page="workspace">Workspace</NavLink>
                        <NavLink page="chat">Chat</NavLink>
                        <NavLink page="profile">Profile</NavLink>
                        <NavLink page="pricing">Pricing</NavLink>
                        {userData?.role === 'admin' && <NavLink page="admin" className="!text-red-600">Admin</NavLink>}
                        <div className="border-t my-2"></div>
                        <NavLink page="home">Home</NavLink>
                        <NavLink page="blog">Blog</NavLink>
                        <div className="border-t my-2"></div>
                        <button onClick={handleLogout} className="w-full mt-2 px-4 py-2 bg-red-500 text-white rounded-md text-sm font-semibold">Logout</button>
                    </nav>
                </div>
            )}
        </header>
    );
};
const Footer = () => {
    const { setPage } = useApp();
    return (
        <footer className="bg-white border-t">
            <div className="max-w-7xl mx-auto py-8 px-4 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                <p>&copy; {new Date().getFullYear()} FileSense. All rights reserved.</p>
                <nav className="flex gap-6 mt-4 md:mt-0">
                    <button onClick={() => setPage('privacy')} className="hover:text-indigo-600">Privacy Policy</button>
                    <button onClick={() => setPage('terms')} className="hover:text-indigo-600">Terms of Service</button>
                    <button onClick={() => setPage('ai-document-analysis-guide')} className="hover:text-indigo-600">AI Guide</button>
                </nav>
            </div>
        </footer>
    );
};
