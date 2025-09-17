import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged,
    signInWithCustomToken
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    onSnapshot, 
    doc, 
    updateDoc, 
    deleteDoc,
    setLogLevel
} from 'firebase/firestore';

// --- Helper Icon Components ---
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400 hover:text-red-500 transition-colors">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

const ClipboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
);

// --- Main App Component ---
export default function App() {
    // --- State Management ---
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    
    const taskInputRef = useRef(null);

    // --- Firebase Initialization and Auth ---
    useEffect(() => {
        try {
            // These global variables are provided by the execution environment.
            const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

            if (!firebaseConfig.apiKey) {
                setError("Firebase configuration is missing. The app cannot connect to the database.");
                setIsLoading(false);
                return;
            }

            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            setLogLevel('debug');

            setDb(dbInstance);
            setAuth(authInstance);

            const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    try {
                        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                            await signInWithCustomToken(authInstance, __initial_auth_token);
                        } else {
                            await signInAnonymously(authInstance);
                        }
                    } catch (authError) {
                        console.error("Authentication Error:", authError);
                        setError("Failed to authenticate. Please refresh the page.");
                    }
                }
                setIsAuthReady(true);
                setIsLoading(false);
            });

            return () => unsubscribe();
        } catch (e) {
            console.error("Firebase Initialization Error:", e);
            setError("Could not initialize the application. Check the console for more details.");
            setIsLoading(false);
        }
    }, []);

    // --- Firestore Data Fetching ---
    useEffect(() => {
        if (!isAuthReady || !db) {
            return;
        }

        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const tasksCollectionPath = `artifacts/${appId}/public/data/tasks`;
        const q = query(collection(db, tasksCollectionPath));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const tasksData = [];
            querySnapshot.forEach((doc) => {
                tasksData.push({ id: doc.id, ...doc.data() });
            });
            // Sort tasks by creation time, newest first
            tasksData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setTasks(tasksData);
        }, (err) => {
            console.error("Firestore Snapshot Error:", err);
            setError("Failed to sync tasks. Please check your connection.");
        });

        return () => unsubscribe();

    }, [isAuthReady, db]);

    // --- Firestore Actions ---
    const addTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim() || !db || !userId) return;

        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const tasksCollectionPath = `artifacts/${appId}/public/data/tasks`;
        
        try {
            await addDoc(collection(db, tasksCollectionPath), {
                text: newTask.trim(),
                completed: false,
                createdAt: new Date(),
                ownerId: userId,
            });
            setNewTask('');
        } catch (err) {
            console.error("Error adding task:", err);
            setError("Could not add the new task.");
        }
    };

    const toggleTask = async (task) => {
        if (!db) return;
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const taskDocRef = doc(db, `artifacts/${appId}/public/data/tasks`, task.id);
        try {
            await updateDoc(taskDocRef, {
                completed: !task.completed,
            });
        } catch (err) {
            console.error("Error toggling task:", err);
            setError("Could not update the task status.");
        }
    };

    const deleteTask = async (taskId) => {
        if (!db) return;
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const taskDocRef = doc(db, `artifacts/${appId}/public/data/tasks`, taskId);
        try {
            await deleteDoc(taskDocRef);
        } catch (err) {
            console.error("Error deleting task:", err);
            setError("Could not delete the task.");
        }
    };
    
    const copyUserId = () => {
        if (userId) {
            const tempInput = document.createElement('input');
            tempInput.value = userId;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    // --- Render Logic ---
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-2 text-gray-600">Connecting to workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="font-sans bg-gray-50 text-gray-800 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200/80">
                <header className="p-6 border-b border-gray-200">
                    <h1 className="text-3xl font-bold text-gray-900">Collaborative To-Do List</h1>
                    <p className="mt-2 text-gray-500">Tasks are updated in real-time for all users.</p>
                </header>

                {userId && (
                    <div className="px-6 py-3 bg-blue-50 border-b border-gray-200 flex justify-between items-center text-sm text-blue-800 rounded-t-none">
                        <span className="font-mono truncate pr-4" title={userId}>Your User ID: {userId}</span>
                        <button 
                            onClick={copyUserId}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition-all text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                        >
                            {copied ? 'Copied!' : 'Copy ID'}
                            {!copied && <ClipboardIcon />}
                        </button>
                    </div>
                )}
                
                <div className="p-6">
                    <form onSubmit={addTask} className="flex items-center gap-3">
                        <input
                            ref={taskInputRef}
                            type="text"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder="Add a new task..."
                            className="flex-grow w-full px-4 py-3 text-base text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        />
                        <button 
                            type="submit" 
                            className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform transform active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={!newTask.trim()}
                        >
                            Add
                        </button>
                    </form>
                </div>
                
                {error && (
                    <div className="px-6 pb-4">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
                           <p>{error}</p>
                        </div>
                    </div>
                )}

                <div className="px-6 pb-6">
                    <ul className="space-y-3">
                        {tasks.length > 0 ? (
                            tasks.map(task => (
                                <li key={task.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                    <div 
                                        className="flex items-center cursor-pointer flex-grow"
                                        onClick={() => toggleTask(task)}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 mr-4 ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                            {task.completed && (
                                                <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className={`flex-grow break-all ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                            {task.text}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => deleteTask(task.id)} 
                                        className="ml-4 flex-shrink-0 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                                        aria-label="Delete task"
                                    >
                                        <TrashIcon />
                                    </button>
                                </li>
                            ))
                        ) : (
                            <div className="text-center py-10 px-4">
                                <h3 className="text-lg font-medium text-gray-700">No tasks yet!</h3>
                                <p className="text-gray-500 mt-1">Add a task above to get started.</p>
                            </div>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
