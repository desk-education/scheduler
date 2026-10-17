// --- FIREBASE REALTIME DATABASE & AUTH CONFIGURATION ---
    const firebaseConfig = {
      apiKey: "AIzaSyA2paUzz5cVQWEN8tmYLcOWpOaiXiuEfDA",
      authDomain: "class-scheduler-webapp.firebaseapp.com",
      databaseURL: "https://class-scheduler-webapp-default-rtdb.firebaseio.com",
      projectId: "class-scheduler-webapp",
      storageBucket: "class-scheduler-webapp.firebasestorage.app",
      messagingSenderId: "1054299020306",
      appId: "1:1054299020306:web:36515c6a0ddf0f585ecccb",
      measurementId: "G-Q6DW3FX579"
    };

    // Initialize Firebase Services
    let db = null;
    let scheduleRef = null;
    let isFirebaseActive = false;

    try {
      if (typeof firebase !== "undefined") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        scheduleRef = db.ref('scheduleData');
        isFirebaseActive = true;
      }
    } catch(e) {
      console.warn("Firebase failed to initialize. Falling back to LocalStorage mode.", e);
    }

    // Explicit Session Guard Check
    if (typeof firebase !== "undefined" && firebase.auth) {
      firebase.auth().onAuthStateChanged(function(user) {
        if (!user && !sessionStorage.getItem("user_authenticated") && sessionStorage.getItem("user_role") !== "admin" && !sessionStorage.getItem("active_teacher_name")) {
          window.location.replace("index.html");
        }
      });
    }

    // --- DIRECT ADMIN ACCESS LOGIN HANDLER ---
    function loginAsAdminDirectly() {
      sessionStorage.setItem("user_role", "admin");
      sessionStorage.setItem("user_name", "System Administrator");
      sessionStorage.setItem("user_authenticated", "true");
      sessionStorage.removeItem("active_teacher_name");
      sessionStorage.removeItem("active_teacher_matched");
      applyRoleRestrictions();
      showToast("Signed in as Administrator with full system control.", "success");
      switchTab('master');
    }

    // --- AUTHENTICATION & CHANGE USER HANDLER ---
    function handleUserLogout() {
      sessionStorage.removeItem("user_role");
      sessionStorage.removeItem("user_name");
      sessionStorage.removeItem("user_authenticated");
      sessionStorage.removeItem("active_teacher_name");
      sessionStorage.removeItem("active_teacher_matched");
      if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut().then(() => {
          window.location.href = 'index.html';
        }).catch((err) => {
          console.error("Sign-out error:", err);
          window.location.href = 'index.html';
        });
      } else {
        window.location.href = 'index.html';
      }
    }

    // --- OFFLINE INLINE ICON HELPER ENGINE ---
    const SVG_ICONS = {
      'calendar-range': `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M17 14h-6"/><path d="M13 18H7"/></svg>`,
      'grid': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline-block mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`,
      'users': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline-block mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      'layout-grid': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline-block mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`,
      'alert-triangle': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline-block mr-1.5 -mt-0.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,
      'bar-chart-3': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline-block mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>`,
      'wand2': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.21 1.21 0 0 0 1.72 0L21.64 5.36a1.21 1.21 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/></svg>`,
      'upload': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`,
      'download': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
      'printer': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>`,
      'menu': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,
      'chevron-down': `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
      'school': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 6 8-4 8 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"/><path d="M12 22V12"/><path d="M12 12h8"/></svg>`,
      'user-check': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`,
      'book-open': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
      'check-circle': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      'trash-2': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
      'plus': `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>`,
      'rotate-ccw': `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
      'shield-alert': `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
      'zap': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
      'edit-3': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
      'x': `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>`,
      'grip-vertical': `<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-slate-400 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>`,
      'alert-circle': `<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 mr-1 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
      'plus-circle': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>`,
      'user': `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      'sparkles': `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 mr-1 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
      'check-circle-2': `<svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-emerald-500 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
      'log-out': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`
    };

    const lucide = {
      createIcons: function() {
        document.querySelectorAll('[data-lucide]').forEach(el => {
          const name = el.getAttribute('data-lucide');
          if (SVG_ICONS[name]) {
            el.innerHTML = SVG_ICONS[name];
          }
        });
      }
    };

    // --- DATA & APP STATE ENGINE ---
    
    // Master List of 21 Sections
    const SECTIONS = [
      { name: "ARTS & DESIGN", track: "ACADEMIC" },
      { name: "ABM 1", track: "ACADEMIC" },
      { name: "ABM 2", track: "ACADEMIC" },
      { name: "ABM 3", track: "ACADEMIC" },
      { name: "GAS 1", track: "ACADEMIC" },
      { name: "HUMSS 1", track: "ACADEMIC" },
      { name: "HUMSS 2", track: "ACADEMIC" },
      { name: "HUMSS 3", track: "ACADEMIC" },
      { name: "HUMSS 4", track: "ACADEMIC" },
      { name: "HUMSS 5", track: "ACADEMIC" },
      { name: "STEM 1", track: "ACADEMIC" },
      { name: "STEM 2", track: "ACADEMIC" },
      { name: "STEM 3", track: "ACADEMIC" },
      { name: "HE 1", track: "TVL" },
      { name: "HE 2", track: "TVL" },
      { name: "HEI 1", track: "TVL" },
      { name: "HEI 2", track: "TVL" },
      { name: "HI 1", track: "TVL" },
      { name: "HI 2", track: "TVL" },
      { name: "HI 3", track: "TVL" },
      { name: "HI 4", track: "TVL" }
    ];

    // Exactly 35 Teachers (Removed UNASSIGNED from count)
    const TEACHERS = [
      "LAPIZ", "AGUIRRE", "SANCHEZ", "RECILLA", "GALLARDO", "A. NACORDA", 
      "CABILAN", "CABADING", "MONLEON", "VIVAS", "C. REYES", "PIAMONTE", 
      "MIRANDA", "M. TORREFRANCA", "OLIVA", "ENTERO", "TUMULAK", "PELIGRO", 
      "CORDOVA", "MORI", "TOPIA", "NAILON", "DAGATAN", "MONTES", "BAYATO", 
      "CARTUCIANO", "NOBE", "A. F. GALLARDO", "R. Q. REYES", "SINADJAN", 
      "DEGULACION", "GENTALLAN", "VILLAPANA", "JIMENEZ", "B. NACORDA"
    ];

    /* 
      ==========================================================================
      REPAIR FIX #1: AUTHORITATIVE TIME-SLOT & PERIOD TIMETABLE CONFIGURATION
      ==========================================================================
      Updated to requested timetable slots with designated Lunch Break and Health Break converted to active schedulable slots.
    */
    const TIME_SLOTS_CONFIG = [
      { id: "p1", label: "07:00 - 08:00", start: "07:00", end: "08:00", startMin: 420, endMin: 480, isBreak: false },
      { id: "p2", label: "08:00 - 09:00", start: "08:00", end: "09:00", startMin: 480, endMin: 540, isBreak: false },
      { id: "p3", label: "09:00 - 10:00", start: "09:00", end: "10:00", startMin: 540, endMin: 600, isBreak: false },
      { id: "p4", label: "10:00 - 11:00", start: "10:00", end: "11:00", startMin: 600, endMin: 660, isBreak: false },
      { id: "p5", label: "11:00 - 12:00", start: "11:00", end: "12:00", startMin: 660, endMin: 720, isBreak: false },
      { id: "b1", label: "12:00 - 01:00", start: "12:00", end: "13:00", startMin: 720, endMin: 780, isBreak: false, breakName: "LUNCH BREAK" },
      { id: "p6", label: "01:00 - 02:00", start: "13:00", end: "14:00", startMin: 780, endMin: 840, isBreak: false },
      { id: "p7", label: "02:00 - 03:00", start: "14:00", end: "15:00", startMin: 840, endMin: 900, isBreak: false },
      { id: "p8", label: "03:00 - 04:00", start: "15:00", end: "16:00", startMin: 900, endMin: 960, isBreak: false },
      { id: "b2", label: "04:00 - 04:15", start: "16:00", end: "16:15", startMin: 960, endMin: 975, isBreak: false, breakName: "HEALTH BREAK" },
      { id: "p9", label: "04:15 - 05:15", start: "16:15", end: "17:15", startMin: 975, endMin: 1035, isBreak: false },
      { id: "p10", label: "05:15 - 06:15", start: "17:15", end: "18:15", startMin: 1035, endMin: 1095, isBreak: false },
      { id: "p11", label: "06:15 - 07:15", start: "18:15", end: "19:15", startMin: 1095, endMin: 1155, isBreak: false }
    ];

    // Legacy Time Slot String Array preserved for visual UI backwards compatibility
    const TIME_SLOTS = TIME_SLOTS_CONFIG.map(slot => slot.label);

    const INSTRUCTIONAL_SLOTS = TIME_SLOTS_CONFIG.filter(s => !s.isBreak).map(s => s.label);
    const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

    // Fully pre-generated deterministic seed schedule mapped to the updated time slots
    let rawSeedSchedule = [
      // Section 1: ARTS & DESIGN
      { id: "slot-1", section: "ARTS & DESIGN", day: "MON", time: "07:00 - 08:00", subject: "CPAR", teacher: "LAPIZ", room: "Studio A" },
      { id: "slot-2", section: "ARTS & DESIGN", day: "MON", time: "08:00 - 09:00", subject: "PE 4", teacher: "SANCHEZ", room: "Gym" },
      { id: "slot-3", section: "ARTS & DESIGN", day: "MON", time: "09:00 - 10:00", subject: "ENTREPRENEURSHIP", teacher: "AGUIRRE", room: "Studio A" },
      { id: "slot-4", section: "ARTS & DESIGN", day: "TUE", time: "07:00 - 08:00", subject: "PHYSICAL SCIENCE", teacher: "RECILLA", room: "Sci Lab" },
      { id: "slot-5", section: "ARTS & DESIGN", day: "TUE", time: "08:00 - 09:00", subject: "3D ANIMATION", teacher: "GALLARDO", room: "Mac Lab" },

      // Section 2: ABM 1
      { id: "slot-6", section: "ABM 1", day: "MON", time: "07:00 - 08:00", subject: "BUSINESS MATH", teacher: "A. NACORDA", room: "Room 201" },
      { id: "slot-7", section: "ABM 1", day: "MON", time: "08:00 - 09:00", subject: "CPAR", teacher: "CABILAN", room: "Room 201" },
      { id: "slot-8", section: "ABM 1", day: "MON", time: "09:00 - 10:00", subject: "FABM 2", teacher: "CABADING", room: "Room 201" },

      // Section 3: ABM 2 (Contains 1 deliberate conflict with LAPIZ at MON 07:00 to test engine)
      { id: "slot-9", section: "ABM 2", day: "MON", time: "07:00 - 08:00", subject: "CPAR", teacher: "LAPIZ", room: "Room 202" }, 
      { id: "slot-10", section: "ABM 2", day: "MON", time: "08:00 - 09:00", subject: "MARKETING", teacher: "MONLEON", room: "Room 202" },
      
      // Section 4: STEM 1
      { id: "slot-11", section: "STEM 1", day: "MON", time: "07:00 - 08:00", subject: "PHYSICS 2", teacher: "VIVAS", room: "Physics Lab" },
      { id: "slot-12", section: "STEM 1", day: "MON", time: "08:00 - 09:00", subject: "CHEMISTRY 2", teacher: "C. REYES", room: "Chem Lab" },
      { id: "slot-13", section: "STEM 1", day: "MON", time: "09:00 - 10:00", subject: "CALCULUS", teacher: "PIAMONTE", room: "Room 301" },
      { id: "slot-14", section: "STEM 1", day: "MON", time: "10:00 - 11:00", subject: "RESEARCH", teacher: "MIRANDA", room: "Room 301" },

      // Section 5: STEM 2 (Contains 1 deliberate conflict with VIVAS at MON 07:00)
      { id: "slot-15", section: "STEM 2", day: "MON", time: "07:00 - 08:00", subject: "PHYSICS 2", teacher: "VIVAS", room: "Room 302" }, 
      { id: "slot-16", section: "STEM 2", day: "MON", time: "08:00 - 09:00", subject: "BIOLOGY 2", teacher: "M. TORREFRANCA", room: "Bio Lab" },

      // Section 6: HUMSS 1
      { id: "slot-17", section: "HUMSS 1", day: "MON", time: "07:00 - 08:00", subject: "CREATIVE WRITING", teacher: "OLIVA", room: "Room 101" },
      { id: "slot-18", section: "HUMSS 1", day: "MON", time: "08:00 - 09:00", subject: "POLITICS", teacher: "ENTERO", room: "Room 101" },
      { id: "slot-19", section: "HUMSS 1", day: "MON", time: "09:00 - 10:00", subject: "TRENDS", teacher: "TUMULAK", room: "Room 101" },

      // Section 7-21 Slots
      { id: "slot-20", section: "HE 1", day: "MON", time: "07:00 - 08:00", subject: "COOKERY NC II", teacher: "PELIGRO", room: "Kitchen 1" },
      { id: "slot-21", section: "HE 1", day: "MON", time: "08:00 - 09:00", subject: "BREAD & PASTRY", teacher: "CORDOVA", room: "Kitchen 1" },
      { id: "slot-22", section: "HE 2", day: "MON", time: "07:00 - 08:00", subject: "FOOD & BEVERAGE", teacher: "MORI", room: "Kitchen 2" },
      { id: "slot-23", section: "HE 2", day: "MON", time: "08:00 - 09:00", subject: "COOKERY NC II", teacher: "TOPIA", room: "Kitchen 2" },
      { id: "slot-24", section: "HI 1", day: "MON", time: "07:00 - 08:00", subject: "FRONT OFFICE", teacher: "NAILON", room: "Hotel Lab" },
      { id: "slot-25", section: "HI 1", day: "MON", time: "08:00 - 09:00", subject: "HOUSEKEEPING", teacher: "DAGATAN", room: "Hotel Lab" },
      { id: "slot-26", section: "HI 2", day: "MON", time: "07:00 - 08:00", subject: "HOUSEKEEPING", teacher: "MONTES", room: "Suite A" },
      { id: "slot-27", section: "HUMSS 2", day: "TUE", time: "09:00 - 10:00", subject: "SOCIAL SCIENCE", teacher: "BAYATO", room: "Room 102" },
      { id: "slot-28", section: "HUMSS 3", day: "TUE", time: "09:00 - 10:00", subject: "COMMUNITY ENG.", teacher: "CARTUCIANO", room: "Room 103" },
      { id: "slot-29", section: "GAS 1", day: "WED", time: "07:00 - 08:00", subject: "DISASTER READINESS", teacher: "NOBE", room: "Room 105" },
      { id: "slot-30", section: "HEI 1", day: "WED", time: "01:00 - 02:00", subject: "EVENT MGMT", teacher: "A. F. GALLARDO", room: "Lab 3" },
      { id: "slot-31", section: "HI 3", day: "THU", time: "08:00 - 09:00", subject: "BARTENDING", teacher: "R. Q. REYES", room: "Bar Room" },
      { id: "slot-32", section: "HI 4", day: "THU", time: "10:00 - 11:00", subject: "TOURISM", teacher: "SINADJAN", room: "Travel Room" }
    ];

    let scheduleData = [];
    let currentTab = 'master';
    let detectedConflicts = [];
    let draggedSlotId = null;

    /*
      ==========================================================================
      REPAIR FIX #6: XSS PREVENTION AND DYNAMIC VALUE ESCAPING
      ==========================================================================
      Helper function to convert arbitrary string input to safe HTML entities
      preventing script injection via teacher/section names, subjects, or rooms.
    */
    function escapeHTML(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // Initialize App
    window.onload = function() {
      populateSelectOptions();
      loadScheduleData();
      checkActiveTeacherSession();
      applyRoleRestrictions();
      lucide.createIcons();

      // Close dropdown menu when clicking outside
      document.addEventListener('click', function(event) {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const menu = document.getElementById('mobile-menu');
        if (menu && toggleBtn && !toggleBtn.contains(event.target) && !menu.contains(event.target)) {
          menu.classList.add('hidden');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      });
    };

    /*
      ==========================================================================
      ROLE-BASED VIEW RESTRICTION ENGINE
      ==========================================================================
      Restricts logged-in teachers to view ONLY their personal "Teacher Timetable"
      and hides Section View, Master Matrix, Conflict Tracer, Workload Analytics,
      Import JSON, Export JSON, and Auto-Solve Engine except for Admin/Developer.
    */
    function applyRoleRestrictions() {
      const activeTeacherName = sessionStorage.getItem("active_teacher_name");
      const userRole = sessionStorage.getItem("user_role");
      const isTeacherSession = activeTeacherName && userRole !== "admin";

      const restrictedElements = document.querySelectorAll('.role-restricted-nav');

      if (isTeacherSession) {
        // Hide all restricted views, navigation links, and administrative actions
        restrictedElements.forEach(el => el.classList.add('hidden'));

        // Lock teacher profile dropdown selection to the matched teacher
        const selectTeacher = document.getElementById('select-teacher');
        const matchedTeacher = sessionStorage.getItem("active_teacher_matched");
        if (selectTeacher && matchedTeacher) {
          selectTeacher.value = matchedTeacher;
          selectTeacher.disabled = true;
          selectTeacher.classList.add("bg-slate-200", "cursor-not-allowed");
        }

        // Force active view tab strictly to Teacher Schedules
        switchTab('teachers');
      } else {
        // Restore visibility for Admin and Developer users
        restrictedElements.forEach(el => el.classList.remove('hidden'));
        
        const selectTeacher = document.getElementById('select-teacher');
        if (selectTeacher) {
          selectTeacher.disabled = false;
          selectTeacher.classList.remove("bg-slate-200", "cursor-not-allowed");
        }
      }
    }

    /*
      ==========================================================================
      TEACHER ACCOUNT CREATION, FAMILY NAME MATCHING & PORTAL SYSTEM
      ==========================================================================
    */
    function openTeacherLoginModal() {
      switchTeacherAuthTab('login');
      document.getElementById('teacher-auth-error-msg').classList.add('hidden');
      document.getElementById('teacher-auth-modal').classList.remove('hidden');
    }

    function closeTeacherAuthModal() {
      document.getElementById('teacher-auth-modal').classList.add('hidden');
    }

    function switchTeacherAuthTab(tab) {
      const loginBtn = document.getElementById('teacher-tab-login-btn');
      const regBtn = document.getElementById('teacher-tab-register-btn');
      const loginForm = document.getElementById('teacher-login-form');
      const regForm = document.getElementById('teacher-register-form');

      document.getElementById('teacher-auth-error-msg').classList.add('hidden');

      if (tab === 'login') {
        loginBtn.className = "flex-1 py-3 text-center border-b-2 border-indigo-600 text-indigo-600 bg-white transition";
        regBtn.className = "flex-1 py-3 text-center border-b-2 border-transparent hover:text-indigo-600 transition";
        loginForm.classList.remove('hidden');
        regForm.classList.add('hidden');
      } else {
        regBtn.className = "flex-1 py-3 text-center border-b-2 border-indigo-600 text-indigo-600 bg-white transition";
        loginBtn.className = "flex-1 py-3 text-center border-b-2 border-transparent hover:text-indigo-600 transition";
        regForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
      }
    }

    function extractFamilyName(fullName) {
      if (!fullName) return "";
      const parts = fullName.trim().split(/\s+/);
      return parts[parts.length - 1].toUpperCase();
    }

    function findMatchingFacultyProfile(familyName) {
      const cleanTarget = familyName.toUpperCase();
      return TEACHERS.find(t => t.toUpperCase() === cleanTarget || cleanTarget.endsWith(t.toUpperCase())) || familyName;
    }

    function livePreviewNameMatch() {
      const input = document.getElementById('t-reg-fullname').value;
      const extracted = extractFamilyName(input);
      const matched = findMatchingFacultyProfile(extracted);
      
      const previewText = document.getElementById('t-preview-family-name');
      if (extracted) {
        previewText.innerText = `${extracted} (Matched Faculty Profile: ${matched})`;
      } else {
        previewText.innerText = "---";
      }
    }

    function getRegisteredTeacherAccounts() {
      try {
        return JSON.parse(localStorage.getItem('registered_teacher_accounts_v1') || '[]');
      } catch(e) {
        return [];
      }
    }

    function saveRegisteredTeacherAccounts(accounts) {
      localStorage.setItem('registered_teacher_accounts_v1', JSON.stringify(accounts));
    }

    function handleTeacherRegisterSubmit(e) {
      e.preventDefault();
      const fullName = document.getElementById('t-reg-fullname').value.trim();
      const email = document.getElementById('t-reg-email').value.trim().toLowerCase();
      const password = document.getElementById('t-reg-pass').value.trim();

      const extractedFamily = extractFamilyName(fullName);
      const matchedFaculty = findMatchingFacultyProfile(extractedFamily);

      const accounts = getRegisteredTeacherAccounts();
      if (accounts.some(acc => acc.email === email)) {
        showTeacherAuthError("An account with this email address already exists. Please log in.");
        return;
      }

      const newAccount = {
        fullName,
        email,
        password,
        familyName: extractedFamily,
        matchedTeacher: matchedFaculty,
        createdAt: new Date().toISOString()
      };

      accounts.push(newAccount);
      saveRegisteredTeacherAccounts(accounts);

      // Store in Firebase database as well if online
      if (db) {
        db.ref('teacherAccounts').push(newAccount).catch(err => console.warn("Firebase teacher account sync error:", err));
      }

      // Automatically authenticate the new teacher session
      loginTeacherSession(fullName, matchedFaculty);
      closeTeacherAuthModal();
      showToast(`Account created for ${fullName}! Linked to timetable profile: ${matchedFaculty}`, "success");
    }

    function handleTeacherLoginSubmit(e) {
      e.preventDefault();
      const email = document.getElementById('t-login-email').value.trim().toLowerCase();
      const password = document.getElementById('t-login-pass').value.trim();

      const accounts = getRegisteredTeacherAccounts();
      const account = accounts.find(acc => acc.email === email && acc.password === password);

      if (account) {
        loginTeacherSession(account.fullName, account.matchedTeacher);
        closeTeacherAuthModal();
        showToast(`Welcome back, ${account.fullName}! Timetable loaded.`, "success");
      } else {
        showTeacherAuthError("Invalid teacher credentials. Check email and password or register a new account.");
      }
    }

    function showTeacherAuthError(msg) {
      const errBox = document.getElementById('teacher-auth-error-msg');
      const errText = document.getElementById('teacher-auth-error-text');
      errText.innerText = msg;
      errBox.classList.remove('hidden');
    }

    function loginTeacherSession(fullName, matchedTeacherProfile) {
      sessionStorage.setItem("active_teacher_name", fullName);
      sessionStorage.setItem("active_teacher_matched", matchedTeacherProfile);
      sessionStorage.setItem("user_authenticated", "true");
      sessionStorage.removeItem("user_role");

      checkActiveTeacherSession();
      applyRoleRestrictions();
      
      // Automatically switch view to "Teacher Schedules" and set dropdown to their profile
      switchTab('teachers');
      const selectElem = document.getElementById('select-teacher');
      if (selectElem) {
        selectElem.value = matchedTeacherProfile;
        renderTeacherView();
      }
    }

    function logoutTeacherSession() {
      sessionStorage.removeItem("active_teacher_name");
      sessionStorage.removeItem("active_teacher_matched");
      checkActiveTeacherSession();
      applyRoleRestrictions();
      showToast("Teacher session signed out.", "info");
      renderCurrentTab();
    }

    function checkActiveTeacherSession() {
      const activeName = sessionStorage.getItem("active_teacher_name");
      const matchedTeacher = sessionStorage.getItem("active_teacher_matched");

      const banner = document.getElementById('teacher-session-banner');
      const sessionNameElem = document.getElementById('teacher-session-name');
      const sessionMatchedElem = document.getElementById('teacher-session-matched');
      const btnText = document.getElementById('btn-teacher-portal-text');

      if (activeName && matchedTeacher) {
        banner.classList.remove('hidden');
        sessionNameElem.innerText = activeName;
        sessionMatchedElem.innerText = `Matched Profile: ${matchedTeacher}`;
        if (btnText) btnText.innerText = "Switch Teacher";
      } else {
        banner.classList.add('hidden');
        if (btnText) btnText.innerText = "Teacher Login";
      }
    }

    /*
      ==========================================================================
      FIREBASE HYBRID PERSISTENCE ENGINE & DATA NORMALIZATION
      ==========================================================================
    */
    function loadScheduleData() {
      if (isFirebaseActive && scheduleRef) {
        // Realtime Listener from Firebase Cloud Sync
        scheduleRef.on('value', (snapshot) => {
          const data = snapshot.val();
          if (data && Array.isArray(data)) {
            scheduleData = data.map(slot => normalizeSlot(slot));
          } else if (data && typeof data === 'object') {
            scheduleData = Object.values(data).map(slot => normalizeSlot(slot));
          } else {
            // Database empty: seed with defaults
            scheduleData = JSON.parse(JSON.stringify(rawSeedSchedule));
            saveScheduleData();
          }

          evaluateConflicts();
          renderCurrentTab();
          updateDashboardStats();
        }, (error) => {
          console.error("Firebase read error:", error);
          fallbackLocalLoad();
        });
      } else {
        fallbackLocalLoad();
      }
    }

    function fallbackLocalLoad() {
      const storageKey = 'g12_school_schedule_2026';
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          scheduleData = Array.isArray(parsed) ? parsed.map(slot => normalizeSlot(slot)) : JSON.parse(JSON.stringify(rawSeedSchedule));
        } catch(e) {
          scheduleData = JSON.parse(JSON.stringify(rawSeedSchedule));
        }
      } else {
        scheduleData = JSON.parse(JSON.stringify(rawSeedSchedule));
      }
      evaluateConflicts();
      renderCurrentTab();
      updateDashboardStats();
    }

    // Normalizes time slot labels from legacy representations to authoritative slot labels
    function normalizeSlot(slot) {
      const normalized = { ...slot };
      if (!normalized.id) normalized.id = 'slot-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);

      // Map legacy time strings if needed to the updated authoritative list
      if (normalized.time === "07:30 - 08:30") normalized.time = "07:00 - 08:00";
      if (normalized.time === "08:30 - 09:30") normalized.time = "08:00 - 09:00";
      if (normalized.time === "09:30 - 09:45" || normalized.time === "09:45 - 10:45") normalized.time = "09:00 - 10:00";
      if (normalized.time === "10:45 - 11:45") normalized.time = "10:00 - 11:00";
      if (normalized.time === "11:45 - 12:30") normalized.time = "12:00 - 01:00";
      if (normalized.time === "12:30 - 01:30") normalized.time = "01:00 - 02:00";
      if (normalized.time === "01:30 - 02:30") normalized.time = "02:00 - 03:00";
      if (normalized.time === "02:30 - 03:30") normalized.time = "03:00 - 04:00";
      if (normalized.time === "03:30 - 04:30") normalized.time = "04:15 - 05:15";

      return normalized;
    }

    function saveScheduleData() {
      // Local backup sync
      try {
        localStorage.setItem('g12_school_schedule_2026', JSON.stringify(scheduleData));
      } catch(e) {
        console.warn("LocalStorage write error", e);
      }

      // Cloud sync to Firebase Database
      if (isFirebaseActive && scheduleRef) {
        scheduleRef.set(scheduleData)
          .then(() => {
            evaluateConflicts();
            updateDashboardStats();
          })
          .catch((err) => {
            console.error("Firebase Sync Error:", err);
            showToast("Cloud sync error! Saved locally.", "warning");
          });
      } else {
        evaluateConflicts();
        updateDashboardStats();
      }
    }

    function resetDataToDefault() {
      if (confirm("Reset schedule back to default Grade 12 seed data? All custom modifications will be reverted.")) {
        scheduleData = JSON.parse(JSON.stringify(rawSeedSchedule));
        saveScheduleData();
        renderCurrentTab();
        showToast("Data reset to baseline schedule.", "info");
      }
    }

    /*
      ==========================================================================
      REPAIR FIX #2: COMPREHENSIVE CONFLICT DETECTION ENGINE
      ==========================================================================
      Evaluates interval collisions across Teachers, Sections, Rooms, and Breaks.
    */
    function getSlotInterval(timeLabel) {
      const config = TIME_SLOTS_CONFIG.find(c => c.label === timeLabel);
      if (config) return { startMin: config.startMin, endMin: config.endMin, isBreak: config.isBreak };
      return { startMin: 0, endMin: 0, isBreak: false };
    }

    function evaluateConflicts() {
      detectedConflicts = [];
      const conflictMap = new Map();

      for (let i = 0; i < scheduleData.length; i++) {
        const s1 = scheduleData[i];
        const int1 = getSlotInterval(s1.time);

        // Break Violation check
        if (int1.isBreak) {
          const key = `BREAK__${s1.id}`;
          detectedConflicts.push({
            id: key,
            type: "BREAK_VIOLATION",
            teacher: s1.teacher,
            day: s1.day,
            time: s1.time,
            slots: [s1],
            description: `Slot '${s1.subject}' assigned during designated non-instructional break (${s1.time}).`
          });
          continue;
        }

        for (let j = i + 1; j < scheduleData.length; j++) {
          const s2 = scheduleData[j];
          if (s1.day !== s2.day) continue;

          const int2 = getSlotInterval(s2.time);
          if (int2.isBreak) continue;

          // Interval Overlap Check: firstStart < secondEnd && secondStart < firstEnd
          const isOverlapping = (int1.startMin < int2.endMin && int2.startMin < int1.endMin);

          if (isOverlapping) {
            // A. Teacher Overlap Collision
            if (s1.teacher && s2.teacher && s1.teacher.trim().toUpperCase() === s2.teacher.trim().toUpperCase()) {
              const key = `TEACHER__${s1.teacher}__${s1.day}__${s1.time}__${s2.time}`;
              if (!conflictMap.has(key)) {
                conflictMap.set(key, {
                  id: key,
                  type: "TEACHER_DOUBLE_BOOKING",
                  teacher: s1.teacher,
                  day: s1.day,
                  time: `${s1.time} / ${s2.time}`,
                  slots: [s1, s2],
                  description: `Teacher ${s1.teacher} assigned to multiple sections simultaneously.`
                });
              } else {
                const existing = conflictMap.get(key);
                if (!existing.slots.includes(s2)) existing.slots.push(s2);
              }
            }

            // B. Section Simultaneous Class Overlap
            if (s1.section && s2.section && s1.section.trim().toUpperCase() === s2.section.trim().toUpperCase()) {
              const key = `SECTION__${s1.section}__${s1.day}__${s1.time}__${s2.time}`;
              if (!conflictMap.has(key)) {
                conflictMap.set(key, {
                  id: key,
                  type: "SECTION_DOUBLE_BOOKING",
                  teacher: `${s1.teacher} & ${s2.teacher}`,
                  day: s1.day,
                  time: `${s1.time} / ${s2.time}`,
                  slots: [s1, s2],
                  description: `Section ${s1.section} assigned multiple subjects concurrently.`
                });
              }
            }

            // C. Room Double Booking Check
            if (s1.room && s2.room && s1.room.trim() !== "" && s1.room.trim().toLowerCase() === s2.room.trim().toLowerCase()) {
              const key = `ROOM__${s1.room}__${s1.day}__${s1.time}__${s2.time}`;
              if (!conflictMap.has(key)) {
                conflictMap.set(key, {
                  id: key,
                  type: "ROOM_DOUBLE_BOOKING",
                  teacher: `Room: ${s1.room}`,
                  day: s1.day,
                  time: `${s1.time} / ${s2.time}`,
                  slots: [s1, s2],
                  description: `Room ${s1.room} booked by multiple classes simultaneously.`
                });
              }
            }
          }
        }
      }

      // Merge break violations with interval-based map conflicts
      detectedConflicts = [...detectedConflicts, ...Array.from(conflictMap.values())];

      // Update badge counts
      const badge = document.getElementById('tab-conflict-badge');
      const mobileBadge = document.getElementById('mobile-conflict-badge');
      const count = detectedConflicts.length;
      
      [badge, mobileBadge].forEach(b => {
        if (b) {
          b.innerText = count;
          b.className = count > 0 ? 
            "ml-1 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse" : 
            "ml-1 bg-slate-600 text-white text-xs px-2 py-0.5 rounded-full font-bold";
        }
      });
    }

    /*
      ==========================================================================
      REPAIR FIX #3: AUTOMATIC SCHEDULING SOLVER ENGINE REPAIR
      ==========================================================================
      Repairs the recursive DFS backtracking swap algorithm to eliminate false-negative
      availability checks and bound recursion depth safely.
    */
    function runAutoConflictSolver() {
      evaluateConflicts();
      if (detectedConflicts.length === 0) {
        showToast("No conflicts detected! Schedule is 100% conflict-free.", "success");
        return;
      }

      let resolvedCount = 0;
      const maxSearchDepth = 4;

      for (const conflict of [...detectedConflicts]) {
        for (let i = 1; i < conflict.slots.length; i++) {
          const slotToFix = conflict.slots[i];
          
          // Strategy 1: Direct Substitution with free qualified teacher
          const directSub = findFreeTeacher(slotToFix.day, slotToFix.time, slotToFix.teacher, slotToFix.id);
          if (directSub) {
            slotToFix.teacher = directSub;
            resolvedCount++;
            continue;
          }

          // Strategy 2: Relocate slot to open time block for section
          const openTimeSlot = findOpenTimeSlotForSection(slotToFix.section, slotToFix.day, slotToFix.teacher, slotToFix.id);
          if (openTimeSlot) {
            slotToFix.time = openTimeSlot;
            resolvedCount++;
            continue;
          }

          // Strategy 3: DFS Depth-Bounded Multi-Teacher Swap
          const swapChainSuccess = attemptMultiTeacherSwap(slotToFix, maxSearchDepth);
          if (swapChainSuccess) {
            resolvedCount++;
          }
        }
      }

      saveScheduleData();
      renderCurrentTab();
      
      evaluateConflicts();
      if (detectedConflicts.length === 0) {
        showToast(`Auto-Engine resolved all conflicts successfully!`, "success");
      } else {
        showToast(`Resolved ${resolvedCount} issues. ${detectedConflicts.length} complex conflicts require manual review.`, "warning");
      }
    }

    function attemptMultiTeacherSwap(targetSlot, maxDepth) {
      const visitedSlots = new Set([targetSlot.id]);

      function dfsSwap(currentSlot, currentDepth) {
        if (currentDepth > maxDepth) return false;

        const candidateTeachers = TEACHERS.filter(t => t !== currentSlot.teacher);

        for (const candidateTeacher of candidateTeachers) {
          // Identify blocking slots for candidate teacher at this time
          const blockingSlot = scheduleData.find(s => 
            s.id !== currentSlot.id &&
            s.teacher === candidateTeacher && 
            s.day === currentSlot.day && 
            s.time === currentSlot.time
          );

          if (!blockingSlot || visitedSlots.has(blockingSlot.id)) continue;

          // Check candidate availability excluding current assignment
          if (isTeacherAvailable(candidateTeacher, currentSlot.day, currentSlot.time, currentSlot.id)) {
            const alternativeTeacher = findFreeTeacher(blockingSlot.day, blockingSlot.time, candidateTeacher, blockingSlot.id);
            
            if (alternativeTeacher) {
              blockingSlot.teacher = alternativeTeacher;
              currentSlot.teacher = candidateTeacher;
              return true;
            }

            visitedSlots.add(blockingSlot.id);
            const originalBlockingTeacher = blockingSlot.teacher;
            currentSlot.teacher = candidateTeacher;

            if (dfsSwap(blockingSlot, currentDepth + 1)) {
              return true;
            }

            // Backtrack safely on failure
            currentSlot.teacher = targetSlot.teacher;
            blockingSlot.teacher = originalBlockingTeacher;
            visitedSlots.delete(blockingSlot.id);
          }
        }
        return false;
      }

      return dfsSwap(targetSlot, 1);
    }

    function isTeacherAvailable(teacher, day, time, excludeSlotId = null) {
      const intTarget = getSlotInterval(time);
      if (intTarget.isBreak) return false;

      return !scheduleData.some(s => {
        if (s.id === excludeSlotId) return false;
        if (s.teacher !== teacher || s.day !== day) return false;
        const intS = getSlotInterval(s.time);
        return (intTarget.startMin < intS.endMin && intS.startMin < intTarget.endMin);
      });
    }

    function findFreeTeacher(day, time, excludeTeacher, excludeSlotId = null) {
      const candidates = TEACHERS.filter(t => t !== excludeTeacher && isTeacherAvailable(t, day, time, excludeSlotId));
      return candidates.length > 0 ? candidates[0] : null;
    }

    function findOpenTimeSlotForSection(section, day, teacher, excludeSlotId = null) {
      const validSlots = INSTRUCTIONAL_SLOTS.filter(t => {
        const intTarget = getSlotInterval(t);
        
        // Section occupied check
        const sectionOccupied = scheduleData.some(s => {
          if (s.id === excludeSlotId || s.section !== section || s.day !== day) return false;
          const intS = getSlotInterval(s.time);
          return (intTarget.startMin < intS.endMin && intS.startMin < intTarget.endMin);
        });

        if (sectionOccupied) return false;
        return isTeacherAvailable(teacher, day, t, excludeSlotId);
      });

      return validSlots.length > 0 ? validSlots[0] : null;
    }

    // --- DRAG AND DROP ENGINE IMPLEMENTATION ---
    function handleDragStart(e, slotId) {
      draggedSlotId = slotId;
      e.dataTransfer.setData("text/plain", slotId);
      e.dataTransfer.effectAllowed = "move";
    }

    function handleDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      e.currentTarget.classList.add("drag-over");
    }

    function handleDragLeave(e) {
      e.currentTarget.classList.remove("drag-over");
    }

    function handleDrop(e, targetDay, targetTime) {
      e.preventDefault();
      e.currentTarget.classList.remove("drag-over");

      if (!draggedSlotId) return;
      const slot = scheduleData.find(s => s.id === draggedSlotId);
      if (slot) {
        slot.day = targetDay;
        slot.time = targetTime;
        saveScheduleData();
        renderCurrentTab();
        showToast(`Slot moved to ${targetDay} at ${targetTime}.`, "success");
      }
      draggedSlotId = null;
    }

    function handleTrashDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const trash = document.getElementById("trash-dropzone");
      trash.classList.add("trash-over");
    }

    function handleTrashDragLeave(e) {
      const trash = document.getElementById("trash-dropzone");
      trash.classList.remove("trash-over");
    }

    function handleTrashDrop(e) {
      e.preventDefault();
      const trash = document.getElementById("trash-dropzone");
      trash.classList.remove("trash-over");

      if (!draggedSlotId) return;
      scheduleData = scheduleData.filter(s => s.id !== draggedSlotId);
      draggedSlotId = null;

      saveScheduleData();
      renderCurrentTab();
      showToast("Slot removed via drag-and-drop.", "info");
    }

    /*
      ==========================================================================
      REPAIR FIX #9: MOBILE NAVIGATION DRAWER TOGGLE & ACCESSIBILITY
      ==========================================================================
    */
    function toggleMobileMenu() {
      const menu = document.getElementById('mobile-menu');
      const toggleBtn = document.getElementById('mobile-menu-toggle');
      if (menu) {
        const isHidden = menu.classList.toggle('hidden');
        if (toggleBtn) {
          toggleBtn.setAttribute('aria-expanded', (!isHidden).toString());
        }
      }
    }

    // Tab Navigation
    function switchTab(tabId) {
      const activeTeacherName = sessionStorage.getItem("active_teacher_name");
      const userRole = sessionStorage.getItem("user_role");
      const isTeacherSession = activeTeacherName && userRole !== "admin";

      // Guard check: restrict teacher accounts to view ONLY 'teachers' schedule
      if (isTeacherSession && tabId !== 'teachers') {
        showToast("Access Restricted: Teacher accounts can only view their personal schedule.", "warning");
        tabId = 'teachers';
      }

      currentTab = tabId;
      ['master', 'teachers', 'matrix', 'conflicts', 'workload'].forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        const view = document.getElementById(`view-${t}`);
        if (t === tabId) {
          if (btn) btn.className = "px-3 py-1.5 rounded-lg font-semibold transition-all text-white bg-indigo-600 shadow hover:bg-indigo-500 hover:shadow-md";
          if (view) view.classList.remove('hidden');
        } else {
          if (btn) btn.className = "px-3 py-1.5 rounded-lg font-semibold transition-all text-slate-100 hover:text-white hover:bg-indigo-600/80";
          if (view) view.classList.add('hidden');
        }
      });

      renderCurrentTab();
    }

    function renderCurrentTab() {
      if (currentTab === 'master') renderSectionView();
      else if (currentTab === 'teachers') renderTeacherView();
      else if (currentTab === 'matrix') renderMasterMatrix();
      else if (currentTab === 'conflicts') renderConflictTracer();
      else if (currentTab === 'workload') renderWorkloadAnalytics();
      
      lucide.createIcons();
    }

    function populateSelectOptions() {
      const secSelect = document.getElementById('filter-section');
      const modalSecSelect = document.getElementById('modal-section');
      secSelect.innerHTML = SECTIONS.map(s => `<option value="${escapeHTML(s.name)}">${escapeHTML(s.name)} (${escapeHTML(s.track)})</option>`).join('');
      modalSecSelect.innerHTML = SECTIONS.map(s => `<option value="${escapeHTML(s.name)}">${escapeHTML(s.name)}</option>`).join('');

      const teacherSelect = document.getElementById('select-teacher');
      const modalTeacherSelect = document.getElementById('modal-teacher');
      teacherSelect.innerHTML = TEACHERS.map(t => `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join('');
      modalTeacherSelect.innerHTML = TEACHERS.map(t => `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join('');

      // Dynamic population of modal time slot selector from authoritative config
      const modalTimeSelect = document.getElementById('modal-time');
      modalTimeSelect.innerHTML = TIME_SLOTS_CONFIG
        .filter(s => !s.isBreak)
        .map(s => `<option value="${escapeHTML(s.label)}">${escapeHTML(s.label)}</option>`)
        .join('');
    }

    function filterSectionListByTrack() {
      const track = document.getElementById('filter-track').value;
      const secSelect = document.getElementById('filter-section');
      const filtered = track === "ALL" ? SECTIONS : SECTIONS.filter(s => s.track === track);
      secSelect.innerHTML = filtered.map(s => `<option value="${escapeHTML(s.name)}">${escapeHTML(s.name)} (${escapeHTML(s.track)})</option>`).join('');
      renderSectionView();
    }

    // --- RENDER VIEW 1: SECTION TIMETABLE WITH DRAG & DROP ---
    function renderSectionView() {
      const sectionName = document.getElementById('filter-section').value || SECTIONS[0].name;
      const sectionInfo = SECTIONS.find(s => s.name === sectionName) || SECTIONS[0];
      const container = document.getElementById('section-timetable-card');

      const isTVL = sectionInfo.track === "TVL";
      const trackBadgeColor = isTVL ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-blue-100 text-blue-800 border-blue-300";

      let html = `
        <div class="p-4 bg-slate-900 text-white flex justify-between items-center flex-wrap gap-2">
          <div>
            <div class="flex items-center space-x-2">
              <h2 class="text-xl font-bold">${escapeHTML(sectionName)}</h2>
              <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold border ${trackBadgeColor}">${escapeHTML(sectionInfo.track)} TRACK</span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">Drag-and-drop slots to reschedule. Drag to trash to delete.</p>
          </div>
          <button onclick="openModalForSection('${escapeHTML(sectionName)}')" class="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center shadow hover:shadow-md transition">
            <i data-lucide="plus" class="w-3.5 h-3.5 mr-1"></i> Add Slot
          </button>
        </div>

        <div class="overflow-x-auto scrollbar-thin">
          <table class="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr class="bg-slate-100 border-b border-slate-200 text-xs font-bold uppercase text-slate-600">
                <th class="p-3 w-32 border-r">Time Slot</th>
                ${DAYS.map(day => `<th class="p-3 text-center border-r">${day}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 text-xs">
      `;

      TIME_SLOTS_CONFIG.forEach(slotConfig => {
        const time = slotConfig.label;
        
        if (slotConfig.isBreak) {
          html += `
            <tr class="bg-slate-50 font-semibold text-slate-500 text-center">
              <td class="p-2 border-r text-left bg-slate-100">${escapeHTML(time)}</td>
              <td colspan="5" class="p-2 italic tracking-wider bg-slate-100/70 border-r">
                ☕ ${escapeHTML(slotConfig.breakName || "BREAK BLOCK")}
              </td>
            </tr>
          `;
          return;
        }

        html += `<tr class="hover:bg-slate-50 transition">`;
        html += `<td class="p-3 font-semibold text-slate-700 bg-slate-50/50 border-r">${escapeHTML(time)}</td>`;

        DAYS.forEach(day => {
          const slot = scheduleData.find(s => s.section === sectionName && s.day === day && s.time === time);
          
          if (slot) {
            const isConflicted = detectedConflicts.some(c => c.slots.some(cs => cs.id === slot.id));
            const cardBg = isConflicted ? "bg-rose-50 border-rose-300 text-rose-900 conflict-glow" : "bg-indigo-50/70 border-indigo-200 hover:border-indigo-400";
            
            html += `
              <td class="p-2 border-r align-top" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, '${day}', '${escapeHTML(time)}')">
                <div draggable="true" ondragstart="handleDragStart(event, '${slot.id}')" onclick="editSlotModal('${slot.id}')" class="p-2.5 rounded-lg border ${cardBg} cursor-pointer transition shadow-sm hover:shadow-md draggable-card group relative">
                  <div class="font-bold text-xs text-indigo-950 group-hover:text-indigo-600 flex justify-between items-center">
                    <span>${escapeHTML(slot.subject)}</span>
                    <i data-lucide="grip-vertical" class="w-3 h-3 text-slate-400 opacity-60"></i>
                  </div>
                  <div class="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
                    <span class="font-semibold text-indigo-700">${escapeHTML(slot.teacher)}</span>
                    <span class="text-slate-400 font-mono text-[10px]">${escapeHTML(slot.room || 'R-TBD')}</span>
                  </div>
                  ${isConflicted ? `<div class="mt-1 text-[10px] font-bold text-rose-600 flex items-center"><i data-lucide="alert-circle" class="w-3 h-3 mr-1 shrink-0"></i> Conflict Flag</div>` : ''}
                </div>
              </td>
            `;
          } else {
            html += `
              <td class="p-2 border-r align-top" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, '${day}', '${escapeHTML(time)}')">
                <button onclick="openModalForSlot('${escapeHTML(sectionName)}', '${day}', '${escapeHTML(time)}')" class="w-full h-14 border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 rounded-lg flex items-center justify-center text-slate-300 hover:text-indigo-500 transition">
                  <i data-lucide="plus-circle" class="w-4 h-4"></i>
                </button>
              </td>
            `;
          }
        });

        html += `</tr>`;
      });

      html += `</tbody></table></div>`;
      container.innerHTML = html;
    }

    // --- RENDER VIEW 2: TEACHER SCHEDULE VIEW ---
    function renderTeacherView() {
      const activeTeacherMatched = sessionStorage.getItem("active_teacher_matched");
      const activeTeacherName = sessionStorage.getItem("active_teacher_name");

      // Auto-align to logged-in teacher if present
      if (activeTeacherMatched && document.getElementById('select-teacher')) {
        document.getElementById('select-teacher').value = activeTeacherMatched;
      }

      const teacherName = document.getElementById('select-teacher').value || TEACHERS[0];
      const container = document.getElementById('teacher-timetable-card');
      const summaryBadge = document.getElementById('teacher-summary-badge');

      const teacherSlots = scheduleData.filter(s => s.teacher === teacherName);
      summaryBadge.innerHTML = `Total Teaching Load: <strong class="text-indigo-600 font-bold">${teacherSlots.length} Periods</strong> / week across ${new Set(teacherSlots.map(s => s.section)).size} Sections`;

      let sessionHeaderExtra = "";
      if (activeTeacherName && activeTeacherMatched === teacherName) {
        sessionHeaderExtra = `<span class="ml-2 px-2.5 py-0.5 rounded-md bg-emerald-500 text-white text-xs font-bold shadow-sm">Your Personal Schedule (${escapeHTML(activeTeacherName)})</span>`;
      }

      let html = `
        <div class="p-4 bg-slate-800 text-white flex justify-between items-center flex-wrap gap-2">
          <div>
            <h2 class="text-lg font-bold flex items-center">
              <i data-lucide="user" class="w-5 h-5 mr-2 text-indigo-400"></i> Teacher Timetable: ${escapeHTML(teacherName)} ${sessionHeaderExtra}
            </h2>
            <p class="text-xs text-slate-400">Personalized weekly schedule assignments</p>
          </div>
        </div>

        <div class="overflow-x-auto scrollbar-thin">
          <table class="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr class="bg-slate-100 border-b border-slate-200 text-xs font-bold uppercase text-slate-600">
                <th class="p-3 w-32 border-r">Time Slot</th>
                ${DAYS.map(day => `<th class="p-3 text-center border-r">${day}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 text-xs">
      `;

      TIME_SLOTS_CONFIG.forEach(slotConfig => {
        const time = slotConfig.label;
        
        if (slotConfig.isBreak) {
          html += `
            <tr class="bg-slate-50 font-semibold text-slate-500 text-center">
              <td class="p-2 border-r text-left bg-slate-100">${escapeHTML(time)}</td>
              <td colspan="5" class="p-2 italic tracking-wider bg-slate-100/70 border-r">BREAK BLOCK</td>
            </tr>
          `;
          return;
        }

        html += `<tr class="hover:bg-slate-50 transition">`;
        html += `<td class="p-3 font-semibold text-slate-700 bg-slate-50/50 border-r">${escapeHTML(time)}</td>`;

        DAYS.forEach(day => {
          const matchingSlots = teacherSlots.filter(s => s.day === day && s.time === time);

          if (matchingSlots.length > 1) {
            html += `
              <td class="p-2 border-r align-top bg-rose-50/80">
                <div class="p-2 rounded-lg border border-rose-300 bg-white shadow-sm hover:shadow space-y-1 conflict-glow cursor-pointer transition">
                  <div class="text-xs font-bold text-rose-700 flex items-center">
                    <i data-lucide="alert-triangle" class="w-3.5 h-3.5 mr-1"></i> Conflict (${matchingSlots.length})
                  </div>
                  ${matchingSlots.map(s => `
                    <div class="text-[11px] p-1.5 bg-rose-100/60 rounded border border-rose-200 hover:bg-rose-100 transition" onclick="editSlotModal('${s.id}')">
                      <div class="font-bold text-slate-800">${escapeHTML(s.section)}</div>
                      <div class="text-slate-600">${escapeHTML(s.subject)}</div>
                    </div>
                  `).join('')}
                </div>
              </td>
            `;
          } else if (matchingSlots.length === 1) {
            const slot = matchingSlots[0];
            html += `
              <td class="p-2 border-r align-top">
                <div onclick="editSlotModal('${slot.id}')" class="p-2.5 rounded-lg border border-teal-200 bg-teal-50/60 hover:bg-teal-100/80 cursor-pointer transition shadow-sm hover:shadow-md">
                  <div class="font-bold text-xs text-teal-950">${escapeHTML(slot.section)}</div>
                  <div class="text-[11px] font-medium text-teal-800 mt-0.5">${escapeHTML(slot.subject)}</div>
                  <div class="text-[10px] text-slate-500 mt-1">${escapeHTML(slot.room || 'Room TBD')}</div>
                </div>
              </td>
            `;
          } else {
            html += `
              <td class="p-2 border-r align-top text-center" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, '${day}', '${escapeHTML(time)}')">
                <button onclick="openModalForSlot('', '${day}', '${escapeHTML(time)}')" class="w-full h-14 border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 rounded-lg flex items-center justify-center text-slate-300 hover:text-indigo-500 transition">
                  <i data-lucide="plus-circle" class="w-4 h-4"></i>
                </button>
              </td>
            `;
          }
        });

        html += `</tr>`;
      });

      html += `</tbody></table></div>`;
      container.innerHTML = html;
    }

    // --- RENDER VIEW 3: MASTER SCHEDULE MATRIX ---
    function renderMasterMatrix() {
      const selectedDay = document.getElementById('matrix-day-filter').value || 'MON';
      const container = document.getElementById('master-matrix-table-container');

      let html = `
        <table class="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr class="bg-slate-900 text-white text-xs font-bold uppercase">
              <th class="p-3 sticky left-0 bg-slate-900 z-10 border-r w-40">Time Slot</th>
              ${SECTIONS.map(s => `<th class="p-2 text-center border-r min-w-[120px]">${escapeHTML(s.name)}</th>`).join('')}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 text-xs">
      `;

      TIME_SLOTS_CONFIG.forEach(slotConfig => {
        const time = slotConfig.label;

        if (slotConfig.isBreak) {
          html += `
            <tr class="bg-slate-100 text-slate-500 font-bold text-center">
              <td class="p-2 sticky left-0 bg-slate-200 border-r text-left">${escapeHTML(time)}</td>
              <td colspan="${SECTIONS.length}" class="p-2 italic tracking-wider">${escapeHTML(slotConfig.breakName || "BREAK BLOCK")}</td>
            </tr>
          `;
          return;
        }

        html += `<tr>`;
        html += `<td class="p-2.5 font-semibold text-slate-700 bg-slate-50 sticky left-0 border-r shadow-sm">${escapeHTML(time)}</td>`;

        SECTIONS.forEach(sec => {
          const slot = scheduleData.find(s => s.section === sec.name && s.day === selectedDay && s.time === time);

          if (slot) {
            const isConflicted = detectedConflicts.some(c => c.slots.some(cs => cs.id === slot.id));
            const bgClass = isConflicted ? "bg-rose-100 border-rose-300 text-rose-900 font-bold" : "bg-indigo-50/50 hover:bg-indigo-100/80";

            html += `
              <td class="p-1.5 border-r align-top">
                <div onclick="editSlotModal('${slot.id}')" class="p-1.5 rounded border ${bgClass} cursor-pointer transition text-center hover:shadow-sm">
                  <div class="truncate font-bold text-[11px]">${escapeHTML(slot.teacher)}</div>
                  <div class="truncate text-[10px] text-slate-600">${escapeHTML(slot.subject)}</div>
                </div>
              </td>
            `;
          } else {
            html += `
              <td class="p-1.5 border-r align-top text-center" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, '${selectedDay}', '${escapeHTML(time)}')">
                <button onclick="openModalForSlot('${escapeHTML(sec.name)}', '${selectedDay}', '${escapeHTML(time)}')" class="w-full h-10 border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 rounded flex items-center justify-center text-slate-300 hover:text-indigo-500 transition">
                  <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                </button>
              </td>
            `;
          }
        });

        html += `</tr>`;
      });

      html += `</tbody></table>`;
      container.innerHTML = html;
    }

    // --- RENDER VIEW 4: CONFLICT TRACER VIEW ---
    function renderConflictTracer() {
      const container = document.getElementById('conflict-tracer-container');

      if (detectedConflicts.length === 0) {
        container.innerHTML = `
          <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center text-emerald-800 shadow-sm">
            <i data-lucide="check-circle-2" class="w-12 h-12 text-emerald-500 mx-auto mb-3"></i>
            <h3 class="text-lg font-bold">100% Conflict-Free Schedule!</h3>
            <p class="text-xs text-emerald-600 mt-1">There are no overlapping teacher, section, or room assignments across any time block.</p>
          </div>
        `;
        return;
      }

      let html = detectedConflicts.map((c, index) => `
        <div class="bg-white border-l-4 border-rose-500 border-y border-r border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div class="flex items-start justify-between flex-wrap gap-2">
            <div>
              <div class="flex items-center space-x-2">
                <span class="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-md shadow-sm">${escapeHTML(c.type || 'CONFLICT')} #${index + 1}</span>
                <h3 class="font-bold text-slate-800 text-base">Target: ${escapeHTML(c.teacher)}</h3>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                <strong class="text-slate-700">${escapeHTML(c.day)}</strong> at <strong class="text-slate-700">${escapeHTML(c.time)}</strong> • ${escapeHTML(c.description)}
              </p>
            </div>
            
            <button onclick="autoSolveSingleConflict('${escapeHTML(c.id)}')" class="text-xs bg-slate-900 hover:bg-indigo-600 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center transition shadow hover:shadow-md">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 mr-1 text-amber-300"></i> Auto-Solve Conflict
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-100">
            ${c.slots.map(s => `
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition cursor-pointer" onclick="editSlotModal('${s.id}')">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-xs text-indigo-900">${escapeHTML(s.section)}</span>
                  <span class="text-[11px] text-indigo-600 font-semibold hover:underline">Edit Slot</span>
                </div>
                <div class="text-xs text-slate-700 font-medium mt-1">${escapeHTML(s.subject)}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">Teacher: ${escapeHTML(s.teacher)} \vert{} Room:${escapeHTML(s.room || 'N/A')}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');

      container.innerHTML = html;
    }

    function autoSolveSingleConflict(conflictKey) {
      const conflict = detectedConflicts.find(c => c.id === conflictKey);
      if (!conflict || conflict.slots.length < 2) return;

      const slotToFix = conflict.slots[1];
      const sub = findFreeTeacher(slotToFix.day, slotToFix.time, slotToFix.teacher, slotToFix.id);

      if (sub) {
        slotToFix.teacher = sub;
        saveScheduleData();
        renderCurrentTab();
        showToast(`Reassigned ${slotToFix.section} (${slotToFix.subject}) to ${sub}.`, "success");
      } else {
        showToast("Could not find immediate substitute. Try running full Auto-Solve Engine.", "warning");
      }
    }

    /*
      ==========================================================================
      REPAIR FIX #7: WORKLOAD & INSTRUCTIONAL HOURS CALCULATIONS
      ==========================================================================
      Distinguishes raw assigned period count from net teaching hours.
    */
    function renderWorkloadAnalytics(overloadThreshold = 12) {
      const container = document.getElementById('workload-cards-grid');

      let html = TEACHERS.map(teacher => {
        const slots = scheduleData.filter(s => s.teacher === teacher);
        const sectionCount = new Set(slots.map(s => s.section)).size;
        const periods = slots.length;

        // Calculate teaching hours excluding breaks
        let totalHours = 0;
        slots.forEach(s => {
          const config = TIME_SLOTS_CONFIG.find(c => c.label === s.time);
          if (config && !config.isBreak) {
            totalHours += (config.endMin - config.startMin) / 60;
          }
        });

        const isOverloaded = periods > overloadThreshold;
        const badgeColor = isOverloaded ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200";

        return `
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition shadow-sm cursor-default">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-bold text-slate-800 text-sm">${escapeHTML(teacher)}</h3>
                <p class="text-xs text-slate-500 mt-0.5">${sectionCount} Assigned Sections</p>
              </div>
              <span class="text-xs font-bold px-2 py-0.5 rounded-md ${badgeColor}">
                ${periods} Periods (${totalHours.toFixed(1)} hrs)
              </span>
            </div>

            <div class="mt-3 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div class="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style="width: ${Math.min(100, (periods / 15) * 100)}%"></div>
            </div>

            <div class="mt-3 pt-2 border-t border-slate-200 flex flex-wrap gap-1">
              ${Array.from(new Set(slots.map(s => s.section))).map(sec => `
                <span class="text-[10px] bg-white border border-slate-300 text-slate-600 px-1.5 py-0.5 rounded hover:border-indigo-300 transition">${escapeHTML(sec)}</span>
              `).join('')}
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = html;
    }

    // --- REAL-TIME MODAL TIME SLOT AVAILABILITY CHECKER & DISABLE ENGINE ---
    function validateSlotAvailabilityModal() {
      const currentSlotId = document.getElementById('modal-slot-id').value;
      const day = document.getElementById('modal-day').value;
      const time = document.getElementById('modal-time').value;
      const teacher = document.getElementById('modal-teacher').value;
      const saveBtn = document.getElementById('modal-save-btn');
      const warningBox = document.getElementById('modal-conflict-warning');
      const warningText = document.getElementById('modal-conflict-text');

      if (!teacher || !day || !time) return;

      const targetInterval = getSlotInterval(time);

      // Check if teacher is already assigned to another section at this overlapping time
      const conflictingSlot = scheduleData.find(s => {
        if (s.id === currentSlotId) return false;
        if (s.teacher !== teacher || s.day !== day) return false;
        const slotInt = getSlotInterval(s.time);
        return (targetInterval.startMin < slotInt.endMin && slotInt.startMin < targetInterval.endMin);
      });

      if (conflictingSlot) {
        // Teacher is double-booked: Disable Save button & apply red blinking effect
        saveBtn.disabled = true;
        saveBtn.innerText = "Time Slot Unavailable";
        saveBtn.className = "text-xs text-white font-bold px-4 py-2 rounded-lg shadow-md transition cursor-not-allowed animate-btn-blink-red";
        
        warningText.innerText = `Teacher ${teacher} is already booked for ${conflictingSlot.section} (${conflictingSlot.subject}) during ${time} on ${day}.`;
        warningBox.classList.remove('hidden');
      } else {
        // Teacher is available: Enable Save button & restore default styling
        saveBtn.disabled = false;
        saveBtn.innerText = "Save Slot";
        saveBtn.className = "text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition";
        
        warningBox.classList.add('hidden');
      }
    }

    // --- MODAL & EDITOR LOGIC ---
    function openModalForSection(section) {
      document.getElementById('modal-slot-id').value = "";
      document.getElementById('modal-title').innerText = "Add Schedule Slot";
      document.getElementById('modal-section').value = section;
      document.getElementById('modal-subject').value = "";
      document.getElementById('modal-room').value = "";
      document.getElementById('modal-delete-btn').classList.add('hidden');
      document.getElementById('slot-modal').classList.remove('hidden');
      validateSlotAvailabilityModal();
    }

    function openModalForSlot(section, day, time) {
      document.getElementById('modal-slot-id').value = "";
      document.getElementById('modal-title').innerText = "Add Schedule Slot";
      if (section) document.getElementById('modal-section').value = section;
      document.getElementById('modal-day').value = day;
      document.getElementById('modal-time').value = time;
      document.getElementById('modal-subject').value = "";
      document.getElementById('modal-room').value = "";
      document.getElementById('modal-delete-btn').classList.add('hidden');
      document.getElementById('slot-modal').classList.remove('hidden');
      validateSlotAvailabilityModal();
    }

    function addNewSlotModal() {
      openModalForSection(SECTIONS[0].name);
    }

    function editSlotModal(slotId) {
      const slot = scheduleData.find(s => s.id === slotId);
      if (!slot) return;

      document.getElementById('modal-slot-id').value = slot.id;
      document.getElementById('modal-title').innerText = "Edit Schedule Slot";
      document.getElementById('modal-section').value = slot.section;
      document.getElementById('modal-day').value = slot.day;
      document.getElementById('modal-time').value = slot.time;
      document.getElementById('modal-subject').value = slot.subject;
      document.getElementById('modal-teacher').value = slot.teacher;
      document.getElementById('modal-room').value = slot.room || "";
      document.getElementById('modal-delete-btn').classList.remove('hidden');
      document.getElementById('slot-modal').classList.remove('hidden');
      validateSlotAvailabilityModal();
    }

    function closeSlotModal() {
      document.getElementById('slot-modal').classList.add('hidden');
    }

    function handleSaveSlot(e) {
      e.preventDefault();
      
      const id = document.getElementById('modal-slot-id').value;
      const section = document.getElementById('modal-section').value;
      const day = document.getElementById('modal-day').value;
      const time = document.getElementById('modal-time').value;
      const subject = document.getElementById('modal-subject').value.trim();
      const teacher = document.getElementById('modal-teacher').value;
      const room = document.getElementById('modal-room').value.trim();

      if (!subject) {
        showToast("Please enter a subject title.", "warning");
        return;
      }

      if (id) {
        const index = scheduleData.findIndex(s => s.id === id);
        if (index !== -1) {
          scheduleData[index] = { id, section, day, time, subject, teacher, room };
        }
      } else {
        const newSlot = {
          id: 'slot-' + Date.now(),
          section, day, time, subject, teacher, room
        };
        scheduleData.push(newSlot);
      }

      saveScheduleData();
      closeSlotModal();
      renderCurrentTab();
      showToast("Schedule updated successfully!", "success");
    }

    function handleDeleteSlot() {
      const id = document.getElementById('modal-slot-id').value;
      if (!id) return;

      scheduleData = scheduleData.filter(s => s.id !== id);
      saveScheduleData();
      closeSlotModal();
      renderCurrentTab();
      showToast("Slot removed.", "info");
    }

    // --- UTILITIES, IMPORT & EXPORT LOGIC ---
    function updateDashboardStats() {
      document.getElementById('stat-total-sections').innerText = SECTIONS.length;
      document.getElementById('stat-total-teachers').innerText = TEACHERS.length;
      document.getElementById('stat-total-slots').innerText = scheduleData.length;

      const conflictCount = detectedConflicts.length;
      const conflictStat = document.getElementById('stat-total-conflicts');
      const conflictCard = document.getElementById('conflict-stat-card');
      const conflictIcon = document.getElementById('conflict-stat-icon');

      conflictStat.innerText = conflictCount;

      if (conflictCount > 0) {
        conflictCard.className = "bg-rose-50 border border-rose-300 rounded-lg px-3 py-1.5 flex items-center space-x-2.5 transition-all shadow-sm hover:shadow cursor-pointer";
        conflictIcon.className = "p-2 bg-rose-100 text-rose-700 rounded-md";
        conflictStat.className = "text-base font-bold text-rose-700";
      } else {
        conflictCard.className = "bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 flex items-center space-x-2.5 transition-all hover:shadow cursor-pointer";
        conflictIcon.className = "p-2 bg-emerald-100 text-emerald-700 rounded-md";
        conflictStat.className = "text-base font-bold text-emerald-700";
      }
    }

    function triggerImportDialog() {
      document.getElementById('import-file-input').click();
    }

    /*
      ==========================================================================
      REPAIR FIX #4: ROBUST JSON IMPORT VALIDATION & TRANSACTIONAL COMMIT
      ==========================================================================
    */
    function handleImportJSON(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importedData = JSON.parse(e.target.result);
          
          if (!Array.isArray(importedData)) {
            showToast("Invalid import file format: JSON must contain an array.", "warning");
            return;
          }

          // Validate individual entries
          const validSlots = [];
          for (let i = 0; i < importedData.length; i++) {
            const item = importedData[i];
            if (!item.section || !item.day || !item.time || !item.subject) {
              console.warn(`Skipping incomplete record index ${i}`);
              continue;
            }
            validSlots.push(normalizeSlot(item));
          }

          if (validSlots.length === 0) {
            showToast("Import failed: No valid schedule slots found in JSON file.", "warning");
            return;
          }

          if (confirm(`Import ${validSlots.length} schedule slots? This will replace your current schedule data.`)) {
            scheduleData = validSlots;
            saveScheduleData();
            renderCurrentTab();
            showToast(`Successfully imported ${scheduleData.length} slots into the Master Matrix!`, "success");
          }
        } catch (err) {
          console.error("Import error:", err);
          showToast("Failed to parse JSON file. Please check file structure.", "warning");
        } finally {
          event.target.value = "";
        }
      };

      reader.readAsText(file);
    }

    function exportToJSON() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scheduleData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "Grade12_SecondTerm_Schedule.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Schedule exported as JSON.", "success");
    }

    function showToast(message, type = "info") {
      const toast = document.getElementById('toast');
      const msg = document.getElementById('toast-msg');
      const icon = document.getElementById('toast-icon');

      msg.innerText = message;
      if (type === "success") {
        icon.setAttribute("data-lucide", "check-circle");
        icon.className = "w-5 h-5 text-emerald-400";
      } else if (type === "warning") {
        icon.setAttribute("data-lucide", "alert-triangle");
        icon.className = "w-5 h-5 text-amber-400";
      } else {
        icon.setAttribute("data-lucide", "info");
        icon.className = "w-5 h-5 text-blue-400";
      }
      lucide.createIcons();

      toast.classList.remove('translate-y-20', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');

      setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
      }, 3500);
    }
