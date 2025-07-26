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
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
                setChat([]);
                setSopExists(false);
            } else {
                setUserData(null);
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
                    if (page === 'login' || page === 'signup' || page === 'verify-email') setPage('chat');
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
            case 'admin': return userData?.role === 'admin' ? <AdminPage /> : <ChatPage />; // Protect admin route
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
// ... (LoginPage, SignUpPage, VerifyEmailPage are the same)

const AdminPage = () => {
    const { user } = useApp();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!user) return;
            try {
                const token = await getIdToken(user);
                // This assumes a backend endpoint /admin/users
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
        fetchUsers();
    }, [user]);

    // ... (UI for displaying users in a table, with edit/delete buttons)

    return (
        <div className="flex flex-col h-full">
            <Header />
            <main className="flex-1 p-8">
                <h2 className="text-3xl font-bold mb-6">Admin Dashboard</h2>
                {loading ? <p>Loading users...</p> : (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Company</th>
                                    <th>Credits</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.uid}>
                                        <td>{u.fullName}</td>
                                        <td>{u.email}</td>
                                        <td>{u.companyName}</td>
                                        <td>{u.credits}</td>
                                        <td>{/* Edit/Delete Buttons */}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

const ChatPage = () => {
    const { user, userData, setUserData, chat, setChat, sopExists, setSopExists, setPage } = useApp();
    const isAdmin = userData?.role === 'admin';

    // ... (rest of the ChatPage logic is the same)
    
    const handleSendMessage = async (e) => {
        // ... (existing logic)
        try {
            // ... (existing logic)
            if (!isAdmin) { // Only deduct credits if not an admin
                const newCredits = (userData.credits || 0) - 1;
                await updateDoc(doc(db, "users", user.uid), { credits: newCredits });
                setUserData(prev => ({...prev, credits: newCredits}));
            }
        } catch (err) {
            // ... (existing logic)
        } finally {
            // ... (existing logic)
        }
    };

    if (!isAdmin && userData && userData.credits <= 0) {
        setPage('pricing');
        return null;
    }

    return (
        <div className="flex flex-col h-full">
            <Header />
            <main className="flex-1 w-full mx-auto flex flex-col items-center">
                {/* ... (rest of the ChatPage UI is the same) */}
                <p className="text-right mt-2 text-sm font-semibold text-indigo-600">
                    Credits Remaining: {isAdmin ? 'Unlimited' : userData?.credits}
                </p>
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
                <h1 className="text-2xl font-bold text-slate-800">SOP Assistant</h1>
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
