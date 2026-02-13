import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, Package, ShoppingCart, FileText, 
  Settings, Sun, Moon, Search, Plus, Trash2, 
  Save, X, Upload, RotateCcw, Camera, Download,
  TrendingUp, AlertCircle, ChevronRight, ChevronLeft, DollarSign, Image as ImageIcon,
  User, Lock, ClipboardList, Crop, RotateCw, Move, Maximize2, ArrowRight, RefreshCcw, MessageSquarePlus, MinusCircle, ZoomIn, ZoomOut, Unlock,
  History, ShieldCheck, Copy, Replace, ClipboardCheck, Store, Wallet, Truck, Menu, MapPin, Phone, Edit, Folder,
  Key, MessageSquare, LogIn, LogOut, ShieldAlert, FileJson, UploadCloud, Tag, Calendar, XCircle, Printer, FileSpreadsheet, Pencil, Globe, Music, Database

} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import * as XLSX from 'xlsx';

import MapMissionControl from './MapMissionControl';
import JourneyView from './JourneyView';
import StockOpnameView from './StockOpnameView';
import MerchantSalesView from './MerchantSalesView';
import MusicPlayer from './MusicPlayer';

// --- MAP ENGINE IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup, Tooltip as LeafletTooltip, useMap, useMapEvents, Rectangle, LayersControl, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";        // <-- WAS MISSING
import { getAnalytics } from "firebase/analytics";   // <-- WAS MISSING
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  GoogleAuthProvider,
  setPersistence,        // <--- ADD THIS
  browserLocalPersistence // <--- ADD THIS
} from 'firebase/auth';

import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, // <--- THIS WAS MISSING!
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp, 
  query, 
  orderBy, 
  runTransaction, 
  writeBatch
} from "firebase/firestore";


// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyC9Qr2w0K_RbygNvrzVW1ALE8SmLH6qK_4",
  authDomain: "cello-inventory-manager.firebaseapp.com",
  projectId: "cello-inventory-manager",
  storageBucket: "cello-inventory-manager.firebasestorage.app",
  messagingSenderId: "168352992942",
  appId: "1:168352992942:web:3702ffb579bec0a93ea73f",
  measurementId: "G-CM3Z2Q412T"
};
// Pinpoint: Add to your existing firebase/auth or firestore imports
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";

// ... imports ...

const app = initializeApp(firebaseConfig);
let analytics;
try { analytics = getAnalytics(app); } catch (e) { console.warn("Analytics blocked"); }
const auth = getAuth(app);
const db = getFirestore(app);

// Pinpoint: Right below const db = getFirestore(app);
const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();

// --- MISSING LINE: ADD THIS BACK ---
const appId = "cello-inventory-manager"; 
// ----------------------------------

// --- CONSTANTS ---
const ADMIN_PASS = "KomuroMangetsu02";

// --- UTILITIES ---
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
};

const getCurrentDate = () => new Date().toISOString().split('T')[0];

const getRandomColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + "00000".substring(0, 6 - c.length) + c;
};

const convertToBks = (qty, unit, product) => {
    if (!product) return qty;
    const packsPerSlop = product.packsPerSlop || 10;
    const slopsPerBal = product.slopsPerBal || 20;
    const balsPerCarton = product.balsPerCarton || 4;

    if (unit === 'Slop') return qty * packsPerSlop;
    if (unit === 'Bal') return qty * slopsPerBal * packsPerSlop;
    if (unit === 'Karton') return qty * balsPerCarton * slopsPerBal * packsPerSlop;
    return qty; 
};

// --- GLOBAL COMPONENTS (MOVED UP TO PREVENT CRASH) ---

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + entry.value, 0);
    return (
      <div className="bg-white dark:bg-slate-800 p-4 border dark:border-slate-600 shadow-xl rounded-xl text-sm">
        <p className="font-bold mb-2 border-b pb-1 dark:border-slate-600 dark:text-white">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between items-center gap-4 mb-1">
             <span style={{ color: entry.color }} className="font-medium">{entry.name}:</span>
             <span className="font-mono dark:text-slate-300">{formatRupiah(entry.value)}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t dark:border-slate-600 flex justify-between font-bold dark:text-white">
            <span>Total Sales:</span>
            <span>{formatRupiah(total)}</span>
        </div>
      </div>
    );
  }
  return null;
};

const DatabaseBackupIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>;


// --- HIGH PERFORMANCE IMAGE CROPPER (FIXED: BORDER ON TOP) ---
const ImageCropper = ({ imageSrc, onCancel, onCrop, dimensions, onDimensionsChange, face }) => {
  const imgRef = useRef(null);
  const boxRef = useRef(null);
  const containerRef = useRef(null);
  
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  // Mutable state for drag logic
  const state = useRef({
    isDragging: false,
    dragType: null,
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
    initialW: 200,
    initialH: 200,
    panX: 0,
    panY: 0,
    w: 200,
    h: 200
  });

  useEffect(() => {
    if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const padding = 60;
        let axisX = 'w'; let axisY = 'h';
        if (face === 'left' || face === 'right') axisX = 'd';
        if (face === 'top' || face === 'bottom') axisY = 'd';
        
        const ratio = dimensions[axisX] / dimensions[axisY];
        let initialW, initialH;
        
        if (ratio > 1) { 
            initialW = Math.min(320, width - padding); 
            initialH = initialW / ratio; 
        } else { 
            initialH = Math.min(320, height - padding); 
            initialW = initialH * ratio; 
        }

        state.current.w = initialW;
        state.current.h = initialH;
        if(boxRef.current) {
            boxRef.current.style.width = `${initialW}px`;
            boxRef.current.style.height = `${initialH}px`;
        }
    }
  }, [face, dimensions]);

  useEffect(() => {
    updateImageTransform();
  }, [zoom, rotation]);

  const updateImageTransform = () => {
    if (imgRef.current) {
        imgRef.current.style.transform = `translate3d(-50%, -50%, 0) translate3d(${state.current.panX}px, ${state.current.panY}px, 0) scale(${zoom}) rotate(${rotation}deg)`;
    }
  };

  const handleMouseDown = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    state.current.isDragging = true;
    state.current.dragType = type;
    state.current.startX = e.clientX;
    state.current.startY = e.clientY;
    state.current.initialPanX = state.current.panX;
    state.current.initialPanY = state.current.panY;
    state.current.initialW = state.current.w;
    state.current.initialH = state.current.h;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!state.current.isDragging) return;
    const dx = e.clientX - state.current.startX;
    const dy = e.clientY - state.current.startY;

    if (state.current.dragType === 'move') {
        state.current.panX = state.current.initialPanX + dx;
        state.current.panY = state.current.initialPanY + dy;
        updateImageTransform();
    } else {
        let newW = state.current.initialW;
        let newH = state.current.initialH;
        if (state.current.dragType.includes('r')) newW = Math.max(50, state.current.initialW + dx);
        if (state.current.dragType.includes('b')) newH = Math.max(50, state.current.initialH + dy);
        state.current.w = newW;
        state.current.h = newH;
        if (boxRef.current) {
            boxRef.current.style.width = `${newW}px`;
            boxRef.current.style.height = `${newH}px`;
        }
    }
  };

  const onMouseUp = () => {
    state.current.isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  const executeCrop = () => {
    const canvas = document.createElement('canvas'); 
    const BASE_RES = 500;
    const ratio = state.current.w / state.current.h;
    if (ratio > 1) { canvas.width = BASE_RES; canvas.height = BASE_RES / ratio; } 
    else { canvas.height = BASE_RES; canvas.width = BASE_RES * ratio; }
    
    const ctx = canvas.getContext('2d'); 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = imgRef.current; 
    ctx.translate(canvas.width / 2, canvas.height / 2); 
    ctx.rotate((rotation * Math.PI) / 180);
    const scaleFactor = canvas.width / state.current.w; 
    ctx.translate(state.current.panX * scaleFactor, state.current.panY * scaleFactor); 
    ctx.scale(zoom * scaleFactor, zoom * scaleFactor);
    if (img) ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    onCrop(canvas.toDataURL('image/png', 1.0));
  };
  
  const DimSlider = ({ label, val, axis }) => (
    <div className="flex flex-col mb-4">
        <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400">{label}</label>
            <div className="flex items-center gap-1">
                <input type="number" value={val} onChange={(e) => onDimensionsChange({...dimensions, [axis]: Math.max(1, parseInt(e.target.value) || 0)})} className="w-12 text-right text-xs font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded text-slate-700 dark:text-slate-200 border border-transparent focus:border-orange-500 outline-none"/>
                <span className="text-[10px] text-slate-400">mm</span>
            </div>
        </div>
        <input type="range" min="1" max="300" step="1" value={val} onChange={(e) => onDimensionsChange({...dimensions, [axis]: parseInt(e.target.value)})} className="w-full h-3 rounded-full appearance-none cursor-pointer accent-orange-500 bg-orange-100 dark:bg-orange-900/30"/>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        {/* WORKSPACE */}
        <div className="flex-1 flex flex-col bg-slate-900 relative select-none">
            <div className="p-4 z-30 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide"><Crop size={14} className="text-cyan-400"/> Align {face}</h3>
                </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center overflow-hidden relative" ref={containerRef}>
                {/* CROP BOX */}
                <div 
                    ref={boxRef}
                    className="relative"
                    style={{ width: 200, height: 200 }} 
                >
                    {/* --- 1. IMAGE LAYER (Z-10) - RENDERED FIRST --- */}
                    <div className="absolute inset-0 overflow-visible cursor-move z-10" onMouseDown={(e) => handleMouseDown(e, 'move')}>
                        <img 
                            ref={imgRef}
                            src={imageSrc} 
                            className="absolute max-w-none origin-center" 
                            style={{ 
                                left: '50%', 
                                top: '50%', 
                                transform: `translate3d(-50%, -50%, 0) scale(${zoom}) rotate(${rotation}deg)`,
                                userSelect: 'none', 
                                pointerEvents: 'none'
                            }}
                        />
                    </div>

                    {/* --- 2. BORDER & SHADOW LAYER (Z-20) - RENDERED SECOND --- */}
                    {/* This shadow dims the area outside the box, and the border sits ON TOP of the image */}
                    <div className="absolute inset-0 border-[3px] border-cyan-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] z-20 pointer-events-none"></div>
                    
                    {/* --- 3. HANDLES LAYER (Z-30) - RENDERED LAST --- */}
                    <div className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-6 h-12 bg-white border-2 border-cyan-500 rounded-full z-30 cursor-ew-resize flex items-center justify-center shadow-lg" onMouseDown={(e) => handleMouseDown(e, 'resize-r')}><Move size={12} className="text-cyan-600 rotate-90"/></div>
                    <div className="absolute bottom-[-12px] left-1/2 -translate-x-1/2 h-6 w-12 bg-white border-2 border-cyan-500 rounded-full z-30 cursor-ns-resize flex items-center justify-center shadow-lg" onMouseDown={(e) => handleMouseDown(e, 'resize-b')}><Move size={12} className="text-cyan-600"/></div>
                    <div className="absolute bottom-[-10px] right-[-10px] w-8 h-8 bg-cyan-500 border-4 border-white rounded-full z-30 cursor-nwse-resize shadow-lg" onMouseDown={(e) => handleMouseDown(e, 'resize-rb')}/>
                </div>
            </div>
        </div>

        {/* SIDEBAR */}
        <div className="w-full md:w-80 bg-white dark:bg-slate-900 p-6 flex flex-col gap-6 border-l dark:border-slate-700 overflow-y-auto z-40">
            <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <Maximize2 size={18} className="text-orange-500"/>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">3D Size</h4>
                    </div>
                </div>
                <div><DimSlider label="Width" val={dimensions.w} axis="w" /><DimSlider label="Height" val={dimensions.h} axis="h" /><DimSlider label="Depth" val={dimensions.d} axis="d" /></div>
            </div>
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between mb-2"><label className="text-xs font-bold text-slate-500 block">ZOOM</label><span className="text-xs text-slate-400">{zoom.toFixed(2)}x</span></div>
                    <input type="range" min="0.1" max="5" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-cyan-500"/>
                </div>
                <div>
                    <div className="flex justify-between mb-2 items-center">
                        <label className="text-xs font-bold text-slate-500 block">ROTATE</label>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setRotation(r => r - 90)} className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"><RotateCcw size={14} /></button>
                            <button onClick={() => setRotation(r => r + 90)} className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"><RotateCw size={14} /></button>
                        </div>
                    </div>
                    <input type="range" min="-180" max="180" step="1" value={rotation} onChange={(e) => setRotation(parseFloat(e.target.value))} className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-cyan-500"/>
                </div>
            </div>
            <div className="mt-auto pt-4 flex gap-3">
                <button onClick={onCancel} className="px-6 py-4 rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={executeCrop} className="flex-1 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-orange-500/40 transition-all transform active:scale-95"><Crop size={20}/> Crop & Save</button>
            </div>
        </div>
      </div>
    </div>
  );
};

const AdminAuthModal = ({ onClose, onSuccess }) => {
    const [pass, setPass] = useState("");
    const [error, setError] = useState(false);
    const handleSubmit = (e) => { e.preventDefault(); if (pass === ADMIN_PASS) { onSuccess(); } else { setError(true); setTimeout(() => setError(false), 500); } };
    return (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className={`bg-white dark:bg-slate-900 w-full max-w-sm p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center ${error ? 'animate-shake' : ''}`}>
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400"><Lock size={32} /></div>
                <h2 className="text-xl font-bold dark:text-white mb-1">Admin Access</h2>
                <form onSubmit={handleSubmit} className="w-full mt-4"><input type="password" autoFocus value={pass} onChange={(e) => setPass(e.target.value)} className={`w-full p-3 rounded-xl border outline-none dark:bg-slate-800 dark:text-white font-mono ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'}`} placeholder="Password" /><div className="flex gap-3 mt-4"><button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-500">Cancel</button><button type="submit" className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold">Unlock</button></div></form>
            </div>
        </div>
    );
};

const CapybaraMascot = ({ isDiscoMode, message, messages = [], onClick, staticImageSrc, user, scale }) => {
    // --- LOCAL ASSETS (PUBLIC FOLDER) ---
    const NORMAL_IMAGE_URL = "/mr capy.png"; 
    const DISCO_VIDEO_URL = "/Bit_Capybara_Fortnite_Dance_Video.mp4";
    const DISCO_MUSIC_URL = "/disco_music.mp3";
    // ------------------------------------ // <--- ADDED user

// Inside CapybaraMascot component
useEffect(() => {
    const lastBackup = localStorage.getItem('last_usb_backup');
    const now = new Date().getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    // If it's been more than 7 days, force a reminder peek
    if (!lastBackup || (now - lastBackup) > sevenDays) {
        setInternalMsg("⚠️ PROTOCOL ALERT: TIME FOR USB SAFE BACKUP!");
        setIsPeeking(true);
    }
}, []);

// Update this when you click the Physical Safe button
const handlePhysicalBackup = () => {
    handleBackupData(); // Your existing backup function
    localStorage.setItem('last_usb_backup', new Date().getTime());
    triggerCapy("Physical safety confirmed! See you next week. 💾");
};

    // FALLBACK MESSAGES
    const LOGGED_IN_MESSAGES = [
        "Welcome back, Boss!",
        "Stock looks good today.",
        "Don't forget to record samples!",
        "Sales are looking up! 📈",
        "I love organization. And watermelons. 🍉",
        "Did you know Capybaras are the largest rodents?",
        "Remember to hydrate while you work! 💧",
        "System systems go! 🚀",
        "Any new products to add?",
        "You are doing great today! ⭐"
    ];

    const LOCKED_MESSAGES = [
        "System Locked. 🔒",
        "Please identify yourself.",
        "I cannot let you in without a badge.",
        "Access Denied. 🛑",
        "Who goes there?"
    ];

    // Select messages based on User status
    const DEFAULT_MESSAGES = user ? LOGGED_IN_MESSAGES : LOCKED_MESSAGES;


    // Combine passed messages with defaults if empty
    const dialogueList = messages.length > 0 ? messages : DEFAULT_MESSAGES;

    // STATE
    const [isPeeking, setIsPeeking] = useState(false);
    const [isHiding, setIsHiding] = useState(false); 
    const [internalMsg, setInternalMsg] = useState(""); 
    
    // SEQUENCE TRACKER (Starts at 0)
    const msgIndexRef = useRef(0);

    // 1. HANDLE MUSIC
    useEffect(() => {
        let audio = null;
        if (isDiscoMode) {
            audio = new Audio(DISCO_MUSIC_URL);
            audio.volume = 0.6; 
            audio.loop = true;  
            audio.play().catch(e => console.log("Audio blocked:", e));
        }
        return () => { if (audio) { audio.pause(); audio.currentTime = 0; } };
    }, [isDiscoMode]);

    // 2. SEQUENTIAL PEEKING LOGIC
    useEffect(() => {
        if (isDiscoMode) return; 

        let peekTimer;
        let hideTimer;

        const scheduleNextPeek = () => {
            const nextPeekTime = Math.random() * 30000 + 10000; // 10-40s random interval
            
            peekTimer = setTimeout(() => {
                // GET NEXT MESSAGE IN ORDER
                const currentIndex = msgIndexRef.current;
                const nextText = dialogueList[currentIndex];
                
                // Set text
                setInternalMsg(nextText);
                
                // Advance index for NEXT time (Loop back to 0 if at end)
                msgIndexRef.current = (currentIndex + 1) % dialogueList.length;

                // Show him
                setIsPeeking(true);
                setIsHiding(false);

                // Hide after 6 seconds
                hideTimer = setTimeout(() => {
                    handleHide();
                }, 6000); 

            }, nextPeekTime);
        };

        const handleHide = () => {
            setIsHiding(true); 
            setTimeout(() => {
                setIsPeeking(false);
                setIsHiding(false);
                setInternalMsg(""); 
                scheduleNextPeek(); 
            }, 1000);
        };

        scheduleNextPeek();
        return () => { clearTimeout(peekTimer); clearTimeout(hideTimer); };
    }, [isDiscoMode, dialogueList]); // Re-run if list changes

    // 3. SMART CLICK LOGIC
    const onMascotClick = () => {
        if (message || internalMsg) {
            setIsHiding(true);
            setTimeout(() => {
                setIsPeeking(false);
                setInternalMsg("");
            }, 500); 
        } else {
            if (onClick) onClick(); 
            setIsHiding(false);     
        }
    };

    // --- RENDER: DISCO MODE ---
    if (isDiscoMode) {
        return (
            <>
                <div className="fixed inset-0 z-[100] pointer-events-none animate-disco-lights mix-blend-overlay opacity-60"></div>
                <div className="fixed bottom-0 right-4 z-[102] cursor-pointer animate-bounce-high" onClick={onClick}>
                    <div className="relative w-56 h-56 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-pink-500 shadow-[0_0_50px_#ec4899]">
                        <video src={DISCO_VIDEO_URL} autoPlay loop muted className="w-full h-full object-cover"/>
                    </div>
                </div>
                <style>{`
                    @keyframes disco-lights { 0% { background: linear-gradient(45deg, red, blue); } 50% { background: linear-gradient(45deg, lime, yellow); } 100% { background: linear-gradient(45deg, purple, red); } }
                    @keyframes bounce-high { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
                    .animate-disco-lights { animation: disco-lights 2s infinite linear alternate; }
                    .animate-bounce-high { animation: bounce-high 0.8s infinite ease-in-out; }
                `}</style>
            </>
        );
    }

    // --- RENDER: NORMAL MODE ---
    const activeMessage = message || internalMsg; 
    const showMascot = isPeeking || message; 
    const slideClass = isHiding ? 'translate-x-[120%]' : 'translate-x-0'; 
    const initialClass = 'translate-x-[120%]';

    return (
        <div 
            className={`fixed bottom-0 right-0 z-[9999] transition-transform duration-700 ease-in-out cursor-pointer group ${showMascot ? slideClass : initialClass}`}
            onClick={onMascotClick}
            style={{ willChange: 'transform', marginBottom: '0px', marginRight: '0px' }} 
        >
            {/* --- APPLY SCALE TO THIS INNER DIV --- */}
            <div 
                className="relative w-32 h-32 md:w-48 md:h-48 transition-transform duration-300 origin-bottom-right"
                style={{ transform: `scale(${scale || 1})` }}
            > 
                
                {/* Reduced Size */}
                
                {/* HIGH CONTRAST SPEECH BUBBLE */}
                {activeMessage && (
                    <div className="absolute bottom-[85%] right-[20%] z-20 animate-pop-in pointer-events-none">
                        {/* Force white bg and black text with !important via style prop to override theme */}
                        <div 
                            className="relative border-4 border-green-600 p-3 min-w-[140px] max-w-[180px] text-center shadow-[4px_4px_0px_0px_rgba(0,100,0,0.5)]"
                            style={{ backgroundColor: '#ffffff', color: '#000000' }} 
                        >
                            <p className="text-[10px] font-bold font-mono leading-tight uppercase tracking-wide" style={{ color: '#000000' }}>
                                {activeMessage}
                            </p>
                            {/* Speech arrow */}
                            <div className="absolute -bottom-3 right-8 w-4 h-4 border-r-4 border-b-4 border-green-600 rotate-45" style={{ backgroundColor: '#ffffff' }}></div>
                        </div>
                    </div>
                )}

                <img 
                    src={NORMAL_IMAGE_URL} 
                    alt="Mascot" 
                    className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:brightness-110 transition-all origin-bottom-right" // Added glow
                    onError={(e) => { e.target.onerror = null; e.target.src="https://api.dicebear.com/7.x/avataaars/svg?seed=CapyStandard"; }}
                />
            </div>
            <style>{`
                @keyframes pop-in { 0% { transform: scale(0) translateY(20px); opacity: 0; } 80% { transform: scale(1.1) translateY(-5px); opacity: 1; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
                .animate-pop-in { animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
            `}</style>
        </div>
    );
}

// --- FIXED: EXAMINE MODAL (RESIDENT EVIL STYLE AUTO-ROTATION) ---
const ExamineModal = ({ product, onClose, onUpdateProduct, isAdmin }) => {
  const [rotation, setRotation] = useState({ x: -15, y: 25 });
  const [isDragging, setIsDragging] = useState(false);
  const [viewScale, setViewScale] = useState(2.8);
  const [isScaleLocked, setIsScaleLocked] = useState(false);
  
  const lastMousePos = useRef({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState(product.dimensions || { w: 55, h: 90, d: 22 });
  const initialRotation = { x: -15, y: 25 };

  // --- NEW: AUTO-ROTATION LOOP ---
  useEffect(() => {
    let animationFrameId;

    const animate = () => {
      // Only rotate if the user is NOT holding the object
      if (!isDragging) {
        setRotation(prev => ({ ...prev, y: prev.y + 0.4 })); // 0.4 is a nice slow "Item Box" speed
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    // Start loop
    animationFrameId = requestAnimationFrame(animate);

    // Cleanup when closing
    return () => cancelAnimationFrame(animationFrameId);
  }, [isDragging]); // Re-binds when dragging state changes
  // -------------------------------

  const handleDimensionsChange = (newDims) => { setDimensions(newDims); if (onUpdateProduct) onUpdateProduct({ ...product, dimensions: newDims }); };
  const handleReset = () => { setRotation(initialRotation); setViewScale(2.8); };
  const handleZoom = (delta) => { if (isScaleLocked) return; setViewScale(prev => Math.min(5, Math.max(0.5, prev + delta))); };
  
  const w = dimensions.w * viewScale; const h = dimensions.h * viewScale; const d = dimensions.d * viewScale;
  
  const handleMouseDown = (e) => { setIsDragging(true); lastMousePos.current = { x: e.clientX, y: e.clientY }; };
  
  const handleMouseMove = (e) => { 
      if (!isDragging) return; 
      const deltaX = e.clientX - lastMousePos.current.x; 
      const deltaY = e.clientY - lastMousePos.current.y; 
      setRotation(prev => ({ x: prev.x - deltaY * 0.5, y: prev.y + deltaX * 0.5 })); 
      lastMousePos.current = { x: e.clientX, y: e.clientY }; 
  };
  
  const handleMouseUp = () => setIsDragging(false);
  
  const renderFace = (imageSrc, defaultColor = "bg-white") => { if (imageSrc) return <img src={imageSrc} className="w-full h-full object-cover" alt="texture" />; return <div className={`w-full h-full ${defaultColor} border border-slate-400 opacity-90`}></div>; };
  
  const images = product.images || {};
  const frontImage = images.front || product.image;
  const backImage = product.useFrontForBack ? frontImage : images.back;
  
  const BoxSlider = ({ label, val, axis }) => (
    <div className="flex flex-col gap-1"><div className="flex justify-between text-[10px] text-white/70 uppercase font-bold"><span>{label}</span><span>{val}mm</span></div><input type="range" min="10" max="300" step="1" value={val} onChange={(e) => handleDimensionsChange({ ...dimensions, [axis]: parseInt(e.target.value) })} className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-orange-500" onMouseDown={(e) => e.stopPropagation()}/></div>
  );

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4 overflow-hidden" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <button onClick={onClose} className="absolute top-8 right-8 text-white hover:text-red-500 z-50 p-2 bg-black/20 rounded-full"><X size={40} /></button>
      
      <div className="absolute top-8 right-24 z-50 flex gap-2" onMouseDown={(e) => e.stopPropagation()}>
         <button onClick={() => handleZoom(-0.2)} className="p-2 bg-black/60 text-white rounded-full hover:bg-white/20"><ZoomOut size={18}/></button>
         <button onClick={() => setIsScaleLocked(!isScaleLocked)} className={`p-2 rounded-full hover:bg-white/20 ${isScaleLocked ? 'bg-orange-600 text-white' : 'bg-black/60 text-white'}`}>{isScaleLocked ? <Lock size={18}/> : <Unlock size={18}/>}</button>
         <button onClick={() => handleZoom(0.2)} className="p-2 bg-black/60 text-white rounded-full hover:bg-white/20"><ZoomIn size={18}/></button>
      </div>

      {isAdmin && (<div className="absolute top-8 left-8 z-50 bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl w-48 shadow-xl" onMouseDown={(e) => e.stopPropagation()}><div className="flex justify-between items-center mb-3"><h4 className="text-xs font-bold text-white flex items-center gap-2"><Maximize2 size={12} className="text-orange-500"/> Dimensions</h4><button onClick={handleReset} className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"><RefreshCcw size={10} /> Reset</button></div><div className="space-y-4"><BoxSlider label="Width" val={dimensions.w} axis="w" /><BoxSlider label="Height" val={dimensions.h} axis="h" /><BoxSlider label="Depth" val={dimensions.d} axis="d" /></div></div>)}
      
      <div className="text-white mb-12 text-center font-mono pointer-events-none select-none mt-20 md:mt-0">
          <h2 className="text-3xl font-bold tracking-[0.2em] uppercase text-orange-500 drop-shadow-lg">{product.name}</h2>
          <p className="text-emerald-400 text-xs mt-2 tracking-widest animate-pulse">
              {isDragging ? "INSPECTING OBJECT..." : "AUTOMATIC ROTATION"}
          </p>
      </div>

      <div className="relative w-full max-w-md h-[400px] flex items-center justify-center perspective-1000 cursor-move">
        <div className="relative preserve-3d" style={{ width: `${w}px`, height: `${h}px`, transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`, transformStyle: 'preserve-3d', transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}>
          <div className="absolute inset-0 bg-white backface-hidden flex items-center justify-center border border-slate-400" style={{ width: w, height: h, transform: `translateZ(${d / 2}px)` }}>{frontImage ? <img src={frontImage} className="w-full h-full object-cover"/> : <span className="text-4xl">🚬</span>}<div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div></div>
          <div className="absolute inset-0 bg-slate-800 backface-hidden flex items-center justify-center border border-slate-600" style={{ width: w, height: h, transform: `rotateY(180deg) translateZ(${d / 2}px)` }}>{renderFace(backImage, "bg-slate-800")}</div>
          <div className="absolute" style={{ width: d, height: h, transform: `rotateY(90deg) translateZ(${w / 2}px)`, left: (w - d)/2 }}>{renderFace(images.right, "bg-slate-200")}</div>
          <div className="absolute" style={{ width: d, height: h, transform: `rotateY(-90deg) translateZ(${w / 2}px)`, left: (w - d)/2 }}>{renderFace(images.left, "bg-slate-200")}</div>
          <div className="absolute" style={{ width: w, height: d, transform: `rotateX(90deg) translateZ(${h / 2}px)`, top: (h - d)/2 }}>{renderFace(images.top, "bg-slate-300")}</div>
          <div className="absolute" style={{ width: w, height: d, transform: `rotateX(-90deg) translateZ(${h / 2}px)`, top: (h - d)/2 }}>{renderFace(images.bottom, "bg-slate-300")}</div>
        </div>
      </div>

      <div className="mt-8 w-full max-w-2xl bg-black/60 border-t border-b border-orange-500/50 p-6 backdrop-blur-md pointer-events-none select-none">
        <div className="flex justify-between items-start mb-2 font-mono text-xs text-orange-300">
           <span>STOCK: {product.stock} Bks</span>
           <span>TYPE: {product.type}</span>
           <span>CUKAI: {product.taxStamp}</span>
        </div>
        <p className="text-white font-serif text-lg leading-relaxed text-center shadow-black drop-shadow-md">"{product.description || "A standard pack of cigarettes. No unusual properties detected."}"</p>
      </div>
    </div>
  );
};

const ReturnModal = ({ transaction, onClose, onConfirm }) => {
  const [returnQtys, setReturnQtys] = useState({});
  useEffect(() => { const initial = {}; if(transaction.items) transaction.items.forEach(item => initial[item.productId] = 0); setReturnQtys(initial); }, [transaction]);
  const handleQtyChange = (productId, val, max) => { let newQty = parseInt(val) || 0; if (newQty < 0) newQty = 0; if (newQty > max) newQty = max; setReturnQtys(prev => ({ ...prev, [productId]: newQty })); };
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-scale-in">
         <h2 className="text-xl font-bold dark:text-white mb-2">Process Return / Adjustment</h2>
         <div className="space-y-3 max-h-[60vh] overflow-y-auto mb-4">{transaction.items && transaction.items.map(item => (<div key={item.productId} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700"><div><p className="font-bold text-sm dark:text-white">{item.name}</p><p className="text-xs text-slate-500">Max: {item.qty} {item.unit}</p></div><div className="flex items-center gap-2"><input type="number" value={returnQtys[item.productId] || 0} onChange={(e) => handleQtyChange(item.productId, e.target.value, item.qty)} className="w-16 p-1 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white text-center"/></div></div>))}</div>
         <div className="flex gap-2"><button onClick={onClose} className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 dark:text-white">Cancel</button><button onClick={() => onConfirm(returnQtys)} className="flex-1 py-2 rounded-lg bg-orange-500 text-white font-bold">Confirm</button></div>
      </div>
    </div>
  );
};

const ConsignmentView = ({ transactions, inventory, onAddGoods, onPayment, onReturn, onDeleteConsignment, isAdmin }) => {
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [settleMode, setSettleMode] = useState(false);
    const [returnMode, setReturnMode] = useState(false);
    const [itemQtys, setItemQtys] = useState({});

    const customerData = useMemo(() => {
        const customers = {};
        const sortedTransactions = [...transactions].sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        sortedTransactions.forEach(t => {
            if (!t.customerName) return; const name = t.customerName.trim(); if (!customers[name]) customers[name] = { name, items: {}, balance: 0, lastActivity: t.date };
            const getProduct = (pid) => inventory.find(p => p.id === pid);
            if (t.type === 'SALE' && t.paymentType === 'Titip') { customers[name].balance += t.total; t.items.forEach(item => { const product = getProduct(item.productId); const bksQty = convertToBks(item.qty, item.unit, product); const itemKey = `${item.productId}-${item.priceTier || 'Standard'}`; if(!customers[name].items[itemKey]) customers[name].items[itemKey] = { ...item, qty: 0, unit: 'Bks', calculatedPrice: item.calculatedPrice / convertToBks(1, item.unit, product) }; customers[name].items[itemKey].qty += bksQty; }); }
            if (t.type === 'RETURN') { customers[name].balance += t.total; t.items.forEach(item => { const product = getProduct(item.productId); const bksQty = convertToBks(item.qty, item.unit, product); const itemKey = `${item.productId}-${item.priceTier || 'Standard'}`; if(customers[name].items[itemKey]) customers[name].items[itemKey].qty -= bksQty; }); }
            if (t.type === 'CONSIGNMENT_PAYMENT') { customers[name].balance -= t.amountPaid; t.itemsPaid.forEach(item => { const product = getProduct(item.productId); const bksQty = convertToBks(item.qty, item.unit, product); const itemKey = `${item.productId}-${item.priceTier || 'Standard'}`; if(customers[name].items[itemKey]) customers[name].items[itemKey].qty -= bksQty; }); }
        });
        Object.values(customers).forEach(c => { c.balance = Math.max(0, c.balance); Object.keys(c.items).forEach(k => { c.items[k].qty = Math.max(0, c.items[k].qty); }); });
        return Object.values(customers).filter(c => c.balance > 0 || Object.values(c.items).some(i => i.qty > 0));
    }, [transactions, inventory]);

    const activeCustomer = selectedCustomer ? customerData.find(c => c.name === selectedCustomer.name) || selectedCustomer : null;
    const handleQtyInput = (key, val, max) => { let q = parseInt(val) || 0; if(q < 0) q = 0; setItemQtys(p => ({...p, [key]: q})); };
    
    const submitAction = () => {
        const itemsToProcess = []; let totalValue = 0;
        Object.entries(itemQtys).forEach(([key, qty]) => { if(qty > 0) { const item = activeCustomer.items[key]; itemsToProcess.push({ productId: item.productId, name: item.name, qty, priceTier: item.priceTier, calculatedPrice: item.calculatedPrice, unit: 'Bks' }); totalValue += (item.calculatedPrice * qty); } });
        if(itemsToProcess.length === 0) return;
        if (settleMode) onPayment(activeCustomer.name, itemsToProcess, totalValue); else if (returnMode) onReturn(activeCustomer.name, itemsToProcess, totalValue);
        setSettleMode(false); setReturnMode(false); setItemQtys({});
    };
    
    const formatStockDisplay = (qty, product) => { if (!product) return `${qty} Bks`; const packsPerSlop = product.packsPerSlop || 10; const slops = Math.floor(qty / packsPerSlop); const bks = qty % packsPerSlop; return slops > 0 ? `${qty} Bks (${slops} Slop ${bks > 0 ? `+ ${bks} Bks` : ''})` : `${qty} Bks`; };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)] animate-fade-in">
            {/* LEFT LIST */}
            <div className={`lg:w-1/3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 flex flex-col ${selectedCustomer ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-4 border-b dark:border-slate-700"><h2 className="font-bold text-lg dark:text-white flex items-center gap-2"><Truck size={20}/> Active Consignments</h2></div>
                <div className="flex-1 overflow-y-auto">{customerData.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm">No active consignments found.</div> : customerData.map(c => (<div key={c.name} onClick={() => setSelectedCustomer(c)} className={`p-4 border-b dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 ${selectedCustomer?.name === c.name ? 'bg-orange-50 dark:bg-slate-700 border-l-4 border-l-orange-500' : ''}`}><div className="flex justify-between items-start"><h3 className="font-bold dark:text-white">{c.name}</h3>
                
                {/* LOCKED: Delete Button hidden for non-admins */}
                {isAdmin && (
                    <button onClick={(e) => { e.stopPropagation(); onDeleteConsignment(c.name); }} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                )}
                
                </div><div className="mt-2 flex justify-between items-center"><span className="text-xs bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded dark:text-slate-300">{Object.values(c.items).reduce((a,b)=>a+b.qty,0)} Bks Held</span><span className="font-mono font-bold text-emerald-600">{formatRupiah(c.balance)}</span></div></div>))}</div>
            </div>

            {/* RIGHT DETAILS */}
            <div className={`lg:w-2/3 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-xl border dark:border-slate-700 ${!selectedCustomer ? 'hidden lg:flex justify-center items-center' : 'flex'}`}>
                {!selectedCustomer ? (<div className="text-center text-slate-400"><Store size={48} className="mx-auto mb-4 opacity-20"/><p>Select a customer to view details</p></div>) : (<><div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 rounded-t-2xl"><div><div className="flex items-center gap-2 lg:hidden mb-2 text-slate-400" onClick={() => setSelectedCustomer(null)}><ArrowRight className="rotate-180" size={16}/> Back</div><h2 className="text-2xl font-bold dark:text-white">{activeCustomer?.name}</h2></div><div className="text-right"><p className="text-xs text-slate-500 uppercase tracking-wider">Outstanding Balance</p><p className="text-2xl font-bold text-orange-500">{formatRupiah(activeCustomer?.balance || 0)}</p></div></div><div className="flex-1 overflow-y-auto p-6"><h3 className="font-bold mb-4 dark:text-white flex items-center gap-2"><Package size={18}/> Goods at Customer</h3><div className="space-y-3">{Object.entries(activeCustomer?.items || {}).filter(([k, i]) => i.qty > 0).map(([key, item]) => { const product = inventory.find(p => p.id === item.productId); return (<div key={key} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700"><div><p className="font-bold dark:text-white">{item.name}</p><div className="flex items-center gap-2"><span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{item.priceTier || 'Standard'}</span><p className="text-xs text-slate-500">{formatRupiah(item.calculatedPrice)} / Bks</p></div></div><div className="flex items-center gap-4"><div className="text-right"><p className="text-lg font-bold dark:text-white">{formatStockDisplay(item.qty, product)}</p></div>{(settleMode || returnMode) && (<input type="number" className={`w-24 p-2 rounded border text-center ${returnMode ? 'border-red-400 bg-red-50 text-red-600' : 'border-emerald-400 bg-emerald-50 text-emerald-600'}`} placeholder="Qty (Bks)" value={itemQtys[key] || ''} onChange={(e) => handleQtyInput(key, e.target.value, item.qty)}/>)}</div></div>); })}</div></div>
                
                {/* LOCKED: Footer Actions */}
                <div className="p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
                    {(!settleMode && !returnMode) ? (
                        isAdmin ? (
                            <div className="grid grid-cols-3 gap-3">
                                <button onClick={() => onAddGoods(activeCustomer?.name)} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-xl hover:bg-orange-50 dark:hover:bg-slate-700 hover:border-orange-500 transition-all group">
                                    <Plus size={24} className="text-orange-500 mb-1"/><span className="text-xs font-bold text-slate-600 dark:text-slate-300">Add Goods</span>
                                </button>
                                <button onClick={() => setSettleMode(true)} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-700 hover:border-emerald-500 transition-all group">
                                    <Wallet size={24} className="text-emerald-500 mb-1"/><span className="text-xs font-bold text-slate-600 dark:text-slate-300">Record Payment</span>
                                </button>
                                <button onClick={() => setReturnMode(true)} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-xl hover:bg-red-50 dark:hover:bg-slate-700 hover:border-red-500 transition-all group">
                                    <RotateCcw size={24} className="text-red-500 mb-1"/><span className="text-xs font-bold text-slate-600 dark:text-slate-300">Process Return</span>
                                </button>
                            </div>
                        ) : (
                            <div className="text-center p-2 text-slate-400 text-sm flex flex-col items-center">
                                <Lock size={20} className="mb-1 opacity-50"/>
                                <span className="font-bold">Consignment Actions Locked</span>
                                <span className="text-xs opacity-70">Admin access required to Add, Pay, or Return items.</span>
                            </div>
                        )
                    ) : (
                        <div>
                            <div className="flex gap-3">
                                <button onClick={() => { setSettleMode(false); setReturnMode(false); setItemQtys({}); }} className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold text-slate-600 dark:text-slate-300">Cancel</button>
                                <button onClick={submitAction} className={`flex-1 py-3 rounded-xl font-bold text-white ${settleMode ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>Confirm {settleMode ? 'Payment' : 'Return'}</button>
                            </div>
                        </div>
                    )}
                </div>
                </>)}
            </div>
        </div>
    );
};

const HistoryReportView = ({ transactions, inventory, onDeleteFolder, onDeleteTransaction, isAdmin, user, appId }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [reportView, setReportView] = useState(false);
  const [rangeType, setRangeType] = useState('daily');
  const [targetDate, setTargetDate] = useState(getCurrentDate());
  const [editingTrans, setEditingTrans] = useState(null);

  // Filter Transactions based on Date Range
  const filteredTransactions = useMemo(() => {
      const target = new Date(targetDate);
      return transactions.filter(t => {
          const tDate = new Date(t.date);
          if (rangeType === 'daily') return t.date === targetDate;
          if (rangeType === 'weekly') {
              const startOfWeek = new Date(target);
              startOfWeek.setDate(target.getDate() - target.getDay()); 
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 6);
              return tDate >= startOfWeek && tDate <= endOfWeek;
          }
          if (rangeType === 'monthly') return tDate.getMonth() === target.getMonth() && tDate.getFullYear() === target.getFullYear();
          if (rangeType === 'yearly') return tDate.getFullYear() === target.getFullYear();
          return false;
      }).sort((a,b) => (b.timestamp?.seconds||0) - (a.timestamp?.seconds||0));
  }, [transactions, rangeType, targetDate]);

  // Calculate Statistics
  const stats = useMemo(() => {
    const totalRev = filteredTransactions.reduce((sum, t) => sum + (t.total || t.amountPaid || 0), 0);
    const totalProfit = filteredTransactions.reduce((sum, t) => sum + (t.totalProfit || 0), 0); // New Profit Stat
    const count = filteredTransactions.length;
    const items = {};
    
    // Payment Method Breakdown
    const payments = {
        Cash: 0,
        QRIS: 0,
        Transfer: 0,
        Titip: 0
    };

    filteredTransactions.forEach(t => {
        // Sum up payment types
        const method = t.paymentType || 'Cash';
        if (payments[method] !== undefined) {
            payments[method] += (t.total || t.amountPaid || 0);
        } else {
            // Handle edge cases or old data
            payments['Cash'] += (t.total || t.amountPaid || 0);
        }

        // Sum up items
        if(t.items) t.items.forEach(i => {
            const product = inventory.find(p => p.id === i.productId);
            const bksQty = convertToBks(i.qty, i.unit, product || {});
            if(!items[i.name]) items[i.name] = { qty: 0, val: 0 };
            items[i.name].qty += bksQty;
            items[i.name].val += (i.calculatedPrice * i.qty);
        });
    });
    return { totalRev, totalProfit, count, items, payments, transactions: filteredTransactions };
  }, [filteredTransactions, inventory]);

  const handleEditSubmit = async (e) => {
      e.preventDefault();
      if(!editingTrans || !user) return;
      const formData = new FormData(e.target);
      const updates = {
          date: formData.get('date'),
          customerName: formData.get('customerName'),
          total: parseFloat(formData.get('total')) || 0,
          updatedAt: serverTimestamp()
      };
      try {
          await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/transactions`, editingTrans.id), updates);
          setEditingTrans(null);
      } catch(err) { alert(err.message); }
  };

  // --- EXCEL EXPORT WITH PAYMENT BREAKDOWN ---
  const generateExcel = () => {
      const wb = XLSX.utils.book_new();

      // 1. Header Info
      const reportInfo = [
          ["KPM INVENTORY - SALES REPORT"],
          [`Period: ${rangeType.toUpperCase()}`],
          [`Date Selected: ${targetDate}`],
          [`Generated On: ${new Date().toLocaleString()}`],
          [""]
      ];

      // 2. Summary Statistics
      const summaryInfo = [
          ["SUMMARY STATISTICS"],
          ["Total Revenue", stats.totalRev], 
          ["Total Profit (Cuan)", stats.totalProfit],
          ["Total Transactions", stats.count],
          ["Items Sold (Bks)", Object.values(stats.items).reduce((a,b)=>a+b.qty,0)],
          [""]
      ];

      // 3. Payment Breakdown (New Section in Excel)
      const paymentInfo = [
          ["PAYMENT RECONCILIATION"],
          ["Cash (Drawer)", stats.payments.Cash],
          ["QRIS", stats.payments.QRIS],
          ["Transfer (Bank)", stats.payments.Transfer],
          ["Titip (Unpaid)", stats.payments.Titip],
          [""]
      ];

      // 4. Main Data Table
      const tableHeader = [["DATE", "TIME", "CUSTOMER", "TYPE", "PAYMENT", "ITEMS / DETAILS", "TOTAL (Rp)"]];
      
      const tableData = stats.transactions.map(t => {
          const timeStr = t.timestamp ? new Date(t.timestamp.seconds*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';
          let itemsStr = "";
          if (t.items && t.items.length > 0) {
              itemsStr = t.items.map(i => `${i.qty} ${i.unit} ${i.name}`).join(", ");
          } else if (t.paymentType === 'Titip') {
              itemsStr = "Consignment Request";
          } else if (t.itemsPaid) {
              itemsStr = `Payment for ${t.itemsPaid.length} items`;
          }

          return [
              t.date,
              timeStr,
              t.customerName,
              t.type,
              t.paymentType || 'Cash',
              itemsStr,
              t.total || t.amountPaid
          ];
      });

      const finalData = [...reportInfo, ...summaryInfo, ...paymentInfo, ...tableHeader, ...tableData];
      const ws = XLSX.utils.aoa_to_sheet(finalData);

      // Set Column Widths
      ws['!cols'] = [
          { wch: 12 }, // Date
          { wch: 10 }, // Time
          { wch: 25 }, // Customer
          { wch: 10 }, // Type
          { wch: 10 }, // Payment Method
          { wch: 50 }, // Items
          { wch: 15 }  // Total
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Sales Data");
      XLSX.writeFile(wb, `KPM_Report_${rangeType}_${targetDate}.xlsx`);
  };

  const handlePrint = () => {
      window.print();
  };

  const customerStats = useMemo(() => { const stats = {}; transactions.forEach(t => { const name = t.customerName || 'Unknown'; if (!stats[name]) stats[name] = { name, count: 0, total: 0, lastDate: t.date, history: [] }; stats[name].count += 1; if (t.type === 'SALE' || t.type === 'RETURN') stats[name].total += t.total || 0; if (t.date > stats[name].lastDate) stats[name].lastDate = t.date; stats[name].history.push(t); }); return Object.values(stats).sort((a,b) => b.total - a.total); }, [transactions]);

  if (reportView) {
      return (
        <div className="animate-fade-in max-w-5xl mx-auto">
             {/* EDIT MODAL */}
             {editingTrans && (
                 <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                         <h3 className="font-bold text-lg mb-4 dark:text-white">Edit Transaction</h3>
                         <form onSubmit={handleEditSubmit} className="space-y-4">
                             <div><label className="text-xs font-bold text-slate-500">Date</label><input name="date" type="date" defaultValue={editingTrans.date} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"/></div>
                             <div><label className="text-xs font-bold text-slate-500">Customer</label><input name="customerName" defaultValue={editingTrans.customerName} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"/></div>
                             <div><label className="text-xs font-bold text-slate-500">Total Value (Rp)</label><input name="total" type="number" defaultValue={editingTrans.total || editingTrans.amountPaid} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"/></div>
                             <div className="flex gap-2 pt-2"><button type="button" onClick={()=>setEditingTrans(null)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg font-bold">Cancel</button><button className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-bold">Save Changes</button></div>
                         </form>
                     </div>
                 </div>
             )}

             {/* HEADER CONTROLS (Hidden on Print) */}
             <div className="print:hidden">
                <button onClick={() => setReportView(false)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors"><ArrowRight className="rotate-180" size={20}/> Back to Folders</button>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border dark:border-slate-700">
                        {['daily', 'weekly', 'monthly', 'yearly'].map(t => (
                            <button key={t} onClick={() => setRangeType(t)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${rangeType === t ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{t}</button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="p-2.5 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold shadow-sm"/>
                        <button onClick={generateExcel} className="bg-emerald-500 hover:bg-emerald-600 text-white p-2.5 rounded-xl shadow-sm tooltip" title="Download Excel (.xlsx)"><FileSpreadsheet size={20}/></button>
                        <button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-xl shadow-sm tooltip" title="Print PDF"><Printer size={20}/></button>
                    </div>
                </div>
             </div>

             {/* PRINTABLE REPORT CONTAINER */}
             <div className="print-container bg-white dark:bg-slate-800 dark:print:bg-white p-8 rounded-2xl shadow-xl border dark:border-slate-700 print:shadow-none print:border-none print:p-0">
                 <div className="flex justify-between items-end mb-8 border-b-2 border-orange-500 pb-4">
                     <div>
                         <h1 className="text-3xl font-bold text-slate-900 dark:text-white dark:print:text-black uppercase tracking-tight">Sales Report</h1>
                         <p className="text-slate-500 dark:print:text-slate-600 font-mono text-sm mt-1 uppercase">{rangeType} Recap • {new Date(targetDate).toLocaleDateString(undefined, {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</p>
                     </div>
                     <div className="text-right"><p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Total Revenue</p><h2 className="text-4xl font-bold text-emerald-600 dark:print:text-emerald-700">{formatRupiah(stats.totalRev)}</h2></div>
                 </div>
                 
                 {/* SUMMARY CARDS */}
                 <div className="grid grid-cols-3 gap-6 mb-8">
                     <div className="p-4 bg-slate-50 dark:bg-slate-900 dark:print:bg-slate-100 rounded-xl border dark:border-slate-700 print:border-slate-200"><p className="text-xs uppercase text-slate-500 font-bold mb-1">Transactions</p><p className="text-2xl font-bold text-slate-800 dark:text-white dark:print:text-black">{stats.count}</p></div>
                     <div className="p-4 bg-slate-50 dark:bg-slate-900 dark:print:bg-slate-100 rounded-xl border dark:border-slate-700 print:border-slate-200"><p className="text-xs uppercase text-slate-500 font-bold mb-1">Items Moved (Bks)</p><p className="text-2xl font-bold text-blue-600">{Object.values(stats.items).reduce((a,b)=>a+b.qty,0)}</p></div>
                     <div className="p-4 bg-slate-50 dark:bg-slate-900 dark:print:bg-slate-100 rounded-xl border dark:border-slate-700 print:border-slate-200"><p className="text-xs uppercase text-slate-500 font-bold mb-1">Net Profit (Cuan)</p><p className="text-2xl font-bold text-emerald-500">{formatRupiah(stats.totalProfit)}</p></div>
                 </div>

                 {/* NEW: PAYMENT METHOD BREAKDOWN (MONEY RECONCILIATION) */}
                 <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-700 print:border-slate-200">
                    <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white dark:print:text-black flex items-center gap-2">
                        <Wallet size={20} className="text-emerald-500"/> Money Breakdown (Reconciliation)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Cash', 'QRIS', 'Transfer', 'Titip'].map(method => (
                            <div key={method} className="bg-white dark:bg-slate-800 p-3 rounded-xl border dark:border-slate-700 shadow-sm">
                                <p className="text-xs uppercase font-bold text-slate-400 mb-1">{method}</p>
                                <p className={`text-lg font-bold ${method === 'Titip' ? 'text-orange-500' : 'text-slate-800 dark:text-white dark:print:text-black'}`}>
                                    {formatRupiah(stats.payments[method])}
                                </p>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* PRODUCT BREAKDOWN */}
                 <div className="mb-8">
                     <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white dark:print:text-black flex items-center gap-2"><Package size={20} className="text-orange-500"/> Product Performance</h3>
                     <table className="w-full text-sm text-left border-collapse"><thead className="text-slate-500 border-b-2 border-slate-100 dark:border-slate-700 dark:print:border-slate-300"><tr><th className="py-2">Product Name</th><th className="py-2 text-right">Qty (Bks)</th><th className="py-2 text-right">Revenue</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700 dark:print:divide-slate-200">{Object.entries(stats.items).sort((a,b) => b[1].val - a[1].val).map(([name, data]) => (<tr key={name}><td className="py-3 font-medium text-slate-700 dark:text-slate-200 dark:print:text-black">{name}</td><td className="py-3 text-right text-slate-600 dark:text-slate-400 dark:print:text-black font-mono">{data.qty}</td><td className="py-3 text-right font-bold text-emerald-600">{formatRupiah(data.val)}</td></tr>))}</tbody></table>
                 </div>
                 
                 {/* LOG */}
                 <div>
                    <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white dark:print:text-black flex items-center gap-2"><History size={20} className="text-orange-500"/> Transaction Log</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-900 dark:print:bg-slate-100 text-slate-500 font-bold"><tr><th className="p-3 rounded-l-lg">Time</th><th className="p-3">Customer</th><th className="p-3">Type</th><th className="p-3">Method</th><th className="p-3 text-right">Total</th><th className="p-3 rounded-r-lg text-right print:hidden">Action</th></tr></thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {stats.transactions.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-3 text-slate-500 font-mono text-xs">{t.timestamp ? new Date(t.timestamp.seconds*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : t.date}</td>
                                        <td className="p-3 font-bold text-slate-700 dark:text-slate-200 dark:print:text-black">{t.customerName}</td>
                                        <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:print:bg-slate-200 dark:print:text-black border dark:border-slate-600">{t.type}</span></td>
                                        <td className="p-3 text-xs text-slate-500">{t.paymentType || 'Cash'}</td>
                                        <td className="p-3 text-right font-bold text-emerald-600">{formatRupiah(t.total || t.amountPaid)}</td>
                                        <td className="p-3 text-right print:hidden">
                                            {isAdmin && (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingTrans(t)} className="p-1.5 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><Pencil size={14}/></button>
                                                    <button onClick={() => onDeleteTransaction(t)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 size={14}/></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>
             </div>
             
             <style>{`@media print { @page { size: A4; margin: 20mm; } body { background: white; color: black; } .print\\:hidden { display: none !important; } .print\\:shadow-none { box-shadow: none !important; } .print\\:border-none { border: none !important; } .print\\:p-0 { padding: 0 !important; } .dark\\:print\\:text-black { color: black !important; } .dark\\:print\\:bg-white { background: white !important; } .dark\\:print\\:bg-slate-100 { background: #f1f5f9 !important; } .dark\\:print\\:border-slate-300 { border-color: #cbd5e1 !important; } nav, .capy-mascot { display: none !important; } main { margin: 0 !important; padding: 0 !important; } }`}</style>
        </div>
      );
  }

  if (!selectedCustomer) { 
      return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2"><FileText size={24} className="text-orange-500"/> Transaction Reports</h2>
                
                {/* --- CHANGED THIS BUTTON TO ORANGE FOR VISIBILITY --- */}
                <button onClick={() => setReportView(true)} className="w-full md:w-auto bg-orange-600 border border-orange-400 px-6 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 font-bold text-white hover:bg-orange-500 hover:scale-105 transition-all group">
                    <div className="bg-white/20 p-2 rounded-lg text-white group-hover:scale-110 transition-transform"><Calendar size={20}/></div>
                    <span>Open Analytics Dashboard</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerStats.map(c => (<div key={c.name} onClick={() => setSelectedCustomer(c)} className="relative bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-orange-500 group"><button onClick={(e) => { e.stopPropagation(); onDeleteFolder(c.name); }} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors z-10"><Trash2 size={16} /></button><div className="flex items-start justify-between mb-4"><div className="p-3 bg-orange-100 dark:bg-slate-700 rounded-lg text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors"><Folder size={24} /></div><span className="text-xs font-mono text-slate-400 mr-8">{c.lastDate}</span></div><h3 className="font-bold text-lg dark:text-white mb-1 truncate">{c.name}</h3><div className="flex justify-between items-end mt-4"><div><p className="text-xs text-slate-500 uppercase">Lifetime Value</p><p className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(c.total)}</p></div><div className="text-right"><p className="text-xs text-slate-500 uppercase">Transactions</p><p className="font-bold dark:text-white">{c.count}</p></div></div></div>))}
            </div>
        </div>
      ); 
  }
  
  const groupedByMonth = selectedCustomer.history.reduce((groups, t) => { const date = new Date(t.date); const key = date.toLocaleString('default', { month: 'long', year: 'numeric' }); if (!groups[key]) groups[key] = []; groups[key].push(t); return groups; }, {});
  return (<div className="animate-fade-in max-w-4xl mx-auto"><button onClick={() => setSelectedCustomer(null)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors"><ArrowRight className="rotate-180" size={20}/> Back to Folders</button><div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border dark:border-slate-700 overflow-hidden"><div className="bg-slate-900 text-white p-8"><div className="flex justify-between items-start"><div><p className="text-orange-500 font-bold tracking-widest text-xs uppercase mb-1">Customer Performance Report</p><h1 className="text-3xl font-bold font-serif">{selectedCustomer.name}</h1></div><div className="text-right"><p className="text-sm opacity-70">Total Lifetime Value</p><p className="text-2xl font-bold">{formatRupiah(selectedCustomer.total)}</p></div></div></div><div className="p-8">{Object.entries(groupedByMonth).map(([month, trans]) => (<div key={month} className="mb-8 last:mb-0"><h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 border-b-2 border-orange-500 inline-block mb-4 pb-1">{month}</h3><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 uppercase text-xs font-bold"><tr><th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3">Details</th><th className="p-3 text-right">Amount</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">{trans.map(t => (<tr key={t.id}><td className="p-3 font-mono text-slate-600 dark:text-slate-400">{t.date}</td><td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.type === 'SALE' ? 'bg-emerald-100 text-emerald-700' : t.type === 'RETURN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{t.type.replace('_', ' ')}</span></td><td className="p-3 text-slate-600 dark:text-slate-300">{t.items ? `${t.items.length} Items` : t.itemsPaid ? `Payment for ${t.itemsPaid.length} Items` : 'N/A'}{t.paymentType === 'Titip' && <span className="ml-2 text-xs text-orange-500 font-bold">(Consignment)</span>}</td><td className={`p-3 text-right font-bold ${t.total < 0 ? 'text-red-500' : 'text-slate-700 dark:text-white'}`}>{formatRupiah(t.amountPaid || t.total)}</td></tr>))}</tbody></table></div></div>))}</div></div></div>);
};
// --- NEW: CUSTOMER DETAIL VIEW (WITH IFRAME SUPPORT) ---
const CustomerDetailView = ({ customer, db, appId, user, onBack, logAudit, triggerCapy }) => {
    const [benchmarks, setBenchmarks] = useState([]);
    const [newBench, setNewBench] = useState({ brand: '', product: '', price: '', notes: '', volume: 'Medium' });
    const [mapMode, setMapMode] = useState('map'); 

    useEffect(() => {
        const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/customers/${customer.id}/benchmarks`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => setBenchmarks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, [customer.id]);

    const handleAddBenchmark = async (e) => {
        e.preventDefault();
        if (!newBench.product || !newBench.price) return;
        try {
            await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/customers/${customer.id}/benchmarks`), { ...newBench, price: parseFloat(newBench.price), createdAt: serverTimestamp() });
            setNewBench({ brand: '', product: '', price: '', notes: '', volume: 'Medium' });
            triggerCapy("Competitor data logged!");
        } catch (err) { console.error(err); }
    };

    const handleDeleteBenchmark = async (id) => {
        if (!window.confirm("Delete record?")) return;
        await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers/${customer.id}/benchmarks`, id));
    };

    // --- MAP RENDER LOGIC ---
    const renderMap = () => {
        // 1. If user provided EXACT Embed Code, use it (Best for Street View POV)
        if (customer.embedHtml && customer.embedHtml.startsWith("<iframe")) {
            return <div dangerouslySetInnerHTML={{ __html: customer.embedHtml.replace('<iframe', '<iframe width="100%" height="100%" style="border:0;"') }} className="w-full h-full" />;
        }

        // 2. Otherwise, construct URL based on Lat/Lng
        const hasGPS = customer.latitude && customer.longitude;
        let src = "";

        if (mapMode === 'street') {
             // Try basic street view embed (Might be limited without key)
             const loc = hasGPS ? `${customer.latitude},${customer.longitude}` : encodeURIComponent(customer.address || customer.name);
             src = `https://maps.google.com/maps?q=$${loc}&layer=c&output=svembed`;
        } else {
             // Standard Map
             if (hasGPS) src = `https://maps.google.com/maps?q=$${customer.latitude},${customer.longitude}&z=18&output=embed`;
             else {
                 let query = customer.address || customer.name;
                 if (customer.city) query += `, ${customer.city}`;
                 src = `https://maps.google.com/maps?q=$${encodeURIComponent(query)}&z=15&output=embed`;
             }
        }

        return <iframe width="100%" height="100%" src={src} frameBorder="0" className="transition-all duration-500"></iframe>;
    };

    return (
        <div className="animate-fade-in space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors"><ArrowRight className="rotate-180" size={20}/> Back to List</button>
            
            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700">
                        <h2 className="text-2xl font-bold dark:text-white mb-1">{customer.name}</h2>
                        <div className="text-sm text-slate-500 mb-4 flex items-center gap-2"><MapPin size={14}/> {customer.city} {customer.region}</div>
                        
                        <div className="space-y-3 mb-6">
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center gap-3"><Phone size={18} className="text-slate-400"/><span className="font-bold dark:text-white">{customer.phone || "-"}</span></div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-start gap-3">
                                <MapPin size={18} className="text-slate-400 mt-1"/>
                                <div><span className="text-sm dark:text-slate-300 block">{customer.address || "No Address"}</span>{customer.latitude && <span className="text-[10px] text-emerald-500 font-mono mt-1 block">GPS: {customer.latitude}, {customer.longitude}</span>}</div>
                            </div>
                        </div>

                        {/* MAP CONTAINER */}
                        <div className="rounded-xl overflow-hidden border dark:border-slate-700 h-64 bg-slate-100 relative group">
                            {renderMap()}
                            
                            {/* Switcher (Only show if NOT using Embed Code, as Embed code is fixed) */}
                            {!customer.embedHtml && (
                                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                                    <button onClick={() => setMapMode(mapMode === 'map' ? 'street' : 'map')} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                                        {mapMode === 'map' ? <><User size={14} className="text-orange-500"/> Street View</> : <><MapPin size={14} className="text-blue-500"/> Map View</>}
                                    </button>
                                </div>
                            )}
                        </div>
                        {customer.embedHtml ? 
                            <p className="text-[10px] text-emerald-500 mt-2 text-center font-bold">Using Custom Embed View</p> :
                            <p className="text-[10px] text-slate-400 mt-2 text-center">{customer.latitude ? "Exact GPS Location" : "Approximate Address Location"}</p>
                        }
                    </div>
                </div>

                {/* COMPETITOR CATALOG */}
                <div className="md:w-2/3">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div><h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><ShieldAlert size={20} className="text-red-500"/> Competitor Intelligence</h3><p className="text-xs text-slate-500">Track benchmark prices at this specific store.</p></div>
                        </div>
                        <form onSubmit={handleAddBenchmark} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-700 mb-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                <input value={newBench.brand} onChange={e=>setNewBench({...newBench, brand:e.target.value})} placeholder="Brand" className="p-2 text-sm rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white"/>
                                <input value={newBench.product} onChange={e=>setNewBench({...newBench, product:e.target.value})} placeholder="Product Name" className="p-2 text-sm rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white"/>
                                <input type="number" value={newBench.price} onChange={e=>setNewBench({...newBench, price:e.target.value})} placeholder="Price (Rp)" className="p-2 text-sm rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white"/>
                                <select value={newBench.volume} onChange={e=>setNewBench({...newBench, volume:e.target.value})} className="p-2 text-sm rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white"><option>High Sales</option><option>Medium</option><option>Slow Moving</option></select>
                            </div>
                            <div className="flex gap-3"><input value={newBench.notes} onChange={e=>setNewBench({...newBench, notes:e.target.value})} placeholder="Notes (e.g. Promos)" className="flex-1 p-2 text-sm rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white"/><button className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-600">Add Log</button></div>
                        </form>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-sm text-left"><thead className="text-slate-500 font-bold border-b dark:border-slate-700"><tr><th className="pb-3 pl-2">Product</th><th className="pb-3">Price</th><th className="pb-3">Performance</th><th className="pb-3">Notes</th><th className="pb-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">{benchmarks.map(b => (<tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50"><td className="py-3 pl-2"><div className="font-bold dark:text-white">{b.product}</div><div className="text-xs text-slate-500">{b.brand}</div></td><td className="py-3 font-mono text-red-500 font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(b.price)}</td><td className="py-3"><span className={`text-[10px] px-2 py-1 rounded-full border ${b.volume === 'High Sales' ? 'bg-green-100 text-green-700 border-green-200' : b.volume === 'Slow Moving' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>{b.volume}</span></td><td className="py-3 text-slate-500 text-xs italic">{b.notes}</td><td className="py-3 text-right pr-2"><button onClick={()=>handleDeleteBenchmark(b.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button></td></tr>))}</tbody></table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};          

// --- UPGRADED: CUSTOMER MANAGEMENT (RESTORED EMBED LINK FIELD) ---
const CustomerManagement = ({ customers, db, appId, user, logAudit, triggerCapy, isAdmin, tierSettings, onRequestCrop, croppedImage, onClearCroppedImage }) => {
    const [viewMode, setViewMode] = useState('list');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [formData, setFormData] = useState({ 
        name: '', phone: '', region: '', city: '', address: '', 
        gmapsUrl: '', embedHtml: '', // <--- Added embedHtml here
        latitude: '', longitude: '', storeImage: '', 
        tier: 'Silver', visitFreq: 7, lastVisit: new Date().toISOString().split('T')[0] 
    });
    const [editingId, setEditingId] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    
    useEffect(() => {
        if (croppedImage) {
            setFormData(prev => ({ ...prev, storeImage: croppedImage }));
            onClearCroppedImage(); 
        }
    }, [croppedImage]);

    const [coordInput, setCoordInput] = useState("");
    const coordRef = useRef(null);

    useEffect(() => {
        if (document.activeElement !== coordRef.current) {
            if (formData.latitude && formData.longitude) {
                setCoordInput(`${formData.latitude}, ${formData.longitude}`);
            } else {
                setCoordInput("");
            }
        }
    }, [formData.latitude, formData.longitude]);

    const handleAutoGeocode = async () => {
        if (!formData.address && !formData.city) { alert("Please enter City/Address first!"); return; }
        setIsLocating(true);
        try {
            const query = `${formData.address}, ${formData.city || ''}, ${formData.region || ''}`;
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const result = data[0];
                setFormData(prev => ({ ...prev, latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) }));
                triggerCapy(`Found: ${result.display_name.split(',')[0]} 📍`);
            } else { alert("Location not found."); }
        } catch (error) { console.error(error); alert("Geocoding failed."); }
        setIsLocating(false);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                setIsLocating(false);
                triggerCapy("GPS Locked! 🎯");
            },
            (err) => { alert("GPS Error: " + err.message); setIsLocating(false); }
        );
    };

    const handleCoordInputChange = (e) => {
        const val = e.target.value;
        setCoordInput(val);
        const parts = val.split(',').map(s => s.trim());
        if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
        }
    };

    const handleFileSelect = (e) => {
        if(e.target.files[0] && onRequestCrop) {
            onRequestCrop(e.target.files[0]);
        }
        e.target.value = null; 
    };

    const handleSubmit = async (e) => { 
        e.preventDefault(); 
        if (!formData.name.trim()) return; 
        const cleanData = {
            ...formData,
            name: formData.name.trim(),
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            updatedAt: serverTimestamp()
        };
        try { 
            if (editingId) { 
                await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'customers', editingId), cleanData); 
                await logAudit("CUSTOMER_UPDATE", `Updated: ${formData.name}`); 
                triggerCapy("Customer updated!"); 
                setEditingId(null); 
            } else { 
                await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'customers'), cleanData); 
                await logAudit("CUSTOMER_ADD", `Added: ${formData.name}`); 
                triggerCapy("Customer added!"); 
            } 
            setFormData({ name: '', phone: '', region: '', city: '', address: '', gmapsUrl: '', embedHtml: '', latitude: '', longitude: '', storeImage: '', tier: 'Silver', visitFreq: 7, lastVisit: new Date().toISOString().split('T')[0] }); 
            setCoordInput("");
        } catch (err) { console.error(err); } 
    };

    const handleEdit = (c) => { 
        setFormData({ 
            name: c.name, phone: c.phone || '', region: c.region || '', city: c.city || '', 
            address: c.address || '', gmapsUrl: c.gmapsUrl || '', embedHtml: c.embedHtml || '', // <--- Load Saved Link
            storeImage: c.storeImage || '',
            latitude: c.latitude || '', longitude: c.longitude || '',
            tier: c.tier || 'Silver', visitFreq: c.visitFreq || 7, lastVisit: c.lastVisit || new Date().toISOString().split('T')[0]
        }); 
        setCoordInput(c.latitude && c.longitude ? `${c.latitude}, ${c.longitude}` : "");
        setEditingId(c.id); 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    };

    const handleDelete = async (id, name) => { if (window.confirm("Delete profile?")) { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'customers', id)); logAudit("CUSTOMER_DELETE", `Deleted ${name}`); } };
    const openDetail = (c) => { setSelectedCustomer(c); setViewMode('detail'); };

    if (viewMode === 'detail' && selectedCustomer) return <CustomerDetailView customer={selectedCustomer} db={db} appId={appId} user={user} onBack={() => { setViewMode('list'); setSelectedCustomer(null); }} logAudit={logAudit} triggerCapy={triggerCapy} />;

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2"><Store size={24} className="text-orange-500"/> Customer Directory</h2>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-sm text-slate-500 uppercase">{editingId ? 'Edit Customer' : 'Add New Customer'}</h3>{editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({name:'', phone:'', region:'', city:'', address:'', gmapsUrl:'', embedHtml: '', latitude: '', longitude: '', storeImage:'', tier: 'Silver', visitFreq: 7, lastVisit: ''}); setCoordInput(""); }} className="text-xs text-red-500 hover:underline">Cancel Edit</button>}</div>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase">Store Name</label><input value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" required/></div>
                        <div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase">Phone</label><input value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" /></div>
                    </div>

                    {/* STRATEGY & IMAGE UPLOAD */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50 dark:bg-slate-900/50 p-3 rounded-xl border border-indigo-100 dark:border-slate-700">
                        <div>
                            <label className="text-[10px] font-bold text-indigo-500 uppercase mb-1 block">Tier</label>
                            <select value={formData.tier} onChange={e=>setFormData({...formData, tier: e.target.value})} className="w-full p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white font-bold">
                                {tierSettings && tierSettings.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                {!tierSettings && <option value="Silver">Silver</option>}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-indigo-500 uppercase mb-1 block">Last Visit</label>
                            <input type="date" value={formData.lastVisit} onChange={e=>setFormData({...formData, lastVisit: e.target.value})} className="w-full p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white"/>
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-bold text-indigo-500 uppercase mb-1 block">Store Photo</label>
                            <div className="flex items-center gap-2">
                                <label className="flex-1 cursor-pointer bg-white dark:bg-slate-800 border dark:border-slate-600 hover:border-indigo-500 rounded p-2 flex items-center justify-center gap-2 transition-colors">
                                    <Camera size={16} className="text-indigo-500"/>
                                    <span className="text-xs font-bold dark:text-white">Upload</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                                </label>
                                {formData.storeImage && (
                                    <div className="w-9 h-9 rounded border border-indigo-200 overflow-hidden shrink-0 group relative">
                                        <img src={formData.storeImage} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => setFormData({...formData, storeImage: ''})} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100"><X size={12}/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* LOCATION TOOLS (RESTORED EMBED LINK) */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border dark:border-slate-700 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-orange-500"/>
                                <span className="font-bold text-sm dark:text-white">Location & Street View</span>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={handleAutoGeocode} disabled={isLocating} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-md">
                                    {isLocating ? <RefreshCcw size={12} className="animate-spin"/> : <Search size={12}/>} Auto-Find
                                </button>
                                <button type="button" onClick={handleGetLocation} className="bg-white dark:bg-slate-700 border dark:border-slate-600 px-3 rounded text-xs font-bold hover:bg-slate-100 flex items-center gap-1">
                                    <MapPin size={12}/> My GPS
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <input value={formData.region} onChange={e=>setFormData({...formData, region: e.target.value})} className="flex-1 p-2 text-xs border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="Region (Kabupaten)" />
                            <input value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} className="flex-1 p-2 text-xs border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="City (Kecamatan)" />
                        </div>
                        <input value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full p-2 text-xs border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="Address..." />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">GPS Coordinates</label>
                                <input ref={coordRef} type="text" placeholder="-7.6043, 110.2055" className="w-full p-2 text-sm border rounded bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white font-mono" value={coordInput} onChange={handleCoordInputChange} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Street View Link (Iframe/URL)</label>
                                <input 
                                    type="text" 
                                    placeholder="Paste Google Maps Link or Embed Code here..." 
                                    className="w-full p-2 text-sm border rounded bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white" 
                                    value={formData.embedHtml} 
                                    onChange={e => setFormData({...formData, embedHtml: e.target.value})} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button className={`text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 ${editingId ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'}`}>{editingId ? 'Update Profile' : 'Save Customer'}</button>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customers.map(c => {
                    const tierDef = tierSettings ? tierSettings.find(t => t.id === c.tier) : null;
                    return (
                        <div key={c.id} onClick={() => openDetail(c)} className={`bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-orange-500 transition-all group ${editingId === c.id ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-slate-700' : ''}`}>
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg dark:text-white group-hover:text-orange-500 transition-colors">{c.name}</h3>
                                    {c.latitude ? <MapPin size={16} className="text-emerald-500"/> : <MapPin size={16} className="text-slate-300"/>}
                                </div>
                                <div className="flex gap-2 mb-2">
                                    {tierDef ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold w-fit" style={{ borderColor: tierDef.color, backgroundColor: `${tierDef.color}15`, color: tierDef.color }}>
                                            {tierDef.iconType === 'image' ? <img src={tierDef.value} className="w-3 h-3 object-contain"/> : tierDef.value} {tierDef.label}
                                        </span>
                                    ) : ( <span className="text-[10px] px-2 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-300">{c.tier}</span> )}
                                </div>
                                {(c.city || c.region) && <p className="text-xs font-bold text-slate-400 uppercase">{c.city} {c.region}</p>}
                            </div>
                            {isAdmin && (
                                <div className="flex gap-2 justify-end mt-4 pt-3 border-t dark:border-slate-700">
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(c); }} className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded hover:bg-blue-100 text-slate-600 dark:text-slate-300">Edit</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.name); }} className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded hover:bg-red-100 text-red-500">Delete</button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- NEW: SAMPLING ANALYTICS VIEW (FIXED TOOLTIP & COST ANALYSIS) ---
const SamplingAnalyticsView = ({ samplings, inventory, onBack }) => {
    const [rangeType, setRangeType] = useState('monthly');
    const [targetDate, setTargetDate] = useState(getCurrentDate());

    // Local Helper for Rupiah
    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    // --- CUSTOM TOOLTIP (FIXES THE "BKS IN RUPIAH" BUG) ---
    const SamplingTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 p-3 border dark:border-slate-600 shadow-xl rounded-xl text-xs z-50">
                    <p className="font-bold mb-2 border-b pb-1 dark:border-slate-600 dark:text-white">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex justify-between items-center gap-4 mb-1">
                            <span style={{ color: entry.color }} className="font-bold">{entry.name}:</span>
                            <span className="font-mono dark:text-slate-300">
                                {/* Only add "Rp" if the label says Cost or Value */}
                                {entry.name.includes('Cost') || entry.name.includes('Value') || entry.name.includes('Rp')
                                    ? formatRp(entry.value) 
                                    : `${entry.value} Bks`} 
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Filter Data & Calculate Stats
    const stats = useMemo(() => {
        const target = new Date(targetDate);
        const filtered = samplings.filter(s => {
            if(!s.date) return false;
            const sDate = new Date(s.date);
            if (rangeType === 'daily') return s.date === targetDate;
            if (rangeType === 'weekly') {
                const start = new Date(target); start.setDate(target.getDate() - target.getDay());
                const end = new Date(start); end.setDate(start.getDate() + 6);
                return sDate >= start && sDate <= end;
            }
            if (rangeType === 'monthly') return sDate.getMonth() === target.getMonth() && sDate.getFullYear() === target.getFullYear();
            if (rangeType === 'yearly') return sDate.getFullYear() === target.getFullYear();
            return false;
        });

        let totalQty = 0;
        let totalValueDistributor = 0; // Factory Cost (Modal)
        
        // Opportunity Costs
        let totalValueRetail = 0;      
        let totalValueGrosir = 0;
        let totalValueEcer = 0;
        
        const productBreakdown = {};
        const locationBreakdown = {};

        filtered.forEach(s => {
            // Find Product to get Price
            const product = inventory.find(p => p.id === s.productId) || {};
            
            // PRICES
            const cost = product.priceDistributor || 0;
            const retail = product.priceRetail || 0;
            const grosir = product.priceGrosir || 0;
            const ecer = product.priceEcer || 0;
            
            // Calc Totals
            totalQty += s.qty;
            totalValueDistributor += (s.qty * cost);
            totalValueRetail += (s.qty * retail);
            totalValueGrosir += (s.qty * grosir);
            totalValueEcer += (s.qty * ecer);

            // Product Stats (By Value/Cost now, not just Qty)
            if (!productBreakdown[s.productName]) productBreakdown[s.productName] = { qty: 0, val: 0 };
            productBreakdown[s.productName].qty += s.qty;
            productBreakdown[s.productName].val += (s.qty * cost); // Accumulate Cost for Graph

            // Location Stats
            const loc = s.reason || 'Unknown';
            if (!locationBreakdown[loc]) locationBreakdown[loc] = { qty: 0, val: 0 };
            locationBreakdown[loc].qty += s.qty;
            locationBreakdown[loc].val += (s.qty * cost);
        });

        // Prepare Chart Data (Top 5 by Marketing Spend/Cost)
        const chartData = Object.entries(productBreakdown)
            .map(([name, data]) => ({ name, qty: data.qty, val: data.val }))
            .sort((a, b) => b.val - a.val) // Sort by Value (Cost) not Qty
            .slice(0, 5);

        // Find Top Location (by Spend)
        const topLocation = Object.entries(locationBreakdown).sort((a,b) => b[1].val - a[1].val)[0];

        return { 
            totalQty, 
            totalValueDistributor, 
            totalValueRetail,
            totalValueGrosir,
            totalValueEcer,
            filtered, 
            topLocation: topLocation ? { name: topLocation[0], val: topLocation[1].val } : null,
            chartData 
        };
    }, [samplings, rangeType, targetDate, inventory]);

    return (
        <div className="animate-fade-in space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors"><ArrowRight className="rotate-180" size={20}/> Back to Folders</button>
            
            {/* CONTROLS */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border dark:border-slate-700">
                    {['daily', 'weekly', 'monthly', 'yearly'].map(t => (
                        <button key={t} onClick={() => setRangeType(t)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${rangeType === t ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{t}</button>
                    ))}
                </div>
                <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="p-2.5 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold shadow-sm"/>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Marketing Invest (Factory Cost) */}
                <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet size={16} className="text-blue-200"/>
                        <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Total Marketing Burn</p>
                    </div>
                    <h3 className="text-3xl font-bold">{formatRp(stats.totalValueDistributor)}</h3>
                    <p className="text-[10px] opacity-70 mt-1">Real Cost (Distributor Price)</p>
                </div>

                {/* 2. Total Samples */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow-sm">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Items Distributed</p>
                    <h3 className="text-3xl font-bold dark:text-white">{stats.totalQty} <span className="text-lg opacity-50">Bks</span></h3>
                </div>

                {/* 3. Top Location */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow-sm">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Top Location (By Spend)</p>
                    <h3 className="text-lg font-bold dark:text-white truncate">{stats.topLocation?.name || '-'}</h3>
                    <p className="text-sm font-bold text-orange-500">{stats.topLocation ? formatRp(stats.topLocation.val) : '-'}</p>
                </div>
            </div>

            {/* OPPORTUNITY COST COMPARISON (NEW) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Ecer Opportunity */}
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                    <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase mb-1">Potential if sold at ECER</p>
                    <h4 className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatRp(stats.totalValueEcer)}</h4>
                </div>

                {/* Retail Opportunity */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                    <p className="text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase mb-1">Potential if sold at RETAIL</p>
                    <h4 className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatRp(stats.totalValueRetail)}</h4>
                </div>

                {/* Grosir Opportunity */}
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800/50">
                    <p className="text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase mb-1">Potential if sold at GROSIR</p>
                    <h4 className="text-xl font-bold text-orange-700 dark:text-orange-300">{formatRp(stats.totalValueGrosir)}</h4>
                </div>
            </div>

            {/* CHART - NOW SHOWING COST (Rupiah) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm h-80">
                <h3 className="font-bold mb-4 dark:text-white">Top 5 Products by Marketing Spend (Cost)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1}/>
                        <XAxis dataKey="name" fontSize={10} stroke="#94a3b8"/>
                        <YAxis fontSize={12} stroke="#94a3b8" tickFormatter={(value) => `Rp${value/1000}k`}/>
                        {/* Use the new Smart Tooltip here */}
                        <Tooltip content={<SamplingTooltip />} cursor={{fill: 'transparent'}}/>
                        <Bar dataKey="val" fill="#f97316" radius={[4, 4, 0, 0]} name="Cost (Rp)"/>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

            // --- NEW: SAMPLING CART VIEW (The Missing Component) ---
const SamplingCartView = ({ inventory, isAdmin, onCancel, onSubmit }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [cart, setCart] = useState([]);
    const [location, setLocation] = useState("");
    const [note, setNote] = useState("");
    const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredInventory = inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { id: item.id, name: item.name, qty: 1 }];
        });
    };

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
    };

    const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

    const handleFinalSubmit = async () => {
        if (!location.trim()) { alert("Please enter a Folder/Location name!"); return; }
        if (cart.length === 0) return;
        
        setIsSubmitting(true);
        await onSubmit(cart, location, targetDate, note);
        setIsSubmitting(false);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] animate-fade-in">
            {/* LEFT: PRODUCT GRID */}
            <div className="lg:w-2/3 flex flex-col">
                <div className="flex gap-4 mb-4">
                    <button onClick={onCancel} className="p-3 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 text-slate-500 hover:text-orange-500"><ArrowRight className="rotate-180"/></button>
                    <input className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border dark:border-slate-700 dark:text-white" placeholder="Search item to sample..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                </div>
                <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 border dark:border-slate-700">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredInventory.map(item => (
                            <div key={item.id} onClick={() => addToCart(item)} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border dark:border-slate-700 cursor-pointer hover:border-orange-500 group transition-all">
                                <h4 className="font-bold text-sm dark:text-white truncate">{item.name}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{item.stock} in stock</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT: BASKET */}
            <div className="lg:w-1/3 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-xl border dark:border-slate-700 overflow-hidden">
                <div className="p-5 bg-slate-900 text-white">
                    <h3 className="font-bold flex items-center gap-2"><ClipboardList className="text-orange-500"/> Sampling Basket</h3>
                    <p className="text-xs text-slate-400 mt-1">Items will be grouped by description.</p>
                </div>
                
                <div className="p-4 border-b dark:border-slate-700 space-y-3 bg-orange-50 dark:bg-slate-800/50">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Folder Name / Location</label>
                        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Pasar Sraten" className="w-full p-2.5 rounded-lg border-2 border-orange-200 focus:border-orange-500 dark:bg-slate-900 dark:border-slate-600 dark:text-white font-bold text-sm" />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Description / Store Name (Optional)</label>
                        <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Toko Bayu" className="w-full p-2.5 rounded-lg border border-slate-300 dark:bg-slate-900 dark:border-slate-600 dark:text-white text-sm" />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block flex justify-between">
                            <span>Date</span>
                            {!isAdmin && <span className="text-red-400 flex items-center gap-1"><Lock size={10}/> Locked</span>}
                        </label>
                        <div className="relative">
                            <input 
                                type="date" 
                                value={targetDate} 
                                onChange={e => setTargetDate(e.target.value)} 
                                disabled={!isAdmin}
                                className={`w-full p-2.5 rounded-lg border dark:bg-slate-900 dark:border-slate-600 dark:text-white text-sm font-bold ${!isAdmin ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`} 
                            />
                            <Calendar className="absolute right-3 top-2.5 text-slate-400 dark:text-white pointer-events-none" size={18}/>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><Truck size={48} className="mb-2"/><p className="text-sm font-bold">Basket is empty</p></div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700 animate-fade-in-up flex items-center justify-between">
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm dark:text-white">{item.name}</h4>
                                    <p className="text-xs text-orange-500 font-bold">{item.qty} Bks</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow border dark:border-slate-600 hover:bg-slate-100 dark:text-white">-</button>
                                    <span className="w-6 text-center text-sm font-bold dark:text-white">{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow border dark:border-slate-600 hover:bg-slate-100 dark:text-white">+</button>
                                    <button onClick={() => removeFromCart(item.id)} className="ml-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t dark:border-slate-700">
                    <button onClick={handleFinalSubmit} disabled={isSubmitting || cart.length === 0} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${isSubmitting ? 'bg-slate-400' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'}`}>
                        {isSubmitting ? <RefreshCcw className="animate-spin"/> : <Save size={20}/>}
                        {isSubmitting ? 'Saving...' : `Save ${cart.reduce((a,b)=>a+b.qty,0)} Items`}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- 1. SAMPLING FOLDER VIEW (FIXED: EDIT BUTTON & DARK HOVER) ---
const SamplingFolderView = ({ samplings, isAdmin, onRecordSample, onDelete, onEdit, onEditFolder, onShowAnalytics }) => {
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);

    // 1. Group Data: Year -> Month -> Date -> Location
    const folderStructure = useMemo(() => {
        const structure = {};
        samplings.forEach(s => {
            if (!s.date) return;
            const d = new Date(s.date);
            const year = d.getFullYear();
            const month = d.toLocaleString('default', { month: 'long' });
            
            if (!structure[year]) structure[year] = {};
            if (!structure[year][month]) structure[year][month] = {};
            if (!structure[year][month][s.date]) structure[year][month][s.date] = {};
            
            const loc = s.reason ? s.reason.trim() : 'Unspecified';
            if (!structure[year][month][s.date][loc]) structure[year][month][s.date][loc] = [];
            structure[year][month][s.date][loc].push(s);
        });
        return structure;
    }, [samplings]);

    // --- LEVEL 4: ITEMS LIST (THE FIX IS HERE) ---
    if (selectedYear && selectedMonth && selectedDate && selectedLocation) {
        const items = folderStructure[selectedYear][selectedMonth][selectedDate][selectedLocation] || [];
        
        // Group Items by Note (Description)
        const groupedItems = items.reduce((groups, item) => {
            const noteKey = item.note ? item.note.trim() : "General / No Description";
            if (!groups[noteKey]) groups[noteKey] = [];
            groups[noteKey].push(item);
            return groups;
        }, {});

        return (
            <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setSelectedLocation(null)} className="flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors"><ArrowRight className="rotate-180" size={20}/> Back to Locations</button>
                    {isAdmin && (
                        <button onClick={() => onEditFolder(selectedDate, selectedLocation)} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-orange-100 hover:text-orange-600 transition-colors">
                            <Edit size={14}/> Edit Folder
                        </button>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border dark:border-slate-700 overflow-hidden">
                    <div className="bg-slate-900 text-white p-8">
                        <p className="text-orange-500 font-bold tracking-widest text-xs uppercase mb-1">{selectedDate}</p>
                        <h1 className="text-3xl font-bold font-serif">{selectedLocation}</h1>
                        <p className="text-slate-400 text-sm mt-2">{items.length} Total Items Sampled</p>
                    </div>
                    
                    <div className="p-8 space-y-8">
                        {Object.entries(groupedItems).map(([noteGroup, groupItems]) => (
                            <div key={noteGroup} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border dark:border-slate-700 overflow-hidden">
                                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                                        <Store size={16} className="text-orange-500"/> {noteGroup}
                                    </h3>
                                    <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{groupItems.length} items</span>
                                </div>
                                <table className="w-full text-sm text-left">
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {groupItems.map(s => (
                                            // --- FIX: DARKER HOVER COLOR (bg-black/5 for light, bg-white/5 for dark) ---
                                            <tr key={s.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                <td className="p-3 font-medium dark:text-white pl-4">{s.productName}</td>
                                                <td className="p-3 text-right text-red-500 font-bold">-{s.qty}</td>
                                                <td className="p-3 text-right flex justify-end gap-2 pr-4">
                                                    {isAdmin && (
                                                        <>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); onEdit(s); }} // STOP PROPAGATION FIX
                                                                className="p-1.5 text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
                                                                title="Edit Item"
                                                            >
                                                                <Pencil size={14}/>
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); onDelete(s); }} 
                                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors"
                                                                title="Delete Item"
                                                            >
                                                                <Trash2 size={14}/>
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- LEVEL 3: LOCATION FOLDERS (Inside a Date) ---
    if (selectedYear && selectedMonth && selectedDate) {
        const locations = Object.keys(folderStructure[selectedYear][selectedMonth][selectedDate] || {});
        return (
            <div className="animate-fade-in">
                <button onClick={() => setSelectedDate(null)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors"><ArrowRight className="rotate-180" size={20}/> Back to {selectedMonth}</button>
                <h2 className="text-2xl font-bold dark:text-white mb-6 flex items-center gap-2"><Calendar size={24} className="text-orange-500"/> {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {locations.map(loc => (
                        <div key={loc} onClick={() => setSelectedLocation(loc)} className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md hover:border-orange-500 group transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 dark:bg-slate-700 rounded-lg text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors"><MapPin size={24} /></div>
                                <div><h3 className="font-bold text-lg dark:text-white group-hover:text-orange-500 transition-colors">{loc}</h3><p className="text-xs text-slate-500">{folderStructure[selectedYear][selectedMonth][selectedDate][loc].length} Items</p></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- LEVEL 2: DATE FOLDERS (Inside a Month) ---
    if (selectedYear && selectedMonth) {
        const dates = Object.keys(folderStructure[selectedYear][selectedMonth] || {}).sort((a,b) => new Date(b) - new Date(a));
        return (
            <div className="animate-fade-in">
                <button onClick={() => setSelectedMonth(null)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors"><ArrowRight className="rotate-180" size={20}/> Back to {selectedYear}</button>
                <h2 className="text-2xl font-bold dark:text-white mb-6 flex items-center gap-2"><Folder size={24} className="text-orange-500"/> {selectedMonth} {selectedYear}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {dates.map(date => {
                        const locCount = Object.keys(folderStructure[selectedYear][selectedMonth][date]).length;
                        return (
                            <div key={date} onClick={() => setSelectedDate(date)} className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md hover:border-orange-500 group transition-all text-center">
                                <div className="w-12 h-12 mx-auto bg-orange-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors mb-3"><span className="font-bold text-lg">{new Date(date).getDate()}</span></div>
                                <h3 className="font-bold text-sm dark:text-white">{new Date(date).toLocaleDateString(undefined, {weekday:'short'})}</h3>
                                <p className="text-[10px] text-slate-500 mt-1">{locCount} Locations</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // --- LEVEL 1: MONTH FOLDERS (Inside a Year) ---
    if (selectedYear) {
        const months = Object.keys(folderStructure[selectedYear] || {});
        const monthOrder = { "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6, "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12 };
        months.sort((a, b) => monthOrder[a] - monthOrder[b]);
        return (
            <div className="animate-fade-in">
                <button onClick={() => setSelectedYear(null)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors"><ArrowRight className="rotate-180" size={20}/> Back to Years</button>
                <h2 className="text-2xl font-bold dark:text-white mb-6 flex items-center gap-2"><Folder size={24} className="text-blue-500"/> {selectedYear} Archives</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {months.map(month => (
                        <div key={month} onClick={() => setSelectedMonth(month)} className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md hover:border-orange-500 group transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-slate-700 rounded-lg text-blue-500 group-hover:bg-orange-500 group-hover:text-white transition-colors"><Folder size={24} /></div>
                                <div><h3 className="font-bold text-lg dark:text-white">{month}</h3><p className="text-xs text-slate-500">{Object.keys(folderStructure[selectedYear][month]).length} Dates Recorded</p></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- LEVEL 0: YEAR FOLDERS (Top Level) ---
    const years = Object.keys(folderStructure).sort((a, b) => b - a);
    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2"><Folder size={24} className="text-orange-500"/> Sampling Archives</h2>
                <button onClick={onShowAnalytics} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-all"><TrendingUp size={18}/> View Analytics</button>
            </div>
            {years.length === 0 ? (
                 <div className="text-center py-20 text-slate-400"><Folder size={48} className="mx-auto mb-4 opacity-20"/><p>No sampling records found.</p></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {years.map(year => (
                        <div key={year} onClick={() => setSelectedYear(year)} className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform relative overflow-hidden group">
                            <Folder size={100} className="absolute -right-6 -bottom-6 text-white opacity-5 group-hover:opacity-10 transition-opacity"/>
                            <div className="relative z-10"><h3 className="text-3xl font-bold mb-1">{year}</h3><div className="h-1 w-12 bg-orange-500 rounded mb-3"></div><p className="text-sm text-slate-400 font-mono">{Object.keys(folderStructure[year]).length} Months Active</p></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- FIXED: SAMPLING MODAL (UNLOCKED PRODUCT SELECTION) ---
const SampleEntryModal = ({ isOpen, onClose, onSubmit, initialData, inventory }) => {
    // Initialize with default or existing data
    const [formData, setFormData] = useState({ 
        date: new Date().toISOString().split('T')[0], 
        reason: '', 
        productId: '', 
        productName: '', 
        qty: 1, 
        note: '' 
    });

    useEffect(() => {
        if (initialData && !initialData.isNew) {
            // EDIT MODE: Load existing data
            setFormData({
                ...initialData,
                date: initialData.date || new Date().toISOString().split('T')[0],
            });
        } else {
            // NEW MODE: Reset form
            setFormData({ 
                date: new Date().toISOString().split('T')[0], 
                reason: '', 
                productId: '', 
                productName: '', 
                qty: 1, 
                note: '' 
            });
        }
    }, [initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const product = inventory.find(p => p.id === formData.productId);
        
        // Pass all data back to parent
        onSubmit({ 
            ...formData, 
            productName: product ? product.name : formData.productName 
        });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><X size={20}/></button>
                <h2 className="text-xl font-bold mb-4 dark:text-white">{initialData?.isNew ? 'New Sample Entry' : 'Edit Sample Details'}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500">Date</label>
                            <input type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" required/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500">Qty</label>
                            <input type="number" min="1" value={formData.qty} onChange={e=>setFormData({...formData, qty: parseInt(e.target.value)})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" required/>
                        </div>
                    </div>

                    {/* --- FIXED: PRODUCT DROPDOWN IS ALWAYS ACTIVE NOW --- */}
                    <div>
                        <label className="text-xs font-bold text-slate-500">Product</label>
                        <select 
                            value={formData.productId} 
                            onChange={e=>setFormData({...formData, productId: e.target.value})} 
                            className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" 
                            required
                        >
                            <option value="">Select Product...</option>
                            {inventory.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500">Location / Store Name</label>
                        <input value={formData.reason} onChange={e=>setFormData({...formData, reason: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" placeholder="e.g. Toko Berkah" required/>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-500">Notes (Folder Group)</label>
                        <input value={formData.note} onChange={e=>setFormData({...formData, note: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" placeholder="e.g. Area 1"/>
                    </div>
                    
                    <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl mt-2">
                        {initialData?.isNew ? 'Add to Folder' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- UPDATED: BIOHAZARD THEME (MOBILE STABILITY FIXES) ---
const BiohazardTheme = ({ activeTab, setActiveTab, children, user, appSettings, isAdmin, onLogin }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    
    const handleLogout = () => {
        if(window.confirm("Terminate Session?")) {
            signOut(auth);
            window.location.reload();
        }
    };

    const allMenuItems = [
        { id: 'dashboard', label: 'Overview' },
        { id: 'map_war_room', label: 'Map System' },
        { id: 'journey', label: 'Journey Plan' },
        { id: 'inventory', label: 'Inventory' },
        { id: 'sales', label: 'Sales Terminal' },
        { id: 'consignment', label: 'Consignment' },
        { id: 'stock_opname', label: 'Stock Opname' },
        { id: 'customers', label: 'Customers' },
        { id: 'sampling', label: 'Sampling' },
        { id: 'transactions', label: 'Reports' },
        { id: 'audit', label: 'Audit Logs' },
        { id: 'settings', label: 'Settings' }
    ];

    const visibleMenu = allMenuItems.filter(item => 
        isAdmin ? true : !['transactions', 'audit', 'stock_opname'].includes(item.id)
    );

    return (
        <div className="min-h-screen bg-black text-gray-300 font-sans tracking-wide overflow-hidden flex relative">
            
            {/* BACKGROUND LAYERS */}
            <div className="absolute inset-0 bg-[url('https://wallpapers.com/images/hd/resident-evil-background-2834-x-1594-c7m6q8j3q8j3q8j3.jpg')] bg-cover bg-center opacity-40 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent pointer-events-none"></div>

            {/* --- 1. FIXED MOBILE MENU BUTTON --- */}
            {/* Added inset-inline-start-4 for better phone compatibility */}
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden fixed top-6 left-6 z-[100] p-4 bg-orange-600/90 backdrop-blur-md text-white rounded-2xl shadow-[0_0_20px_rgba(234,88,12,0.5)] border border-orange-400/50 active:scale-90 transition-all"
            >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            {/* LEFT COLUMN: NAVIGATION */}
            <div className={`
                fixed inset-y-0 left-0 z-[90] w-64 bg-black/95 backdrop-blur-xl border-r border-white/10 flex flex-col pt-24 md:pt-8 pl-6 pr-4 transition-transform duration-300
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:relative md:translate-x-0
            `}>
                
                {/* BRANDING */}
                <h1 className="text-xl font-bold text-white mb-6 font-mono border-b-2 border-white/50 pb-2 inline-block shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    {appSettings?.companyName || "KPM SYSTEM"}
                </h1>

                {/* MENU (Auto-closes on selection) */}
                {user ? (
                    <nav className="space-y-0.5 flex-1 overflow-y-auto scrollbar-hide">
                        {visibleMenu.map(item => (
                            <button
                                key={item.id}
                                onClick={() => { 
                                    setActiveTab(item.id); 
                                    setIsMobileMenuOpen(false); // <--- FIXED: Closes sidebar immediately
                                }}
                                className={`w-full text-left py-2 px-3 text-xs font-bold transition-all duration-200 uppercase tracking-widest clip-path-polygon ${
                                    activeTab === item.id 
                                    ? 'bg-white text-black pl-6 shadow-[0_0_10px_rgba(255,255,255,0.8)] border-l-4 border-orange-500' 
                                    : 'text-gray-500 hover:text-white hover:pl-4 hover:bg-white/5'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                ) : (
                    <div className="flex-1 flex flex-col items-start pt-10 opacity-50">
                        <div className="text-xs text-red-500 font-mono mb-2">ACCESS DENIED</div>
                        <div className="h-0.5 w-10 bg-red-800 mb-4"></div>
                        <p className="text-[10px] text-slate-500">Authentication required.</p>
                    </div>
                )}

                {/* BOTTOM SECTION */}
                <div className="mt-auto mb-4 border-t border-white/10 pt-4">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <img 
                                src={appSettings?.mascotImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"} 
                                className="w-10 h-10 rounded border border-white/30 object-cover bg-black"
                                alt="avatar"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] text-gray-400 uppercase font-bold">OPERATIVE</p>
                                <p className="text-xs text-white font-mono truncate">{user.email?.split('@')[0]}</p>
                            </div>
                            <button onClick={handleLogout} className="text-red-500 hover:text-red-400 p-2 rounded transition-colors" title="Logout">
                                <LogOut size={16}/>
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={onLogin}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-500 border border-emerald-800 py-3 rounded uppercase text-xs font-bold tracking-widest transition-all"
                        >
                            <LogIn size={14}/> System Login
                        </button>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: CONTENT AREA */}
            <div className="relative z-10 flex-1 flex flex-col h-screen overflow-hidden bg-gradient-to-br from-transparent to-black/80">

                {/* HEADER (With safety padding for mobile menu) */}
                <div className="pt-24 md:pt-6 px-4 md:px-8 pb-2 flex justify-between items-end border-b border-white/20 shrink-0 relative">
                    <h2 className="text-6xl font-bold text-white/5 uppercase select-none absolute top-2 right-8 pointer-events-none hidden md:block">
                        {activeTab}
                    </h2>

                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${user ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`}></div>
                            <span className={`text-[9px] font-mono uppercase ${user ? 'text-emerald-500' : 'text-red-500'}`}>{user ? "System Active" : "Disconnected"}</span>
                        </div>
                        <div className="text-2xl text-white font-bold tracking-[0.15em] uppercase text-shadow-glow">
                            {activeTab.replace(/_/g, ' ')}
                        </div>
                    </div>

                    <div className="text-[10px] text-gray-500 font-mono text-right">
                        <div>{new Date().toLocaleDateString()}</div>
                        <div className="text-sm text-white">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/20">
                    <div className="biohazard-content max-w-full mx-auto">
                        {children}
                    </div>
                </div>

                {/* --- 2. HIDE FOOTER ON MOBILE --- */}
                {/* Added 'hidden md:flex' to ensure it stays invisible on phones */}
                <div className="hidden md:flex h-8 border-t border-white/10 items-center px-6 gap-6 text-[10px] text-gray-500 font-bold uppercase bg-black/80 backdrop-blur shrink-0">
                    <span className="flex items-center gap-2"><span className="bg-white text-black px-1 rounded-[1px]">L-CLICK</span> SELECT</span>
                    <span className="flex items-center gap-2"><span className="bg-gray-700 text-white px-1 rounded-[1px]">SCROLL</span> NAVIGATE</span>
                </div>

            </div>
            
            {/* GLOBAL STYLE OVERRIDES */}
            <style>{`
                .biohazard-content .bg-white { 
                    background-color: rgba(20, 20, 20, 0.85) !important; 
                    border: 1px solid rgba(255,255,255,0.15) !important; 
                    color: #e5e5e5 !important; 
                }
                .text-shadow-glow { text-shadow: 0 0 10px rgba(255,255,255,0.5); }
            `}</style>
        </div>
    );
};
// --- HELPER: SLIDER COMPONENT (Moved Outside to Fix Lag) ---
const DimensionControl = ({ label, val, axis, onChange, onInteract }) => (
    <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono text-slate-400 w-8">{label}</span>
        
        {/* SLIDER */}
        <input 
            type="range" min="10" max="300" 
            value={val} 
            onMouseDown={() => onInteract(true)}
            onMouseUp={() => onInteract(false)}
            onTouchStart={() => onInteract(true)}
            onTouchEnd={() => onInteract(false)}
            onChange={(e) => onChange(axis, parseInt(e.target.value))}
            className="flex-1 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-orange-500"
        />
        
        {/* MANUAL NUMBER INPUT */}
        <input 
            type="number" 
            value={val}
            onChange={(e) => onChange(axis, parseInt(e.target.value))}
            className="w-12 h-6 text-[10px] font-mono bg-black border border-white/20 text-white text-center rounded focus:border-orange-500 outline-none"
        />
        <span className="text-[10px] text-slate-500">mm</span>
    </div>
);

// --- NEW: TRUE 3D ITEM INSPECTOR (ZOOM SAVING + FIXED BUTTONS) ---
const ItemInspector = ({ product, isAdmin, onEdit, onDelete, onUpdateProduct }) => { 
    const [rotation, setRotation] = useState({ x: -15, y: 35 });
    const [isDragging, setIsDragging] = useState(false);
    const [isInteracting, setIsInteracting] = useState(false); 
    const lastMousePos = useRef({ x: 0, y: 0 });
    
    const [dims, setDims] = useState(product.dimensions || { w: 55, h: 90, d: 22 });
    const [zoom, setZoom] = useState(product.defaultZoom || 3.0); 
    const [showControls, setShowControls] = useState(false);
    
    useEffect(() => {
        setDims(product.dimensions || { w: 55, h: 90, d: 22 });
        setZoom(product.defaultZoom || 3.0);
    }, [product]);

    useEffect(() => {
        let frameId;
        const animate = () => {
            if (!isDragging && !isInteracting) {
                setRotation(prev => ({ ...prev, y: prev.y + 0.3 }));
            }
            frameId = requestAnimationFrame(animate);
        };
        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [isDragging, isInteracting]);

    const handleMouseDown = (e) => { 
        if(e.target.closest('.controls-panel') || e.target.closest('.admin-actions') || e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return; 
        setIsDragging(true); 
        lastMousePos.current = { x: e.clientX, y: e.clientY }; 
    };
    
    const handleMouseMove = (e) => { 
        if (!isDragging) return; 
        const deltaX = e.clientX - lastMousePos.current.x; 
        const deltaY = e.clientY - lastMousePos.current.y; 
        setRotation(prev => ({ x: prev.x - deltaY * 0.5, y: prev.y + deltaX * 0.5 })); 
        lastMousePos.current = { x: e.clientX, y: e.clientY }; 
    };

    const w = dims.w * zoom; 
    const h = dims.h * zoom; 
    const d = dims.d * zoom;

    const renderFace = (img, fallbackColor) => img ? <img src={img} className="w-full h-full object-cover" /> : <div className={`w-full h-full ${fallbackColor} border border-white/10`}></div>;
    const images = product.images || {};
    const front = images.front || product.image;
    const back = product.useFrontForBack ? front : images.back;

    return (
        <div className="h-full flex flex-col relative animate-fade-in select-none bg-gradient-to-b from-black via-slate-900/20 to-black overflow-hidden">
            
            {/* 3D CONTROLS */}
            {isAdmin && (
                <div className="absolute top-4 right-4 z-[100] flex flex-col items-end gap-2 controls-panel">
                    <button onClick={() => setShowControls(!showControls)} className={`p-2 rounded-full border border-white/20 ${showControls ? 'bg-orange-500 text-white' : 'bg-black/50 text-slate-400'}`}>
                        <Maximize2 size={16}/>
                    </button>
                    {showControls && (
                        <div className="bg-black/90 backdrop-blur-md border border-white/20 p-4 rounded-xl w-64 shadow-2xl">
                             <DimensionControl label="W" val={dims.w} axis="w" onChange={(a,v) => setDims(p=>({...p, [a]:v}))} onInteract={setIsInteracting} />
                             <DimensionControl label="H" val={dims.h} axis="h" onChange={(a,v) => setDims(p=>({...p, [a]:v}))} onInteract={setIsInteracting} />
                             <DimensionControl label="D" val={dims.d} axis="d" onChange={(a,v) => setDims(p=>({...p, [a]:v}))} onInteract={setIsInteracting} />
                             <button onClick={() => onUpdateProduct(product.id, { dimensions: dims, defaultZoom: zoom })} className="w-full mt-2 bg-emerald-600 text-white text-[10px] font-bold py-2 rounded">Save 3D Layout</button>
                        </div>
                    )}
                </div>
            )}

            {/* 3D VIEWER - FIXED DEPTH & FLICKERING */}
            <div 
                className="flex-1 flex items-center justify-center relative perspective-[1200px] cursor-move z-10"
                style={{ perspective: '1200px' }}
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => setIsDragging(false)}
            >
                <div 
                    className="relative" 
                    style={{ 
                        width: w, height: h, 
                        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                        transformStyle: 'preserve-3d', // <--- FIXED: FORCES 3D DEPTH
                        willChange: 'transform' // <--- FIXED: REDUCES FLICKER
                    }}
                >
                    <div className="absolute inset-0 bg-white" style={{ transform: `translateZ(${d/2}px)`, backfaceVisibility: 'hidden' }}>{renderFace(front, "bg-white")}</div>
                    <div className="absolute inset-0 bg-slate-800" style={{ transform: `rotateY(180deg) translateZ(${d/2}px)`, backfaceVisibility: 'hidden' }}>{renderFace(back, "bg-slate-800")}</div>
                    <div className="absolute" style={{ width: d, height: h, transform: `rotateY(90deg) translateZ(${w/2}px)`, left: (w-d)/2, backfaceVisibility: 'hidden' }}>{renderFace(images.right, "bg-slate-400")}</div>
                    <div className="absolute" style={{ width: d, height: h, transform: `rotateY(-90deg) translateZ(${w/2}px)`, left: (w-d)/2, backfaceVisibility: 'hidden' }}>{renderFace(images.left, "bg-slate-400")}</div>
                    <div className="absolute" style={{ width: w, height: d, transform: `rotateX(90deg) translateZ(${h/2}px)`, top: (h-d)/2, backfaceVisibility: 'hidden' }}>{renderFace(images.top, "bg-slate-300")}</div>
                    <div className="absolute" style={{ width: w, height: d, transform: `rotateX(-90deg) translateZ(${h/2}px)`, top: (h-d)/2, backfaceVisibility: 'hidden' }}>{renderFace(images.bottom, "bg-slate-500")}</div>
                </div>
            </div>

            {/* PRODUCT DATA & CLEAN ACTIONS */}
            <div className="bg-black/90 border-t-2 border-orange-600 p-6 md:p-8 relative z-20 backdrop-blur-xl">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                    <div className="w-full">
                        <h2 className="text-xl md:text-3xl text-white font-serif tracking-widest uppercase mb-1">{product.name}</h2>
                        <div className="flex items-center gap-3">
                            <span className="bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-500/50 text-emerald-400 text-[10px] font-mono font-bold">STOCK: {isAdmin ? product.stock : "**"}</span>
                            <span className="text-[9px] text-slate-500 font-mono uppercase">{product.type}</span>
                        </div>
                    </div>

                    {/* MOVED: Clean buttons at the top of the info panel */}
                    {isAdmin && (
                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={() => onEdit(product)} className="flex-1 md:px-6 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-colors">Edit</button>
                            <button onClick={() => onDelete(product.id)} className="flex-1 md:px-6 py-2 bg-red-900/30 text-red-500 border border-red-800 text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors">Discard</button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] md:text-xs font-mono border-t border-white/10 pt-4">
                    <div className="bg-white/5 p-2 border-l-2 border-red-500">
                        <p className="text-slate-500 uppercase mb-1">Dist</p>
                        <p className="text-white font-bold">{formatRupiah(product.priceDistributor)}</p>
                    </div>
                    <div className="bg-white/5 p-2 border-l-2 border-emerald-500">
                        <p className="text-slate-500 uppercase mb-1">Retail</p>
                        <p className="text-white font-bold">{formatRupiah(product.priceRetail)}</p>
                    </div>
                    <div className="bg-white/5 p-2 border-l-2 border-blue-500">
                        <p className="text-slate-500 uppercase mb-1">Grosir</p>
                        <p className="text-white font-bold">{formatRupiah(product.priceGrosir)}</p>
                    </div>
                    <div className="bg-white/5 p-2 border-l-2 border-yellow-500">
                        <p className="text-slate-500 uppercase mb-1">Ecer</p>
                        <p className="text-white font-bold">{formatRupiah(product.priceEcer)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- NEW: RESIDENT EVIL INVENTORY (SUPPORTS ZOOM SAVE) ---
const ResidentEvilInventory = ({ inventory, isAdmin, onEdit, onDelete, onAddNew, backgroundSrc, onUploadBg, onUpdateProduct }) => { 
    const [selectedId, setSelectedId] = useState(null);
    const [search, setSearch] = useState("");
    const [activeSection, setActiveSection] = useState("ALL");

    const sections = useMemo(() => {
        const groups = { "ALL": inventory };
        inventory.forEach(item => {
            const type = item.type || "MISC";
            if (!groups[type]) groups[type] = [];
            groups[type].push(item);
        });
        return groups;
    }, [inventory]);

    useEffect(() => {
        if (!selectedId && inventory.length > 0) setSelectedId(inventory[0].id);
    }, [inventory]);

    const sectionKeys = Object.keys(sections).sort();
    const currentList = sections[activeSection].filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    const selectedItem = inventory.find(i => i.id === selectedId) || inventory[0];

    return (
        <div className="flex flex-col md:flex-row h-full w-full bg-black overflow-hidden border border-white/10 rounded-xl shadow-2xl relative">
            
            {/* SUPPLY CASE: 45% Height on Mobile for better visibility */}
            <div className="w-full md:w-96 h-[45%] md:h-full flex flex-col border-b md:border-b-0 md:border-r border-white/10 bg-black/95 relative z-30 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
                <div className="p-4 md:p-6 border-b border-white/20">
                    <h3 className="text-white font-serif italic text-lg md:text-2xl mb-2">Supply Case</h3>
                    <div className="relative mb-3">
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH..." className="w-full bg-black/50 border border-white/30 p-2 pl-8 text-white text-[10px] font-mono outline-none"/>
                        <Search size={12} className="absolute left-2 top-2.5 text-slate-500"/>
                        {isAdmin && <button onClick={onAddNew} className="absolute right-2 top-1.5 text-slate-400 hover:text-white"><Plus size={16}/></button>}
                    </div>
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                        {sectionKeys.map(sec => (
                            <button key={sec} onClick={() => setActiveSection(sec)} className={`px-2 py-1 text-[8px] font-bold uppercase border whitespace-nowrap ${activeSection === sec ? 'bg-white text-black' : 'text-slate-500 border-slate-700'}`}>{sec}</button>
                        ))}
                    </div>
                </div>

                {/* SCROLLABLE LIST AREA */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10">
                    {currentList.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => setSelectedId(item.id)} 
                            className={`p-3 md:p-3 cursor-pointer border mb-1 flex items-center gap-3 transition-all ${selectedId === item.id ? 'bg-white/10 border-white/20' : 'border-transparent'}`}
                        >
                            <div className={`w-10 h-10 border flex items-center justify-center bg-black ${selectedId === item.id ? 'border-orange-500' : 'border-white/10'}`}>
                                {item.images?.front ? <img src={item.images.front} className="w-full h-full object-cover" /> : <Package size={16} className="text-slate-600"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-xs uppercase tracking-wide truncate ${selectedId === item.id ? 'text-orange-400' : 'text-slate-400'}`}>{item.name}</h4>
                                <p className="text-[9px] text-slate-600 font-mono">STK: {isAdmin ? item.stock : "**"}</p>
                            </div>
                        </div>
                    ))}
                    {currentList.length === 0 && <p className="text-center text-[10px] text-slate-600 mt-10">NO ITEMS FOUND</p>}
                </div>
            </div>

            {/* INSPECTOR AREA: 55% Height on Mobile */}
            <div className="flex-1 h-[55%] md:h-full relative bg-black">
                <div className="absolute inset-0 z-0">
                    <img src={backgroundSrc || 'https://www.transparenttextures.com/patterns/dark-leather.png'} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80"></div>
                </div>
                <div className="relative z-10 h-full">
                    {isAdmin && (
                        <label className="absolute top-4 right-14 z-50 cursor-pointer"> 
                            <div className="bg-black/50 p-2 rounded-full text-white border border-white/10"><ImageIcon size={14}/></div>
                            <input type="file" accept="image/*" onChange={onUploadBg} className="hidden" />
                        </label>
                    )}
                    {selectedItem && (
                        <ItemInspector 
                            product={selectedItem} 
                            isAdmin={isAdmin} 
                            onEdit={onEdit} 
                            onDelete={onDelete} 
                            onUpdateProduct={onUpdateProduct} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
};


// --- MODIFIED: AUDIT VAULT EXPLORER (SPLIT-PACKET VERSION) ---

const AuditVaultExplorer = ({ db, storage, appId, user, isAdmin, logAudit, setBackupToast }) => {
    // ... rest of the code ...
    const [path, setPath] = useState({ year: null, month: null, day: null });
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const years = ["2025", "2026"];
    const months = Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0'));
    const days = Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0'));

    // --- REVERSAL LOGIC: FETCH EXTERNAL SNAPSHOT & RESTORE ---
    const handleRestoreFromSnapshot = async (logEntry) => {
        if (!isAdmin || !logEntry.snapshotPath) return;
        
        const confirmMsg = `[RE TERMINAL]: DOWNLOADING CLOUD ARCHIVE...\n\nTarget: ${logEntry.action}\n\nProceed with reconstruction?`;
        
        if (window.confirm(confirmMsg)) {
            try {
                setLoading(true);
                // 1. FETCH THE EXTERNAL FILE FROM STORAGE
                const fileRef = storageRef(storage, logEntry.snapshotPath);
                const downloadUrl = await getDownloadURL(fileRef);
                const response = await fetch(downloadUrl);
                const snapshot = await response.json();

                // 2. AUTO-SAVE SAFETY SNAPSHOT
                await logAudit("PRE_REVERT_SAFETY", `Auto-archived before reverting to ${logEntry.action}`, true);

                const batch = writeBatch(db);
                
                if (snapshot.inventory) {
                    snapshot.inventory.forEach(item => {
                        batch.set(doc(db, `artifacts/${appId}/users/${user.uid}/products`, item.id), item);
                    });
                }
                if (snapshot.customers) {
                    snapshot.customers.forEach(c => {
                        batch.set(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, c.id), c);
                    });
                }

                await batch.commit();
                setBackupToast(true); 
                setTimeout(() => window.location.reload(), 2000);
                
            } catch (err) {
                console.error("CLOUD_REVERSION_FAILURE:", err);
                setLoading(false);
                alert("SYSTEM ERROR: Cloud data packet corrupted.");
            }
        }
    };

    useEffect(() => {
        if (path.year && path.month && path.day && user?.uid) {
            setLoading(true);
            const dateKey = `${path.year}-${path.month}-${path.day}`;
            const vaultPath = `artifacts/${appId}/users/${user.uid}/audit_vault/${dateKey}/logs`;
            
            const q = query(collection(db, vaultPath), orderBy('timestamp', 'desc'));
            const unsub = onSnapshot(q, (snap) => {
                setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                setLoading(false);
            }, (err) => {
                console.error("Vault Error:", err);
                setLoading(false);
            });
            return () => unsub();
        }
    }, [path, db, appId, user?.uid]);

    const formatM = (m) => new Date(2000, parseInt(m) - 1).toLocaleString('default', { month: 'long' });

    return (
        <div className="bg-black/20 border border-white/10 rounded-2xl p-6 min-h-[400px] font-mono text-xs">
            {/* Breadcrumbs */}
            <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6 border-b border-white/5 pb-2">
                <button onClick={() => setPath({year:null, month:null, day:null})} className="hover:text-white">VAULT</button>
                {path.year && <><span>/</span><button onClick={() => setPath({...path, month:null, day:null})} className="text-orange-500">{path.year}</button></>}
                {path.month && <><span>/</span><button onClick={() => setPath({...path, day:null})} className="text-orange-500">{formatM(path.month)}</button></>}
                {path.day && <><span>/</span><span className="text-white">{path.day}</span></>}
            </div>

            {/* Folder Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {!path.year && years.map(y => (
                    <button key={y} onClick={() => setPath({...path, year: y})} className="flex flex-col items-center p-4 bg-white/5 border border-white/10 rounded-xl hover:border-orange-500 group transition-all">
                        <Folder size={24} className="text-orange-500 mb-2 group-hover:scale-110 transition-transform"/>
                        <span className="text-white font-bold">{y}</span>
                    </button>
                ))}
                {path.year && !path.month && months.map(m => (
                    <button key={m} onClick={() => setPath({...path, month: m})} className="flex flex-col items-center p-4 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500 group transition-all">
                        <Calendar size={24} className="text-blue-500 mb-2"/>
                        <span className="text-white">{formatM(m)}</span>
                    </button>
                ))}
                {path.month && !path.day && days.map(d => (
                    <button key={d} onClick={() => setPath({...path, day: d})} className="flex flex-col items-center p-4 bg-white/5 border border-white/10 rounded-xl hover:border-emerald-500 group transition-all">
                        <div className="text-lg font-black text-white/20 group-hover:text-emerald-500">{d}</div>
                        <span className="text-[8px] text-slate-500 uppercase">DAY</span>
                    </button>
                ))}
            </div>

            {/* Log List */}
            {path.day && (
                <div className="mt-4 space-y-2 animate-fade-in">
                    {loading ? <p className="text-orange-500 animate-pulse text-center py-10 uppercase tracking-widest">/// Decrypting Sector ///</p> : logs.map(log => (
                        <div key={log.id} className="p-3 bg-white/5 border-l-2 border-orange-500 flex justify-between items-center group">
                            <div className="flex-1">
                                <p className="text-white font-bold uppercase flex items-center gap-2">
                                    {log.action}
                                    {log.snapshotId && (
                                        <span className="text-[7px] bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded tracking-tighter animate-pulse">
                                            REMOTE SNAPSHOT LOADED
                                        </span>
                                    )}
                                </p>
                                <p className="text-slate-400 text-[10px]">{log.details}</p>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                {log.snapshotId && isAdmin && (
                                    <button 
                                        onClick={() => handleRestoreFromSnapshot(log)}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-[9px] font-bold uppercase hover:bg-emerald-500 transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                    >
                                        <RotateCcw size={10}/> Revert
                                    </button>
                                )}
                                <span className="text-slate-600 text-[9px]">{log.timeStr}</span>
                            </div>
                        </div>
                    ))}
                    {!loading && logs.length === 0 && <p className="text-slate-600 italic py-10 text-center uppercase tracking-widest">/// Sector Empty ///</p>}
                </div>
            )}
        </div>
    );
};


// --- SIMPLIFIED: STABLE SAFETY STATUS WIDGET ---
// --- UPDATED: SAFETY STATUS (SYNCED WITH SETTINGS) ---
const SafetyStatus = ({ auditLogs = [], sessionStatus }) => {
    // 1. Get Limits
    const resetThreshold = parseInt(localStorage.getItem('indicator_reset_time') || '0');
    const now = new Date();
    const todayStr = now.toLocaleDateString();

    // 2. CLOUD SYNC LOGIC (Matches Settings)
    const confirmedMirror = auditLogs.find(log => 
        (log.action === "DATABASE_MIRROR" || log.action === "MASTER_BACKUP") && 
        log.timestamp && 
        (log.timestamp.seconds * 1000 > resetThreshold)
    );
    // If we clicked the button (sessionStatus.cloud) OR we found a valid log -> GREEN
    const isCloudSecure = sessionStatus?.cloud || !!confirmedMirror;

    // 3. USB SAFE LOGIC (Matches Settings)
    const lastUSB = parseInt(localStorage.getItem('last_usb_backup') || '0');
    const isUsbValidInDb = lastUSB > resetThreshold && (now.getTime() - lastUSB) < (7 * 24 * 60 * 60 * 1000);
    const isUsbSecure = sessionStatus?.usb || isUsbValidInDb;

    // 4. SNAPSHOT LOGIC
    const todaySnapshots = auditLogs.filter(log => {
        if (!log.isSavePoint || !log.timestamp || !log.timestamp.seconds) return false;
        try {
            const logDate = new Date(log.timestamp.seconds * 1000).toLocaleDateString();
            return logDate === todayStr;
        } catch (e) { return false; }
    }).length;
    // If manual recovery button pressed OR we have logs -> GREEN
    const isRecoverySecure = sessionStatus?.recovery || todaySnapshots > 0;

    return (
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm flex gap-6 shadow-lg mb-6">
            {/* CLOUD INDICATOR */}
            <div className="flex-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">Cloud Sync</p>
                <div className={`text-sm font-black flex items-center gap-2 ${isCloudSecure ? 'text-emerald-500' : 'text-red-500'}`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isCloudSecure ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    {isCloudSecure ? 'SECURE' : 'REQUIRED'}
                </div>
            </div>
            
            <div className="w-[1px] bg-white/10"></div>
            
            {/* USB INDICATOR */}
            <div className="flex-1 text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">USB Safe</p>
                <div className={`text-sm font-black flex justify-center items-center gap-2 ${isUsbSecure ? 'text-emerald-500' : 'text-orange-500'}`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isUsbSecure ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                    {isUsbSecure ? 'SECURE' : 'OUTDATED'}
                </div>
            </div>
            
            <div className="w-[1px] bg-white/10"></div>
            
            {/* SNAPSHOT COUNTER */}
            <div className="flex-1 text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">Save Points</p>
                <div className={`text-sm font-black flex justify-end items-center gap-2 font-mono ${isRecoverySecure ? 'text-emerald-400' : 'text-slate-400'}`}>
                    <History size={14} className={isRecoverySecure ? "animate-pulse" : "opacity-30"}/>
                    {todaySnapshots.toString().padStart(2, '0')} <span className="text-[8px] text-slate-600">TODAY</span>
                </div>
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
export default function KPMInventoryApp() {  // <--- ONLY ONE OPENING BRACE
  const [user, setUser] = useState(null);
  // ... rest of your code ...
  const [isAdmin, setIsAdmin] = useState(true);
  const [sessionStatus, setSessionStatus] = useState({ recovery: false, usb: false, cloud: false });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPin, setAdminPin] = useState(null);       
  const [hasAdminPin, setHasAdminPin] = useState(false); 
  const [inputPin, setInputPin] = useState("");         
  const [isSetupMode, setIsSetupMode] = useState(false); 
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [loginError, setLoginError] = useState(null); // <--- Add this to track login errors
  const [backupToast, setBackupToast] = useState(false);


// Helper to include Hours and Minutes in the filename
  // --- DOWNLOAD ENGINE HELPERS ---
  // --- PINPOINT: Line 1739 (Master Protocol Logic) ---
  const getCurrentTimestamp = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    return `${date}_${h}-${m}`; // Example: 2026-02-13_08-30
  };

  const triggerDownload = (name, data) => {
    try {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a); // Required for some browser security layers
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Download Error:", err);
    }
  };

  // --- UPDATED: MASTER PROTOCOL (Forces Green Indicators) ---
  const handleMasterProtocol = async () => {
    if (!user || !isAdmin) return;
    const ts = getCurrentTimestamp();
    
    const recovery = { meta: { type: "RECOVERY", ts }, inventory, customers, appSettings };
    const usb = { meta: { type: "USB_SAFE", ts }, inventory, transactions, customers, samplings, appSettings };
    const mirror = { meta: { type: "CLOUD_MIRROR", ts }, inventory, transactions, customers, samplings, appSettings, auditLogs };

    triggerCapy("Initiating Triple-Layer Backup... 🛡️");

    // Sequential Downloads
    setTimeout(() => triggerDownload(`FOLDER_RECOVERY--POINT_${ts}.json`, recovery), 0);
    setTimeout(() => triggerDownload(`FOLDER_USB--SAFE_OFFSITE_${ts}.json`, usb), 1500);
    setTimeout(() => triggerDownload(`FOLDER_CLOUD--MIRROR_SYNC_${ts}.json`, mirror), 3000);

    localStorage.setItem('last_usb_backup', new Date().getTime().toString());
    
    // --- FORCE GREEN LIGHTS IMMEDIATELY ---
    setSessionStatus({ recovery: true, usb: true, cloud: true }); 

    await logAudit("MASTER_BACKUP", `Triple Redundancy executed at ${ts}`, true);
    triggerCapy("Protocol Complete! Files sent to sorting. 💾");
  };


  
  // --- NEW: ULTRA-SLIM SNAPSHOT (STRIPS EVERYTHING BUT NUMBERS) ---
  const getUltraSlimSnapshot = () => {
    // We only keep the ID, current Stock, and Price tiers. 
    // We strip Names, Descriptions, and Images to save 90% more space.
    const ultraSlimInventory = inventory.map(item => ({
        id: item.id,
        stock: item.stock,
        pD: item.priceDistributor,
        pR: item.priceRetail,
        pG: item.priceGrosir,
        pE: item.priceEcer
    }));
    
    const ultraSlimCustomers = customers.map(c => ({
        id: c.id,
        tier: c.tier,
        lastV: c.lastVisit
    }));

    return {
        inventory: ultraSlimInventory,
        customers: ultraSlimCustomers,
        appSettings: { companyName: appSettings.companyName } // Only essential settings
    };
  };

  // --- LOGIC: CHECK IF USB BACKUP IS CURRENTLY SECURE (Within 7 Days) ---
  const lastUSB = localStorage.getItem('last_usb_backup');
  const isUsbSecure = lastUSB && (new Date().getTime() - parseInt(lastUSB)) < (7 * 24 * 60 * 60 * 1000);
  
  

  // --- 1. FULL CLOUD MIRROR (FOR SECURITY) ---
  const handleCloudMirror = async () => {
    if(!user) return;
    const mirrorPayload = {
      meta: { timestamp: new Date().toISOString(), app: "KPM_MIRROR", operator: user.email },
      inventory, transactions, customers, samplings, appSettings
    };
    const blob = new Blob([JSON.stringify(mirrorPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CLOUD_MIRROR_${getCurrentDate()}.json`;
    a.click();
    await logAudit("DATABASE_MIRROR", "Manual offsite cloud mirror created");
    triggerCapy("Mirror Synchronized! Upload this to your private Google Drive.");
  };

  // --- 2. GRANULAR TEAM SHARING: EXPORT ---
  const handleExportGranular = (type) => {
    if(!user) return;
    let exportData = {
        meta: { 
            type: `kpm_share_${type}`, 
            signature: `KPM-AUTO-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
            date: new Date().toISOString(), 
            owner: user.email 
        }
    };

    if (type === 'products' || type === 'both') {
        exportData.inventory = inventory; //
        exportData.appSettings = appSettings; // Shares tiers and branding
    }
    if (type === 'customers' || type === 'both') {
        exportData.customers = customers; //
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KPM_SHARE_${type.toUpperCase()}_${getCurrentDate()}.json`;
    a.click();
    triggerCapy(`Differentiated ${type} data signed and ready!`);
};

  // --- 3. GRANULAR TEAM SHARING: IMPORT ---
  const handleImportGranular = (e, targetType) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    if(!window.confirm(`Import ${targetType} data? This will overwrite existing items with the same ID.`)) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);
            const batch = writeBatch(db);

            if ((targetType === 'products' || targetType === 'both') && data.inventory) {
                data.inventory.forEach(item => {
                    batch.set(doc(db, `artifacts/${appId}/users/${user.uid}/products`, item.id), item);
                });
            }
            if ((targetType === 'customers' || targetType === 'both') && data.customers) {
                data.customers.forEach(c => {
                    batch.set(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, c.id), c);
                });
            }
            
            await batch.commit();
            triggerCapy(`${targetType.toUpperCase()} data imported successfully!`);
        } catch (err) { alert("Import Failed: " + err.message); }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };
const handleGitHubMirror = async () => {
    if(!user) return;
    
    // Package all critical business data
    const mirrorPayload = {
      meta: { 
        timestamp: new Date().toISOString(), 
        app: "KPM_SYSTEM_MIRROR",
        operator: user.email 
      },
      inventory,
      transactions,
      customers,
      samplings,
      appSettings
    };

    triggerCapy("Initiating Offsite Mirror... ☁️");

    try {
      // Note: In a production environment, you would use a secure backend 
      // or a specific API key stored in Firebase Secrets.
      // For now, this triggers a secondary JSON backup download as a 'Manual Mirror'.
      const blob = new Blob([JSON.stringify(mirrorPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OFFSITE_MIRROR_${getCurrentDate()}.json`;
      a.click();
      
      await logAudit("DATABASE_MIRROR", "Manual offsite cloud mirror created");
      triggerCapy("Mirror Synchronized! Move this to your Cloud Drive.");
    } catch (err) {
      console.error(err);
      triggerCapy("Mirror failed. Check console.");
    }
  };



// --- PINPOINT: Line 1770 (Objective 4: Advanced Security Logic) ---
  const [recoveryWord, setRecoveryWord] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);
  const [authShake, setAuthShake] = useState(false); // For visual "Wrong Password" feedback

  // 1. INITIAL CHECK: Does a PIN exist?
  useEffect(() => {
    const checkAdminStatus = async () => {
        if (!user) return;
        const ref = doc(db, `artifacts/${appId}/users/${user.uid}/settings`, 'admin');
        const snap = await getDoc(ref);
        
        if (snap.exists() && snap.data().pin) {
            setAdminPin(snap.data().pin);
            setRecoveryWord(snap.data().recoveryWord || "");
            setHasAdminPin(true);
            setIsSetupMode(false);
        } else {
            // No PIN found: Force Setup Mode
            setHasAdminPin(false);
            setIsSetupMode(true);
        }
    };
    checkAdminStatus();
  }, [user]);

  // 2. SETUP: Create PIN & Secret Word
  const handleSetupSecurity = async (newPin, secretWord) => {
    if (newPin.length < 4) { triggerCapy("PIN too short! (Min 4)"); return; }
    if (!secretWord.trim()) { triggerCapy("Secret word required!"); return; }

    const cleanWord = secretWord.trim().toLowerCase();
    
    // Save to Firestore
    await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/settings`, 'admin'), {
        pin: newPin,
        recoveryWord: cleanWord,
        updatedAt: serverTimestamp()
    });

    // Update Local State
    setAdminPin(newPin);
    setRecoveryWord(cleanWord);
    setHasAdminPin(true);
    setIsSetupMode(false);
    setIsAdmin(true); // Auto-login after setup
    setShowAdminLogin(false);
    
    triggerCapy("Security Protocol Established! 🛡️");
  };

  // 3. LOGIN: Verify PIN
  const handlePinLogin = () => {
      if (inputPin === adminPin) {
          setIsAdmin(true);
          setShowAdminLogin(false);
          setInputPin("");
          triggerCapy("Access Granted. Welcome, Boss.");
      } else {
          // Wrong PIN Animation
          setAuthShake(true);
          setTimeout(() => setAuthShake(false), 500);
          setInputPin("");
          triggerCapy("Access Denied.");
      }
  };

  // 4. RESET: Verify Secret Word
  const handleResetPin = (word) => {
    if (word.trim().toLowerCase() === recoveryWord) {
        setIsResetMode(false);
        setIsSetupMode(true); // Allow them to set a new PIN
        triggerCapy("Identity Verified. Create new PIN.");
    } else {
        setAuthShake(true);
        setTimeout(() => setAuthShake(false), 500);
        triggerCapy("Verification Failed.");
    }
  };

// --- PINPOINT: Line 1830 (Add this missing function to fix the crash) ---
  const handleChangePin = () => {
      // Switches the modal to "Setup Mode" so you can overwrite the old PIN
      setIsSetupMode(true); 
      setShowAdminLogin(true);
      setIsResetMode(false);
      setInputPin("");
      triggerCapy("Initialize PIN Reset Protocol.");
  };



  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);
  
  // Data States
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]); 
  const [transactions, setTransactions] = useState([]);
  const [samplings, setSamplings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [cart, setCart] = useState([]);
  const [opnameData, setOpnameData] = useState({});
  const [appSettings, setAppSettings] = useState({ mascotImage: '', companyName: 'KPM Inventory', mascotMessages: [] });

// --- NEW: TIER SETTINGS STATE ---
  const DEFAULT_TIERS = [
      { id: 'Platinum', label: 'Platinum', color: '#f59e0b', iconType: 'emoji', value: '🏆' },
      { id: 'Gold', label: 'Gold', color: '#fbbf24', iconType: 'emoji', value: '🥇' },
      { id: 'Silver', label: 'Silver', color: '#94a3b8', iconType: 'emoji', value: '🥈' },
      { id: 'Bronze', label: 'Bronze', color: '#78350f', iconType: 'emoji', value: '🥉' }
  ];
  const [tierSettings, setTierSettings] = useState(DEFAULT_TIERS);

  // Load Tiers from DB
  useEffect(() => {
      if(!user) return;
      const unsubTiers = onSnapshot(doc(db, `artifacts/${appId}/users/${user.uid}/settings`, 'tiers'), (snap) => {
          if (snap.exists() && snap.data().list) {
              setTierSettings(snap.data().list);
          }
      });
      return () => unsubTiers();
  }, [user]);

// --- MISSING FUNCTION: SAVE TIERS TO DATABASE ---
  const handleSaveTiers = async (newTiers) => {
      if (!user) return;
      try {
          await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/settings`, 'tiers'), { list: newTiers }, { merge: true });
          // No alert needed here to avoid spamming while typing
      } catch (err) {
          console.error("Error saving tiers:", err);
          alert("Failed to save tier settings.");
      }
  };

  // --- NEW: EXPORT TIER ICONS ---
  const handleExportTiers = () => {
      if(!tierSettings) return;
      const data = JSON.stringify({ 
          meta: { type: 'kpm_tier_config', date: new Date().toISOString() }, 
          tiers: tierSettings 
      }, null, 2);
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kpm_map_icons_${getCurrentDate()}.json`;
      a.click();
      triggerCapy("Map Icons Exported!");
  };

  // --- FIXED: SMART IMPORT (AUTO-RESIZE TO FIT DATABASE) ---
  const handleImportTiers = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      if(!window.confirm("Import Icons? This will overwrite your current map pins.")) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const json = JSON.parse(event.target.result);
              // Validation
              if (json.meta?.type !== 'kpm_tier_config' || !Array.isArray(json.tiers)) {
                  throw new Error("Invalid Icon Config File");
              }
              
              triggerCapy("Optimizing icons... please wait.");

              // --- AUTO-COMPRESSION LOGIC ---
              const resizedTiers = await Promise.all(json.tiers.map(async (tier) => {
                  // Only compress if it's an image and looks large (base64 string > 50kb)
                  if (tier.iconType === 'image' && tier.value && tier.value.length > 50000) { 
                      return new Promise((resolve) => {
                          const img = new Image();
                          img.src = tier.value;
                          img.onload = () => {
                              const canvas = document.createElement('canvas');
                              // Resize to 120px (Perfect for Map Icons, small file size)
                              const scale = 120 / Math.max(img.width, img.height);
                              canvas.width = img.width * scale;
                              canvas.height = img.height * scale;
                              const ctx = canvas.getContext('2d');
                              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                              // Export as compressed PNG
                              resolve({ ...tier, value: canvas.toDataURL('image/png', 0.8) });
                          };
                          img.onerror = () => resolve(tier); // If fail, keep original
                      });
                  }
                  return tier;
              }));
              // -----------------------------

              setTierSettings(resizedTiers);
              await handleSaveTiers(resizedTiers); // Now safe to save!
              triggerCapy("Map Icons Imported & Optimized!");
          } catch (err) {
              console.error(err);
              alert("Import Failed: " + err.message);
          }
      };
      reader.readAsText(file);
      e.target.value = null;
  };

  // UI States
  const [editingProduct, setEditingProduct] = useState(null);
  const [examiningProduct, setExaminingProduct] = useState(null);
  const [returningTransaction, setReturningTransaction] = useState(null);
  const [tempImages, setTempImages] = useState({}); 
  const [tempCustomerImage, setTempCustomerImage] = useState(null); // Staging for customer photo
  const [searchTerm, setSearchTerm] = useState("");
  const [useFrontForBack, setUseFrontForBack] = useState(false);
  const [boxDimensions, setBoxDimensions] = useState({ w: 55, h: 90, d: 22 });
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [activeCropContext, setActiveCropContext] = useState(null); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
// --- NEW: DISCO MODE STATE ---
  const [isDiscoMode, setIsDiscoMode] = useState(false);
  const discoTimeoutRef = useRef(null); 

  const triggerDiscoParty = () => {
      if (isDiscoMode) return; 
      setIsDiscoMode(true);
      triggerCapy("Let's DANCE! 🕺💃"); 

      // Stop after 12 seconds
      if (discoTimeoutRef.current) clearTimeout(discoTimeoutRef.current);
      discoTimeoutRef.current = setTimeout(() => {
          setIsDiscoMode(false);
      }, 12000); 
  };

  // Capybara Message Cycle
  const [capyMsg, setCapyMsg] = useState("Welcome to KPM Inventory!");
  const [showCapyMsg, setShowCapyMsg] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);

  // Default messages if none are set
  const defaultMessages = [
    "Welcome back, Boss! Stock looks good today.",
    "Checking the inventory... All safe! 🛡️",
    "Don't forget to record samples!",
    "Sales are looking up! 📈",
    "Need to restock soon? Check the list.",
    "I love organization. And watermelons. 🍉",
    "Did you know Capybaras are the largest rodents?",
    "Keep up the good work, team!",
    "Remember to hydrate while you work! 💧",
    "Profit margins are looking healthy.",
    "Scanning for discounts... just kidding!",
    "Is it time for a coffee break yet? ☕",
    "Inventory accuracy is key to success!",
    "You are doing great today! ⭐",
    "Any new products to add?",
    "I'm watching the store, don't worry.",
    "Make sure to update the customer list!",
    "A tidy inventory is a happy inventory.",
    "System systems go! 🚀",
    "Hello from the digital world! 👋"
  ];
  
  const activeMessages = (appSettings?.mascotMessages && appSettings.mascotMessages.length > 0) ? appSettings.mascotMessages : defaultMessages;

  // Feature State

 // Feature State
  const [editMascotMessage, setEditMascotMessage] = useState("");
  const [newMascotMessage, setNewMascotMessage] = useState("");
  
  // New Editing States
  const [editingMsgIndex, setEditingMsgIndex] = useState(-1); 
  const [editMsgText, setEditMsgText] = useState("");         
  
  const [editCompanyName, setEditCompanyName] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [editingSample, setEditingSample] = useState(null); 
  const [showSamplingAnalytics, setShowSamplingAnalytics] = useState(false); // <--- NEW STATE
  const [editingFolder, setEditingFolder] = useState(null);



  // --- AUTHENTICATION FLOW ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        setIsAdmin(false);
        if (currentUser?.email) setCurrentUserEmail(currentUser.email);
    });
    return () => unsubAuth();
  }, []);

  const handleAdminAuthSuccess = () => {
    setIsAdmin(true);
    setShowAdminLogin(false);
    triggerCapy("Access Granted. Welcome back, Boss.");
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    triggerCapy("Admin session ended.");
  };

  // --- DEBUG LOGIN LISTENER ---
    useEffect(() => {
        console.log("App loaded. Checking for redirect result..."); // <--- Check Console for this
        getRedirectResult(auth)
            .then((result) => {
                if (result) {
                    console.log("✅ LOGIN SUCCESS! User:", result.user.email);
                    // Force a state update if needed
                    setUser(result.user);
                } else {
                    console.log("ℹ️ No redirect result found. (Normal if just refreshing)");
                }
            })
            .catch((error) => {
                console.error("❌ REDIRECT ERROR:", error);
                // THIS ALERT WILL TELL US THE REAL REASON
                alert("Login Error Code: " + error.code + "\nMessage: " + error.message);
            });
    }, []);

  // --- DATA SYNC ---
  useEffect(() => {
    if (!user || !user.uid) return;
    const basePath = `artifacts/${appId}/users/${user.uid}`;
    
    // 1. Settings
    const unsubSettings = onSnapshot(doc(db, basePath, 'settings', 'general'), (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            setAppSettings(data);
            setEditCompanyName(data?.companyName || "KPM Inventory");
        } else {
            setDoc(doc(db, basePath, 'settings', 'general'), { companyName: 'KPM Inventory' });
        }
    });

    // 2. Inventory
    const unsubInv = onSnapshot(collection(db, basePath, 'products'), (snap) => setInventory(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    
    // 3. Transactions
    const unsubTrans = onSnapshot(query(collection(db, basePath, 'transactions'), orderBy('timestamp', 'desc')), (snap) => setTransactions(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    
    // 4. Samplings
    const unsubSamp = onSnapshot(query(collection(db, basePath, 'samplings'), orderBy('timestamp', 'desc')), (snap) => setSamplings(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    
    // 5. Audit Logs
    const unsubLogs = onSnapshot(query(collection(db, basePath, 'audit_logs'), orderBy('timestamp', 'desc')), (snap) => setAuditLogs(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    
    // 6. Customers (THIS IS LIKELY THE MISSING PART)
    const unsubCust = onSnapshot(query(collection(db, basePath, 'customers'), orderBy('name', 'asc')), (snap) => setCustomers(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    const savedTheme = localStorage.getItem('kpm_theme');
    if (savedTheme === 'light') setDarkMode(false);
    
    return () => { unsubSettings(); unsubInv(); unsubTrans(); unsubSamp(); unsubLogs(); unsubCust(); };
  }, [user]);

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('kpm_theme', 'dark'); } else { document.documentElement.classList.remove('dark'); localStorage.setItem('kpm_theme', 'light'); }
  }, [darkMode]);

  const handleLogin = async () => {
        setLoginError(null); // Reset errors
        try {
            // 1. Force persistence (Store login in Local Storage)
            await setPersistence(auth, browserLocalPersistence);
            
            // 2. Use POPUP (It works better on localhost than Redirect)
            const result = await signInWithPopup(auth, googleProvider);
            
            // 3. Success!
            console.log("Login Success:", result.user);
            setUser(result.user);
            
        } catch (error) {
            console.error("Login Error:", error);
            // Show the error on screen so we know exactly what's wrong
            setLoginError(`Error: ${error.code} - ${error.message}`);
        }
    };
  const handleLogout = async () => { await signOut(auth); setUser(null); setInventory([]); setTransactions([]); setIsAdmin(false); };

  // --- ACTIONS ---
 
  // --- MODIFIED: SYSTEM LOG ENGINE (FIXED 4TH DOWNLOAD BUG) ---
  const logAudit = async (action, details, includeSnapshot = false) => {
    if (!user) return;
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

    try {
        // FIX: Only trigger the extra generic download if it is NOT the Master Protocol
        // This prevents the 4th file from appearing while still keeping the indicators GREEN.
        if (includeSnapshot && action !== "MASTER_BACKUP" && action !== "BACKUP_SINGLE") {
            handleBackupData(); 
            triggerCapy("System Save File Downloaded! 💾");
        }

        const logData = {
            action,
            details,
            user: user.email,
            timestamp: serverTimestamp(),
            timeStr: now.toLocaleTimeString(),
            isSavePoint: includeSnapshot // This MUST remain true for the indicators to work
        };

        // Log to Firestore
        await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/audit_logs`), logData);
        await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/audit_vault/${dateKey}/logs`), logData);

    } catch (err) {
        console.error("Log Error:", err);
    }
  };
  
  const cycleMascotMessage = () => {
    // Uses the latest activeMessages list to cycle dialogue
    const nextIndex = (msgIndex + 1) % activeMessages.length;
    setMsgIndex(nextIndex);
    const message = activeMessages[nextIndex];
    setCapyMsg(message);
    setShowCapyMsg(true);
    setTimeout(() => setShowCapyMsg(false), 8000); 
  };
  
  // Re-usable function to pop up the mascot with a custom message
  const triggerCapy = (msg) => { 
    const message = msg || "Hello!"; 
    setCapyMsg(message); 
    setShowCapyMsg(true); 
    // Auto-hide after 8 seconds to prevent screen clutter
    setTimeout(() => setShowCapyMsg(false), 8000); 
  };
  
  const handleAddMascotMessage = async () => {
      if(!newMascotMessage.trim() || !user) return;
      const currentMessages = appSettings.mascotMessages || [];
      const updatedMessages = [...currentMessages, newMascotMessage.trim()];
      await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/settings/general`), { mascotMessages: updatedMessages }, {merge: true});
      setNewMascotMessage("");
      triggerCapy("New dialogue added!");
  };

  const handleDeleteMascotMessage = async (msgToDelete) => {
      if(!user) return;
      const currentMessages = appSettings.mascotMessages || [];
      const updatedMessages = currentMessages.filter(m => m !== msgToDelete);
      await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/settings/general`), { mascotMessages: updatedMessages }, {merge: true});
      triggerCapy("Dialogue removed.");
  };

// --- NEW: SAVE EDITED MASCOT MESSAGE ---
  const handleSaveEditedMessage = async (index) => {
      if (!user || !editMsgText.trim()) return;
      
      // 1. Get current list (or use defaults if this is the first customization)
      let currentList = appSettings?.mascotMessages;
      if (!currentList || currentList.length === 0) {
          currentList = [...defaultMessages];
      }
      
      // 2. Create a copy and update the specific item
      const updatedList = [...currentList];
      updatedList[index] = editMsgText.trim();
      
      // 3. Save to Firestore
      await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/settings/general`), { mascotMessages: updatedList }, {merge: true});
      
      // 4. Reset UI
      setEditingMsgIndex(-1);
      setEditMsgText("");
      triggerCapy("Dialogue updated!");
  };
  // --- NEW: DELETE SINGLE TRANSACTION ---
  const handleDeleteSingleTransaction = async (transaction) => {
      if(!window.confirm("Delete this specific transaction record? Stock will NOT be restored automatically (manual adjustment required if needed).")) return;
      try {
          await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/transactions`, transaction.id));
          logAudit("TRANS_DELETE", `Deleted transaction ${transaction.id} for ${transaction.customerName}`);
          triggerCapy("Transaction record removed.");
      } catch(err) {
          alert(err.message);
      }
  };

  const handleDeleteConsignmentData = async (customerName) => { if(!window.confirm(`Delete ALL history for ${customerName}?`)) return; try { const targets = transactions.filter(t => (t.customerName||'').trim() === customerName && (t.type.includes('CONSIGNMENT') || (t.type === 'SALE' && t.paymentType === 'Titip') || t.type === 'RETURN')); for(const t of targets) { await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/transactions`, t.id)); } logAudit("CONSIGN_DELETE", `Cleared data for ${customerName}`); } catch(err) {} };
  const handleDeleteHistory = async (customerName) => { if(!window.confirm(`Permanently delete ALL transaction history for "${customerName}"?`)) return; try { const targets = transactions.filter(t => (t.customerName||'').trim() === customerName); for (const t of targets) { await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/transactions`, t.id)); } await logAudit("HISTORY_DELETE", `Deleted history folder for ${customerName}`); triggerCapy(`Deleted ${targets.length} records for ${customerName}`); } catch (err) { console.error(err); alert("Error deleting history."); } };
  const handleExportCSV = () => { const headers = ["ID,Name,Category,Stock,Price(Retail)\n"]; const csvContent = inventory.map(p => `${p.id},"${p.name}",${p.type},${p.stock},${p.priceRetail}`).join("\n"); const blob = new Blob([headers + csvContent], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `inventory_${getCurrentDate()}.csv`; a.click(); logAudit("EXPORT", "Downloaded Inventory CSV"); };
 
 
// --- UPDATED: TARGETED MERCHANT SAVING ---
  const handleCropConfirm = (base64) => { 
      if (!activeCropContext) return; 
      
      const collPath = `artifacts/${appId}/users/${user.uid}/settings/general`;

      if (activeCropContext.type === 'mascot') { 
          setAppSettings(prev => ({ ...prev, mascotImage: base64 }));
          if(user) setDoc(doc(db, collPath), { mascotImage: base64 }, {merge: true});
          triggerCapy("Profile picture updated!"); 
      
      } else if (activeCropContext.type === 'product') { 
          setTempImages(prev => ({ ...prev, [activeCropContext.face]: base64 })); 
      
      } else if (activeCropContext.type === 'tier') {
          const idx = activeCropContext.index;
          const newTiers = [...tierSettings];
          newTiers[idx].value = base64; 
          setTierSettings(newTiers);
          handleSaveTiers(newTiers);
          triggerCapy("Tier Icon Updated!");

      } else if (activeCropContext.type === 'inventory_bg') {
          setAppSettings(prev => ({ ...prev, inventoryBg: base64 }));
          if(user) setDoc(doc(db, collPath), { inventoryBg: base64 }, {merge: true});
          triggerCapy("Inventory Backdrop Updated!");

      // --- FIXED: TARGETED MERCHANT SPRITE SAVING ---
      } else if (activeCropContext.type.startsWith('merchant_')) {
          const moodKey = activeCropContext.type.split('_')[1]; // Extracts 'idle', 'talking', or 'deal'
          const settingsKey = `merchant_${moodKey}`;
          
          // 1. Update local state immediately
          setAppSettings(prev => ({ ...prev, [settingsKey]: base64 }));
          
          // 2. Perform targeted update to Firestore (avoids overwriting other settings)
          if(user) {
              setDoc(doc(db, collPath), { [settingsKey]: base64 }, {merge: true});
              logAudit("SETTINGS_UPDATE", `Updated Merchant ${moodKey} visual`);
          }
          triggerCapy(`Merchant ${moodKey} visual updated!`);
      }
      
      setCropImageSrc(null); 
      setActiveCropContext(null); 
  };
  // --- FILE HANDLERS ---
  function handleTierIconSelect(e, index) {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = () => {
              setCropImageSrc(reader.result);
              setActiveCropContext({ type: 'tier', index: index, face: 'front' });
              setBoxDimensions({ w: 100, h: 100, d: 0 }); 
          };
          reader.readAsDataURL(file);
      }
      e.target.value = null;
  }

  const handleMascotSelect = (e) => { 
      const file = e.target.files[0]; 
      if (file) { 
          const reader = new FileReader(); 
          reader.onload = () => { 
              setCropImageSrc(reader.result); 
              setActiveCropContext({ type: 'mascot', face: 'front' }); 
              setBoxDimensions({ w: 100, h: 100, d: 100 }); 
          }; 
          reader.readAsDataURL(file); 
      } 
      e.target.value = null; 
  };

  const handleProductFaceUpload = (e, face) => { 
      const file = e.target.files[0]; 
      if (file) { 
          const reader = new FileReader(); 
          reader.onload = () => { 
              setCropImageSrc(reader.result); 
              setActiveCropContext({ type: 'product', face }); 
          }; 
          reader.readAsDataURL(file); 
      } 
      e.target.value = null; 
  };

  const handleEditExisting = (face, imgSource) => { 
      setCropImageSrc(imgSource); 
      setActiveCropContext({ type: 'product', face }); 
  };

  const handleInventoryBgSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = () => {
              setCropImageSrc(reader.result);
              setActiveCropContext({ type: 'inventory_bg', face: 'front' });
              setBoxDimensions({ w: 160, h: 90, d: 0 }); 
          };
          reader.readAsDataURL(file);
      }
      e.target.value = null;
  };

  // --- SETTINGS ACTIONS ---
  const handleSaveCompanyName = () => { 
      if(user) { 
          setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/settings/general`), { companyName: editCompanyName }, {merge: true}); 
          logAudit("SETTINGS_UPDATE", `Company Name changed to ${editCompanyName}`); 
      } 
      triggerCapy("Company name updated!"); 
  };

  // --- PRODUCT MANAGEMENT ---
  const handleSaveProduct = async (e) => { 
      e.preventDefault(); 
      if (!user) return; 
      try { 
          const formData = new FormData(e.target); 
          const data = Object.fromEntries(formData.entries());
          const numFields = ['stock', 'minStock', 'priceDistributor', 'priceRetail', 'priceGrosir', 'priceEcer']; 
          numFields.forEach(field => data[field] = Number(data[field]) || 0); 
          
          data.images = { ...(editingProduct?.images || {}), ...tempImages }; 
          data.dimensions = { ...boxDimensions }; 
          data.useFrontForBack = useFrontForBack; 
          data.updatedAt = serverTimestamp(); 
          
          if (editingProduct?.id) { 
              await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/products`, editingProduct.id), data); 
              await logAudit("PRODUCT_UPDATE", `Updated product: ${data.name}`); 
              triggerCapy("Product updated successfully!"); 
          } else { 
              data.createdAt = serverTimestamp(); 
              await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/products`), data); 
              await logAudit("PRODUCT_ADD", `Added new product: ${data.name}`); 
              triggerCapy("New product added!"); 
          } 
          setEditingProduct(null); 
          setTempImages({}); 
          setUseFrontForBack(false); 
      } catch (err) { 
          console.error(err); 
          triggerCapy("Error saving product!"); 
      } 
  };

  const handleUpdateProduct = async (updatedProduct) => { 
      setInventory(prev => prev.map(item => item.id === updatedProduct.id ? updatedProduct : item)); 
      if (editingProduct && editingProduct.id === updatedProduct.id) { 
          setEditingProduct(updatedProduct); 
      } 
      if(isAdmin && user && updatedProduct.id) { 
          try { 
              await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/products`, updatedProduct.id), { dimensions: updatedProduct.dimensions }); 
          } catch(e) {} 
      } 
  };

  const deleteProduct = async (id) => { 
      if (window.confirm("Are you sure you want to delete this product?")) { 
          try { 
              await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/products`, id)); 
              await logAudit("PRODUCT_DELETE", `Deleted product ID: ${id}`); 
              triggerCapy("Item removed."); 
          } catch (err) { 
              triggerCapy("Delete failed"); 
          } 
      } 
  };

  // --- STOCK OPNAME ---
  const handleOpnameChange = (id, val) => { setOpnameData(prev => ({ ...prev, [id]: val })); };
  
  const handleOpnameSubmit = async () => { 
      if (!user) return; 
      const updates = []; 
      inventory.forEach(item => { 
          const actual = opnameData[item.id]; 
          if (actual !== undefined && actual !== item.stock && !isNaN(actual)) { 
              updates.push({ id: item.id, name: item.name, old: item.stock, new: actual }); 
          } 
      }); 
      if (updates.length === 0) { triggerCapy("No changes to save!"); return; } 
      if (!window.confirm(`Confirm stock adjustment for ${updates.length} items?`)) return; 
      try { 
          await runTransaction(db, async (transaction) => { 
              updates.forEach(update => { 
                  const ref = doc(db, `artifacts/${appId}/users/${user.uid}/products`, update.id); 
                  transaction.update(ref, { stock: update.new }); 
              }); 
          }); 
          updates.forEach(u => { logAudit("STOCK_OPNAME", `Adjusted ${u.name}: ${u.old} -> ${u.new}`); }); 
          setOpnameData({}); 
          triggerCapy("Stock Opname saved successfully!"); 
      } catch (err) { 
          console.error(err); 
          alert("Failed to update stock: " + err.message); 
      } 
  };

  // --- CART & SALES LOGIC ---
  const addToCart = (product) => { 
      setCart(prev => { 
          const existing = prev.find(item => item.productId === product.id); 
          if (existing) return prev.map(item => item.productId === product.id ? { ...item, qty: item.qty + 1 } : item); 
          return [...prev, { productId: product.id, name: product.name, qty: 1, unit: 'Bks', priceTier: 'Retail', calculatedPrice: product.priceRetail, product }]; 
      }); 
  };

  const updateCartItem = (productId, field, value) => { 
      setCart(prev => prev.map(item => { 
          if (item.productId === productId) { 
              const newItem = { ...item, [field]: value }; 
              const { unit, priceTier: tier, product: prod } = newItem; 
              let base = 0; 
              if (tier === 'Ecer') base = prod.priceEcer || 0; 
              if (tier === 'Retail') base = prod.priceRetail || 0; 
              if (tier === 'Grosir') base = prod.priceGrosir || 0; 
              if (tier === 'Distributor') base = prod.priceDistributor || 0;
              
              let mult = 1; 
              if (unit === 'Slop') mult = prod.packsPerSlop || 10; 
              if (unit === 'Bal') mult = (prod.slopsPerBal || 20) * (prod.packsPerSlop || 10); 
              if (unit === 'Karton') mult = (prod.balsPerCarton || 4) * (prod.slopsPerBal || 20) * (prod.packsPerSlop || 10); 
              
              newItem.calculatedPrice = base * mult; 
              return newItem; 
          } 
          return item; 
      })); 
  };

  const removeFromCart = (pid) => setCart(p => p.filter(i => i.productId !== pid));

  // --- CORE TRANSACTION ENGINE ---
  const processTransaction = async (e, manualData = null) => { 
      if (e) e.preventDefault(); 
      if (!user) return; 
      
      const customerName = manualData ? manualData.customerName : new FormData(e.target).get('customerName').trim(); 
      const paymentType = manualData ? manualData.paymentType : new FormData(e.target).get('paymentType'); 
      const activeCart = manualData ? manualData.cart : cart;
      const totalRevenue = activeCart.reduce((acc, item) => acc + (item.calculatedPrice * item.qty), 0); 
      
      if(!customerName) { alert("Customer Name is required!"); return; } 

      try { 
          await runTransaction(db, async (firestoreTrans) => { 
              const updatesToPerform = [];
              const transactionItems = []; 
              let totalProfit = 0; 

              for (const item of activeCart) { 
                  const prodRef = doc(db, `artifacts/${appId}/users/${user.uid}/products`, item.productId); 
                  const prodDoc = await firestoreTrans.get(prodRef); 
                  
                  if(!prodDoc.exists()) throw `Product ${item.name} not found`; 
                  const prodData = prodDoc.data(); 
                  
                  let mult = 1; 
                  if (item.unit === 'Slop') mult = prodData.packsPerSlop || 10; 
                  if (item.unit === 'Bal') mult = (prodData.slopsPerBal || 20) * (prodData.packsPerSlop || 10); 
                  if (item.unit === 'Karton') mult = (prodData.balsPerCarton || 4) * (prodData.slopsPerBal || 20) * (prodData.packsPerSlop || 10); 
                  
                  const qtyToDeduct = item.qty * mult; 
                  if(prodData.stock < qtyToDeduct) throw `Not enough stock for ${item.name}`; 
                  
                  const distributorPrice = prodData.priceDistributor || 0; 
                  const totalCost = distributorPrice * qtyToDeduct; 
                  const totalRevenueItem = item.calculatedPrice * item.qty; 
                  const itemProfit = totalRevenueItem - totalCost; 
                  
                  totalProfit += itemProfit;
                  updatesToPerform.push({ ref: prodRef, newStock: prodData.stock - qtyToDeduct });
                  
                  transactionItems.push({ 
                      ...item, 
                      distributorPriceSnapshot: distributorPrice, 
                      profitSnapshot: itemProfit 
                  });
              } 

              for (const update of updatesToPerform) { firestoreTrans.update(update.ref, { stock: update.newStock }); }
              
              const transRef = doc(collection(db, `artifacts/${appId}/users/${user.uid}/transactions`)); 
              firestoreTrans.set(transRef, { 
                  date: getCurrentDate(), 
                  customerName, 
                  paymentType, 
                  items: transactionItems, 
                  total: totalRevenue,
                  totalProfit: totalProfit, 
                  type: 'SALE', 
                  timestamp: serverTimestamp() 
              }); 
          }); 

          await logAudit("SALE", `Sold to ${customerName} via ${paymentType}`); 
          if (!manualData) setCart([]); 
          triggerCapy("Sale Recorded! Profit Calculated. 💰"); 
      } catch(err) { 
          console.error(err);
          alert("Transaction Failed: " + err); 
      } 
  };


  const handleMerchantSale = (custName, payMethod, cartItems) => {
      // 1. Normalize the typed input
      const inputTrimmed = custName.trim().toLowerCase();

      // 2. SMART MATCH: Check if this name already exists in your official Customer Profiles
      // This looks for an exact match OR if the typed name is part of an official name (e.g., "Aneka" matches "TOKO ANEKA (MTL)")
      const existingProfile = customers.find(c => 
          c.name.toLowerCase() === inputTrimmed || 
          c.name.toLowerCase().includes(inputTrimmed)
      );

      // 3. Use the Official Name if found, otherwise Title Case the new name
      const finalName = existingProfile 
          ? existingProfile.name 
          : custName.replace(/\b\w/g, l => l.toUpperCase());

      processTransaction(null, {
          customerName: finalName,
          paymentType: payMethod,
          cart: cartItems
      });
  };

  const executeReturn = async (returnQtys) => { if (!returningTransaction || !user) return; const trans = returningTransaction; let totalRefundValue = 0; const itemsToReturn = []; trans.items.forEach(item => { const qty = returnQtys[item.productId] || 0; if (qty > 0) { totalRefundValue += (item.calculatedPrice * qty); itemsToReturn.push({ ...item, qty }); } }); if (itemsToReturn.length === 0) { setReturningTransaction(null); return; } handleConsignmentReturn(trans.customerName, itemsToReturn, totalRefundValue); setReturningTransaction(null); };
  const handleConsignmentPayment = async (customerName, itemsPaid, amountPaid) => { try { await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/transactions`), { date: getCurrentDate(), customerName, paymentType: "Cash", itemsPaid, amountPaid, type: 'CONSIGNMENT_PAYMENT', timestamp: serverTimestamp() }); triggerCapy("Payment recorded!"); } catch (err) { console.error(err); } };
  const handleConsignmentReturn = async (customerName, itemsReturned, refundValue) => { try { await runTransaction(db, async (t) => { for(const item of itemsReturned) { const prodRef = doc(db, `artifacts/${appId}/users/${user.uid}/products`, item.productId); const prodDoc = await t.get(prodRef); if(prodDoc.exists()) t.update(prodRef, { stock: prodDoc.data().stock + (item.qty * 1) }); } const returnRef = doc(collection(db, `artifacts/${appId}/users/${user.uid}/transactions`)); t.set(returnRef, { date: getCurrentDate(), customerName, items: itemsReturned, total: -refundValue, type: 'RETURN', timestamp: serverTimestamp() }); }); triggerCapy("Return Processed!"); } catch (err) { console.error(err); } };
  const handleAddGoodsToCustomer = (name) => { alert(`Go to Sales Terminal for ${name}`); setActiveTab('sales'); };
  
 // --- NEW: HANDLE BATCH SAMPLING (GLOBAL NOTE) ---
  const handleBatchSamplingSubmit = async (cartItems, location, date, note) => {
      if (!user) return;
      try {
          await runTransaction(db, async (transaction) => {
              const writes = [];
              for (const item of cartItems) {
                  const prodRef = doc(db, `artifacts/${appId}/users/${user.uid}/products`, item.id);
                  const prodDoc = await transaction.get(prodRef);
                  if (!prodDoc.exists()) throw `Product ${item.name} not found!`;
                  
                  const currentStock = prodDoc.data().stock || 0;
                  const newStock = currentStock - item.qty;
                  if (newStock < 0) throw `Not enough stock for ${item.name} (Has: ${currentStock})`;

                  writes.push({ type: 'update', ref: prodRef, data: { stock: newStock } });
                  const newSampleRef = doc(collection(db, `artifacts/${appId}/users/${user.uid}/samplings`));
                  
                  // NEW: Save the GLOBAL note to every item
                  writes.push({ 
                      type: 'set', 
                      ref: newSampleRef, 
                      data: {
                          date: date,
                          productId: item.id,
                          productName: item.name,
                          qty: item.qty,
                          reason: location, 
                          note: note || '', 
                          timestamp: serverTimestamp()
                      } 
                  });
              }
              for (const w of writes) {
                  if (w.type === 'update') transaction.update(w.ref, w.data);
                  if (w.type === 'set') transaction.set(w.ref, w.data);
              }
          });
          await logAudit("SAMPLING_BATCH", `Added ${cartItems.length} items to folder: ${location}`);
          triggerCapy(`Success! ${cartItems.length} items saved.`);
          setEditingSample(null);
      } catch (err) { console.error(err); alert("Failed to save batch: " + err); }
  };

 // --- NEW: DELETE SAMPLING RECORD ---
  const handleDeleteSampling = async (sample) => {
      if(!window.confirm("Delete this sample record? Stock will be RESTORED to inventory.")) return;
      try {
          await runTransaction(db, async (t) => {
              const prodRef = doc(db, `artifacts/${appId}/users/${user.uid}/products`, sample.productId);
              const prodDoc = await t.get(prodRef);
              
              // 1. Restore Stock
              if(prodDoc.exists()) {
                  const currentStock = prodDoc.data().stock || 0;
                  t.update(prodRef, { stock: currentStock + sample.qty });
              }
              
              // 2. Delete Record
              t.delete(doc(db, `artifacts/${appId}/users/${user.uid}/samplings`, sample.id));
          });
          
          logAudit("SAMPLING_DELETE", `Deleted sample: ${sample.productName}`);
          triggerCapy("Sample deleted & stock restored.");
      } catch(err) {
          console.error(err);
          alert("Failed to delete: " + err.message);
      }
  };

// --- 3. UPDATE SINGLE SAMPLING LOGIC ---
  const handleUpdateSampling = async (updatedData) => {
      if (!user || !editingSample) return;
      
      const newQty = parseInt(updatedData.qty);
      const newDate = updatedData.date;
      const newReason = updatedData.reason;
      const newNote = updatedData.note;

      try {
          await runTransaction(db, async (t) => {
              const prodRef = doc(db, `artifacts/${appId}/users/${user.uid}/products`, editingSample.productId);
              const prodDoc = await t.get(prodRef);
              
              // Adjust stock difference
              // (If you change qty from 5 to 8, we need to deduct 3 more from stock)
              const oldQty = editingSample.qty;
              const diff = newQty - oldQty;
              
              if (prodDoc.exists() && diff !== 0) {
                  const currentStock = prodDoc.data().stock || 0;
                  if (currentStock < diff) throw `Not enough stock to increase sample! (Need ${diff}, Has ${currentStock})`;
                  t.update(prodRef, { stock: currentStock - diff });
              }

              t.update(doc(db, `artifacts/${appId}/users/${user.uid}/samplings`, editingSample.id), {
                  date: newDate,
                  qty: newQty,
                  reason: newReason,
                  note: newNote,
                  updatedAt: serverTimestamp()
              });
          });
          
          triggerCapy("Record updated!");
          setEditingSample(null);
      } catch (err) { alert(err.message || err); }
  };

  // --- NEW: OPEN FOLDER EDIT MODAL ---
  const handleBatchFolderEdit = (oldDate, oldReason) => {
      setEditingFolder({ oldDate, oldReason }); // Just open the modal
  };

  // --- NEW: SAVE FOLDER CHANGES (Native Date Picker) ---
  const processFolderEdit = async (e) => {
      e.preventDefault();
      if (!user || !editingFolder) return;
      
      const formData = new FormData(e.target);
      const newDate = formData.get('newDate');
      let newReason = formData.get('newReason').trim();
      
      // Auto-capitalize the new location name for consistency
      newReason = newReason.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

      const { oldDate, oldReason } = editingFolder;

      if (newDate === oldDate && newReason === oldReason) {
          setEditingFolder(null);
          return;
      }

      if (!window.confirm(`Move ALL items from "${oldReason}" to "${newReason}" on ${newDate}?`)) return;

      try {
          const targets = samplings.filter(s => s.date === oldDate && s.reason === oldReason);
          const batch = writeBatch(db);
          
          targets.forEach(s => {
              const ref = doc(db, `artifacts/${appId}/users/${user.uid}/samplings`, s.id);
              batch.update(ref, { date: newDate, reason: newReason });
          });
          
          await batch.commit();
          triggerCapy(`Successfully moved ${targets.length} items!`);
          setEditingFolder(null);
      } catch (err) {
          console.error(err);
          alert("Move failed: " + err.message);
      }
  };

  const handleBackupData = async () => {
    if(!user || !isAdmin) return; 
    
    const backupData = {
        meta: { date: new Date().toISOString(), user: user.email },
        inventory, transactions, customers, samplings, appSettings, auditLogs
    };
    
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `USB_SAFE_BACKUP_${getCurrentDate()}.json`; 
    a.click();

    // 1. Update the indicator (Turns status GREEN)
    localStorage.setItem('last_usb_backup', new Date().getTime().toString());
    
    // 2. Show the Success Toast
    setBackupToast(true);
    setTimeout(() => setBackupToast(false), 4000); 
    
    await logAudit("USB_BACKUP", "Admin performed physical safe backup");
    triggerCapy("Physical safety confirmed! 💾");
  };

  const handleRestoreData = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    if(!window.confirm("WARNING: This will attempt to restore data from the file. Existing records with the same IDs will be overwritten. Continue?")) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if(!data.inventory || !data.transactions) throw new Error("Invalid backup file format");
            for(const item of data.inventory) { await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/products`, item.id), item); }
            if(data.customers) { for(const cust of data.customers) { await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, cust.id), cust); } }
            if(data.transactions) { for(const t of data.transactions) { await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/transactions`, t.id), t); } }
            if(data.appSettings) { await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/settings`, 'general'), data.appSettings); }
            triggerCapy("Data restoration complete! Please refresh the page.");
        } catch (err) { alert("Failed to restore: " + err.message); console.error(err); }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };// 
  
  // --- NEW: EXPORT SHARED CONFIG (Products + Branding ONLY) ---
  const handleExportSharedConfig = async () => {
    if(!user) return;
    const shareData = {
        meta: { type: "kpm_shared_config", date: new Date().toISOString(), exportedBy: user.email },
        inventory,      // The products (Images, 3D dims, Prices)
        appSettings     // The branding (Mascot, Company Name, Dialogues)
    };
    const blob = new Blob([JSON.stringify(shareData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kpm_shared_config_${getCurrentDate()}.json`;
    a.click();
    triggerCapy("Shared Config ready to send!");
  };

  // --- NEW: IMPORT SHARED CONFIG ---
  const handleImportSharedConfig = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    
    if(!window.confirm("Import Shared Config? This will overwrite your current Product List and Branding settings (Mascot/Name). Transactions will NOT be affected.")) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if(data.meta?.type !== "kpm_shared_config") throw new Error("Invalid Config File. Please use a file generated by the 'Share Config' button.");
            
            // 1. Overwrite Settings
            if(data.appSettings) {
                await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/settings`, 'general'), data.appSettings);
            }

            // 2. Merge/Overwrite Products
            if(data.inventory && Array.isArray(data.inventory)) {
                const batch = writeBatch(db); 
                data.inventory.forEach(item => {
                    const ref = doc(db, `artifacts/${appId}/users/${user.uid}/products`, item.id);
                    batch.set(ref, item); 
                });
                await batch.commit();
            }
            
            triggerCapy("Config Imported! Welcome to the team.");
        } catch (err) { 
            alert("Import Failed: " + err.message); 
            console.error(err); 
        }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  const totalStockValue = inventory.reduce((acc, i) => acc + (i.stock * (i.priceRetail || 0)), 0);
  const filteredInventory = inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const chartData = React.useMemo(() => {
      const dataMap = {};
      const customers = new Set();
      transactions.filter(t => t.type === 'SALE' || t.type === 'RETURN').forEach(t => {
          const date = t.date;
          if (!dataMap[date]) dataMap[date] = { date };
          const cName = (t.customerName || 'Unknown').trim();
          if (!dataMap[date][cName]) dataMap[date][cName] = 0;
          dataMap[date][cName] += t.total;
          customers.add(cName);
      });
      return { data: Object.values(dataMap).sort((a,b) => new Date(a.date) - new Date(b.date)).slice(-7), keys: Array.from(customers) };
  }, [transactions]);

  const handleEditMascotMsgChange = (e) => setEditMascotMessage(e.target.value);
  const handleEditCompNameChange = (e) => setEditCompanyName(e.target.value);
  const mainContentClass = isSidebarCollapsed ? 'ml-20' : 'ml-64';

// --- NEW: SAVE MAP HOME BASE ---
  const handleSetMapHome = async (center, zoom) => {
      if(!user || !isAdmin) return;
      try {
          const newSettings = { ...appSettings, mapHome: { lat: center.lat, lng: center.lng, zoom } };
          setAppSettings(newSettings);
          await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/settings/general`), newSettings, {merge: true});
          triggerCapy("New Map Home Base Saved! 🏠");
      } catch(err) { console.error(err); alert("Failed to save map home."); }
  };









// --- UPDATED: SINGLE BACKUP (Forces Specific Green Light) ---
  const handleSingleBackup = async (type) => {
      if (!user) return;
      const ts = getCurrentTimestamp();
      let data = {};
      let filename = "";

      if (type === "RECOVERY") {
          data = { meta: { type: "RECOVERY", ts }, inventory, customers, appSettings };
          filename = `FOLDER_RECOVERY--POINT_${ts}.json`;
          setSessionStatus(prev => ({ ...prev, recovery: true })); // <--- Force Green
      } else if (type === "USB") {
          data = { meta: { type: "USB_SAFE", ts }, inventory, transactions, customers, samplings, appSettings };
          filename = `FOLDER_USB--SAFE_OFFSITE_${ts}.json`;
          setSessionStatus(prev => ({ ...prev, usb: true })); // <--- Force Green
      } else if (type === "CLOUD") {
          data = { meta: { type: "CLOUD_MIRROR", ts }, inventory, transactions, customers, samplings, appSettings, auditLogs };
          filename = `FOLDER_CLOUD--MIRROR_SYNC_${ts}.json`;
          setSessionStatus(prev => ({ ...prev, cloud: true })); // <--- Force Green
      }

      triggerDownload(filename, data);
      await logAudit("BACKUP_SINGLE", `Manual download: ${type}`, true);
      triggerCapy(`${type} Backup Saved! Status Secure.`);
  };


 const renderSettings = () => {
      if (!user) return null; 

      // 1. LOCKSCREEN
      if (!isAdmin) {
          return (
              <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in text-center">
                  <div className="relative mb-8">
                      <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full animate-pulse"></div>
                      <div className="relative w-24 h-24 bg-black border-2 border-red-600 rounded-full flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(220,38,38,0.4)]">
                          <Lock size={40} className="animate-bounce-slow" />
                      </div>
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-[0.25em] mb-2 font-mono">Restricted Access</h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-xs leading-relaxed mb-8">Admin Clearance Required</p>
                  <button onClick={() => setShowAdminLogin(true)} className="px-10 py-4 border-2 border-white text-white font-black uppercase text-xs hover:bg-white hover:text-black transition-all">Unlock System</button>
              </div>
          );
      }

      // --- LOGIC HUB: MERGING DATABASE + INSTANT SESSION STATUS ---
      const resetThreshold = parseInt(localStorage.getItem('indicator_reset_time') || '0');
      const sNow = new Date();
      const sTodayStr = sNow.toLocaleDateString();

      // 1. CHECK DATABASE (Slow/Permanent Record)
      const confirmedMirror = auditLogs.find(log => 
          (log.action === "DATABASE_MIRROR" || log.action === "MASTER_BACKUP") && 
          log.timestamp && 
          (log.timestamp.seconds * 1000 > resetThreshold)
      );

      const dbRecoveryCount = auditLogs.filter(log => {
          if (!log.isSavePoint || !log.timestamp) return false;
          const logTime = log.timestamp.seconds * 1000;
          if (logTime < resetThreshold) return false;
          return new Date(logTime).toLocaleDateString() === sTodayStr;
      }).length;

      const lastUsbTime = parseInt(localStorage.getItem('last_usb_backup') || '0');
      const isUsbValidInDb = lastUsbTime > resetThreshold && (sNow.getTime() - lastUsbTime) < (7 * 24 * 60 * 60 * 1000);

      // 2. THE FIX: COMBINE SESSION STATE (Instant) WITH DATABASE (Persistent)
      const isRecoverySecure = sessionStatus.recovery || dbRecoveryCount > 0;
      const isUsbSecure = sessionStatus.usb || isUsbValidInDb;
      const isCloudSecure = sessionStatus.cloud || !!confirmedMirror;

      // 3. RESET HANDLER
      const handleResetIndicators = () => {
          localStorage.setItem('indicator_reset_time', new Date().getTime().toString());
          localStorage.removeItem('last_usb_backup'); 
          setSessionStatus({ recovery: false, usb: false, cloud: false }); // <--- Forces Red
          triggerCapy("Indicators Reset to REQUIRED state.");
      };

      return (
        <div className="animate-fade-in max-w-2xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">System Configuration</h2>
                    <p className="text-[10px] text-emerald-500 font-mono font-bold animate-pulse">CLEARANCE: ADMIN VERIFIED</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleResetIndicators} className="bg-white/5 border border-slate-600 text-slate-400 px-3 py-1 rounded text-[10px] font-bold uppercase hover:bg-red-900/50 hover:text-red-400 hover:border-red-500 transition-all">
                        Reset Indicators
                    </button>
                    <button onClick={handleAdminLogout} className="bg-red-900/30 border border-red-800 text-red-500 px-4 py-1 rounded text-[10px] font-bold uppercase hover:bg-red-600 hover:text-white transition-all">
                        Lock Admin
                    </button>
                </div>
            </div>

            {/* MASTER SECURITY CARD */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border-2 border-orange-500/20 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldCheck size={120} className="text-orange-500" /></div>

                <div className="relative z-10">
                    <h3 className="font-bold text-xl mb-1 dark:text-white flex items-center gap-3"><ShieldCheck className="text-emerald-500" size={24}/> Master Security Protocol</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-8">Triple-Layer Data Redundancy</p>
                    
                    <button onClick={handleMasterProtocol} className="w-full group relative bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] shadow-lg active:scale-95 mb-6">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-sm">EXECUTE MASTER BACKUP</span>
                            <span className="text-[9px] opacity-70 font-mono tracking-normal">Generate 3 Recovery Points Now</span>
                        </div>
                    </button>

                    {/* BIG LIVE STATUS INDICATORS */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {/* 1. RECOVERY STATUS */}
                        <div className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-500 ${isRecoverySecure ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-red-900/20 border-red-500 text-red-500 animate-pulse'}`}>
                            {isRecoverySecure ? <ShieldCheck size={32}/> : <ShieldAlert size={32}/>}
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest mb-1">RECOVERY</p>
                                <p className="text-xs font-bold">{isRecoverySecure ? "SECURE" : "REQUIRED"}</p>
                            </div>
                        </div>

                        {/* 2. USB STATUS */}
                        <div className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-500 ${isUsbSecure ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-orange-500/20 border-orange-500 text-orange-500 animate-pulse'}`}>
                            {isUsbSecure ? <ShieldCheck size={32}/> : <ShieldAlert size={32}/>}
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest mb-1">USB SAFE</p>
                                <p className="text-xs font-bold">{isUsbSecure ? "SECURE" : "UPDATE"}</p>
                            </div>
                        </div>

                        {/* 3. CLOUD STATUS */}
                        <div className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-500 ${isCloudSecure ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-red-900/20 border-red-500 text-red-500 animate-pulse'}`}>
                            {isCloudSecure ? <ShieldCheck size={32}/> : <ShieldAlert size={32}/>}
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest mb-1">CLOUD SYNC</p>
                                <p className="text-xs font-bold">{isCloudSecure ? "SECURE" : "REQUIRED"}</p>
                            </div>
                        </div>
                    </div>

                    {/* INDIVIDUAL DOWNLOADS */}
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => handleSingleBackup('RECOVERY')} className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded hover:bg-blue-500 hover:text-white transition-colors text-[9px] font-bold text-slate-500">DOWNLOAD FILE 1</button>
                        <button onClick={() => handleSingleBackup('USB')} className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded hover:bg-orange-500 hover:text-white transition-colors text-[9px] font-bold text-slate-500">DOWNLOAD FILE 2</button>
                        <button onClick={() => handleSingleBackup('CLOUD')} className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded hover:bg-emerald-500 hover:text-white transition-colors text-[9px] font-bold text-slate-500">DOWNLOAD FILE 3</button>
                    </div>
                </div>
            </div>
  
      
  
      
  

            {/* 2. TEAM SHARING (GRANULAR CONFIG) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-all">
                <h3 className="font-bold text-lg mb-1 dark:text-white flex items-center gap-2"><Copy size={20}/> Team Sharing</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4">Export specific datasets for your team</p>
                
                <div className="space-y-4">
                    {[
                        { label: 'Products & Prices', type: 'products', icon: <Package size={16}/> },
                        { label: 'Customer Directory', type: 'customers', icon: <User size={16}/> },
                        { label: 'Full Configuration', type: 'both', icon: <Settings size={16}/> }
                    ].map((item) => (
                        <div key={item.type} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="text-orange-500">{item.icon}</div>
                                <span className="text-sm font-bold dark:text-white">{item.label}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleExportGranular(item.type)} className="px-3 py-1.5 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-colors uppercase">Export</button>
                                <label className="px-3 py-1.5 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-100 cursor-pointer transition-colors uppercase">
                                    Import
                                    <input type="file" accept=".json" onChange={(e) => handleImportGranular(e, item.type)} className="hidden" />
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. USER PROFILE & SECURITY */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white"><User size={20}/> User Profile</h3>
                <label className="block text-sm text-slate-500 mb-2">Google Account Email</label>
                <input type="email" className="w-full p-2 rounded border dark:bg-slate-900 dark:border-slate-600 dark:text-white mb-4" value={currentUserEmail || ""} disabled/>
                <div className="p-4 rounded-xl border flex justify-between items-center bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
                    <div>
                        <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                            Administrator Access Verified
                        </p>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={handleChangePin} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 rounded-lg text-xs font-bold">Change PIN</button>
                         <button onClick={handleAdminLogout} className="px-4 py-2 bg-white dark:bg-slate-900 border border-emerald-200 rounded-lg text-xs font-bold text-red-500">Lock Admin</button>
                    </div>
                </div>
            </div>

            {/* 4. TIER & MAP ICON MANAGER */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white"><Tag size={20}/> Customer Tiers & Map Icons</h3>
                    <div className="flex gap-2">
                        <button onClick={handleExportTiers} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold"><Download size={14}/></button>
                        <label className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold cursor-pointer"><Upload size={14}/><input type="file" accept=".json" onChange={handleImportTiers} className="hidden" /></label>
                    </div>
                </div>
                <div className="space-y-3">
                    {tierSettings.map((tier, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border dark:border-slate-700">
                            <input type="color" value={tier.color} onChange={(e) => { const newTiers = [...tierSettings]; newTiers[idx].color = e.target.value; handleSaveTiers(newTiers); }} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"/>
                            <input value={tier.label} onChange={(e) => { const newTiers = [...tierSettings]; newTiers[idx].label = e.target.value; setTierSettings(newTiers); }} onBlur={() => handleSaveTiers(tierSettings)} className="w-24 p-2 text-xs font-bold border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                            <select value={tier.iconType} onChange={(e) => { const newTiers = [...tierSettings]; newTiers[idx].iconType = e.target.value; handleSaveTiers(newTiers); }} className="p-2 text-xs border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white"><option value="emoji">Emoji</option><option value="image">Custom Logo</option></select>
                            <div className="flex-1">
                                {tier.iconType === 'image' ? (
                                    <label className="flex items-center justify-center gap-2 w-full p-2 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer hover:bg-slate-300 text-xs font-bold text-slate-600 dark:text-slate-300"><Upload size={14}/> {tier.value?.startsWith('data:') ? "Change" : "Upload"}<input type="file" accept="image/*" onChange={(e) => handleTierIconSelect(e, idx)} className="hidden" /></label>
                                ) : (
                                    <input value={tier.value} onChange={(e) => { const newTiers = [...tierSettings]; newTiers[idx].value = e.target.value; handleSaveTiers(newTiers); }} className="w-full p-2 text-xs border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                                )}
                            </div>
                            <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-800" style={{ borderColor: tier.color }}>
                                {tier.iconType === 'image' ? (tier.value ? <img src={tier.value} className="w-full h-full object-contain p-1" /> : <ImageIcon size={14} className="opacity-30"/>) : (<span className="text-lg">{tier.value}</span>)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 5. MASCOT SETTINGS (SIZE + DIALOGUE) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-all duration-300">
                <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white mb-4"><MessageSquare size={20}/> Mascot Settings</h3>
                <div className="mb-6 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-700">
                    <div className="flex justify-between mb-2"><label className="text-xs font-bold text-slate-500 uppercase">Mascot Size</label><span className="text-xs text-orange-500 font-bold">{appSettings.mascotScale || 1}x</span></div>
                    <input type="range" min="0.5" max="2.0" step="0.1" value={appSettings.mascotScale || 1} onChange={(e) => { const scale = parseFloat(e.target.value); setAppSettings(prev => ({ ...prev, mascotScale: scale })); setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/settings/general`), { mascotScale: scale }, { merge: true }); }} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-orange-500"/>
                </div>
                <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Add New Dialogue Line</label>
                    <div className="flex gap-2">
                        <input className="flex-1 p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" placeholder="Type a message..." value={newMascotMessage} onChange={(e) => setNewMascotMessage(e.target.value)}/>
                        <button onClick={handleAddMascotMessage} className="bg-emerald-500 text-white px-4 rounded font-bold">Add</button>
                    </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeMessages.map((msg, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-2 rounded border dark:border-slate-700">
                            {editingMsgIndex === idx ? (
                                <div className="flex gap-2 w-full animate-fade-in">
                                    <input autoFocus className="flex-1 p-1 text-sm border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={editMsgText} onChange={(e) => setEditMsgText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEditedMessage(idx)}/>
                                    <button onClick={() => handleSaveEditedMessage(idx)} className="text-emerald-500 hover:text-emerald-600"><Save size={16}/></button>
                                    <button onClick={() => setEditingMsgIndex(-1)} className="text-slate-400 hover:text-slate-500"><X size={16}/></button>
                                </div>
                            ) : (
                                <>
                                    <span className="text-sm dark:text-slate-300 italic truncate mr-2">"{msg}"</span>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => { setEditingMsgIndex(idx); setEditMsgText(msg); }} className="text-slate-400 hover:text-blue-500"><Edit size={14}/></button>
                                        <button onClick={() => handleDeleteMascotMessage(msg)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 6. COMPANY IDENTITY */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-all duration-300">
                <h3 className="font-bold text-lg mb-4 dark:text-white">Company Identity</h3>
                <div className="flex gap-2">
                    <input className="flex-1 p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" value={editCompanyName || ""} onChange={handleEditCompNameChange}/>
                    <button onClick={handleSaveCompanyName} className="bg-orange-500 text-white px-4 rounded font-bold">Save Name</button>
                </div>
            </div>

            {/* 7. PROFILE PICTURE */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-all duration-300">
                <h3 className="font-bold text-lg mb-4 dark:text-white"><ImageIcon size={20}/> Mascot Profile</h3>
                <div className="flex items-start gap-6">
                    <div className="flex flex-col items-center">
                        <img src={appSettings?.mascotImage || "/mr capy.png"} className="w-24 h-24 rounded-full border-4 border-orange-500 object-cover bg-slate-100" onError={(e) => {e.target.onerror = null; e.target.src="https://api.dicebear.com/7.x/avataaars/svg?seed=Capy"}}/>
                        <span className="text-xs text-slate-400 mt-2">Current</span>
                    </div>
                    <div className="flex-1">
                        <label className="bg-orange-100 dark:bg-slate-700 text-orange-600 dark:text-orange-300 px-4 py-2 rounded-lg cursor-pointer hover:bg-orange-200 transition-colors inline-flex items-center gap-2 font-medium">
                            <Upload size={16} /> Select & Crop
                            <input type="file" accept="image/*" onChange={handleMascotSelect} className="hidden" />
                        </label>
                    </div>
                </div>
            </div>

            {/* 8. DANGER ZONE */}
            <div className="mt-12 pt-8 border-t-2 border-red-100 dark:border-red-900/30">
                <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldAlert size={16}/> Danger Zone</h4>
                <button onClick={triggerDiscoParty} disabled={isDiscoMode} className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all ${isDiscoMode ? 'bg-slate-500' : 'bg-red-600 hover:bg-red-700'}`}>
                    {isDiscoMode ? <><Music size={24} className="animate-spin"/> SYSTEM OVERLOAD...</> : <><ShieldAlert size={24} className="animate-pulse"/> DO NOT PRESS: CAPY DISCO PROTOCOL</>}
                </button>
                <p className="text-[10px] text-red-400 text-center mt-3 font-mono opacity-70">Warning: Extreme funkiness levels incoming.</p>
            </div>
        </div>
      );
  };

  // --- MAIN APP RENDER (BIOHAZARD THEME) ---
  return (
    <BiohazardTheme 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        appSettings={appSettings}
        isAdmin={isAdmin}
    >
      {/* 1. GLOBAL MODALS */}
      {examiningProduct && <ExamineModal product={examiningProduct} onClose={() => setExaminingProduct(null)} onUpdateProduct={handleUpdateProduct} isAdmin={isAdmin} />}
      {cropImageSrc && <ImageCropper imageSrc={cropImageSrc} onCancel={() => { setCropImageSrc(null); setActiveCropContext(null); }} onCrop={handleCropConfirm} dimensions={boxDimensions} onDimensionsChange={setBoxDimensions} face={activeCropContext?.face || 'front'} />}
      {returningTransaction && <ReturnModal transaction={returningTransaction} onClose={() => setReturningTransaction(null)} onConfirm={executeReturn} />}
      
      {/* --- PINPOINT: Improved Admin Modal (Fixed Fonts & Layout) --- */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 font-mono">
          <div className={`bg-black border-2 ${isResetMode ? 'border-orange-500' : 'border-red-600/50'} p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all ${authShake ? 'animate-shake' : ''}`}>
            
            {/* Terminal Decoration */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${isResetMode ? 'via-orange-500' : 'via-red-600'} to-transparent animate-pulse`}></div>
            
            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-[0.2em]">
                {isSetupMode ? "Initialize Security" : isResetMode ? "Identity Recovery" : "Security Check"}
            </h2>

            {/* CASE 1: FIRST TIME SETUP (Or Resetting) */}
            {isSetupMode ? (
                <div className="space-y-4">
                    <p className="text-[10px] text-emerald-500 uppercase font-bold mb-4 tracking-widest">Create Administrator Credentials</p>
                    <input type="password" placeholder="CREATE PIN (4+ DIGITS)" id="setupPin" className="w-full bg-white/5 border border-white/20 p-4 text-center text-white text-xl outline-none focus:border-emerald-500 font-mono placeholder:text-white/20" maxLength={6}/>
                    <input type="text" placeholder="SECRET RECOVERY WORD" id="setupWord" className="w-full bg-white/5 border border-white/20 p-4 text-center text-white text-xs outline-none focus:border-emerald-500 uppercase tracking-widest placeholder:text-white/20 font-mono" />
                    <button onClick={() => handleSetupSecurity(document.getElementById('setupPin').value, document.getElementById('setupWord').value)} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-xs tracking-[0.2em] transition-all shadow-lg font-mono">Save Credentials</button>
                </div>
            ) : isResetMode ? (
                /* CASE 2: RECOVERY MODE */
                <div className="space-y-4">
                    <p className="text-[10px] text-orange-400 uppercase font-bold mb-4 tracking-widest">Enter Secret Word</p>
                    <input type="text" id="resetWord" placeholder="WATERMELON..." className="w-full bg-white/5 border border-orange-500/50 p-4 text-center text-white text-xl outline-none uppercase tracking-widest focus:border-orange-500 font-mono placeholder:text-white/20" autoFocus />
                    <div className="flex gap-3">
                        <button onClick={() => setIsResetMode(false)} className="flex-1 py-3 border border-white/20 text-gray-400 text-xs font-bold uppercase hover:bg-white/10 font-mono tracking-widest">Cancel</button>
                        <button onClick={() => handleResetPin(document.getElementById('resetWord').value)} className="flex-1 py-3 bg-orange-600 text-white text-xs font-bold uppercase hover:bg-orange-500 font-mono tracking-widest">Verify</button>
                    </div>
                </div>
            ) : (
                /* CASE 3: STANDARD LOGIN (Fixed Buttons) */
                <div className="space-y-4">
                    <input 
                        type="password" 
                        placeholder="ENTER PIN" 
                        className="w-full bg-white/5 border border-white/20 p-4 text-center text-white text-3xl mb-4 outline-none font-mono tracking-[0.5em] focus:border-red-500 placeholder:text-white/10 placeholder:tracking-normal placeholder:text-sm transition-colors" 
                        value={inputPin} 
                        onChange={(e) => setInputPin(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handlePinLogin()} 
                        autoFocus 
                    />
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowAdminLogin(false)} 
                            className="flex-1 py-4 border border-white/20 text-gray-500 hover:text-white hover:bg-white/10 uppercase text-xs font-bold tracking-widest transition-all font-mono"
                        >
                            Abort
                        </button>
                        <button 
                            onClick={handlePinLogin} 
                            className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white uppercase text-xs font-bold tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all font-mono"
                        >
                            Access
                        </button>
                    </div>
                    
                    <div className="pt-4">
                        <button onClick={() => setIsResetMode(true)} className="text-[9px] text-slate-600 hover:text-slate-400 uppercase font-bold transition-colors tracking-widest font-mono">
                            Lost Key? Use Recovery Protocol
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}

      {/* 3. MAIN TABS (Only render if user exists) */}
      {user && (
        <>
         {activeTab === 'dashboard' && (
              <div className="space-y-8 relative">
                {/* --- PINPOINT: Pass sessionStatus here --- */}
                <SafetyStatus auditLogs={auditLogs} sessionStatus={sessionStatus} />
                  
                
                  
                  {/* Summary Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="border-l-4 border-white bg-white/5 p-6 backdrop-blur-sm">
                          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Assets</h3>
                          <p className="text-4xl font-bold text-white">{isAdmin ? formatRupiah(totalStockValue) : "****"}</p>
                      </div>
                      <div className="border-l-4 border-orange-500 bg-white/5 p-6 backdrop-blur-sm">
                          <h3 className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-1">Revenue</h3>
                          <p className="text-4xl font-bold text-white">{isAdmin ? formatRupiah(transactions.filter(t => t.type === 'SALE' || t.type === 'RETURN').reduce((acc, t) => acc + (t.total || 0), 0)) : "****"}</p>
                      </div>
                      <div className="border-l-4 border-emerald-500 bg-white/5 p-6 backdrop-blur-sm">
                          <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Net Profit</h3>
                          <p className="text-4xl font-bold text-white">{isAdmin ? formatRupiah(transactions.filter(t => t.type === 'SALE').reduce((acc, t) => acc + (t.totalProfit || 0), 0)) : "****"}</p>
                      </div>
                  </div>

                  {/* --- MODIFIED PHYSICAL SECURITY BLOCK: ADMIN ONLY + HIDE IF SECURE --- */}
                  {isAdmin && !isUsbSecure && (
                      <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl flex justify-between items-center animate-pulse">
                          <div className="flex items-center gap-3">
                              <ShieldAlert className="text-orange-500" size={20}/>
                              <p className="text-xs text-orange-200 font-bold uppercase tracking-wider">
                                  Physical Security Protocol Required?
                              </p>
                          </div>
                          <button 
                              onClick={handleBackupData} 
                              className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95"
                          >
                              Run USB Safe Backup
                          </button>
                      </div>
                  )}

                  {/* Performance Graph Area */}
                  <div className="bg-black/40 border border-white/10 p-6 h-96">
                      <h3 className="text-white mb-4 uppercase text-xs font-bold tracking-widest border-b border-white/10 pb-2">Performance Graph</h3>
                      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                            <BarChart data={chartData.data}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#fff"/>
                                <XAxis dataKey="date" stroke="#666" fontSize={10} tick={{fill: '#999'}}/>
                                <YAxis stroke="#666" fontSize={10} tick={{fill: '#999'}}/>
                                <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #fff', color: '#fff'}} cursor={{fill: 'rgba(255,255,255,0.1)'}}/>
                                <Legend />
                                {chartData.keys.map((key) => (
                                    <Bar key={key} dataKey={key} stackId="a" fill={getRandomColor(key)} />
                                ))}
                            </BarChart>
                      </ResponsiveContainer>
                  </div>

                  {/* RE TERMINAL TOAST (Kept here to ensure it works) */}
                  {backupToast && (
                      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[1000] bg-black/90 border-2 border-emerald-500 text-emerald-500 px-10 py-5 rounded-none shadow-[0_0_30px_rgba(16,185,129,0.5)] font-mono flex flex-col items-center gap-2 animate-terminal-flicker">
                          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
                          <div className="flex items-center gap-3">
                              <ShieldCheck size={28} className="animate-pulse" />
                              <div className="text-lg font-black uppercase tracking-[0.3em]">Backup Initialized</div>
                          </div>
                          <div className="h-[1px] w-full bg-emerald-500/30"></div>
                          <div className="text-[10px] uppercase tracking-widest opacity-70">Physical Data Integrity Confirmed</div>
                      </div>
                  )}
              </div>
          )}


          {activeTab === 'map_war_room' && <MapMissionControl customers={customers} transactions={transactions} inventory={inventory} db={db} appId={appId} user={user} logAudit={logAudit} triggerCapy={triggerCapy} isAdmin={isAdmin} savedHome={appSettings?.mapHome} onSetHome={handleSetMapHome} tierSettings={tierSettings} />}
          {activeTab === 'journey' && <JourneyView customers={customers} db={db} appId={appId} user={user} logAudit={logAudit} triggerCapy={triggerCapy} setActiveTab={setActiveTab} tierSettings={tierSettings} />}
          
          {activeTab === 'inventory' && (
          <div className="h-[calc(100vh-140px)] w-full max-w-7xl mx-auto border-4 border-black shadow-[0_0_0_1px_rgba(255,255,255,0.1)] relative">
              
              <ResidentEvilInventory 
                  inventory={filteredInventory}
                  isAdmin={isAdmin}
                  backgroundSrc={appSettings?.inventoryBg}
                  onUploadBg={handleInventoryBgSelect}
                  
                  // --- UPDATED SAVE FUNCTION ---
                  onUpdateProduct={async (id, updates) => {
                      // updates contains { dimensions: ..., defaultZoom: ... }
                      try {
                          await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/products`, id), updates);
                          triggerCapy("3D Settings Saved! 📦");
                          // Update local state immediately
                          setInventory(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
                      } catch(err) { console.error(err); alert("Save failed"); }
                  }}
                  // ---------------------------

                  onDelete={(id) => deleteProduct(id)}
                  onEdit={(item) => { 
                      setEditingProduct(item); 
                      setTempImages(item.images || {}); 
                      setBoxDimensions(item.dimensions || {w:55, h:90, d:22}); 
                      setUseFrontForBack(item.useFrontForBack || false); 
                  }}
                  onAddNew={() => { 
                      setEditingProduct({}); 
                      setTempImages({}); 
                      setBoxDimensions({w:55, h:90, d:22}); 
                      setUseFrontForBack(false); 
                  }}
              />
              
              {/* EDIT MODAL - AUTO HIDES WHEN CROPPING (fixes "Menu doesn't exit") */}
              {editingProduct && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-300"
                    style={{ display: cropImageSrc ? 'none' : 'flex' }} // <--- MAGIC FIX: Hides when cropping
                >
                    <div className="bg-black border border-white/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                        <button onClick={() => setEditingProduct(null)} className="absolute top-4 right-4 text-white hover:text-red-500"><X size={24}/></button>
                        <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest border-b border-white/20 pb-2">
                            {editingProduct.id ? "Edit Record" : "New Entry"}
                        </h2>
                        
                        <form onSubmit={handleSaveProduct} className="space-y-6 font-mono text-xs">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div><label className="text-gray-500 block mb-1">PRODUCT NAME</label><input name="name" defaultValue={editingProduct.name} className="w-full p-2 bg-white/5 border border-white/20 text-white focus:border-orange-500 outline-none"/></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-gray-500 block mb-1">STOCK</label><input name="stock" type="number" defaultValue={editingProduct.stock} className="w-full p-2 bg-white/5 border border-emerald-500/50 text-emerald-400 focus:border-emerald-500 outline-none"/></div>
                                        <div><label className="text-gray-500 block mb-1">TYPE</label><input name="type" defaultValue={editingProduct.type} className="w-full p-2 bg-white/5 border border-white/20 text-white focus:border-white outline-none"/></div>
                                    </div>
                                    
                                    {/* RESTORED: FRONT = BACK TOGGLE */}
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            id="useFront" 
                                            checked={useFrontForBack} 
                                            onChange={(e) => setUseFrontForBack(e.target.checked)}
                                            className="accent-orange-500 w-4 h-4"
                                        />
                                        <label htmlFor="useFront" className="text-white text-xs cursor-pointer select-none">Use Front Image for Back</label>
                                    </div>

                                    {/* TEXTURE ASSETS (WITH PREVIEWS & EDIT BTN) */}
                                    <div className="p-3 border border-dashed border-white/30 text-center bg-white/5">
                                        <p className="text-orange-500 font-bold mb-2">TEXTURE ASSETS</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['front', 'back', 'left', 'right', 'top', 'bottom'].map(face => {
                                                const hasImg = tempImages[face] || (editingProduct.images && editingProduct.images[face]);
                                                return (
                                                    <div 
                                                        key={face} 
                                                        className="h-12 bg-black border border-white/10 flex items-center justify-center text-[9px] text-gray-500 uppercase cursor-pointer hover:bg-white/10 hover:text-white transition-colors relative group overflow-hidden" 
                                                        onClick={() => document.getElementById(`file-edit-${face}`).click()}
                                                    >
                                                        {hasImg ? (
                                                            <>
                                                                <img src={hasImg} className="w-full h-full object-cover opacity-50 group-hover:opacity-100"/>
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Pencil size={12} className="text-white"/>
                                                                </div>
                                                                {/* RESTORED: Edit from existing button */}
                                                                <button 
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); handleEditExisting(face, hasImg); }}
                                                                    className="absolute top-0 right-0 p-1 bg-orange-600 text-white opacity-0 group-hover:opacity-100 z-20"
                                                                    title="Edit Crop"
                                                                >
                                                                    <Crop size={8}/>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            face
                                                        )}
                                                        <input id={`file-edit-${face}`} type="file" className="hidden" onChange={(e) => handleProductFaceUpload(e, face)}/>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-white border-b border-white/10 pb-1 mb-2">PRICING ENGINE</h3>
                                    <div><label className="text-gray-500 block mb-1">DISTRIBUTOR (MODAL)</label><input name="priceDistributor" type="number" defaultValue={editingProduct.priceDistributor} className="w-full p-2 bg-white/5 border border-red-900/50 text-red-400 focus:border-red-500 outline-none"/></div>
                                    <div><label className="text-gray-500 block mb-1">RETAIL PRICE</label><input name="priceRetail" type="number" defaultValue={editingProduct.priceRetail} className="w-full p-2 bg-white/5 border border-emerald-900/50 text-emerald-400 focus:border-emerald-500 outline-none"/></div>
                                    <div><label className="text-gray-500 block mb-1">GROSIR PRICE</label><input name="priceGrosir" type="number" defaultValue={editingProduct.priceGrosir} className="w-full p-2 bg-white/5 border border-blue-900/50 text-blue-400 focus:border-blue-500 outline-none"/></div>
                                    <div><label className="text-gray-500 block mb-1">ECER PRICE</label><input name="priceEcer" type="number" defaultValue={editingProduct.priceEcer} className="w-full p-2 bg-white/5 border border-yellow-900/50 text-yellow-400 focus:border-yellow-500 outline-none"/></div>
                                </div>
                            </div>
                            <button className="w-full bg-white text-black font-bold py-4 mt-6 uppercase hover:bg-gray-300 tracking-widest text-sm">Update Database</button>
                        </form>
                    </div>
                </div>
              )}
          </div>
      )}

          
          {activeTab === 'sales' && (
      <div className="h-full w-full"> 
          <MerchantSalesView 
              inventory={filteredInventory} 
              user={user} 
              appSettings={appSettings}
              customers={customers} // <--- ADD THIS: Passes the list for the dropdown
              onProcessSale={handleMerchantSale}
              onInspect={(item) => setExaminingProduct(item)} 
          />
      </div>
  )}


          {activeTab === 'customers' && (
              <CustomerManagement 
                  customers={customers} 
                  db={db} 
                  appId={appId} 
                  user={user} 
                  logAudit={logAudit} 
                  triggerCapy={triggerCapy} 
                  isAdmin={isAdmin} 
                  tierSettings={tierSettings}
                  onRequestCrop={(file) => {
                      const reader = new FileReader();
                      reader.onload = () => {
                          setCropImageSrc(reader.result);
                          setActiveCropContext({ type: 'customer_staging', face: 'front' });
                          setBoxDimensions({ w: 100, h: 100, d: 0 }); // Square crop
                      };
                      reader.readAsDataURL(file);
                  }}
                  croppedImage={tempCustomerImage}
                  onClearCroppedImage={() => setTempCustomerImage(null)}
              />
          )}

          {activeTab === 'consignment' && <ConsignmentView transactions={transactions} inventory={inventory} onAddGoods={handleAddGoodsToCustomer} onPayment={handleConsignmentPayment} onReturn={handleConsignmentReturn} onDeleteConsignment={handleDeleteConsignmentData} isAdmin={isAdmin} />}
          {activeTab === 'stock_opname' && (
              <StockOpnameView 
                  inventory={inventory} 
                  db={db} 
                  appId={appId} 
                  user={user} 
                  logAudit={logAudit}
                  triggerCapy={triggerCapy}
              />
          )}
          {activeTab === 'sampling' && (
              <>
                  {/* EDIT FOLDER MODAL */}
                  {editingFolder && (
                      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                              <h3 className="font-bold text-lg mb-4 dark:text-white">Rename Folder</h3>
                              <form onSubmit={processFolderEdit} className="space-y-4">
                                  <div><label className="text-xs font-bold text-slate-500">Date</label><input name="newDate" type="date" defaultValue={editingFolder.oldDate} className="w-full p-2 rounded border dark:bg-slate-900 dark:border-slate-600 dark:text-white"/></div>
                                  <div><label className="text-xs font-bold text-slate-500">Location Name</label><input name="newReason" defaultValue={editingFolder.oldReason} className="w-full p-2 rounded border dark:bg-slate-900 dark:border-slate-600 dark:text-white"/></div>
                                  <div className="flex gap-2 pt-2"><button type="button" onClick={()=>setEditingFolder(null)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">Cancel</button><button className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-bold">Save Move</button></div>
                              </form>
                          </div>
                      </div>
                  )}

                  {/* EDIT ITEM MODAL (The one you asked for) */}
                  <SampleEntryModal 
                      isOpen={!!editingSample} 
                      onClose={() => setEditingSample(null)} 
                      initialData={editingSample} 
                      inventory={inventory}
                      onSubmit={editingSample?.isNew ? handleBatchSamplingSubmit : handleUpdateSampling} // Logic switcher
                  />

                  {/* MAIN VIEW */}
                  {showSamplingAnalytics ? (
                      <SamplingAnalyticsView samplings={samplings} inventory={inventory} onBack={() => setShowSamplingAnalytics(false)} />
                  ) : (
                      <SamplingFolderView 
                          samplings={samplings} 
                          isAdmin={isAdmin} 
                          onRecordSample={() => setEditingSample({isNew:true})} // New Item
                          onDelete={handleDeleteSampling} 
                          onEdit={(s) => setEditingSample(s)} // Edit Item
                          onEditFolder={handleBatchFolderEdit}
                          onShowAnalytics={() => setShowSamplingAnalytics(true)}
                      />
                  )}
              </>
          )}
          
          {activeTab === 'transactions' && <HistoryReportView transactions={transactions} inventory={inventory} onDeleteFolder={handleDeleteHistory} onDeleteTransaction={handleDeleteSingleTransaction} isAdmin={isAdmin} user={user} appId={appId} />}
          
         {activeTab === 'audit' && (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
        <div className="flex justify-between items-end border-b border-white/10 pb-4">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="text-orange-500"/> Audit Vault
                </h2>
                <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em]">Immutable Operation Archive</p>
            </div>
        </div>
        
        {/* --- FULLY OPTIMIZED EXPLORER --- */}
        <AuditVaultExplorer 
    db={db} 
    storage={storage} // <--- ADD THIS LINE HERE
    appId={appId} 
    user={user} 
    isAdmin={isAdmin} 
    logAudit={logAudit} 
    setBackupToast={setBackupToast} 
/>
        
        <div className="mt-10">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 opacity-50">Recent System Activity</h3>
            <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden font-mono text-[10px]">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-slate-500">
                        <tr><th className="p-3">Action</th><th className="p-3">Details</th><th className="p-3 text-right">Time</th></tr>
                    </thead>
                    <tbody>
                        {auditLogs.slice(0, 8).map(log => (
                            <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-3 text-orange-500 font-bold">{log.action}</td>
                                <td className="p-3 text-slate-300">{log.details}</td>
                                <td className="p-3 text-right text-slate-500">
                                    {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString() : 'Just now'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
)}


          {activeTab === 'settings' && renderSettings()}
        </>
      )}

      {/* GLOBAL WIDGETS */}
      <CapybaraMascot 
          isDiscoMode={isDiscoMode} 
          message={showCapyMsg ? capyMsg : null} 
          onClick={() => cycleMascotMessage()} 
          staticImageSrc={appSettings?.mascotImage} 
          user={user} 
          
          // --- ADD THIS LINE ---
          scale={appSettings?.mascotScale || 1} 
      />
      <MusicPlayer />
    </BiohazardTheme>
  );
}
