"use strict";

    /*
      FIREBASE CONFIGURATION
      A Firebase web API key is not a password. Database Security Rules and
      Firebase Authentication must be configured correctly in the Firebase Console.
    */
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

    const BRANDING_KEY = "classSchedulerLoginBrandingV1";
    const NEXT_PAGE = "system.html";

    // Master List of 35 Faculty Members for Family Name Auto-Matching
    const FACULTY_TEACHERS = [
      "LAPIZ", "AGUIRRE", "SANCHEZ", "RECILLA", "GALLARDO", "A. NACORDA", 
      "CABILAN", "CABADING", "MONLEON", "VIVAS", "C. REYES", "PIAMONTE", 
      "MIRANDA", "M. TORREFRANCA", "OLIVA", "ENTERO", "TUMULAK", "PELIGRO", 
      "CORDOVA", "MORI", "TOPIA", "NAILON", "DAGATAN", "MONTES", "BAYATO", 
      "CARTUCIANO", "NOBE", "A. F. GALLARDO", "R. Q. REYES", "SINADJAN", 
      "DEGULACION", "GENTALLAN", "VILLAPANA", "JIMENEZ", "B. NACORDA"
    ];

    const loginForm = document.getElementById("loginForm");
    const teacherForm = document.getElementById("teacherForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginButton = document.getElementById("loginButton");
    const createAccountButton = document.getElementById("createAccountButton");
    const statusMessage = document.getElementById("statusMessage");
    const togglePasswordButton = document.getElementById("togglePassword");

    let auth = null;
    let database = null;
    let firebaseReady = false;
    let isRedirecting = false;
    let isRegisteringTeacher = false;

    function showMessage(message, type) {
      statusMessage.textContent = message;
      statusMessage.className = "message " + (type === "success" ? "success" : "error");
    }

    function clearMessage() {
      statusMessage.textContent = "";
      statusMessage.className = "message";
    }

    function setBusy(isBusy, action) {
      loginButton.disabled = isBusy;
      createAccountButton.disabled = isBusy;
      loginButton.textContent = isBusy && action === "login" ? "Signing in…" : "Log In";
      createAccountButton.textContent = isBusy && action === "create" ? "Creating account…" : "Create Account";
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    /*
      ==========================================================================
      TEACHER PORTAL & FAMILY NAME MATCHING ENGINE
      ==========================================================================
    */
    function switchPortalMode(mode) {
      clearMessage();
      const stdTab = document.getElementById("tab-mode-standard");
      const teachTab = document.getElementById("tab-mode-teacher");

      if (mode === 'teacher') {
        stdTab.classList.remove('active');
        teachTab.classList.add('active');
        loginForm.style.display = 'none';
        teacherForm.style.display = 'block';
        document.getElementById('formDescription').textContent = "Register or sign in to your Teacher Timetable Profile.";
      } else {
        teachTab.classList.remove('active');
        stdTab.classList.add('active');
        teacherForm.style.display = 'none';
        loginForm.style.display = 'block';
        document.getElementById('formDescription').textContent = "Enter your email and password to continue.";
      }
    }

    function extractFamilyName(fullName) {
      if (!fullName) return "";
      const parts = fullName.trim().split(/\s+/);
      return parts[parts.length - 1].toUpperCase();
    }

    function findMatchingFacultyProfile(familyName) {
      const cleanTarget = familyName.toUpperCase();
      return FACULTY_TEACHERS.find(t => t.toUpperCase() === cleanTarget || cleanTarget.endsWith(t.toUpperCase())) || familyName;
    }

    function livePreviewTeacherMatch() {
      const name = document.getElementById("teacherFullname").value;
      const extracted = extractFamilyName(name);
      const matched = findMatchingFacultyProfile(extracted);
      const previewSpan = document.getElementById("teacher-preview-name");

      if (extracted) {
        previewSpan.textContent = extracted + " (Matched Timetable Profile: " + matched + ")";
      } else {
        previewSpan.textContent = "---";
      }
    }

    function getRegisteredTeachers() {
      try {
        return JSON.parse(localStorage.getItem('registered_teacher_accounts_v1') || '[]');
      } catch(e) {
        return [];
      }
    }

    function getDeveloperTeacherAccessCode() {
      return localStorage.getItem("dev_teacher_access_code") || "TEACHER2026";
    }

    function handleTeacherRegisterAction() {
      clearMessage();
      const accessCodeField = document.getElementById("field-teacher-access-code");
      
      if (!isRegisteringTeacher) {
        // Toggle view to display access code field and registration interface
        isRegisteringTeacher = true;
        accessCodeField.style.display = "block";
        document.getElementById("teacherRegisterButton").textContent = "Submit Registration & Verify Access Code";
        showMessage("Enter the Teacher Registration Access Code generated in the Developer Console to complete registration.", "success");
        return;
      }

      const accessCodeInput = document.getElementById("teacherAccessCode").value.trim();
      const validCode = getDeveloperTeacherAccessCode();

      // Feature: Access code enforcement logic
      if (accessCodeInput !== validCode) {
        showMessage("Invalid Registration Access Code! Please request the access code generated in Developer Console.", "error");
        return;
      }

      const fullName = document.getElementById("teacherFullname").value.trim();
      const email = document.getElementById("teacherEmail").value.trim().toLowerCase();
      const password = document.getElementById("teacherPassword").value.trim();

      if (!fullName) {
        showMessage("Please enter your Full Name.", "error");
        return;
      }
      if (!isValidEmail(email)) {
        showMessage("Please enter a valid teacher email address.", "error");
        return;
      }
      if (password.length < 6) {
        showMessage("Password must be at least 6 characters long.", "error");
        return;
      }

      const extracted = extractFamilyName(fullName);
      const matched = findMatchingFacultyProfile(extracted);

      const accounts = getRegisteredTeachers();
      if (accounts.some(acc => acc.email === email)) {
        showMessage("An account with this email already exists. Click 'Log In to Timetable' instead.", "error");
        return;
      }

      const newAccount = {
        fullName: fullName,
        email: email,
        password: password,
        familyName: extracted,
        matchedTeacher: matched,
        createdAt: new Date().toISOString()
      };

      accounts.push(newAccount);
      localStorage.setItem('registered_teacher_accounts_v1', JSON.stringify(accounts));

      if (database) {
        database.ref('teacherAccounts').push(newAccount).catch(err => console.warn("Firebase teacher account sync notice:", err));
      }

      sessionStorage.setItem("active_teacher_name", fullName);
      sessionStorage.setItem("active_teacher_matched", matched);
      sessionStorage.setItem("user_authenticated", "true");

      showMessage("Teacher account registered! Redirecting to your personal schedule…", "success");
      setTimeout(() => { redirectToApp(); }, 1200);
    }

    function handleTeacherLoginAction() {
      clearMessage();
      const email = document.getElementById("teacherEmail").value.trim().toLowerCase();
      const password = document.getElementById("teacherPassword").value.trim();

      if (!isValidEmail(email) || !password) {
        showMessage("Please enter your teacher email and password.", "error");
        return;
      }

      const accounts = getRegisteredTeachers();
      const account = accounts.find(acc => acc.email === email && acc.password === password);

      if (account) {
        sessionStorage.setItem("active_teacher_name", account.fullName);
        sessionStorage.setItem("active_teacher_matched", account.matchedTeacher);
        sessionStorage.setItem("user_authenticated", "true");

        showMessage("Welcome back, " + account.fullName + "! Redirecting to timetable…", "success");
        setTimeout(() => { redirectToApp(); }, 1000);
      } else {
        showMessage("Invalid teacher credentials. Please check your email and password or click 'Register New Teacher Account'.", "error");
      }
    }

    function friendlyAuthError(error, isCreating) {
      const code = error && error.code ? error.code : "";
      if (code === "auth/invalid-credential" ||
          code === "auth/wrong-password" ||
          code === "auth/user-not-found" ||
          code === "auth/invalid-email") {
        return "Incorrect email or password. Please try again.";
      }
      if (code === "auth/email-already-in-use") {
        return "An account with that email already exists. Please log in instead.";
      }
      if (code === "auth/weak-password") {
        return "Please use a password with at least 6 characters.";
      }
      if (code === "auth/operation-not-allowed") {
        return "Email/Password sign-in is not enabled in Firebase Authentication.";
      }
      if (code === "auth/network-request-failed") {
        return "Network connection failed. Check your internet connection and try again.";
      }
      if (code === "auth/too-many-requests") {
        return "Too many attempts. Please wait a while before trying again.";
      }
      if (code === "auth/invalid-api-key" || code === "auth/app-not-authorized") {
        return "Firebase configuration is incomplete or this domain is not authorized. Check the Firebase project settings.";
      }
      if (code === "PERMISSION_DENIED" || code === "database/permission-denied") {
        return "Firebase denied access to the user profile. Check the Realtime Database Security Rules.";
      }
      return isCreating
        ? "Could not create the account. Check Firebase settings and try again."
        : "Unable to sign in. Check your connection and Database settings, then try again.";
    }

    async function saveUserProfile(user, email) {
      if (!database || !user) return;
      const profileRef = database.ref("users/" + user.uid + "/profile");
      await profileRef.update({
        email: email,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      });
    }

    function redirectToApp() {
      if (isRedirecting) return;
      isRedirecting = true;
      sessionStorage.setItem("user_authenticated", "true");
      window.location.replace(NEXT_PAGE);
    }

    async function handleLogin(event) {
      event.preventDefault();
      clearMessage();

      if (!firebaseReady) {
        showMessage("Firebase is not ready. Check the Firebase configuration in login.html.", "error");
        return;
      }

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!isValidEmail(email)) {
        showMessage("Please enter a valid email address.", "error");
        emailInput.focus();
        return;
      }
      if (!password) {
        showMessage("Please enter your password.", "error");
        passwordInput.focus();
        return;
      }

      setBusy(true, "login");
      try {
        const credential = await auth.signInWithEmailAndPassword(email, password);
        try {
          await saveUserProfile(credential.user, email);
        } catch (profileError) {
          console.warn("Could not update the user's profile in Realtime Database.", profileError);
        }
        redirectToApp();
      } catch (error) {
        showMessage(friendlyAuthError(error, false), "error");
        passwordInput.select();
        passwordInput.focus();
        setBusy(false);
      }
    }

    async function handleCreateAccount() {
      clearMessage();

      if (!firebaseReady) {
        showMessage("Firebase is not ready. Check the Firebase configuration in login.html.", "error");
        return;
      }

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!isValidEmail(email)) {
        showMessage("Please enter a valid email address to create an account.", "error");
        emailInput.focus();
        return;
      }
      if (password.length < 6) {
        showMessage("Enter a password with at least 6 characters to create an account.", "error");
        passwordInput.focus();
        return;
      }

      const confirmed = window.confirm("Create a new account for email \"" + email + "\"? Use this only if self-registration is permitted by your school.");
      if (!confirmed) return;

      setBusy(false, "create");
      try {
        const credential = await auth.createUserWithEmailAndPassword(email, password);
        try {
          await saveUserProfile(credential.user, email);
          showMessage("Account created successfully. Opening the scheduler…", "success");
        } catch (profileError) {
          console.warn("Account created, but the profile could not be saved to Realtime Database.", profileError);
          showMessage("Account created. Opening the scheduler…", "success");
        }
        redirectToApp();
      } catch (error) {
        showMessage(friendlyAuthError(error, true), "error");
        setBusy(false);
      }
    }

    // --- REAL-TIME BRANDING APPLICATION ENGINE ---
    function applyBranding(settings) {
      const header = (settings && settings.header) || "Grade 12 Class Scheduler";
      const subtitle = (settings && settings.subtitle) || "Secure access for authorized users";
      const logoUrl = (settings && settings.logoUrl) || "";
      const footer = (settings && settings.footer) || "Class Scheduler · Authorized access only";
      const colorPrimary = (settings && settings.colorPrimary) || "#12345a";
      const colorAccent = (settings && settings.colorAccent) || "#f4b400";

      document.getElementById("mainHeader").textContent = header;
      document.getElementById("headerSubtitle").textContent = subtitle;
      document.getElementById("siteFooter").textContent = footer;

      const siteHeader = document.getElementById("siteHeader");
      if (siteHeader) {
        siteHeader.style.backgroundColor = colorPrimary;
        siteHeader.style.borderBottomColor = colorAccent;
      }

      const logo = document.getElementById("schoolLogo");
      const fallback = document.getElementById("logoFallback");
      if (logoUrl) {
        try {
          const parsed = new URL(logoUrl, window.location.href);
          if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
            throw new Error("Only HTTP or HTTPS logo URLs are accepted.");
          }
          logo.onload = function () {
            logo.style.display = "block";
            fallback.style.display = "none";
          };
          logo.onerror = function () {
            logo.style.display = "none";
            fallback.style.display = "inline";
          };
          logo.src = parsed.href;
          logo.alt = header + " logo";
        } catch (error) {
          logo.removeAttribute("src");
          logo.style.display = "none";
          fallback.style.display = "inline";
        }
      } else {
        logo.removeAttribute("src");
        logo.style.display = "none";
        fallback.style.display = "inline";
      }
    }

    function loadBranding() {
      let settings = null;
      try {
        settings = JSON.parse(localStorage.getItem(BRANDING_KEY) || "null");
      } catch (error) {
        console.warn("Local branding settings could not be read.", error);
      }
      applyBranding(settings);
    }

    // Real-Time Cross-Tab Event Listener for Storage Sync
    window.addEventListener("storage", function(e) {
      if (e.key === BRANDING_KEY || e.key === "dev_branding_settings") {
        loadBranding();
      }
    });

    togglePasswordButton.addEventListener("click", function () {
      const showing = passwordInput.type === "text";
      passwordInput.type = showing ? "password" : "text";
      togglePasswordButton.textContent = showing ? "Show" : "Hide";
      togglePasswordButton.setAttribute("aria-pressed", String(!showing));
    });

    const toggleTeacherPassBtn = document.getElementById("toggleTeacherPassword");
    if (toggleTeacherPassBtn) {
      toggleTeacherPassBtn.addEventListener("click", function () {
        const tPass = document.getElementById("teacherPassword");
        const showing = tPass.type === "text";
        tPass.type = showing ? "password" : "text";
        toggleTeacherPassBtn.textContent = showing ? "Show" : "Hide";
        toggleTeacherPassBtn.setAttribute("aria-pressed", String(!showing));
      });
    }

    loginForm.addEventListener("submit", handleLogin);
    createAccountButton.addEventListener("click", handleCreateAccount);

    // Initial branding load
    loadBranding();

    try {
      if (typeof firebase === "undefined") {
        throw new Error("Firebase SDK could not be loaded.");
      }

      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      auth = firebase.auth();
      database = firebase.database();
      firebaseReady = true;

      // Realtime Firebase Listener for Cloud Branding Sync
      database.ref('appBranding').on('value', function(snapshot) {
        const cloudSettings = snapshot.val();
        if (cloudSettings) {
          applyBranding(cloudSettings);
          localStorage.setItem(BRANDING_KEY, JSON.stringify(cloudSettings));
        }
      });

      // If an authenticated session already exists, skip the login screen.
      auth.onAuthStateChanged(function (user) {
        if ((user || sessionStorage.getItem("active_teacher_name")) && !isRedirecting) {
          redirectToApp();
        }
      });
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      showMessage("Firebase could not initialize. Check the Firebase configuration and internet connection.", "error");
    }
