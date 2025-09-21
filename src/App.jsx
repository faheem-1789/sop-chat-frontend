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
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, addDoc, query, getDocs, orderBy, arrayUnion, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

// Firebase configuration
const firebaseConfig = {
  // Replace with your Firebase config object
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// App Context
const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(() => localStorage.getItem('currentPage') || 'home');
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [chat, setChat] = useState([]);
  const [sopExists, setSopExists] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          const workspaceIds = userDoc.data().workspaces || [];
          const workspacePromises = workspaceIds.map(id => getDoc(doc(db, 'workspaces', id)));
          const workspaceDocs = await Promise.all(workspacePromises);
          setWorkspaces(workspaceDocs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } else {
        setUserData(null);
        setChat([]);
        setActiveConversationId(null);
        setWorkspaces([]);
        setActiveWorkspaceId(null);
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

  const value = { user, userData, setUserData, loading, page, setPage, chat, setChat, sopExists, setSopExists, activeConversationId, setActiveConversationId, workspaces, setWorkspaces, activeWorkspaceId, setActiveWorkspaceId };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const useApp = () => useContext(AppContext);

// Blog Posts Data
const blogPostsData = [
  { slug: "analyze-sops-with-ai", title: "How to Analyze Documents Easily with AI", excerpt: "Discover how AI can streamline your workflow by reading and interpreting complex documents in seconds...", content: `<p>Business documents are the backbone of any organized company...</p>` },
  { slug: "ai-reads-excel", title: "AI-Powered Excel Analysis", excerpt: "Learn how AI can extract insights from Excel spreadsheets effortlessly.", content: `<p>Excel files are critical for data-driven decisions. Our AI reads and interprets complex spreadsheets...</p>` },
  { slug: "improve-efficiency", title: "Boost Efficiency with AI Document Management", excerpt: "Explore how AI can reduce manual document processing time.", content: `<p>Manual document processing is time-consuming. Discover how FileSense automates workflows...</p>` },
  { slug: "anatomy-of-sop", title: "The Anatomy of an Effective SOP", excerpt: "Understand the key components of a standard operating procedure.", content: `<p>A well-crafted SOP is essential for consistency. Learn its key elements...</p>` },
  { slug: "common-sop-mistakes", title: "Common SOP Mistakes to Avoid", excerpt: "Avoid pitfalls in creating standard operating procedures.", content: `<p>Creating SOPs can be tricky. Here are common mistakes and how to avoid them...</p>` },
  { slug: "integrating-ai-workflow", title: "Integrating AI into Your Workflow", excerpt: "Seamlessly integrate AI tools into your daily operations.", content: `<p>AI integration can transform your workflow. Learn best practices...</p>` },
  { slug: "ai-for-quality-control", title: "Using AI for Quality Control", excerpt: "Improve quality control with AI-driven document analysis.", content: `<p>Quality control is critical. See how AI enhances accuracy...</p>` },
  { slug: "future-of-document-management", title: "The Future of Document Management", excerpt: "Discover the next generation of document management with AI.", content: `<p>The future of document management is AI-driven. Explore upcoming trends...</p>` },
  { slug: "case-study-logistics", title: "Case Study: AI in Logistics", excerpt: "How AI transformed document handling in logistics.", content: `<p>This case study explores AI's impact on logistics document management...</p>` },
  { slug: "roi-on-ai", title: "Calculating ROI on AI Investments", excerpt: "Understand the return on investment for AI tools.", content: `<p>Investing in AI can yield significant returns. Learn how to calculate ROI...</p>` },
  { slug: "data-security-ai", title: "Data Security in AI Document Processing", excerpt: "Ensure your data remains secure with AI tools.", content: `<p>Data security is paramount. Discover how FileSense protects your data...</p>` },
  { slug: "beyond-vlookup", title: "Beyond VLOOKUP: AI for Excel", excerpt: "Move beyond traditional Excel functions with AI.", content: `<p>VLOOKUP is limited. See how AI revolutionizes Excel analysis...</p>` },
  { slug: "sop-for-startups", title: "SOPs for Startups", excerpt: "Why startups need standard operating procedures.", content: `<p>Startups thrive on efficiency. Learn why SOPs are crucial...</p>` },
  { slug: "ai-team-training", title: "Training Your Team on AI Tools", excerpt: "Best practices for onboarding your team to AI.", content: `<p>Effective AI adoption requires training. Discover how to train your team...</p>` },
  { slug: "top-industries-ai-sops", title: "Top Industries Using AI for SOPs", excerpt: "Explore industries leveraging AI for SOP management.", content: `<p>AI is transforming SOPs across industries. See which sectors benefit most...</p>` }
];

// Icons
const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="128" height="128" rx="24" fill="#4338CA"/>
    <path d="M48 32H80C84.4183 32 88 35.5817 88 40V72C88 76.4183 84.4183 80 80 80H72L64 88L56 80H48C43.5817 80 40 76.4183 40 72V40C40 35.5817 43.5817 32 48 32Z" fill="white"/>
    <path d="M56 48H72" stroke="#4338CA" strokeWidth="6" strokeLinecap="round"/>
    <path d="M56 60H72" stroke="#4338CA" strokeWidth="6" strokeLinecap="round"/>
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a1 1 0 011 1v1H9V4a1 1 0 011-1zM4 7h16" />
  </svg>
);

// Ad Components
const LeftAdPanel = () => (
  <div className="ad-container hidden lg:block w-64 bg-white p-4 shadow-md">
    <ins className="adsbygoogle"
         style={{ display: 'block' }}
         data-ad-client="ca-pub-7478653994670887"
         data-ad-slot="1234567890"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
  </div>
);

const RightAdPanel = () => (
  <div className="ad-container hidden lg:block w-64 bg-white p-4 shadow-md">
    <ins className="adsbygoogle"
         style={{ display: 'block' }}
         data-ad-client="ca-pub-7478653994670887"
         data-ad-slot="0987654321"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
  </div>
);

const AdSenseScript = () => (
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7478653994670887" crossOrigin="anonymous"></script>
);

// Header Components
const Header = () => {
  const { setPage } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const NavLink = ({ page, children }) => (
    <button onClick={() => { setPage(page); setIsMenuOpen(false); }} className="font-semibold text-slate-600 hover:text-indigo-600 transition-colors w-full text-left py-2 md:w-auto md:text-center md:py-0">
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
          <NavLink page="faq">FAQ</NavLink>
          <div className="h-6 w-px bg-slate-200"></div>
          <NavLink page="login">Login</NavLink>
          <NavLink page="signup">Sign Up</NavLink>
        </nav>
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-4 p-4 bg-white rounded-lg shadow-lg"
          >
            <nav className="flex flex-col space-y-2">
              <NavLink page="home">Home</NavLink>
              <NavLink page="blog">Blog</NavLink>
              <NavLink page="faq">FAQ</NavLink>
              <div className="border-t my-2"></div>
              <NavLink page="login">Login</NavLink>
              <NavLink page="signup">Sign Up</NavLink>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const LoggedInHeader = () => {
  const { setPage, userData } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleLogout = async () => {
    await signOut(auth);
    setPage('home');
  };
  const NavLink = ({ page, children, className = '' }) => (
    <button onClick={() => { setPage(page); setIsMenuOpen(false); }} className={`font-semibold text-slate-600 hover:text-indigo-600 transition-colors w-full text-left py-2 md:w-auto md:text-center md:py-0 ${className}`}>
      {children}
    </button>
  );
  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm p-4 z-40 sticky top-0">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage('chat')}>
          <Logo />
          <h1 className="text-2xl font-bold text-slate-800">FileSense</h1>
        </div>
        <nav className="hidden md:flex items-center space-x-6">
          <NavLink page="home">Home</NavLink>
          <NavLink page="blog">Blog</NavLink>
          <NavLink page="workspaces">Workspaces</NavLink>
          <div className="h-6 w-px bg-slate-200"></div>
          {userData?.role === 'admin' && (
            <NavLink page="admin" className="!text-red-600 hover:!text-red-700">Admin</NavLink>
          )}
          <NavLink page="chat">Chat</NavLink>
          <NavLink page="profile">Profile</NavLink>
          <NavLink page="pricing">Pricing</NavLink>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-md text-sm font-semibold hover:bg-red-600 transform transition-transform hover:scale-105">Logout</button>
        </nav>
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-4 p-4 bg-white rounded-lg shadow-lg"
          >
            <nav className="flex flex-col space-y-2">
              <NavLink page="chat">Chat</NavLink>
              <NavLink page="workspaces">Workspaces</NavLink>
              <NavLink page="profile">Profile</NavLink>
              <NavLink page="pricing">Pricing</NavLink>
              {userData?.role === 'admin' && (
                <NavLink page="admin" className="!text-red-600 hover:!text-red-700">Admin</NavLink>
              )}
              <div className="border-t my-2"></div>
              <NavLink page="home">Home</NavLink>
              <NavLink page="blog">Blog</NavLink>
              <NavLink page="faq">FAQ</NavLink>
              <div className="border-t my-2"></div>
              <button onClick={handleLogout} className="w-full mt-2 px-4 py-2 bg-red-500 text-white rounded-md text-sm font-semibold hover:bg-red-600">Logout</button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

// Footer
const Footer = () => {
  const { setPage } = useApp();
  return (
    <footer className="bg-slate-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Logo />
              <h2 className="text-xl font-bold">FileSense</h2>
            </div>
            <p className="text-slate-400">Empowering businesses with AI-driven document analysis.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><button onClick={() => setPage('home')} className="text-slate-400 hover:text-white">Home</button></li>
              <li><button onClick={() => setPage('blog')} className="text-slate-400 hover:text-white">Blog</button></li>
              <li><button onClick={() => setPage('faq')} className="text-slate-400 hover:text-white">FAQ</button></li>
              <li><button onClick={() => setPage('contact')} className="text-slate-400 hover:text-white">Contact</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><button onClick={() => setPage('privacy')} className="text-slate-400 hover:text-white">Privacy Policy</button></li>
              <li><button onClick={() => setPage('terms')} className="text-slate-400 hover:text-white">Terms of Service</button></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-700 pt-4 text-center">
          <p className="text-slate-400">&copy; {new Date().getFullYear()} FileSense. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// Pages
const HomePage = () => (
  <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-3xl"
    >
      <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Unlock Insights with FileSense</h1>
      <p className="text-lg text-slate-600 mb-6">Upload your business documents and let our AI read, interpret, and answer your questions in seconds.</p>
      <button onClick={() => useApp().setPage('signup')} className="px-6 py-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transform transition-transform hover:scale-105">Get Started</button>
    </motion.div>
  </div>
);

const LoggedInDashboard = () => (
  <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-3xl"
    >
      <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Welcome Back!</h1>
      <p className="text-lg text-slate-600 mb-6">Ready to dive into your documents? Start chatting or manage your profile.</p>
      <div className="space-x-4">
        <button onClick={() => useApp().setPage('chat')} className="px-6 py-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transform transition-transform hover:scale-105">Go to Chat</button>
        <button onClick={() => useApp().setPage('profile')} className="px-6 py-3 bg-slate-600 text-white rounded-md font-semibold hover:bg-slate-700 transform transition-transform hover:scale-105">Profile</button>
      </div>
    </motion.div>
  </div>
);

const AboutPage = () => (
  <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl"
    >
      <h1 className="text-3xl font-bold text-slate-800 mb-4">About FileSense</h1>
      <p className="text-slate-600 mb-4">FileSense is an AI-powered platform designed to help businesses analyze and understand their documents effortlessly. From SOPs to spreadsheets, our AI reads and provides insights in real-time.</p>
      <p className="text-slate-600">Our mission is to streamline workflows and empower teams with intelligent document processing.</p>
    </motion.div>
  </div>
);

const ContactPage = () => (
  <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl"
    >
      <h1 className="text-3xl font-bold text-slate-800 mb-4">Contact Us</h1>
      <p className="text-slate-600 mb-4">Have questions or need support? Reach out to us!</p>
      <p className="text-slate-600">Email: support@filesense.com</p>
    </motion.div>
  </div>
);

const PrivacyPolicyPage = () => (
  <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl"
    >
      <h1 className="text-3xl font-bold text-slate-800 mb-4">Privacy Policy</h1>
      <p className="text-slate-600 mb-4">At FileSense, we are committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your data.</p>
      <p className="text-slate-600">Last updated: August 24, 2025</p>
    </motion.div>
  </div>
);

const TermsOfServicePage = () => (
  <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl"
    >
      <h1 className="text-3xl font-bold text-slate-800 mb-4">Terms of Service</h1>
      <p className="text-slate-600 mb-4">By using FileSense, you agree to these terms of service. Please read them carefully.</p>
      <p className="text-slate-600">Last updated: August 24, 2025</p>
    </motion.div>
  </div>
);

const BlogPage = () => {
  const { setPage } = useApp();
  return (
    <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Blog</h1>
        <div className="grid gap-6 md:grid-cols-2">
          {blogPostsData.map(post => (
            <div key={post.slug} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-slate-800">{post.title}</h2>
              <p className="text-slate-600 mt-2">{post.excerpt}</p>
              <button onClick={() => setPage(`blog/${post.slug}`)} className="mt-4 text-indigo-600 font-semibold hover:text-indigo-700">Read More</button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const BlogPostPage = () => {
  const { page } = useApp();
  const slug = page.split('/')[1];
  const post = blogPostsData.find(p => p.slug === slug);
  if (!post) {
    return <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">Post not found</div>;
  }
  return (
    <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full"
      >
        <h1 className="text-3xl font-bold text-slate-800 mb-4">{post.title}</h1>
        <ReactMarkdown className="prose text-slate-600">{post.content}</ReactMarkdown>
      </motion.div>
    </div>
  );
};

const FAQPage = () => (
  <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl w-full"
    >
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Frequently Asked Questions</h1>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">What file types are supported?</h3>
          <p className="text-slate-600">FileSense supports PDF, PPTX, DOCX, XLSX, and XLS files.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">How secure is my data?</h3>
          <p className="text-slate-600">We use industry-standard encryption and Firebase security rules to protect your data.</p>
        </div>
      </div>
    </motion.div>
  </div>
);

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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        setPage('verify-email');
        return;
      }
      setPage('chat');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg"
      >
        <h2 className="text-3xl font-bold text-slate-800">Welcome Back!</h2>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transform transition-transform hover:scale-105"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-sm text-slate-600">
          Don't have an account?{' '}
          <button onClick={() => setPage('signup')} className="text-indigo-600 hover:text-indigo-700 font-semibold">
            Sign Up
          </button>
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
  const [contactNumber, setContactNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        email,
        fullName,
        companyName,
        department,
        contactNumber,
        role: 'user',
        version: 'basic',
        credits: 10,
        createdAt: serverTimestamp(),
        workspaces: [],
      });
      setPage('verify-email');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg"
      >
        <h2 className="text-3xl font-bold text-slate-800">Join FileSense</h2>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Full Name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Company Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Department"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Number</label>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Contact Number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transform transition-transform hover:scale-105"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-sm text-slate-600">
          Already have an account?{' '}
          <button onClick={() => setPage('login')} className="text-indigo-600 hover:text-indigo-700 font-semibold">
            Login
          </button>
        </p>
      </motion.div>
    </div>
  );
};

const VerifyEmailPage = () => {
  const { user, setPage } = useApp();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResendEmail = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('');
    try {
      await sendEmailVerification(user);
      setMessage('Verification email sent! Please check your inbox.');
    } catch (err) {
      setMessage('Error sending verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg"
      >
        <h2 className="text-3xl font-bold text-slate-800">Verify Your Email</h2>
        <p className="text-slate-600">A verification email has been sent to your inbox. Please verify your email to continue.</p>
        {message && <p className={`text-sm ${message.includes('Error') ? 'text-red-500 bg-red-100' : 'text-green-500 bg-green-100'} p-3 rounded-md`}>{message}</p>}
        <button
          onClick={handleResendEmail}
          disabled={loading}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transform transition-transform hover:scale-105"
        >
          {loading ? 'Sending...' : 'Resend Verification Email'}
        </button>
        <button
          onClick={() => setPage('login')}
          className="w-full px-4 py-2 bg-slate-600 text-white rounded-md font-semibold hover:bg-slate-700 transform transition-transform hover:scale-105"
        >
          Back to Login
        </button>
      </motion.div>
    </div>
  );
};

const ProfilePageContent = () => {
  const { user, userData, setUserData, setSopExists, setChat, setPage } = useApp();
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [department, setDepartment] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
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
    setError('');
    try {
      const userRef = doc(db, "users", user.uid);
      const updatedData = { fullName, companyName, department, contactNumber };
      await updateDoc(userRef, updatedData);
      setUserData(prev => ({...prev, ...updatedData}));
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError('Error updating profile.');
    }
  };

  const handleClearMemory = async () => {
    if (!user) return;
    setError('');
    setMessage('');
    try {
      const token = await getIdToken(user);
      const response = await axios.delete("https://sop-chat-backend.onrender.com/clear_memory", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSopExists(false);
      setChat([]);
      setShowConfirm(false);
      setMessage(response.data.message || 'All data cleared successfully!');
      setPage('chat');
    } catch (error) {
      console.error("Failed to clear memory:", error);
      setError(`Error clearing data: ${error.response?.data?.detail || error.message}`);
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
        {message && <p className="text-green-500 mb-4 bg-green-100 p-3 rounded-md">{message}</p>}
        {error && <p className="text-red-500 mb-4 bg-red-100 p-3 rounded-md">{error}</p>}
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
        <div className="mt-8 bg-white p-8 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-slate-800">Danger Zone</h3>
          <div className="border-t pt-4">
            <button onClick={() => setShowConfirm(true)} className="px-5 py-2 bg-red-600 text-white rounded-md font-semibold">Clear All Document Data</button>
            <p className="text-sm text-slate-500 mt-2">This will permanently delete all uploaded documents and learned knowledge for your account. This action cannot be undone.</p>
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

const PricingPage = () => (
  <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl w-full"
    >
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Pricing</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-slate-800">Basic</h2>
          <p className="text-slate-600 mt-2">Free plan with limited features and ads.</p>
          <p className="text-2xl font-bold text-slate-800 mt-4">$0/month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-slate-800">Premium</h2>
          <p className="text-slate-600 mt-2">Ad-free experience with unlimited credits.</p>
          <p className="text-2xl font-bold text-slate-800 mt-4">Contact for pricing</p>
        </div>
      </div>
    </motion.div>
  </div>
);

const AdminPageContent = () => {
  const { user } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', companyName: '', version: 'basic', credits: 0 });

  const fetchUsers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getIdToken(user);
      const res = await axios.get("https://sop-chat-backend.onrender.com/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const handleEdit = (user) => {
    setEditingUser(user.uid);
    setFormData({ fullName: user.fullName, email: user.email, companyName: user.companyName, version: user.version, credits: user.credits });
  };

  const handleUpdate = async (uid) => {
    try {
      const token = await getIdToken(user);
      await axios.put(`https://sop-chat-backend.onrender.com/admin/users/${uid}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const handleDelete = async (uid) => {
    try {
      const token = await getIdToken(user);
      await axios.delete(`https://sop-chat-backend.onrender.com/admin/users/${uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  return (
    <div className="flex-1 p-8 bg-slate-100">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Admin Dashboard</h2>
      {loading ? (
        <p className="text-slate-600">Loading users...</p>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-200">
              <th className="p-4">Status</th>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Company</th>
              <th className="p-4">Version</th>
              <th className="p-4">Credits</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.uid} className="border-b">
                <td className="p-4">{u.status}</td>
                <td className="p-4">
                  {editingUser === u.uid ? (
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="px-2 py-1 border rounded-md"
                    />
                  ) : (
                    u.fullName
                  )}
                </td>
                <td className="p-4">{u.email}</td>
                <td className="p-4">
                  {editingUser === u.uid ? (
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="px-2 py-1 border rounded-md"
                    />
                  ) : (
                    u.companyName
                  )}
                </td>
                <td className="p-4">
                  {editingUser === u.uid ? (
                    <select
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      className="px-2 py-1 border rounded-md"
                    >
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                    </select>
                  ) : (
                    u.version
                  )}
                </td>
                <td className="p-4">
                  {editingUser === u.uid ? (
                    <input
                      type="number"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                      className="px-2 py-1 border rounded-md"
                    />
                  ) : (
                    u.credits
                  )}
                </td>
                <td className="p-4 flex space-x-2">
                  {editingUser === u.uid ? (
                    <button onClick={() => handleUpdate(u.uid)} className="px-2 py-1 bg-indigo-600 text-white rounded-md">Save</button>
                  ) : (
                    <button onClick={() => handleEdit(u)} className="text-indigo-600"><EditIcon /></button>
                  )}
                  <button onClick={() => handleDelete(u.uid)} className="text-red-600"><DeleteIcon /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const AdminPage = () => (
  <div className="flex flex-col min-h-screen">
    <LoggedInHeader />
    <AdminPageContent />
  </div>
);

const WorkspacesPage = () => {
  const { user, workspaces, setWorkspaces, setActiveWorkspaceId, setPage } = useApp();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const token = await getIdToken(user);
      const response = await axios.post(
        'https://sop-chat-backend.onrender.com/workspaces',
        { name, companyName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newWorkspace = { id: response.data.workspaceId, name, companyName, ownerId: user.uid, members: [{ uid: user.uid, role: 'admin' }] };
      setWorkspaces([...workspaces, newWorkspace]);
      setMessage('Workspace created successfully!');
      setName('');
      setCompanyName('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error creating workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (workspaceId) => {
    if (!user || !inviteEmail) return;
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const token = await getIdToken(user);
      await axios.post(
        `https://sop-chat-backend.onrender.com/workspaces/${workspaceId}/invite`,
        { email: inviteEmail, role: inviteRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('User invited successfully!');
      setInviteEmail('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error inviting user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full mx-auto flex flex-col items-center p-8 bg-slate-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Workspaces</h1>
        {message && <p className="text-green-500 bg-green-100 p-3 rounded-md mb-4">{message}</p>}
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Create Workspace</h2>
          <form onSubmit={handleCreateWorkspace} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Workspace Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Workspace Name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Company Name"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </form>
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Your Workspaces</h2>
        {workspaces.length === 0 ? (
          <p className="text-slate-600">No workspaces found. Create one to get started!</p>
        ) : (
          <div className="space-y-4">
            {workspaces.map(workspace => (
              <div key={workspace.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{workspace.name}</h3>
                    <p className="text-slate-600">{workspace.companyName}</p>
                    <p className="text-sm text-slate-500">Role: {workspace.members.find(m => m.uid === user.uid)?.role}</p>
                  </div>
                  <button
                    onClick={() => { setActiveWorkspaceId(workspace.id); setPage('chat'); }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700"
                  >
                    Open Workspace
                  </button>
                </div>
                {workspace.ownerId === user.uid && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Invite Member</h4>
                    <div className="flex space-x-4">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        placeholder="Invitee Email"
                      />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleInvite(workspace.id)}
                        disabled={loading || !inviteEmail}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400"
                      >
                        {loading ? 'Inviting...' : 'Invite'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ... (Previous imports and components remain unchanged up to ChatPageContent)

const ChatPageContent = () => {
  const { user, userData, setUserData, chat, setChat, sopExists, setSopExists, activeConversationId, setActiveConversationId, activeWorkspaceId, setPage } = useApp();
  const isAdmin = userData?.role === 'admin';
  const isBasicVersion = userData?.version === 'basic';
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isUploadingMore, setIsUploadingMore] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const API_URL = "https://sop-chat-backend.onrender.com";
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [workspaceRole, setWorkspaceRole] = useState(null);

  useEffect(() => {
    if (activeWorkspaceId && user) {
      const fetchRole = async () => {
        const workspaceDoc = await getDoc(doc(db, 'workspaces', activeWorkspaceId));
        if (workspaceDoc.exists()) {
          const members = workspaceDoc.data().members || [];
          const member = members.find(m => m.uid === user.uid);
          setWorkspaceRole(member?.role || 'viewer');
        }
      };
      fetchRole();
    } else {
      setWorkspaceRole('admin');
    }
  }, [activeWorkspaceId, user]);

  useEffect(() => {
    if (user && activeConversationId === null) {
      setLoadingConversations(true);
      const convRef = activeWorkspaceId 
        ? collection(db, 'workspaces', activeWorkspaceId, 'conversations')
        : collection(db, 'users', user.uid, 'conversations');
      const q = query(convRef, orderBy("lastUpdated", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const convList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setConversations(convList);
        setLoadingConversations(false);
      }, (error) => {
        console.error("Firestore Real-Time Error:", error);
        setLoadingConversations(false);
      });
      return () => unsubscribe();
    }
  }, [user, activeConversationId, activeWorkspaceId]);

  useEffect(() => {
    const checkSopStatus = async () => {
      if (!user) return;
      setLoadingStatus(true);
      try {
        const token = await getIdToken(user);
        const res = await axios.get(`${API_URL}/status`, { 
          headers: { Authorization: `Bearer ${token}` },
          params: activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {}
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
  }, [user, setSopExists, activeWorkspaceId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleFileChange = (e) => {
    if (workspaceRole === 'viewer') {
      setToast({ show: true, message: 'Viewers cannot upload files.', type: 'error' });
      return;
    }
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const invalidFiles = selectedFiles.filter(file => !validTypes.includes(file.type) || file.size > maxSize);
    if (invalidFiles.length > 0) {
      setToast({ show: true, message: 'Invalid files detected. Only PDF, PPTX, DOCX, XLSX, XLS files up to 10MB are allowed.', type: 'error' });
      return;
    }
    if (sopExists) {
      handleUpload(selectedFiles, true);
    } else {
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleUpload = async (filesToUpload, isMoreUpload = false) => {
    if (filesToUpload.length === 0 || !user) return;
    if (workspaceRole === 'viewer') {
      setToast({ show: true, message: 'Viewers cannot upload files.', type: 'error' });
      return;
    }
    const loadingSetter = isMoreUpload ? setIsUploadingMore : setLoadingUpload;
    loadingSetter(true);
    const wasInitialUpload = !sopExists;
    let newMessages = [];

    try {
      const token = await getIdToken(user);
      let summary = null;
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post(`${API_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
          params: activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {}
        });
        summary = res.data.summary;
      }
      setSopExists(true);
      if (wasInitialUpload) {
        newMessages.push({ role: 'system', content: 'Document uploaded successfully! You can now ask questions about your document.' });
      }
      if (summary) {
        newMessages.push({ role: 'system', content: summary });
      }
      setChat([...chat, ...newMessages]);
      setFiles([]);
      fileInputRef.current.value = null;
      if (userData.credits > 0) {
        const newCredits = userData.credits - filesToUpload.length;
        setUserData({ ...userData, credits: newCredits });
        await updateDoc(doc(db, 'users', user.uid), { credits: newCredits });
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      setToast({ show: true, message: `Error uploading files: ${error.response?.data?.detail || error.message}`, type: 'error' });
    } finally {
      loadingSetter(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user || loadingSend || (isBasicVersion && userData.credits <= 0)) return;
    if (workspaceRole === 'viewer') {
      setToast({ show: true, message: 'Viewers cannot send messages.', type: 'error' });
      return;
    }
    setLoadingSend(true);
    const newMessages = [...chat, { role: 'user', content: message }];
    setChat(newMessages);

    try {
      const token = await getIdToken(user);
      const history = newMessages.map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      }));
      const res = await axios.post(`${API_URL}/chat`, { prompt: message, history }, {
        headers: { Authorization: `Bearer ${token}` },
        params: activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {}
      });
      const botMessage = { role: 'assistant', content: res.data.response };
      setChat([...newMessages, botMessage]);

      const convRef = activeWorkspaceId 
        ? collection(db, 'workspaces', activeWorkspaceId, 'conversations')
        : collection(db, 'users', user.uid, 'conversations');
      const conversationId = activeConversationId || (await addDoc(convRef, {
        messages: [...newMessages, botMessage],
        lastUpdated: serverTimestamp()
      })).id;
      if (!activeConversationId) {
        setActiveConversationId(conversationId);
      } else {
        await updateDoc(doc(convRef, activeConversationId), {
          messages: [...newMessages, botMessage],
          lastUpdated: serverTimestamp()
        });
      }

      if (isBasicVersion && userData.credits > 0) {
        const newCredits = userData.credits - 1;
        setUserData({ ...userData, credits: newCredits });
        await updateDoc(doc(db, 'users', user.uid), { credits: newCredits });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setToast({ show: true, message: `Error: ${error.response?.data?.detail || error.message}`, type: 'error' });
    } finally {
      setLoadingSend(false);
      setMessage("");
    }
  };

  const handleConversationSelect = async (conversationId) => {
    setActiveConversationId(conversationId);
    const convRef = activeWorkspaceId 
      ? doc(db, 'workspaces', activeWorkspaceId, 'conversations', conversationId)
      : doc(db, 'users', user.uid, 'conversations', conversationId);
    const convDoc = await getDoc(convRef);
    if (convDoc.exists()) {
      setChat(convDoc.data().messages || []);
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setChat([]);
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  if (loadingStatus) {
    return (
      <div className="flex-1 w-full mx-auto flex flex-col items-center justify-center p-8 bg-slate-100">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full mx-auto flex p-8 bg-slate-100">
      <LeftAdPanel />
      <div className="flex-1 max-w-4xl mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-slate-800">{activeWorkspaceId ? 'Workspace Chat' : 'Chat'}</h2>
          <button onClick={handleNewConversation} className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transform transition-transform hover:scale-105">
            New Conversation
          </button>
        </div>
        {!sopExists && (
          <div className="bg-white p-8 rounded-2xl shadow-lg mb-6 text-center">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Upload a Document</h3>
            <p className="text-slate-600 mb-4">Upload a PDF, PPTX, DOCX, XLSX, or XLS file (up to 10MB) to start analyzing.</p>
            <input
              type="file"
              accept=".pdf,.pptx,.docx,.xlsx,.xls"
              multiple
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={loadingUpload || workspaceRole === 'viewer'}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transform transition-transform hover:scale-105"
            >
              {loadingUpload ? 'Uploading...' : 'Upload Document'}
            </button>
            {files.length > 0 && (
              <div className="mt-4">
                <p className="text-slate-600 mb-2">Selected Files:</p>
                <ul className="text-sm text-slate-600">
                  {files.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpload(files)}
                  disabled={loadingUpload || workspaceRole === 'viewer'}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-green-400 transform transition-transform hover:scale-105"
                >
                  {loadingUpload ? 'Processing...' : 'Confirm Upload'}
                </button>
              </div>
            )}
          </div>
        )}
        {sopExists && (
          <>
            <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800">Conversations</h3>
                {isAdmin && (
                  <button
                    onClick={() => setPage('admin')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transform transition-transform hover:scale-105"
                  >
                    Admin Dashboard
                  </button>
                )}
              </div>
              {loadingConversations ? (
                <p className="text-slate-600 mt-4">Loading conversations...</p>
              ) : conversations.length === 0 ? (
                <p className="text-slate-600 mt-4">No conversations yet.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => handleConversationSelect(conv.id)}
                      className={`w-full text-left p-3 rounded-md ${activeConversationId === conv.id ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'} hover:bg-indigo-50 transition-colors`}
                    >
                      Conversation {conv.id.slice(0, 8)}... ({new Date(conv.lastUpdated?.seconds * 1000).toLocaleString()})
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto max-h-[60vh] mb-4">
                {chat.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`inline-block p-4 rounded-lg max-w-[70%] ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : msg.role === 'system'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {isBasicVersion && (
                <p className="text-sm text-slate-600 mb-2">
                  Credits remaining: {userData.credits} {userData.credits <= 0 && '(Upgrade to continue)'}
                </p>
              )}
              <div className="flex space-x-2">
                <input
                  type="file"
                  accept=".pdf,.pptx,.docx,.xlsx,.xls"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={isUploadingMore || workspaceRole === 'viewer'}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transform transition-transform hover:scale-105"
                >
                  {isUploadingMore ? 'Uploading...' : 'Upload More'}
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about your document..."
                  disabled={loadingSend || (isBasicVersion && userData.credits <= 0) || workspaceRole === 'viewer'}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loadingSend || !message.trim() || (isBasicVersion && userData.credits <= 0) || workspaceRole === 'viewer'}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transform transition-transform hover:scale-105"
                >
                  {loadingSend ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        )}
        {toast.show && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg ${toast.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {toast.message}
          </div>
        )}
      </div>
      <RightAdPanel />
    </div>
  );
};

// Main App Component
const App = () => {
  const { user, userData, loading, page } = useApp();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-slate-100">Loading...</div>;
  }

  const renderPage = () => {
    if (user) {
      switch (page) {
        case 'chat':
          return <ChatPageContent />;
        case 'profile':
          return <ProfilePageContent />;
        case 'pricing':
          return <PricingPage />;
        case 'admin':
          return userData?.role === 'admin' ? <AdminPage /> : <LoggedInDashboard />;
        case 'workspaces':
          return <WorkspacesPage />;
        default:
          return <LoggedInDashboard />;
      }
    } else {
      if (page.startsWith('blog/')) {
        return <BlogPostPage />;
      }
      switch (page) {
        case 'home':
          return <HomePage />;
        case 'blog':
          return <BlogPage />;
        case 'faq':
          return <FAQPage />;
        case 'about':
          return <AboutPage />;
        case 'contact':
          return <ContactPage />;
        case 'privacy':
          return <PrivacyPolicyPage />;
        case 'terms':
          return <TermsOfServicePage />;
        case 'login':
          return <LoginPage />;
        case 'signup':
          return <SignUpPage />;
        case 'verify-email':
          return <VerifyEmailPage />;
        default:
          return <HomePage />;
      }
    }
  };

  return (
    <AppProvider>
      <div className="flex flex-col min-h-screen">
        {user ? <LoggedInHeader /> : <Header />}
        {renderPage()}
        <Footer />
      </div>
    </AppProvider>
  );
};

export default App;
