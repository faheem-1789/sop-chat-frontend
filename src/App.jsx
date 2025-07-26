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
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Firebase Configuration ---
// IMPORTANT: Replace with your actual Firebase config from your Firebase project console.
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
    const { user, userData, loading } = useAuth();
    const [page, setPage] = useState('login'); // login, signup, chat, profile, pricing

    useEffect(() => {
        if (!loading) {
            if (user) {
                if (user.emailVerified) {
                    if (page === 'login' || page === 'signup') setPage('chat');
                } else {
                    // If user is logged in but not verified, keep them on a page that shows the verification message.
                    if (page !== 'verify-email') setPage('verify-email');
                }
            } else {
                if (page !== 'signup') setPage('login');
            }
        }
    }, [user, userData, loading, page]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-slate-100"><div className="animate-pulse">Loading Application...</div></div>;
    }

    const renderPage = () => {
        if (user && !user.emailVerified) {
             return <VerifyEmailPage setPage={setPage} />;
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
            // The router's useEffect will handle navigation
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
                credits: 10, // 10 free credits on signup
                createdAt: serverTimestamp(),
            });
            // The router's useEffect will navigate to the verify email page
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

const VerifyEmailPage = ({ setPage }) => {
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
    const [fullName, setFullName] = useState(userData?.fullName || '');
    const [companyName, setCompanyName] = useState(userData?.companyName || '');
    const [department, setDepartment] = useState(userData?.department || '');
    const [contactNumber, setContactNumber] = useState(userData?.contactNumber || '');
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!user) return;
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
    // Pricing logic here...
    return (
        <>
            <Header setPage={setPage} />
            {/* ... Pricing page UI ... */}
        </>
    );
};


const ChatPage = ({ setPage }) => {
    const { userData, setUserData } = useAuth();

    // This is where your full chat UI logic will go.
    // For now, it's a placeholder.
    const handleSendMessage = async () => {
        // ... your sendMessage logic
        // After a successful response from the backend:
        const newCredits = userData.credits - 1;
        await updateDoc(doc(db, "users", auth.currentUser.uid), { credits: newCredits });
        setUserData(prev => ({...prev, credits: newCredits}));
    };

    if (userData && userData.credits <= 0) {
        return (
            <>
                <Header setPage={setPage} />
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <h2 className="text-2xl font-bold">You're out of credits!</h2>
                    <button onClick={() => setPage('pricing')} className="mt-4 px-6 py-3 bg-green-600 text-white rounded-md">Purchase More</button>
                </div>
            </>
        )
    }

    return (
        <>
            <Header setPage={setPage} />
            <div className="flex-1 p-4 flex flex-col">
                <div className="flex-1">
                    {/* Your chat messages display here */}
                </div>
                <div className="p-4">
                    <p className="text-right mb-2 text-sm font-semibold text-indigo-600">Credits Remaining: {userData?.credits}</p>
                    {/* Your chat input form here */}
                </div>
            </div>
        </>
    );
};

const Header = ({ setPage }) => {
    const handleLogout = async () => {
        await signOut(auth);
        // The router's useEffect will handle navigation to login
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
