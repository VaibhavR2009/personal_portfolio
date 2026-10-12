import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ====== FIREBASE CONFIGURATION ======
const firebaseConfig = {
    apiKey: "AIzaSyAkD4kAl_8vYany_A88KKz6n0s96wHmgrY",
    authDomain: "personalportfolio-e6de9.firebaseapp.com",
    projectId: "personalportfolio-e6de9",
    storageBucket: "personalportfolio-e6de9.firebasestorage.app",
    messagingSenderId: "1075908881350",
    appId: "1:1075908881350:web:4ade08c00ebfca3959a0c7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// State
let globalProjects = [];
let activeProjectLogs = [];
let activeSelectedProject = null;
let activeSelectedLog = null;
let isAdminLoggedIn = false;

document.addEventListener("DOMContentLoaded", () => {
    // Navigation & Page Elements
    const navItems = document.querySelectorAll(".nav-item");
    const pages = document.querySelectorAll(".page-panel");
    const logoLink = document.querySelector(".logo");
    const projectsGrid = document.getElementById("summer-projects-grid");
    const logSelectElement = document.getElementById("log-project-select");

    // Modal Overlays
    const journalModal = document.getElementById("journal-modal");
    const authModal = document.getElementById("auth-modal");
    const openAuthBtn = document.getElementById("admin-auth-btn");
    const closeAuthBtn = document.getElementById("cancel-auth-btn");
    const closeModalBtn = document.getElementById("close-modal-btn");

    // Admin Panel Forms
    const adminPanel = document.getElementById("admin-control-panel");
    const loginForm = document.getElementById("login-form");
    const newProjectForm = document.getElementById("new-project-form");
    const newLogForm = document.getElementById("new-log-form");
    const logoutBtn = document.getElementById("admin-logout-btn");

    // Dynamic Form Controls
    const projectFormTitle = document.getElementById("project-form-title");
    const projectSubmitBtn = document.getElementById("proj-submit-btn");
    const cancelProjEditBtn = document.getElementById("cancel-proj-edit");
    const hiddenProjId = document.getElementById("edit-proj-id");

    const logFormTitle = document.getElementById("log-form-title");
    const logSubmitBtn = document.getElementById("log-submit-btn");
    const cancelLogEditBtn = document.getElementById("cancel-log-edit");
    const hiddenLogId = document.getElementById("edit-log-id");

    // Modal Admin Controls
    const projectAdminCluster = document.getElementById("modal-project-admin-actions");
    const logAdminCluster = document.getElementById("modal-log-admin-actions");

    // Toast Notification
    const toast = document.getElementById("toast-notification");

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 2500);
    }

    // Copy to Clipboard Helpers
    const copyEmailBtn = document.getElementById("copy-email-btn");
    const copyPhoneBtn = document.getElementById("copy-phone-btn");

    if (copyEmailBtn) {
        copyEmailBtn.addEventListener("click", () => {
            navigator.clipboard.writeText("vaibhav.ramji09@gmail.com").then(() => {
                showToast("Email copied to clipboard!");
            }).catch(() => {
                showToast("vaibhav.ramji09@gmail.com");
            });
        });
    }

    if (copyPhoneBtn) {
        copyPhoneBtn.addEventListener("click", () => {
            navigator.clipboard.writeText("925-247-1121").then(() => {
                showToast("Phone number copied!");
            }).catch(() => {
                showToast("925-247-1121");
            });
        });
    }

    // ==========================================
    // PAGE ROUTING
    // ==========================================
    const switchPage = (targetPageId) => {
        pages.forEach(page => page.classList.remove("active"));
        navItems.forEach(item => item.classList.remove("active"));

        const targetPage = document.getElementById(targetPageId);
        if (targetPage) targetPage.classList.add("active");

        const matchingNavItem = document.querySelector(`.nav-item[data-target="${targetPageId}"]`);
        if (matchingNavItem) matchingNavItem.classList.add("active");

        window.scrollTo({ top: 0, behavior: "smooth" });

        if (targetPageId === 'summer-journal') {
            pullProjectsFromDatabase();
        }
    };

    navItems.forEach(item => {
        item.addEventListener("click", () => switchPage(item.getAttribute("data-target")));
    });

    if (logoLink) {
        logoLink.addEventListener("click", (e) => {
            e.preventDefault();
            switchPage("home");
        });
    }

    // ==========================================
    // DEFAULT SHOWCASE PROJECTS & BUILD LOGS
    // ==========================================
    const DEFAULT_PROJECTS = [
        {
            id: "demo-sunflower",
            isDemo: true,
            title: "Sunflower: Robotic Face-Tracking Monitor Arm",
            shortSummary: "Motorized monitor arm modeled in FreeCAD and 3D printed with PETG-CF. Tracks faces with Google MediaPipe and uses Arduino motor drivers.",
            longSummary: "Sunflower is my senior engineering capstone: a motorized monitor arm that physically tracks and adjusts to the user's face in real-time. Modeled in FreeCAD with hollow wire channels and reinforced stress walls, 3D printed in carbon-fiber PETG on a Bambu Lab A1. Computer vision is handled on PC via MediaPipe with a custom deadband filter to solve 2D-to-Z perspective jitter, driving motors smoothly via Arduino.",
            githubLink: "https://github.com/VaibhavR2009"
        },
        {
            id: "demo-partfinder",
            isDemo: true,
            title: "DIY Partfinder: Agentic AI Hardware Recommender",
            shortSummary: "Google & Kaggle Capstone: Agentic AI reasoning through electrical and mechanical constraints to generate DIY build guides.",
            longSummary: "Created for Google's 5-Day Intensive AI Hackathon on Kaggle. DIY Partfinder is an autonomous agent that takes any DIY hardware concept and reasons across mechanical constraints (weight, torque) and electrical factors (voltage, current, motor compatibility) to generate component lists, specs, buy links, and step-by-step build guides.",
            githubLink: "https://github.com/VaibhavR2009"
        },
        {
            id: "demo-techthought",
            isDemo: true,
            title: "Techthought.org: News Automation & GUI Agent",
            shortSummary: "Startup internship: Built Python news automation, GUI Agent, configured Linux OS & virtual machines, and led the intern team.",
            longSummary: "During summers 2025 and 2026 at Techthought.org, I built Python automated news fetching and social media posting scripts, developed a GUI Agent, configured Linux OS and Raspberry Pi GPIO setups, and managed virtual machines. Promoted to intern team lead in 2026, creating daily sprint logs, team calendars, and GitHub versioning.",
            githubLink: "https://github.com/VaibhavR2009"
        }
    ];

    const DEFAULT_LOGS = {
        "demo-sunflower": [
            {
                title: "Day 1: FreeCAD Modeling & Hollow Arm Stress Analysis",
                dateStamped: "Senior Capstone",
                content: "Designed the frame in FreeCAD. Since a metal frame exceeded budget, we decided on 3D printing. Carved and reinforced a hollow arm cylinder so all wiring can pass cleanly through without catching. Researched torque and stress calculations from AP Physics C to ensure walls can survive the rotational force of the motors."
            },
            {
                title: "Day 2: 3D Printing with PETG-CF & Hardened Steel Nozzle",
                dateStamped: "Senior Capstone",
                content: "Selected carbon-fiber reinforced PETG (PETG-CF) for high rigidity and minimal flex under monitor weight. Because carbon fiber abrades standard brass nozzles rapidly, I swapped in a hardened steel nozzle on our school's Bambu Lab A1 printer. First structural test was rock solid."
            },
            {
                title: "Day 3: Dual Architecture — PC MediaPipe & Arduino Motors",
                dateStamped: "Senior Capstone",
                content: "Tested running MediaPipe computer vision locally on a Raspberry Pi 4, but it bottlenecked face tracking at ~10 FPS. Pivoted to a dual-system architecture: offloaded camera capture and MediaPipe processing to the user's host PC, sending lightweight serial commands to an Arduino to drive the motor controllers with high responsiveness."
            },
            {
                title: "Day 4: Solving the MediaPipe Z-Depth Perspective Jitter",
                dateStamped: "Senior Capstone",
                content: "Discovered that leaning forward or backward changed the face's pixel bounds in the 2D feed, causing the arm to oscillate and jitter. Traced through MediaPipe documentation and Face Mesh source code to understand how Z-depth is inferred from perspective. Implemented a center-of-face tracking algorithm paired with a deadband threshold so the arm only moves when the user genuinely changes position."
            }
        ],
        "demo-partfinder": [
            {
                title: "Day 1: Defining Engineering Constraints & Agent Architecture",
                dateStamped: "Kaggle & Google Intensive",
                content: "Makers often don't know what parts are compatible when starting a build. Designed an Agentic AI with Python and Gemini API that evaluates mechanical constraints (weight, torque) alongside electrical requirements (voltage, current, motor driver compatibility) before suggesting hardware."
            },
            {
                title: "Day 2: Live Reasoning UI & 5-Minute Demo Video",
                dateStamped: "Kaggle & Google Intensive",
                content: "Redesigned the frontend interface to stream the agent's chain-of-thought in real-time rather than having users stare at an opaque progress bar. Successfully produced the submission demo and published the open-source repository on GitHub, earning the course completion badge."
            }
        ],
        "demo-techthought": [
            {
                title: "Summer 2025: Python News API Automation & Linux Setup",
                dateStamped: "Internship",
                content: "Built an automated Python script fetching headlines from a News API and formatting them for social media posting. Configured Linux operating system on local test machines and set up virtual machine environments for testing."
            },
            {
                title: "Summer 2026: Promotion to Intern Lead & GUI Agent",
                dateStamped: "Intern Lead",
                content: "Promoted to lead the intern team. Introduced shared daily sprint logs, team calendars, and GitHub version control. Developed a GUI Agent and investigated Raspberry Pi GPIO current draw characteristics under load."
            }
        ]
    };

    // ==========================================
    // PROJECTS & FIRESTORE DATABASE
    // ==========================================
    async function pullProjectsFromDatabase() {
        projectsGrid.innerHTML = "";
        logSelectElement.innerHTML = '<option value="">Select Project...</option>';
        globalProjects = [];

        try {
            const querySnapshot = await getDocs(collection(db, "projects"));

            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const projectData = { id: doc.id, ...doc.data() };
                    globalProjects.push(projectData);
                    renderProjectDisplayCard(projectData);
                    
                    const option = document.createElement("option");
                    option.value = doc.id;
                    option.textContent = projectData.title;
                    logSelectElement.appendChild(option);
                });
                return;
            }
        } catch (err) {
            console.warn("Firestore query note (using showcase data):", err.message);
        }

        // Showcase fallback if Firestore is fresh
        globalProjects = [...DEFAULT_PROJECTS];
        globalProjects.forEach(proj => {
            renderProjectDisplayCard(proj);
            const option = document.createElement("option");
            option.value = proj.id;
            option.textContent = proj.title;
            logSelectElement.appendChild(option);
        });
    }

    function renderProjectDisplayCard(proj) {
        const card = document.createElement("div");
        card.className = "institution-card portfolio-card";
        card.innerHTML = `
            <span class="project-category">${proj.isDemo ? 'Featured Capstone' : 'Project'}</span>
            <h3>${proj.title}</h3>
            <p class="academy-text">${proj.shortSummary}</p>
            <span class="clickable-badge">View Build Log & Details →</span>
        `;
        card.addEventListener("click", () => activateJournalModal(proj));
        projectsGrid.appendChild(card);
    }

    // ==========================================
    // MODAL WINDOW & LOG ENTRIES
    // ==========================================
    async function activateJournalModal(project) {
        activeSelectedProject = project;
        document.getElementById("modal-project-title").textContent = project.title;
        document.getElementById("modal-project-long").textContent = project.longSummary;
        
        const githubLink = document.getElementById("modal-project-github");
        githubLink.href = project.githubLink || "#";
        githubLink.style.display = project.githubLink ? "inline-block" : "none";

        projectAdminCluster.style.display = (isAdminLoggedIn && !project.isDemo) ? "flex" : "none";
        logAdminCluster.style.display = "none";

        const navTimeline = document.getElementById("modal-timeline-nav");
        const logContentArea = document.getElementById("modal-log-viewer-content");
        
        navTimeline.innerHTML = "";
        logContentArea.innerHTML = `<div class="loading-state">Loading project build logs...</div>`;
        journalModal.classList.add("active");

        if (project.isDemo && DEFAULT_LOGS[project.id]) {
            activeProjectLogs = DEFAULT_LOGS[project.id];
            renderTimelineLogs(activeProjectLogs, navTimeline, logContentArea);
            return;
        }

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
                logContentArea.innerHTML = `<div class="empty-log-state">No build logs posted for this project yet.</div>`;
                return;
            }

            renderTimelineLogs(activeProjectLogs, navTimeline, logContentArea);
        } catch (error) {
            console.error(error);
            logContentArea.innerHTML = `<div class="empty-log-state">Error loading build logs.</div>`;
        }
    }

    function renderTimelineLogs(logs, navTimeline, logContentArea) {
        logContentArea.innerHTML = `<div class="empty-log-state">Select an entry from the list on the left to read details.</div>`;

        logs.forEach((log, index) => {
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

            // Auto-select first log
            if (index === 0) {
                navBtn.classList.add("active");
                activeSelectedLog = log;
                displaySpecificLogEntry(log);
            }
        });
    }

    function displaySpecificLogEntry(log) {
        logAdminCluster.style.display = isAdminLoggedIn ? "flex" : "none";
        const area = document.getElementById("modal-log-viewer-content");
        area.innerHTML = `
            <div class="log-entry-frame">
                <h2>${log.title}</h2>
                <span class="log-date-stamp">Build Log • ${log.dateStamped || 'Live Update'}</span>
                <p class="log-body-text">${log.content}</p>
            </div>
        `;
    }

    // ==========================================
    // AUTHENTICATION
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
                showToast("Signed in as Admin.");
            })
            .catch(err => alert("Sign in error: " + err.message));
    });

    logoutBtn.addEventListener("click", () => {
        signOut(auth).then(() => { 
            resetProjectFormState(); 
            resetLogFormState(); 
            switchPage("home");
            showToast("Logged out successfully.");
        });
    });

    // ==========================================
    // FORM SUBMISSIONS & UPDATES
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
                alert("Project details updated successfully!");
                resetProjectFormState();
            } else {
                await addDoc(collection(db, "projects"), payload);
                alert("New project published successfully!");
                newProjectForm.reset();
            }
            pullProjectsFromDatabase();
        } catch (err) { alert("Error saving project: " + err.message); }
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
                alert("Build log entry updated cleanly!");
                resetLogFormState();
            } else {
                payload.dateStamped = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                await addDoc(collection(db, "logs"), payload);
                alert("New build log entry saved successfully!");
                newLogForm.reset();
            }
        } catch (err) { alert("Error saving log entry: " + err.message); }
    });

    // ==========================================
    // EDIT & DELETE ACTIONS
    // ==========================================
    document.getElementById("modal-edit-project").addEventListener("click", () => {
        if (!activeSelectedProject) return;
        journalModal.classList.remove("active");
        
        hiddenProjId.value = activeSelectedProject.id;
        document.getElementById("proj-title").value = activeSelectedProject.title;
        document.getElementById("proj-short").value = activeSelectedProject.shortSummary;
        document.getElementById("proj-long").value = activeSelectedProject.longSummary;
        document.getElementById("proj-github").value = activeSelectedProject.githubLink || "";

        projectFormTitle.textContent = "Edit Project";
        projectSubmitBtn.textContent = "Save Changes";
        cancelProjEditBtn.style.display = "inline-block";

        adminPanel.scrollIntoView({ behavior: "smooth" });
    });

    document.getElementById("modal-delete-project").addEventListener("click", async () => {
        if (!activeSelectedProject) return;
        const confirmDelete = confirm(`Are you sure you want to delete "${activeSelectedProject.title}"?\nThis will remove the project and all attached build logs.`);
        if (!confirmDelete) return;

        try {
            journalModal.classList.remove("active");
            
            const logsQuery = query(collection(db, "logs"), where("projectId", "==", activeSelectedProject.id));
            const logsSnapshot = await getDocs(logsQuery);
            for (const logDoc of logsSnapshot.docs) {
                await deleteDoc(doc(db, "logs", logDoc.id));
            }

            await deleteDoc(doc(db, "projects", activeSelectedProject.id));
            alert("Project deleted successfully.");
            pullProjectsFromDatabase();
        } catch (err) { alert("Error deleting project: " + err.message); }
    });

    document.getElementById("modal-edit-log").addEventListener("click", () => {
        if (!activeSelectedLog) return;
        journalModal.classList.remove("active");

        hiddenLogId.value = activeSelectedLog.id;
        document.getElementById("log-project-select").value = activeSelectedLog.projectId;
        document.getElementById("log-day").value = activeSelectedLog.title;
        document.getElementById("log-content").value = activeSelectedLog.content;

        logFormTitle.textContent = "Edit Build Log Entry";
        logSubmitBtn.textContent = "Save Changes";
        cancelLogEditBtn.style.display = "inline-block";

        adminPanel.scrollIntoView({ behavior: "smooth" });
    });

    document.getElementById("modal-delete-log").addEventListener("click", async () => {
        if (!activeSelectedLog) return;
        if (!confirm("Are you sure you want to delete this build log entry?")) return;

        try {
            await deleteDoc(doc(db, "logs", activeSelectedLog.id));
            alert("Log entry removed.");
            activateJournalModal(activeSelectedProject);
        } catch (err) { alert("Error deleting log entry: " + err.message); }
    });

    function resetProjectFormState() {
        newProjectForm.reset();
        hiddenProjId.value = "";
        projectFormTitle.textContent = "Add New Project";
        projectSubmitBtn.textContent = "Save Project";
        cancelProjEditBtn.style.display = "none";
    }

    function resetLogFormState() {
        newLogForm.reset();
        hiddenLogId.value = "";
        logFormTitle.textContent = "Add Build Log Entry";
        logSubmitBtn.textContent = "Save Entry";
        cancelLogEditBtn.style.display = "none";
    }

    cancelProjEditBtn.addEventListener("click", resetProjectFormState);
    cancelLogEditBtn.addEventListener("click", resetLogFormState);

    openAuthBtn.addEventListener("click", () => authModal.classList.add("active"));
    closeAuthBtn.addEventListener("click", () => authModal.classList.remove("active"));
    closeModalBtn.addEventListener("click", () => journalModal.classList.remove("active"));

    // Close modals on clicking backdrop
    [journalModal, authModal].forEach(modal => {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.remove("active");
            }
        });
    });

    // Close modals on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            journalModal.classList.remove("active");
            authModal.classList.remove("active");
        }
    });

    // ==========================================
    // CUSTOM CURSOR
    // ==========================================
    const cursorDot = document.querySelector(".custom-cursor-dot");
    const cursorRing = document.querySelector(".custom-cursor-ring");

    if (cursorDot && cursorRing) {
        let mouseX = -100, mouseY = -100;
        let ringX = -100, ringY = -100;

        window.addEventListener("mousemove", (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
        });

        const renderCursorLoop = () => {
            const easeFactor = 0.18;
            ringX += (mouseX - ringX) * easeFactor;
            ringY += (mouseY - ringY) * easeFactor;

            cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
            requestAnimationFrame(renderCursorLoop);
        };
        requestAnimationFrame(renderCursorLoop);

        window.addEventListener("mousedown", () => document.body.classList.add("cursor-clicking"));
        window.addEventListener("mouseup", () => document.body.classList.remove("cursor-clicking"));

        const attachHoverListeners = () => {
            const targets = document.querySelectorAll("a, button, .nav-item, .institution-card, .bento-card, .portfolio-card, .timeline-nav-item, input, select, textarea, .contact-item, .mini-highlight-pill");
            targets.forEach(target => {
                target.addEventListener("mouseenter", () => document.body.classList.add("cursor-hovering"));
                target.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hovering"));
            });
        };

        attachHoverListeners();

        const originalPullProjects = pullProjectsFromDatabase;
        pullProjectsFromDatabase = async function() {
            await originalPullProjects.apply(this, arguments);
            attachHoverListeners();
        };
    }
});