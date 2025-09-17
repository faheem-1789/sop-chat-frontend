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
                const appPages = ['chat', 'profile', 'pricing', 'admin', 'ai-document-analysis-guide'];
                if (appPages.includes(page)) {
                    setPage('login');
                }
            }
        }
    }, [user, loading, page, setPage]);

    // SEO: Update title and meta description based on the current page
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
                case 'ai-document-analysis-guide': PageComponent = PillarPage; break;
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

const AboutPage = () => <GenericPage title="About Us"><p>Welcome to FileSense. Our mission is to revolutionize how businesses interact with their internal documentation, making knowledge accessible and actionable. We believe that by leveraging the power of AI, we can save teams countless hours, reduce errors, and improve operational efficiency. Our platform is built with security and simplicity in mind, ensuring that your sensitive data is protected while providing an intuitive user experience.</p></GenericPage>;
const ContactPage = () => <GenericPage title="Contact Us"><p>Have questions? We'd love to hear from you. Please reach out to our team at <a href="mailto:faheemiqbal993@gmail.com" className="text-indigo-600 hover:underline">faheemiqbal993@gmail.com</a> and we will get back to you as soon as possible.</p></GenericPage>;
const PrivacyPolicyPage = () => <GenericPage title="Privacy Policy"><p><strong>Last Updated: August 18, 2025</strong>...</p></GenericPage>;
const TermsOfServicePage = () => <GenericPage title="Terms of Service"><p><strong>Last Updated: August 18, 2025</strong>...</p></GenericPage>;
const FAQPage = () => <GenericPage title="Frequently Asked Questions"><div>...</div></GenericPage>;

const PillarPage = () => {
    const [showVideoModal, setShowVideoModal] = useState(false);

    return (
        <>
            <GenericPage title="The Ultimate Guide to AI-Powered Document Analysis">
                <div className="relative">
                    <button
                        onClick={() => setShowVideoModal(true)}
                        className="float-right ml-6 mb-4 flex items-center justify-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                    >
                        <VideoIcon />
                        <span>Watch Video Guide</span>
                    </button>
                    
                    <p className="lead text-xl text-slate-600">
                        In today's data-driven world, the ability to quickly extract meaningful insights from vast amounts of documentation is no longer a luxury—it's a necessity. AI-powered document analysis is transforming how businesses operate, turning static files into dynamic, conversational knowledge bases. This guide will walk you through everything you need to know.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">What is AI-Powered Document Analysis?</h2>
                    <p>AI document analysis, also known as intelligent document processing (IDP), is the use of artificial intelligence technologies—primarily Natural Language Processing (NLP) and Machine Learning (ML)—to read, understand, and interpret human language in documents. Unlike simple keyword searching, AI analysis comprehends context, semantics, and relationships within the text, allowing it to provide nuanced and accurate answers to complex questions.</p>

                    <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">The Core Technologies Driving the Revolution</h2>
                    <ul className="space-y-4">
                        <li><strong>Natural Language Processing (NLP):</strong> This is the science of teaching computers to understand human language. NLP enables the AI to parse sentence structure, identify entities (like people, places, and dates), and grasp the underlying meaning of a query.</li>
                        <li><strong>Optical Character Recognition (OCR):</strong> For scanned documents and PDFs, OCR is the foundational technology that converts images of text into machine-readable text data. Modern OCR is incredibly accurate, forming the first step in the analysis pipeline.</li>
                        <li><strong>Machine Learning (ML):</strong> ML models are trained on vast datasets to recognize patterns. In document analysis, they learn to classify information, extract specific data points (like invoice numbers or contract clauses), and continuously improve their accuracy based on user interactions.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">Real-World Applications Across Industries</h2>
                    <p>The applications are virtually limitless, but here are a few key examples:</p>
                    <ul className="space-y-4">
                        <li><strong>Logistics & Supply Chain:</strong> Instantly querying Bills of Lading, Standard Operating Procedures (SOPs), and shipping regulations to reduce delays and ensure compliance.</li>
                        <li><strong>Legal:</strong> Rapidly searching through thousands of pages of case law, contracts, and depositions to find precedents and critical clauses in minutes instead of days.</li>
                        <li><strong>Healthcare:</strong> Analyzing patient records, research papers, and billing codes to improve patient care and streamline administration.</li>
                        <li><strong>Finance:</strong> Automating the extraction of data from financial reports, invoices, and compliance documents to accelerate decision-making and reduce manual error.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">The Key Benefits for Your Business</h2>
                    <ul className="space-y-4">
                        <li><strong>Drastic Efficiency Gains:</strong> Reduce the time employees spend searching for information from hours to seconds.</li>
                        <li><strong>Improved Accuracy:</strong> Eliminate human error associated with manual data extraction and interpretation.</li>
                        <li><strong>Cost Savings:</strong> Free up valuable employee time to focus on high-level strategic tasks rather than document retrieval.</li>
                        <li><strong>Enhanced Knowledge Sharing:</strong> Democratize access to information, ensuring everyone on the team can find what they need, when they need it.</li>
                    </ul>
                     <div className="text-center pt-8 mt-8 border-t">
                        <h2 className="text-2xl font-bold text-indigo-700">Ready to Transform Your Documents?</h2>
                        <p className="mt-2">Stop searching, start knowing. Try FileSense today.</p>
                    </div>
                </div>
            </GenericPage>

            {showVideoModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all scale-100">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-xl font-semibold">Video Guide: AI Document Analysis</h3>
                            <button 
                                onClick={() => setShowVideoModal(false)}
                                className="p-2 rounded-full hover:bg-slate-200 focus:outline-none"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="p-1 sm:p-2 md:p-4">
                             <div className="relative w-full bg-slate-900 rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
                                <div className="absolute inset-0 flex items-center justify-center text-white p-4">
                                     <div className="text-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-400"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
                                        <p className="mt-4 font-medium">Video guide coming soon!</p>
                                        <p className="text-sm text-slate-400">This video will walk you through the core concepts of AI document analysis.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const blogPostsData = [
    {
        slug: "ai-logistics-revolution",
        title: "5 Ways AI is Revolutionizing Logistics Document Management",
        excerpt: "Discover how AI assistants are transforming logistics by providing instant access to SOPs, bills of lading, and route data, cutting delays and reducing errors.",
        content: `
            <p>The logistics industry runs on a mountain of paperwork: bills of lading, packing lists, customs forms, and complex operational manuals. Finding a single piece of critical information quickly can be the difference between a shipment that's on time and one that's stuck in port. This is where AI document analysis is becoming a game-changer.</p>
            <h3>1. Instant SOP and Procedure Lookup</h3>
            <p>Instead of manually searching a 200-page safety manual, a warehouse operator can ask, "What are the handling procedures for hazardous material UN 1263?" An AI assistant like FileSense can provide the exact steps in seconds, ensuring compliance and safety.</p>
            <h3>2. Accelerated Onboarding for New Staff</h3>
            <p>Getting new dispatchers or warehouse staff up to speed is a time-consuming process. With an AI assistant trained on your company's documents, new hires can ask questions like, "How do I process an international shipment with a commercial invoice?" and get immediate, accurate guidance without interrupting senior team members.</p>
            <h3>3. Faster Rate & Quote Retrieval</h3>
            <p>Logistics providers deal with complex rate sheets from multiple carriers. By uploading these Excel files, a freight broker can ask, "What is the LTL rate for a 500lb pallet from Karachi to Lahore?" The AI can parse the relevant spreadsheet and provide the answer instantly, accelerating the quoting process.</p>
            <h3>4. Improved Compliance and Auditing</h3>
            <p>Audits require quick access to specific records. An AI assistant can instantly respond to queries like, "Show me all bills of lading associated with customer XYZ Corp in July" or "Find all references to customs tariff code 9980 in our SOPs." This turns a multi-hour task into a matter of seconds.</p>
            <h3>5. Reducing Costly Human Errors</h3>
            <p>Whether it's a wrong shipping address or an incorrect handling procedure, small mistakes in logistics lead to big costs. By providing a single, easily searchable source of truth, an AI assistant dramatically reduces the chance of human error, leading to fewer delays, less wasted product, and happier customers.</p>
            <p>By transforming your static documents into an interactive, conversational knowledge base, FileSense empowers logistics teams to be faster, more accurate, and more efficient.</p>
        `
    },
    {
        slug: "filesense-vs-manual-search",
        title: "FileSense vs. Manual Searching: A Time-Saving Comparison",
        excerpt: "We break down the real cost of searching for information manually and show how an AI assistant can reclaim hours of your team's valuable time...",
        content: `<p>In any business, time is the most valuable resource...</p>`
    },
    { 
        slug: "analyze-sops-with-ai",
        title: "How to Analyze Documents Easily with AI", 
        excerpt: "Discover how AI can streamline your workflow by reading and interpreting complex documents in seconds...",
        content: `<p>Business documents are the backbone of any organized company...</p>`
    },
    { 
        slug: "ai-reads-excel",
        title: "Can AI Really Read and Understand Your Documents?", 
        excerpt: "We dive into the technology that allows our assistant to parse spreadsheets, PDFs, and more to provide accurate answers...",
        content: `<p>It sounds like science fiction, but it's a reality...</p>`
    },
];

const BlogPage = () => {
    const { setPage } = useApp();
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
                    <div className="text-center pt-8">
                        <button onClick={() => setPage('ai-document-analysis-guide')} className="text-lg font-bold text-indigo-700 hover:underline">
                            Read Our Ultimate Guide to AI Document Analysis &rarr;
                        </button>
                    </div>
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

const PricingPage = () => {
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
                     <div className="max-w-md mx-auto p-8 border-2 border-indigo-500 rounded-2xl shadow-2xl bg-white text-center">
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
                     </div>
                </div>
                 <div>
                    <h2 className="text-3xl font-bold mb-2">Purchase Credits (for Basic Users)</h2>
                    <p className="text-gray-600 mb-8">Keep the ads and top up your credits to continue the conversation.</p>
                    <div className="grid md:grid-cols-4 gap-8">
                        {creditPlans.map((plan) => (
                            <div key={plan.name} className={`p-6 border rounded-lg shadow-lg text-center ${plan.popular ? 'border-indigo-500 scale-105 bg-white' : 'bg-white/50'}`}>
                                <h3 className="text-2xl font-bold">{plan.name}</h3>
                                <p className="text-4xl font-extrabold my-4">{plan.price}</p>
                                <p className="text-lg font-semibold">{plan.credits} Credits</p>
                                <button className="mt-6 w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Purchase</button>
                            </div>
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

const ProfilePage = () => {
    const { user, userData, setUserData, setSopExists, setChat, setPage } = useApp();
    const [fullName, setFullName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [department, setDepartment] = useState('');
    const [contactNumber, setContactNumber] = useState('');

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
        try {
            const userRef = doc(db, "users", user.uid);
            const updatedData = { fullName, companyName, department, contactNumber };
            await updateDoc(userRef, updatedData);
            setUserData(prev => ({...prev, ...updatedData }));
            setMessage('Profile updated successfully!');
            setIsEditing(false);
        } catch (err) {
            setMessage('Error updating profile.');
        }
    };

    const handleClearMemory = async () => {
        if (!user) return;
        setShowConfirm(false);
        try {
            const token = await getIdToken(user);
            await axios.delete("https://sop-chat-backend.onrender.com/clear_memory", {
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
                        <button onClick={() => setShowConfirm(true)} className="px-5 py-2 bg-red-600 text-white rounded-md">Clear All Document Data</button>
                        <p className="text-sm text-slate-500 mt-2">This will permanently delete all uploaded documents. This action cannot be undone.</p>
                    </div>
                </div>
            </div>
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl">
                        <h3 className="text-lg font-bold">Are you sure?</h3>
                        <p className="my-4">This will delete all your data permanently.</p>
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

const AdminPage = () => {
    const { user } = useApp();
    const [users, setUsers] = useState([]);
    const [onlineStatus, setOnlineStatus] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const token = await getIdToken(user);
                const res = await axios.get("https://sop-chat-backend.onrender.com/admin/users", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsers(res.data);
            } catch (err) {
                setError("Could not load user data.");
            }
            setLoading(false);
        };
        fetchUsers();
    }, [user]);

    useEffect(() => {
        const statusRef = ref(rtdb, 'status/');
        const unsubscribe = onValue(statusRef, (snapshot) => {
            setOnlineStatus(snapshot.val() || {});
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="flex-1 p-8 bg-slate-100">
            <h2 className="text-3xl font-bold mb-6">Admin Dashboard</h2>
            {loading ? <p>Loading users...</p> : error ? <p className="text-red-500">{error}</p> : (
            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2">Status</th>
                            <th className="p-2">Name</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Version</th>
                            <th className="p-2">Credits</th>
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
                                <td className="p-2">{u.fullName}</td>
                                <td className="p-2">{u.email}</td>
                                <td className="p-2">{u.version}</td>
                                <td className="p-2">{u.credits}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}
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
                    console.error("Firestore Query Failed.", error);
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
    const { user, userData, setUserData, chat, setChat, sopExists, setSopExists, activeConversationId, setActiveConversationId, setIsStartingNewChat } = useApp();
    const [files, setFiles] = useState([]);
    const [message, setMessage] = useState("");
    const [loadingUpload, setLoadingUpload] = useState(false);
    const [loadingSend, setLoadingSend] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const checkSopStatus = async () => {
            if (!user) return;
            setLoadingStatus(true);
            try {
                const token = await getIdToken(user);
                const res = await axios.get("https://sop-chat-backend.onrender.com/status", { headers: { Authorization: `Bearer ${token}` } });
                setSopExists(res.data.sop_exists);
            } catch (error) {
                console.error("Could not check SOP status", error);
                setSopExists(false);
            }
            setLoadingStatus(false);
        };
        checkSopStatus();
    }, [user, setSopExists]);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);
    
    const handleFileChange = (e) => setFiles(Array.from(e.target.files));

    const handleUpload = async () => {
        if (files.length === 0 || !user) return;
        setLoadingUpload(true);
        try {
            const token = await getIdToken(user);
            const formData = new FormData();
            files.forEach(file => formData.append('file', file));
            await axios.post("https://sop-chat-backend.onrender.com/upload/", formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            setSopExists(true);
            setFiles([]);
        } catch (error) {
            console.error("File upload failed", error);
        }
        setLoadingUpload(false);
    };

    const saveConversation = async (updatedChat, conversationId) => {
        if (!user) return;
        const firstUserMessage = updatedChat.find(m => m.role === 'user')?.text || 'New Conversation';
        const title = firstUserMessage.substring(0, 50);
        
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

            const res = await axios.post("https://sop-chat-backend.onrender.com/chat/", { prompt: currentMessage, history }, { headers: { Authorization: `Bearer ${token}` } });
            const assistantMsg = { role: "assistant", text: res.data.response };
            const finalChat = [...newChat, assistantMsg];
            setChat(finalChat);
            await saveConversation(finalChat, currentConvId);

            const newCredits = (userData.credits || 0) - 1;
            await updateDoc(doc(db, "users", user.uid), { credits: newCredits });
            setUserData(prev => ({...prev, credits: newCredits}));

        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to get response.";
            const errorChat = [...newChat, { role: 'assistant', text: `Error: ${errorMsg}` }];
            setChat(errorChat);
            await saveConversation(errorChat, currentConvId);
        }
        setLoadingSend(false);
    };
    
    return (
        <div className="flex flex-1 overflow-hidden bg-slate-100">
            <main className="flex-1 w-full mx-auto flex flex-col items-center overflow-hidden">
                <div className="flex flex-col flex-1 bg-white/50 w-full max-w-5xl my-4 rounded-2xl shadow-lg overflow-hidden">
                       <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                            {(activeConversationId || isStartingNewChat) && (
                                <button onClick={() => { setActiveConversationId(null); setIsStartingNewChat(false); }} className="text-sm font-semibold text-indigo-600 hover:underline mb-4">&larr; Back to all conversations</button>
                            )}
                            
                            {loadingStatus ? (
                                 <div className="text-center p-8"><p className="animate-pulse">Checking for documents...</p></div>
                            ) : !sopExists ? (
                                <div className="text-center p-8 bg-slate-100 rounded-lg">
                                    <h3 className="font-semibold text-lg mb-2">Welcome, {userData?.fullName}!</h3>
                                    <p className="text-slate-600 mb-4">To get started, please upload one or more documents.</p>
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
                                                <button onClick={handleUpload} disabled={loadingUpload} className="w-full mt-2 bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-indigo-700">
                                                    {loadingUpload ? 'Uploading...' : `Upload ${files.length} File(s)`}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : chat.length === 0 ? (
                                 <div className="text-center p-8 text-slate-500">Your documents are ready. Ask a question to begin.</div>
                            ) : null}

                            {chat.map((c, i) => (
                                <div key={i} className={`flex items-start gap-4 ${c.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {c.role === 'assistant' && <AssistantAvatar />}
                                    <div className={`p-4 rounded-2xl max-w-2xl shadow-md ${c.role === "user" ? "bg-indigo-500 text-white rounded-br-none" : "bg-slate-100 text-slate-800 rounded-bl-none"}`}>
                                        <ReactMarkdown className="prose prose-sm max-w-none">{c.text}</ReactMarkdown>
                                    </div>
                                    {c.role === 'user' && <UserAvatar userData={userData} />}
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
                                <button type="button" title="Upload More Files" onClick={() => fileInputRef.current.click()} className="p-3 rounded-full hover:bg-slate-200">
                                    <UploadIcon />
                                </button>
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

// --- Headers & Footers ---
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
