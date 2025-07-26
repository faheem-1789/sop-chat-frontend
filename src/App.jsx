// src/App.jsx

import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import axios from "axios";
// In a real project, you would install these via npm:
// import { initializeApp } from "firebase/app";
// import { getAuth, ... } from "firebase/auth";
// import { getFirestore, ... } from "firebase/firestore";
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

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAA6U-oPKefpOdy6IsS6wXVmjgCTj3Jlow",
  authDomain: "sop-assistant-9dc2a.firebaseapp.com",
  projectId: "sop-assistant-9dc2a",
  storageBucket: "sop-assistant-9dc2a.appspot.com",
  messagingSenderId: "672105722476",
  appId: "1:672105722476:web:1d88461fdf6631b168de49",
  measurementId: "G-NB4Y7WGDKM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Authentication Context ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

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
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const value = { user, userData, setUserData, loading };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
    return useContext(AuthContext);
};

// --- Main App Component (Router) ---
export default function App() {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
}

const AppRouter = () => {
    const { user, loading } = useAuth();
    const [page, setPage] = useState('login'); // login, signup, chat, profile, pricing

    useEffect(() => {
        if (!loading) {
            if (user) {
                if (user.emailVerified) {
                    if (page === 'login' || page === 'signup' || page === 'verify-email') setPage('chat');
                } else {
                    if (page !== 'verify-email') setPage('verify-email');
                }
            } else {
                if (page !== 'signup') setPage('login');
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
            case 'chat': return <ChatPage setPage={setPage} />;
            case 'profile': return <ProfilePage setPage={setPage} />;
            case 'pricing': return <PricingPage setPage={setPage} />;
            case 'login':
            default: return <LoginPage setPage={setPage} />;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans">
            {renderPage()}
        </div>
    );
};


// --- Page Components ---

const LoginPage = ({ setPage }) => {
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
        <div className="flex items-center justify-center h-screen bg-slate-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
                <h2 className="text-3xl font-bold text-center text-slate-800">Welcome Back!</h2>
                {error && <p className="text-red-500 text-center text-sm bg-red-100 p-3 rounded-md">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                    <button type="submit" disabled={loading} className="w-full px-4 py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 font-semibold disabled:bg-indigo-400">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="text-center text-sm text-slate-600">
                    Don't have an account? <button onClick={() => setPage('signup')} className="font-semibold text-indigo-600 hover:underline">Sign Up</button>
                </p>
            </div>
        </div>
    );
};

const SignUpPage = ({ setPage }) => {
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
                createdAt: serverTimestamp(),
            });
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-slate-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
                <h2 className="text-3xl font-bold text-center text-slate-800">Create an Account</h2>
                {error && <p className="text-red-500 text-center text-sm bg-red-100 p-3 rounded-md">{error}</p>}
                <form onSubmit={handleSignUp} className="space-y-4">
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" required className="w-full px-4 py-3 border rounded-md" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-3 border rounded-md" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min. 6 characters)" required className="w-full px-4 py-3 border rounded-md" />
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company Name" className="w-full px-4 py-3 border rounded-md" />
                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" className="w-full px-4 py-3 border rounded-md" />
                    <button type="submit" disabled={loading} className="w-full px-4 py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 font-semibold disabled:bg-indigo-400">
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
                <p className="text-center text-sm text-slate-600">
                    Already have an account? <button onClick={() => setPage('login')} className="font-semibold text-indigo-600 hover:underline">Login</button>
                </p>
            </div>
        </div>
    );
};

const VerifyEmailPage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-4 bg-slate-100">
            <div className="bg-white p-10 rounded-2xl shadow-lg max-w-lg">
                <h2 className="text-3xl font-bold mb-4 text-slate-800">Verify Your Email</h2>
                <p className="text-slate-600 mb-6">A verification link has been sent to **{auth.currentUser?.email}**. Please check your inbox (and spam folder) and click the link to activate your account.</p>
                <button onClick={() => signOut(auth)} className="w-full px-4 py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 font-semibold">
                    Go to Login
                </button>
            </div>
        </div>
    );
};

const ProfilePage = ({ setPage }) => {
    const { user, userData, setUserData } = useAuth();
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [department, setDepartment] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');

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
    
    return (
        <>
            <Header setPage={setPage} />
            <div className="p-8 max-w-4xl mx-auto w-full">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-800">Profile</h2>
                    <button onClick={() => setIsEditing(!isEditing)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
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
                        {/* Form fields... */}
                        {isEditing && <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-md font-semibold">Save Changes</button>}
                    </form>
                </div>
                
                <div className="mt-8 bg-white p-8 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-bold mb-4 text-slate-800">Share Your Feedback</h3>
                    <textarea placeholder="Tell us about your experience..." className="w-full h-32 p-3 border rounded-md focus:ring-2 focus:ring-indigo-500"></textarea>
                    <button className="mt-4 px-5 py-2 bg-green-600 text-white rounded-md font-semibold">Submit Feedback</button>
                </div>
            </div>
        </>
    );
};

const PricingPage = ({ setPage }) => {
    const plans = [
        { name: 'Basic', credits: 20, price: '1,500 PKR' },
        { name: 'Standard', credits: 50, price: '5,000 PKR' },
        { name: 'Premium', credits: 100, price: '9,000 PKR', popular: true },
        { name: 'Ultra', credits: 'Unlimited', price: '25,000 PKR/mo' },
    ];

    return (
        <>
            <Header setPage={setPage} />
            <div className="p-8 text-center">
                <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
                <p className="text-gray-600 mb-8">Purchase credits to continue the conversation.</p>
                <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
                    {plans.map(plan => (
                        <div key={plan.name} className={`p-6 border rounded-lg shadow-lg ${plan.popular ? 'border-indigo-500' : ''}`}>
                            <h3 className="text-2xl font-bold">{plan.name}</h3>
                            <p className="text-4xl font-extrabold my-4">{plan.price}</p>
                            <p className="text-lg font-semibold">{plan.credits} Credits</p>
                            <button className="mt-6 w-full py-2 bg-indigo-600 text-white rounded-md">Purchase</button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

const ChatPage = ({ setPage }) => {
    const { user, userData, setUserData } = useAuth();
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [chat, setChat] = useState([]);
    const [message, setMessage] = useState("");
    const [loadingUpload, setLoadingUpload] = useState(false);
    const [loadingSend, setLoadingSend] = useState(false);
    const [isReadyToChat, setIsReadyToChat] = useState(false);

    const API_URL = "https://sop-chat-backend.onrender.com";

    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

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

            const newCredits = (userData.credits || 0) - 1;
            await updateDoc(doc(db, "users", user.uid), { credits: newCredits });
            setUserData(prev => ({...prev, credits: newCredits}));

        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to get response.";
            setChat(prev => [...prev, { role: 'assistant', text: `Error: ${errorMsg}` }]);
        } finally {
            setLoadingSend(false);
        }
    };
    
    // Placeholder for upload logic
    const handleUpload = () => {
        alert("Upload functionality to be connected to the backend.");
    };

    if (userData && userData.credits <= 0) {
        setPage('pricing');
        return null;
    }

    return (
        <div className="flex flex-col h-full">
            <Header setPage={setPage} />
            <main className="flex-1 w-full mx-auto flex flex-col items-center">
                <div className="flex flex-col flex-1 bg-white/50 w-full max-w-5xl mt-4 rounded-t-2xl shadow-lg">
                     <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                        {chat.map((c, i) => (
                            <div key={i} className={`flex items-start gap-4 ${c.role === "user" ? "justify-end" : "justify-start"}`}>
                                {c.role === 'assistant' && <div>Assistant</div>}
                                <div className={`p-4 rounded-2xl max-w-2xl ${c.role === "user" ? "bg-indigo-500 text-white" : "bg-slate-100"}`}>
                                    {c.text}
                                </div>
                                {c.role === 'user' && <div>You</div>}
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                     </div>
                     <div className="p-4 bg-white/80 border-t">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                            <input
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              className="border border-slate-300 p-4 w-full rounded-full"
                              placeholder="Ask a question..."
                            />
                            <button type="submit" className="bg-indigo-600 text-white p-3 rounded-full">Send</button>
                        </form>
                         <p className="text-right mt-2 text-sm font-semibold text-indigo-600">Credits Remaining: {userData?.credits}</p>
                     </div>
                </div>
            </main>
        </div>
    );
};

const Header = ({ setPage }) => {
    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <header className="bg-white/80 backdrop-blur-lg shadow-sm p-4 z-10 sticky top-0">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">SOP Assistant</h1>
                <nav className="flex items-center space-x-6">
                    <button onClick={() => setPage('chat')} className="font-semibold text-slate-600 hover:text-indigo-600">Chat</button>
                    <button onClick={() => setPage('profile')} className="font-semibold text-slate-600 hover:text-indigo-600">Profile</button>
                    <button onClick={() => setPage('pricing')} className="font-semibold text-slate-600 hover:text-indigo-600">Pricing</button>
                    <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-md text-sm font-semibold">Logout</button>
                </nav>
            </div>
        </header>
    );
};
