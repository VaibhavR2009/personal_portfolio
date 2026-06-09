import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ====== PLACE YOUR SECURE BACKEND CONFIGURATION MATRIX HERE ======
const firebaseConfig = {
    apiKey: "AIzaSyAkD4kAl_8vYany_A88KKz6n0s96wHmgrY",
    authDomain: "personalportfolio-e6de9.firebaseapp.com",
    projectId: "personalportfolio-e6de9",
    storageBucket: "personalportfolio-e6de9.firebasestorage.app",
    messagingSenderId: "1075908881350",
    appId: "1:1075908881350:web:4ade08c00ebfca3959a0c7"
  };

// Initialize Core Nodes
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Active Operational Variables 
let globalProjects = [];
let activeProjectLogs = [];
let activeSelectedProject = null;
let activeSelectedLog = null;
let isAdminLoggedIn = false;

document.addEventListener("DOMContentLoaded", () => {
    // Dynamic Frame Routing Elements
    const navItems = document.querySelectorAll(".nav-item");
    const pages = document.querySelectorAll(".page-panel");
    const projectsGrid = document.getElementById("summer-projects-grid");
    const logSelectElement = document.getElementById("log-project-select");

    // Modal Overlays
    const journalModal = document.getElementById("journal-modal");
    const authModal = document.getElementById("auth-modal");
    const openAuthBtn = document.getElementById("admin-auth-btn");
    const closeAuthBtn = document.getElementById("cancel-auth-btn");
    const closeModalBtn = document.getElementById("close-modal-btn");

    // Admin Panel Forms Layout Targets
    const adminPanel = document.getElementById("admin-control-panel");
    const loginForm = document.getElementById("login-form");
    const newProjectForm = document.getElementById("new-project-form");
    const newLogForm = document.getElementById("new-log-form");
    const logoutBtn = document.getElementById("admin-logout-btn");

    // Dynamic State Form Fields
    const projectFormTitle = document.getElementById("project-form-title");
    const projectSubmitBtn = document.getElementById("proj-submit-btn");
    const cancelProjEditBtn = document.getElementById("cancel-proj-edit");
    const hiddenProjId = document.getElementById("edit-proj-id");

    const logFormTitle = document.getElementById("log-form-title");
    const logSubmitBtn = document.getElementById("log-submit-btn");
    const cancelLogEditBtn = document.getElementById("cancel-log-edit");
    const hiddenLogId = document.getElementById("edit-log-id");

    // Modal Inner Clusters
    const projectAdminCluster = document.getElementById("modal-project-admin-actions");
    const logAdminCluster = document.getElementById("modal-log-admin-actions");

    // ==========================================
    // MODULE 1: UNIFIED PAGE ROUTER CONSOLE
    // ==========================================
    const switchPage = (targetPageId) => {
        pages.forEach(page => page.classList.remove("active"));
        navItems.forEach(item => item.classList.remove("active"));

        const targetPage = document.getElementById(targetPageId);
        if (targetPage) targetPage.classList.add("active");

        const matchingNavItem = document.querySelector(`.nav-item[data-target="${targetPageId}"]`);
        if (matchingNavItem) matchingNavItem.classList.add("active");

        if (targetPageId === 'summer-journal') {
            pullProjectsFromDatabase();
        }
    };

    navItems.forEach(item => {
        item.addEventListener("click", () => switchPage(item.getAttribute("data-target")));
    });

    // ==========================================
    // MODULE 2: DATABASE STREAM ARCHITECTURE
    // ==========================================
    async function pullProjectsFromDatabase() {
        try {
            const querySnapshot = await getDocs(collection(db, "projects"));
            globalProjects = [];
            projectsGrid.innerHTML = "";
            logSelectElement.innerHTML = '<option value="">Select Target Destination Project Node...</option>';

            if (querySnapshot.empty) {
                projectsGrid.innerHTML = `<div class="loading-state">No active projects found. Add data using the admin forms below.</div>`;
                return;
            }

            querySnapshot.forEach((doc) => {
                const projectData = { id: doc.id, ...doc.data() };
                globalProjects.push(projectData);
                renderProjectDisplayCard(projectData);
                
                const option = document.createElement("option");
                option.value = doc.id;
                option.textContent = projectData.title;
                logSelectElement.appendChild(option);
            });
        } catch (err) {
            console.error(err);
            projectsGrid.innerHTML = `<div class="loading-state">Telemetry Error: Failed to load project matrices.</div>`;
        }
    }

    function renderProjectDisplayCard(proj) {
        const card = document.createElement("div");
        card.className = "institution-card portfolio-card";
        card.innerHTML = `
            <span class="project-category">Project</span>
            <h3>${proj.title}</h3>
            <p class="academy-text">${proj.shortSummary}</p>
            <span class="clickable-badge">Explore Ledger & Timeline →</span>
        `;
        card.addEventListener("click", () => activateJournalModal(proj));
        projectsGrid.appendChild(card);
    }

    // ==========================================
    // MODULE 3: MODAL SPLIT TIMELINE WINDOW
    // ==========================================
    async function activateJournalModal(project) {
        activeSelectedProject = project;
        document.getElementById("modal-project-title").textContent = project.title;
        document.getElementById("modal-project-long").textContent = project.longSummary;
        
        const githubLink = document.getElementById("modal-project-github");
        githubLink.href = project.githubLink || "#";
        githubLink.style.display = project.githubLink ? "inline-block" : "none";

        projectAdminCluster.style.display = isAdminLoggedIn ? "flex" : "none";
        logAdminCluster.style.display = "none";

        const navTimeline = document.getElementById("modal-timeline-nav");
        const logContentArea = document.getElementById("modal-log-viewer-content");
        
        navTimeline.innerHTML = "";
        logContentArea.innerHTML = `<div class="loading-state">Syncing milestone timelines...</div>`;
        journalModal.classList.add("active");

        try {
            const logsQuery = query(collection(db, "logs"), where("projectId", "==", project.id));
            const logsSnapshot = await getDocs(logsQuery);
            activeProjectLogs = [];

            logsSnapshot.forEach(doc => {
                activeProjectLogs.push({ id: doc.id, ...doc.data() });
            });

            activeProjectLogs.sort((a, b) => {
                const titleA = a.title || "";
                const titleB = b.title || "";
                const numA = parseInt(titleA.replace(/^\D+/g, '')) || 0;
                const numB = parseInt(titleB.replace(/^\D+/g, '')) || 0;
                return numA - numB;
            });

            if (activeProjectLogs.length === 0) {
                logContentArea.innerHTML = `<div class="empty-log-state">No timeline logs written for this project node yet.</div>`;
                return;
            }

            logContentArea.innerHTML = `<div class="empty-log-state">Select a milestone node item on the navigation axis to view entries.</div>`;

            activeProjectLogs.forEach(log => {
                const navBtn = document.createElement("button");
                navBtn.className = "timeline-nav-item";
                
                const titleText = log.title || "";
                navBtn.textContent = titleText.includes(":") ? titleText.split(":")[0] : titleText;
                
                navBtn.addEventListener("click", () => {
                    document.querySelectorAll(".timeline-nav-item").forEach(btn => btn.classList.remove("active"));
                    navBtn.classList.add("active");
                    activeSelectedLog = log;
                    displaySpecificLogEntry(log);
                });
                navTimeline.appendChild(navBtn);
            });
        } catch (error) {
            console.error(error);
            logContentArea.innerHTML = `<div class="empty-log-state">Error mapping timeline indexes.</div>`;
        }
    }

    function displaySpecificLogEntry(log) {
        logAdminCluster.style.display = isAdminLoggedIn ? "flex" : "none";
        const area = document.getElementById("modal-log-viewer-content");
        area.innerHTML = `
            <div class="log-entry-frame">
                <h2>${log.title}</h2>
                <span class="log-date-stamp">System Log Entry • ${log.dateStamped || 'Live Sync'}</span>
                <p class="log-body-text">${log.content}</p>
            </div>
        `;
    }

    // ==========================================
    // MODULE 4: ACTIVE LIFECYCLE RECOGNITION
    // ==========================================
    onAuthStateChanged(auth, (user) => {
        isAdminLoggedIn = !!user;
        if (user) {
            adminPanel.style.display = "grid";
            openAuthBtn.style.display = "none";
        } else {
            adminPanel.style.display = "none";
            openAuthBtn.style.display = "block";
            projectAdminCluster.style.display = "none";
            logAdminCluster.style.display = "none";
        }
    });

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("auth-email").value;
        const password = document.getElementById("auth-password").value;

        signInWithEmailAndPassword(auth, email, password)
            .then(() => { 
                authModal.classList.remove("active"); 
                loginForm.reset(); 
            })
            .catch(err => alert("Challenge Fault: " + err.message));
    });

    logoutBtn.addEventListener("click", () => {
        signOut(auth).then(() => { 
            resetProjectFormState(); 
            resetLogFormState(); 
            switchPage("home"); 
        });
    });

    // ==========================================
    // MODULE 5: SYSTEM MODIFICATION CHANNELS
    // ==========================================
    newProjectForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            title: document.getElementById("proj-title").value,
            shortSummary: document.getElementById("proj-short").value,
            longSummary: document.getElementById("proj-long").value,
            githubLink: document.getElementById("proj-github").value,
            timestamp: Date.now()
        };

        try {
            if (hiddenProjId.value) {
                await updateDoc(doc(db, "projects", hiddenProjId.value), payload);
                alert("Core database specifications updated safely.");
                resetProjectFormState();
            } else {
                await addDoc(collection(db, "projects"), payload);
                alert("New research project node deployed successfully.");
                newProjectForm.reset();
            }
            pullProjectsFromDatabase();
        } catch (err) { alert("Execution Matrix Defect: " + err.message); }
    });

    newLogForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            projectId: document.getElementById("log-project-select").value,
            title: document.getElementById("log-day").value,
            content: document.getElementById("log-content").value,
            timestamp: Date.now()
        };

        try {
            if (hiddenLogId.value) {
                await updateDoc(doc(db, "logs", hiddenLogId.value), payload);
                alert("Timeline entry string updated cleanly.");
                resetLogFormState();
            } else {
                payload.dateStamped = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                await addDoc(collection(db, "logs"), payload);
                alert("New journal entry successfully appended into core database.");
                newLogForm.reset();
            }
        } catch (err) { alert("Execution Matrix Defect: " + err.message); }
    });

    // ==========================================
    // MODULE 6: ADVANCED DATA PURGES
    // ==========================================
    document.getElementById("modal-edit-project").addEventListener("click", () => {
        if (!activeSelectedProject) return;
        journalModal.classList.remove("active");
        
        hiddenProjId.value = activeSelectedProject.id;
        document.getElementById("proj-title").value = activeSelectedProject.title;
        document.getElementById("proj-short").value = activeSelectedProject.shortSummary;
        document.getElementById("proj-long").value = activeSelectedProject.longSummary;
        document.getElementById("proj-github").value = activeSelectedProject.githubLink || "";

        projectFormTitle.textContent = "Modify Project Parameters";
        projectSubmitBtn.textContent = "Commit Parameter Modifications";
        cancelProjEditBtn.style.display = "inline-block";

        adminPanel.scrollIntoView({ behavior: "smooth" });
    });

    document.getElementById("modal-delete-project").addEventListener("click", async () => {
        if (!activeSelectedProject) return;
        const confirmWipe = confirm(`CRITICAL OPERATIONAL PURGE ACTIONS:\nAre you sure you want to delete "${activeSelectedProject.title}"?\nThis systematically wipes the project node and all attached timeline children logs permanently.`);
        if (!confirmWipe) return;

        try {
            journalModal.classList.remove("active");
            
            const logsQuery = query(collection(db, "logs"), where("projectId", "==", activeSelectedProject.id));
            const logsSnapshot = await getDocs(logsQuery);
            for (const logDoc of logsSnapshot.docs) {
                await deleteDoc(doc(db, "logs", logDoc.id));
            }

            await deleteDoc(doc(db, "projects", activeSelectedProject.id));
            alert("Database nodes systematically cleared from infrastructure indexes.");
            pullProjectsFromDatabase();
        } catch (err) { alert("Purge Defect: " + err.message); }
    });

    document.getElementById("modal-edit-log").addEventListener("click", () => {
        if (!activeSelectedLog) return;
        journalModal.classList.remove("active");

        hiddenLogId.value = activeSelectedLog.id;
        document.getElementById("log-project-select").value = activeSelectedLog.projectId;
        document.getElementById("log-day").value = activeSelectedLog.title;
        document.getElementById("log-content").value = activeSelectedLog.content;

        logFormTitle.textContent = "Modify Milestone Narrative Log Entry";
        logSubmitBtn.textContent = "Commit Entry Alterations";
        cancelLogEditBtn.style.display = "inline-block";

        adminPanel.scrollIntoView({ behavior: "smooth" });
    });

    document.getElementById("modal-delete-log").addEventListener("click", async () => {
        if (!activeSelectedLog) return;
        if (!confirm("Confirm complete eradication of this journal entry?")) return;

        try {
            await deleteDoc(doc(db, "logs", activeSelectedLog.id));
            alert("Narrative entry block systematically cleared.");
            activateJournalModal(activeSelectedProject);
        } catch (err) { alert("Deletion Defect: " + err.message); }
    });

    function resetProjectFormState() {
        newProjectForm.reset();
        hiddenProjId.value = "";
        projectFormTitle.textContent = "Initialize New Research Node";
        projectSubmitBtn.textContent = "Publish Node";
        cancelProjEditBtn.style.display = "none";
    }

    function resetLogFormState() {
        newLogForm.reset();
        hiddenLogId.value = "";
        logFormTitle.textContent = "Append Technical Journal Entry";
        logSubmitBtn.textContent = "Inject Entry";
        cancelLogEditBtn.style.display = "none";
    }

    cancelProjEditBtn.addEventListener("click", resetProjectFormState);
    cancelLogEditBtn.addEventListener("click", resetLogFormState);

    openAuthBtn.addEventListener("click", () => authModal.classList.add("active"));
    closeAuthBtn.addEventListener("click", () => authModal.classList.remove("active"));
    closeModalBtn.addEventListener("click", () => journalModal.classList.remove("active"));

    // ==========================================
    // MODULE 7: FLUID CURSOR ENGINE
    // ==========================================
    const cursorDot = document.querySelector(".custom-cursor-dot");
    const cursorRing = document.querySelector(".custom-cursor-ring");

    if (cursorDot && cursorRing) {
        // Tracking Coordinates
        let mouseX = 0, mouseY = 0; // Actual mouse position
        let ringX = 0, ringY = 0;   // Lagging ring position

        // Target coordinates sync instantly on move
        window.addEventListener("mousemove", (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            // Instantly stick the tiny center dot to physical hardware coordinates
            cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
        });

        // Smooth Interpolation Loop (The Lerp Engine)
        const renderCursorLoop = () => {
            // Lower values = heavier drag/lag (0.15 gives a clean, snappy glide)
            const easeFactor = 0.15; 
            
            ringX += (mouseX - ringX) * easeFactor;
            ringY += (mouseY - ringY) * easeFactor;

            cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;

            requestAnimationFrame(renderCursorLoop);
        };
        // Spin up the rendering loop
        requestAnimationFrame(renderCursorLoop);

        // Click Event Listeners (Pop Feedback)
        window.addEventListener("mousedown", () => document.body.classList.add("cursor-clicking"));
        window.addEventListener("mouseup", () => document.body.classList.remove("cursor-clicking"));

        // Interactive Tracking Elements Node Matrix
        const attachHoverListeners = () => {
            const targets = document.querySelectorAll("a, button, .nav-item, .institution-card, .bento-card, .portfolio-card, .timeline-nav-item, input, select, textarea");
            
            targets.forEach(target => {
                target.addEventListener("mouseenter", () => document.body.classList.add("cursor-hovering"));
                target.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hovering"));
            });
        };

        attachHoverListeners();

        // Safe pipeline hooking to refresh event bindings after asynchronous Firebase database maps
        const originalPullProjects = pullProjectsFromDatabase;
        pullProjectsFromDatabase = async function() {
            await originalPullProjects.apply(this, arguments);
            attachHoverListeners();
        };
    }
});