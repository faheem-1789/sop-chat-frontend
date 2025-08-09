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
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg"
            >
                <h2 className="text-3xl font-bold text-center text-slate-800">Welcome Back!</h2>
                {error && <p className="text-red-500 text-center text-sm bg-red-100 p-3 rounded-md">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                    <button type="submit" disabled={loading} className="w-full px-4 py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 font-semibold disabled:bg-indigo-400 transform transition-transform hover:scale-105">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="text-center text-sm text-slate-600">
                    Don't have an account? <button onClick={() => setPage('signup')} className="font-semibold text-indigo-600 hover:underline">Sign Up</button>
                </p>
            </motion.div>
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
             <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg"
            >
                <h2 className="text-3xl font-bold text-center text-slate-800">Create an Account</h2>
                {error && <p className="text-red-500 text-center text-sm bg-red-100 p-3 rounded-md">{error}</p>}
                <form onSubmit={handleSignUp} className="space-y-4">
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" required className="w-full px-4 py-3 border rounded-md" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-3 border rounded-md" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min. 6 characters)" required className="w-full px-4 py-3 border rounded-md" />
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company Name" className="w-full px-4 py-3 border rounded-md" />
                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" className="w-full px-4 py-3 border rounded-md" />
                    <button type="submit" disabled={loading} className="w-full px-4 py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 font-semibold disabled:bg-indigo-400 transform transition-transform hover:scale-105">
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
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

const ProfilePage = () => {
    const { user, userData, setUserData, setSopExists, setChat, setPage } = useApp();
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
        try {
            const token = await getIdToken(user);
            // NOTE: The endpoint `/clear_memory` was not in the provided `main.py`. 
            // This call will fail unless you implement that endpoint in your backend.
            await axios.delete("https://sop-chat-backend.onrender.com/clear_memory", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSopExists(false);
            setChat([]);
            setShowConfirm(false);
            setPage('chat');
        } catch (error) {
            console.error("Failed to clear memory:", error);
            setMessage("Error clearing memory. Please try again.");
            setShowConfirm(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <Header />
            <main className="flex-1 w-full mx-auto flex flex-col items-center p-8">
                <div className="w-full max-w-4xl">
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
                            <button onClick={() => setShowConfirm(true)} className="px-5 py-2 bg-red-600 text-white rounded-md font-semibold">Clear All SOP Data</button>
                            <p className="text-sm text-slate-500 mt-2">This will permanently delete all uploaded documents and learned knowledge for your account. This action cannot be undone.</p>
                        </div>
                    </div>
                </div>
            </main>
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

const PricingPage = () => {
    const plans = [
        { name: 'Basic', credits: 20, price: '1,500 PKR' },
        { name: 'Standard', credits: 50, price: '5,000 PKR' },
        { name: 'Premium', credits: 100, price: '9,000 PKR', popular: true },
        { name: 'Ultra', credits: 'Unlimited', price: '25,000 PKR/mo' },
    ];

    return (
        <div className="flex flex-col h-full">
            <Header />
            <main className="flex-1 w-full mx-auto flex flex-col items-center p-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
                    <p className="text-gray-600 mb-8">Purchase credits to continue the conversation.</p>
                    <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
                        {plans.map((plan, index) => (
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
                        For payment details and methods, please contact: <strong className="text-indigo-600">faheemiqbal993@gmail.com</strong>
                    </p>
                </div>
            </main>
        </div>
    );
};

const AdminPage = () => {
    const { user } = useApp();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ name: '', email: '', company: '', department: '' });
    const [editingUser, setEditingUser] = useState(null);

    // State for create user modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', fullName: '', credits: 10 });

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

    useEffect(() => {
        fetchUsers();
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
                fetchUsers(); // Refresh the user list
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
        e.preventDefault();
        try {
            const token = await getIdToken(user);
            await axios.post(`https://sop-chat-backend.onrender.com/admin/users`, newUser, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowCreateModal(false);
            setNewUser({ email: '', password: '', fullName: '', credits: 10 }); // Reset form
            fetchUsers(); // Refresh
        } catch (error) {
            console.error("Failed to create user:", error);
            alert(`Failed to create user: ${error.response?.data?.detail || error.message}`);
        }
    };

    const filteredUsers = users.filter(u => 
        (u.fullName || '').toLowerCase().includes(filters.name.toLowerCase()) &&
        (u.email || '').toLowerCase().includes(filters.email.toLowerCase()) &&
        (u.companyName || '').toLowerCase().includes(filters.company.toLowerCase()) &&
        (u.department || '').toLowerCase().includes(filters.department.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            <Header />
            <main className="flex-1 p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold">Admin Dashboard</h2>
                    <button onClick={() => setShowCreateModal(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700">
                        <AddIcon /> Create User
                    </button>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                    <div className="grid grid-cols-4 gap-4">
                        <input type="text" name="name" value={filters.name} onChange={handleFilterChange} placeholder="Filter by Name..." className="px-3 py-2 border rounded-md" />
                        <input type="text" name="email" value={filters.email} onChange={handleFilterChange} placeholder="Filter by Email..." className="px-3 py-2 border rounded-md" />
                        <input type="text" name="company" value={filters.company} onChange={handleFilterChange} placeholder="Filter by Company..." className="px-3 py-2 border rounded-md" />
                        <input type="text" name="department" value={filters.department} onChange={handleFilterChange} placeholder="Filter by Department..." className="px-3 py-2 border rounded-md" />
                    </div>
                </div>
                {loading ? <p>Loading users...</p> : error ? <p className="text-red-500">{error}</p> : (
                    <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2">Status</th>
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Email</th>
                                    <th className="p-2">Company</th>
                                    <th className="p-2">Credits</th>
                                    <th className="p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? filteredUsers.map(u => (
                                    <tr key={u.uid} className="border-b hover:bg-slate-50">
                                        <td className="p-2">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                u.status === 'Online' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="p-2">{u.fullName}</td>
                                        <td className="p-2">{u.email}</td>
                                        <td className="p-2">{u.companyName}</td>
                                        <td className="p-2">{u.credits}</td>
                                        <td className="p-2 flex gap-2">
                                            <button onClick={() => handleEdit(u)} className="p-1 text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                            <button onClick={() => handleDelete(u.uid)} className="p-1 text-red-600 hover:text-red-800"><DeleteIcon /></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="text-center p-4 text-slate-500">No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Edit User: {editingUser.email}</h3>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                             <input value={editingUser.fullName} onChange={e => setEditingUser({...editingUser, fullName: e.target.value})} className="w-full p-2 border rounded" />
                             <input value={editingUser.companyName} onChange={e => setEditingUser({...editingUser, companyName: e.target.value})} className="w-full p-2 border rounded" />
                             <input value={editingUser.department} onChange={e => setEditingUser({...editingUser, department: e.target.value})} className="w-full p-2 border rounded" />
                             <input type="number" value={editingUser.credits} onChange={e => setEditingUser({...editingUser, credits: e.target.value})} className="w-full p-2 border rounded" />
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-md">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Create New User</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                             <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full p-2 border rounded" required />
                             <input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full p-2 border rounded" required />
                             <input type="text" placeholder="Full Name" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} className="w-full p-2 border rounded" required />
                             <input type="number" placeholder="Credits" value={newUser.credits} onChange={e => setNewUser({...newUser, credits: parseInt(e.target.value, 10)})} className="w-full p-2 border rounded" required />
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-md">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const ChatPage = () => {
    const { user, userData, setUserData, chat, setChat, sopExists, setSopExists, setPage } = useApp();
    const isAdmin = userData?.role === 'admin';
    const [files, setFiles] = useState([]);
    const [fileNames, setFileNames] = useState([]);
    const [message, setMessage] = useState("");
    const [loadingUpload, setLoadingUpload] = useState(false);
    const [loadingSend, setLoadingSend] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(true);
    
    const API_URL = "https://sop-chat-backend.onrender.com";
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

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
            setFiles(selectedFiles);
            setFileNames(selectedFiles.map(f => f.name));
        }
    };

    const handleUpload = async () => {
        if (files.length === 0 || !user) return;
        setLoadingUpload(true);
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
            setFileNames([]);
            setFiles([]);
            const allFileNames = files.map(f => f.name).join(', ');
            setChat([{role: 'assistant', text: `Successfully processed ${allFileNames}. You can now ask questions about them.`}]);
        } catch (error) {
            console.error("File upload failed", error);
            setChat([{role: 'assistant', text: "Sorry, there was an error processing your file."}]);
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
            {/* THIS IS THE FIX: The file input is moved here so it's always in the DOM for the ref to work */}
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
                            <div className="text-center p-8 bg-slate-100 rounded-lg">
                                <h3 className="font-semibold text-lg mb-2">Welcome, {userData?.fullName}!</h3>
                                <p className="text-slate-600 mb-4">To get started, please upload one or more SOP documents.</p>
                                <div className="flex items-center justify-center gap-2">
                                    <label onClick={() => fileInputRef.current.click()} className="cursor-pointer bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border hover:bg-slate-50 transition-colors">
                                      {fileNames.length > 0 ? `${fileNames.length} file(s) selected` : "Choose files..."}
                                    </label>
                                    <button onClick={handleUpload} disabled={files.length === 0 || loadingUpload} className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                        {loadingUpload ? "Uploading..." : "Upload"}
                                    </button>
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

const Header = () => {
    const { setPage, userData } = useApp();
    const handleLogout = async () => {
        await signOut(auth);
        setPage('login');
    };

    return (
        <header className="bg-white/80 backdrop-blur-lg shadow-sm p-4 z-10 sticky top-0">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
                 <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage('chat')}>
                    <Logo />
                    <h1 className="text-2xl font-bold text-slate-800">SOP Assistant</h1>
                </div>
                <nav className="flex items-center space-x-6">
                    {userData?.role === 'admin' && (
                        <button onClick={() => setPage('admin')} className="font-semibold text-red-600 hover:text-red-700 transition-colors">Admin</button>
                    )}
                    <button onClick={() => setPage('chat')} className="font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Chat</button>
                    <button onClick={() => setPage('profile')} className="font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Profile</button>
                    <button onClick={() => setPage('pricing')} className="font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Pricing</button>
                    <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-md text-sm font-semibold hover:bg-red-600 transform transition-transform hover:scale-105">Logout</button>
                </nav>
            </div>
        </header>
    );
};
