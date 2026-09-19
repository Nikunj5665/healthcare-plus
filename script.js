/* =========================================================
   HealthCare+ — shared script for every page.
   Each part only runs if its elements are on the page.

   NOTE: Accounts and checks are saved in this browser
   (localStorage) for the demo. Before real users sign up,
   replace this with a real backend (e.g. Supabase).
========================================================= */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/* =========================
   Footer year
========================= */

$$("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
});


/* =========================
   Mobile menu
========================= */

(function initMobileMenu() {
    const toggle = $(".nav-toggle");
    const menu = $("#navMenu");

    if (!toggle || !menu) return;

    function setOpen(open) {
        menu.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.textContent = open ? "Close" : "Menu";
    }

    toggle.addEventListener("click", function () {
        setOpen(!menu.classList.contains("is-open"));
    });

    $$("a", menu).forEach(function (link) {
        link.addEventListener("click", function () {
            setOpen(false);
        });
    });
})();


/* =========================
   How it works (landing page)
========================= */

(function initHowItWorks() {
    const steps = $$(".how-step");
    const panels = $$(".how-panel");

    if (!steps.length || !panels.length) return;

    const content = [
        {
            title: "Choose where the wound is",
            text: "Tap the part of the body the wound is on. An ulcer on the heel is managed very differently from one on the lower leg, so this shapes the guidance you get.",
            note: "Covers the common pressure points: heels, hips, tailbone and elbows."
        },
        {
            title: "Take a clear photo",
            text: "Take it with the dressing off, in daylight, from the same angle each week. Photos taken the same way make the healing trend obvious.",
            note: "Tips are shown right before you upload."
        },
        {
            title: "Answer a few questions",
            text: "What kind of wound it is, how long it's been open, how much it hurts and whether any warning signs have appeared. A photo alone can't tell the whole story.",
            note: "Takes about 30 seconds."
        },
        {
            title: "Get one clear answer",
            text: "Carry on with your care plan, get the wound seen soon, or get help now. Every answer comes with the steps to take next.",
            note: "Always tells you when to involve your clinic."
        },
        {
            title: "Watch it heal",
            text: "Add a photo every week and see them side by side, so you know whether the dressing plan is actually working.",
            note: "Your photos stay private to you."
        }
    ];

    function showStep(index) {
        steps.forEach(function (step, i) {
            const active = i === index;
            step.classList.toggle("is-active", active);
            step.setAttribute("aria-selected", String(active));
        });

        panels.forEach(function (panel, i) {
            panel.classList.toggle("is-active", i === index);
        });

        $("#howNum").textContent = "Step " + (index + 1) + " of " + content.length;
        $("#howTitle").textContent = content[index].title;
        $("#howText").textContent = content[index].text;
        $("#howNote").textContent = content[index].note;
    }

    steps.forEach(function (step, i) {
        step.addEventListener("click", function () {
            showStep(i);
        });
    });
})();


/* =========================
   Body map (landing page)
   Tap a body part or a label to highlight it.
========================= */

(function initBodyMap() {
    const map = $(".body-map");

    if (!map) return;

    const parts = $$(".bm-part", map);
    const points = $$(".body-point", map);
    const panel = map.closest(".how-panel");
    const caption = panel ? $(".panel-caption", panel) : null;

    const AREA_NAMES = {
        head: "Head or neck",
        chest: "Chest, abdomen or back",
        hand: "Arm or elbow",
        leg: "Hip or leg",
        foot: "Foot or heel"
    };

    function selectArea(area) {
        parts.forEach(function (part) {
            part.classList.toggle("is-selected", part.dataset.area === area);
        });

        points.forEach(function (point) {
            const active = point.dataset.area === area;
            point.classList.toggle("is-selected", active);
            point.setAttribute("aria-pressed", String(active));
        });

        if (caption) {
            caption.textContent = "Selected: " + (AREA_NAMES[area] || area);
        }
    }

    points.forEach(function (point) {
        point.setAttribute("aria-pressed", "false");
        point.addEventListener("click", function () {
            selectArea(point.dataset.area);
        });
    });

    parts.forEach(function (part) {
        part.addEventListener("click", function () {
            selectArea(part.dataset.area);
        });
    });
})();


/* =========================
   Accounts (demo only)
========================= */

const USERS_KEY = "hcp_users";
const SESSION_KEY = "hcp_session";

function readJSON(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value === null ? fallback : value;
    } catch (error) {
        return fallback;
    }
}

function getUsers() {
    return readJSON(USERS_KEY, []);
}

function getSession() {
    return readJSON(SESSION_KEY, null);
}

function startSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        name: user.name,
        email: user.email
    }));
}

/* Passwords are hashed so they're never stored as plain text.
   A real backend will handle this properly. */
async function hashPassword(password) {
    if (window.crypto && crypto.subtle) {
        const data = new TextEncoder().encode(password);
        const buffer = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(buffer))
            .map(function (b) { return b.toString(16).padStart(2, "0"); })
            .join("");
    }

    let hash = 5381;
    for (const char of password) {
        hash = ((hash << 5) + hash + char.charCodeAt(0)) | 0;
    }
    return "basic-" + (hash >>> 0).toString(16);
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function showError(box, message) {
    box.textContent = message;
    box.classList.add("is-visible");
}

function clearError(box) {
    box.textContent = "";
    box.classList.remove("is-visible");
}


/* Show / hide password buttons */

$$("[data-toggle-password]").forEach(function (button) {
    const input = document.getElementById(button.dataset.togglePassword);

    if (!input) return;

    button.addEventListener("click", function () {
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        button.classList.toggle("is-on", show);
        button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
});


/* Sign up */

(function initSignup() {
    const form = $("#signupForm");

    if (!form) return;

    const errorBox = $("#signupError");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearError(errorBox);

        const name = $("#signupName").value.trim();
        const email = $("#signupEmail").value.trim().toLowerCase();
        const password = $("#signupPassword").value;
        const confirm = $("#signupConfirm").value;
        const consent = $("#signupConsent").checked;

        if (!name) {
            return showError(errorBox, "Enter your full name.");
        }

        if (!isValidEmail(email)) {
            return showError(errorBox, "Enter a valid email address, like name@example.com.");
        }

        if (password.length < 8) {
            return showError(errorBox, "Use a password with at least 8 characters.");
        }

        if (password !== confirm) {
            return showError(errorBox, "The two passwords don't match.");
        }

        if (!consent) {
            return showError(errorBox, "Tick the box to agree to the Terms of use and Privacy policy.");
        }

        const users = getUsers();

        if (users.some(function (user) { return user.email === email; })) {
            return showError(errorBox, "An account with this email already exists. Log in instead.");
        }

        const user = {
            name: name,
            email: email,
            passwordHash: await hashPassword(password),
            createdAt: Date.now()
        };

        users.push(user);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        startSession(user);
        window.location.href = "dashboard.html";
    });
})();


/* Log in */

(function initLogin() {
    const form = $("#loginForm");

    if (!form) return;

    const errorBox = $("#loginError");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearError(errorBox);

        const email = $("#loginEmail").value.trim().toLowerCase();
        const password = $("#loginPassword").value;

        if (!email || !password) {
            return showError(errorBox, "Enter your email and password.");
        }

        const user = getUsers().find(function (u) { return u.email === email; });
        const passwordHash = await hashPassword(password);

        if (!user || user.passwordHash !== passwordHash) {
            return showError(errorBox, "That email and password don't match an account. Check them and try again.");
        }

        startSession(user);
        window.location.href = "dashboard.html";
    });
})();


/* Log out */

(function initLogout() {
    const button = $("#logoutBtn");

    if (!button) return;

    button.addEventListener("click", function () {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = "index.html";
    });
})();


/* =========================
   Guidance rules
   Simple, cautious rules for long-term wounds, based on the
   person's answers. The AI photo analysis will be added on top.
========================= */

const AREA_LABELS = {
    head: "head or neck",
    body: "chest, abdomen or back",
    arm: "arm or elbow",
    hand: "hand",
    hip: "hip or tailbone",
    leg: "leg or knee",
    foot: "foot or heel"
};

const TYPE_LABELS = {
    diabetic: "Diabetic foot ulcer",
    pressure: "Pressure sore",
    venous: "Venous leg ulcer",
    surgical: "Surgical wound",
    nonhealing: "Wound that isn't healing",
    other: "Long-term wound"
};

const AGE_LABELS = {
    new: "Open less than 2 weeks",
    weeks: "Open 2 to 4 weeks",
    months: "Open 1 to 3 months",
    long: "Open more than 3 months"
};

const WOUND_CARE = {
    diabetic: [
        "Keep all weight off the foot: use the offloading boot, crutches or wheelchair you were given.",
        "Clean the ulcer with saline or clean running water. Don't soak the foot.",
        "Re-dress it exactly as your clinic showed you, and change the dressing as often as they said.",
        "Check both feet every day, including between the toes and under the heel.",
        "Never cut away hard skin or use corn plasters on the foot yourself."
    ],
    pressure: [
        "Take the pressure off completely: don't lie or sit on the sore at all.",
        "Change position at least every 2 hours in bed, and every 15 minutes in a chair.",
        "Keep the skin clean and dry, and use a barrier cream on skin that gets wet.",
        "Use a pressure-relieving mattress or cushion if you have one.",
        "Check every bony area once a day: heels, hips, tailbone, elbows and shoulder blades."
    ],
    venous: [
        "Wear your compression stockings or bandages every day, unless a doctor has told you not to.",
        "Raise your legs above the level of your heart for 30 minutes, three or four times a day.",
        "Moisturise the skin around the ulcer, but not the ulcer itself.",
        "Walk a little every day, so the calf muscle can pump blood back up the leg.",
        "Change the dressing as often as your nurse or clinic showed you."
    ],
    surgical: [
        "Follow the dressing plan your hospital gave you, and keep the wound clean and dry.",
        "Don't pick at scabs, stitches, staples or surgical glue.",
        "Shower rather than bathe, and pat the area dry instead of rubbing it.",
        "Avoid heavy lifting and anything that stretches the wound until your surgeon says it's safe.",
        "Contact your surgical team if the wound opens or starts leaking."
    ],
    nonhealing: [
        "Keep the wound covered with a clean, moist dressing. A wound that dries out heals more slowly.",
        "Photograph it every week with a coin beside it, so changes in size are easy to see.",
        "Eat enough protein and drink enough water, because healing needs both.",
        "If you smoke, stopping makes a real difference to how fast a wound closes.",
        "Ask your doctor about a wound clinic referral if nothing has changed in 4 weeks."
    ],
    other: [
        "Keep the wound clean and covered with a fresh dressing.",
        "Watch for more pain, redness, swelling, drainage or a new smell.",
        "Photograph it every week so you can see whether it's actually changing."
    ]
};

/* Wounds that need a clinician's eye however settled they look */
const ALWAYS_REVIEW = {
    diabetic: {
        title: "See a doctor today",
        reason: "Every diabetic foot ulcer needs a professional check",
        summary: "Even a small, painless ulcer needs seeing today. Lost feeling in the foot hides how deep an ulcer really is, and early treatment protects the foot.",
        step: "Contact your doctor or foot clinic today about the ulcer."
    },
    pressure: {
        title: "Get the sore seen soon",
        reason: "A pressure sore that has broken the skin needs grading",
        summary: "A nurse or doctor should grade the sore and set up proper pressure relief. Sores that stay under pressure get deeper quickly.",
        step: "Contact your nurse, doctor or care team about the sore in the next day or two."
    }
};

const RED_EXTRA_STEPS = {
    diabetic: "Keep all weight off the foot on the way there.",
    pressure: "Stay off the sore completely and take your dressings with you.",
    venous: "Keep the leg raised while you wait, unless that makes the pain worse.",
    surgical: "Cover the wound with a clean dressing and take your operation notes with you."
};

function assess(answers) {
    const redFlags = answers.flags.filter(function (f) { return f.level === "red"; });
    const amberFlags = answers.flags.filter(function (f) { return f.level === "amber"; });
    const care = WOUND_CARE[answers.type] || WOUND_CARE.other;
    const review = ALWAYS_REVIEW[answers.type];

    /* Red: any urgent warning sign */
    if (redFlags.length) {
        const steps = [
            "Call 112 or go to the nearest emergency department now.",
            "If you can, ask someone to go with you."
        ];

        if (RED_EXTRA_STEPS[answers.type]) {
            steps.push(RED_EXTRA_STEPS[answers.type]);
        }

        return {
            level: "red",
            title: "Get medical help now",
            summary: "Your answers include a warning sign that needs urgent care. A wound infection can spread fast, so don't wait to see whether it settles.",
            reasons: redFlags.map(function (f) { return f.label; }),
            steps: steps
        };
    }

    /* Amber: needs a doctor or wound clinic soon */
    const reasons = amberFlags.map(function (f) { return f.label; });

    if (answers.pain >= 7) {
        reasons.push("Pain of " + answers.pain + " out of 10");
    }

    if (answers.age === "months" || answers.age === "long") {
        reasons.push(AGE_LABELS[answers.age]);
    }

    if (review || reasons.length) {
        const contactStep = review
            ? review.step
            : "Book your doctor or wound clinic in the next 1 to 2 days.";

        return {
            level: "amber",
            title: review ? review.title : "Get the wound seen soon",
            summary: review
                ? review.summary
                : "Book your doctor or wound clinic in the next day or two. Until then, here's how to look after the wound.",
            reasons: review ? [review.reason].concat(reasons) : reasons,
            steps: [contactStep].concat(care, [
                "Get help straight away if a warning sign appears, such as black tissue, a fever or red streaks."
            ])
        };
    }

    /* Green: keep going with the current plan */
    return {
        level: "green",
        title: "Carry on with your care plan",
        summary: "Nothing in your answers points to a problem right now. Keep to the routine below, and photograph the wound again in a few days.",
        reasons: [
            "No warning signs in your answers",
            AGE_LABELS[answers.age] || "Open a short time",
            "Pain of " + answers.pain + " out of 10"
        ],
        steps: care.concat([
            "Take the next photo in 3 to 7 days, from the same angle, to see how it's changing.",
            "Contact your clinic if the wound gets more painful, starts to smell, or stops shrinking."
        ])
    };
}


/* =========================
   Dashboard
========================= */

(function initDashboard() {
    const form = $("#checkForm");

    if (!form) return;

    const session = getSession();

    if (!session) {
        window.location.replace("login.html");
        return;
    }

    const HISTORY_KEY = "hcp_history_" + session.email;

    const errorBox = $("#checkError");
    const photoInput = $("#photoInput");
    const uploadZone = $("#uploadZone");
    const uploadWrap = $("#uploadWrap");
    const preview = $("#photoPreview");
    const previewImg = $("#previewImg");
    const resultPanel = $("#resultPanel");
    const painInput = $("#pain");
    const painValue = $("#painValue");

    let photoFile = null;
    let photoURL = null;


    /* Greeting and avatar */

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const nameParts = (session.name || "").trim().split(/\s+/);

    $("#greeting").textContent = greeting + ", " + (nameParts[0] || "there");
    $("#avatar").textContent = nameParts
        .slice(0, 2)
        .map(function (part) { return part.charAt(0).toUpperCase(); })
        .join("");


    /* History storage */

    function getHistory() {
        return readJSON(HISTORY_KEY, []);
    }

    function saveHistory(history) {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            return true;
        } catch (error) {
            return false;
        }
    }


    /* Photo */

    function setPhoto(file) {
        clearError(errorBox);

        if (!file.type.startsWith("image/")) {
            photoInput.value = "";
            return showError(errorBox, "That file isn't a photo. Choose a JPG or PNG image.");
        }

        if (file.size > 10 * 1024 * 1024) {
            photoInput.value = "";
            return showError(errorBox, "That photo is larger than 10 MB. Choose a smaller one.");
        }

        if (photoURL) URL.revokeObjectURL(photoURL);

        photoFile = file;
        photoURL = URL.createObjectURL(file);

        previewImg.src = photoURL;
        $("#photoName").textContent = file.name;
        preview.hidden = false;
        uploadWrap.hidden = true;

        hideResult();
    }

    function clearPhoto() {
        if (photoURL) URL.revokeObjectURL(photoURL);

        photoFile = null;
        photoURL = null;
        photoInput.value = "";
        previewImg.removeAttribute("src");
        preview.hidden = true;
        uploadWrap.hidden = false;

        hideResult();
    }

    photoInput.addEventListener("change", function () {
        if (photoInput.files[0]) setPhoto(photoInput.files[0]);
    });

    ["dragenter", "dragover"].forEach(function (type) {
        uploadZone.addEventListener(type, function (event) {
            event.preventDefault();
            uploadZone.classList.add("is-dragover");
        });
    });

    ["dragleave", "drop"].forEach(function (type) {
        uploadZone.addEventListener(type, function (event) {
            event.preventDefault();
            uploadZone.classList.remove("is-dragover");
        });
    });

    uploadZone.addEventListener("drop", function (event) {
        const file = event.dataTransfer.files[0];
        if (file) setPhoto(file);
    });

    $("#removePhoto").addEventListener("click", clearPhoto);


    /* Small copy of the photo for the history list */

    function makeThumbnail(url, maxSize) {
        return new Promise(function (resolve) {
            const img = new Image();

            img.onload = function () {
                const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.72));
            };

            img.onerror = function () {
                resolve(null);
            };

            img.src = url;
        });
    }


    /* Pain slider */

    function updatePain() {
        painValue.textContent = painInput.value + " of 10";
    }

    painInput.addEventListener("input", updatePain);


    /* Result */

    function fillList(list, items) {
        list.innerHTML = "";
        items.forEach(function (text) {
            const li = document.createElement("li");
            li.textContent = text;
            list.appendChild(li);
        });
    }

    function showResult(result) {
        resultPanel.dataset.level = result.level;
        $("#resultTitle").textContent = result.title;
        $("#resultSummary").textContent = result.summary;
        $("#resultCall").hidden = result.level !== "red";

        fillList($("#resultReasons"), result.reasons);
        fillList($("#resultSteps"), result.steps);

        resultPanel.hidden = false;
        resultPanel.scrollIntoView({
            behavior: prefersReducedMotion ? "auto" : "smooth",
            block: "start"
        });
    }

    function hideResult() {
        resultPanel.hidden = true;
    }


    /* Submit a check */

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearError(errorBox);

        const area = form.elements.area.value;
        const type = $("#woundType").value;
        const age = $("#woundAge").value;

        if (!area) return showError(errorBox, "Choose where the wound is.");
        if (!photoFile) return showError(errorBox, "Add a photo of the wound.");
        if (!type) return showError(errorBox, "Choose what kind of wound it is.");
        if (!age) return showError(errorBox, "Choose how long the wound has been open.");

        const flags = $$('input[name="flag"]:checked', form).map(function (input) {
            return {
                level: input.dataset.level,
                label: input.dataset.label,
                id: input.dataset.id || null
            };
        });

        const result = assess({
            type: type,
            age: age,
            pain: Number(painInput.value),
            flags: flags
        });

        showResult(result);

        const entry = {
            id: Date.now().toString(36),
            date: Date.now(),
            area: area,
            type: type,
            age: age,
            level: result.level,
            thumb: await makeThumbnail(photoURL, 240)
        };

        const history = [entry].concat(getHistory()).slice(0, 30);

        /* If the browser runs out of space, save without the photo */
        if (!saveHistory(history)) {
            entry.thumb = null;
            saveHistory(history);
        }

        renderHistory();
    });


    /* Start again */

    $("#newCheckBtn").addEventListener("click", function () {
        form.reset();
        updatePain();
        clearPhoto();
        clearError(errorBox);

        $("#new-check").scrollIntoView({
            behavior: prefersReducedMotion ? "auto" : "smooth",
            block: "start"
        });
    });


    /* History list */

    const LEVEL_NAMES = {
        green: "On track",
        amber: "Needs a clinic",
        red: "Urgent"
    };

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

        return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    }

    function renderHistory() {
        const history = getHistory();
        const list = $("#historyList");

        list.innerHTML = "";
        $("#historyEmpty").hidden = history.length > 0;

        $("#statTotal").textContent = history.length;
        $("#statDoctor").textContent = history.filter(function (h) {
            return h.level !== "green";
        }).length;
        $("#statLast").textContent = history.length ? formatDate(history[0].date) : "None";

        history.forEach(function (item) {
            const li = document.createElement("li");
            li.className = "history-item";

            const thumb = document.createElement("img");
            thumb.className = "history-thumb";
            thumb.alt = "";
            if (item.thumb) thumb.src = item.thumb;

            const info = document.createElement("div");

            const title = document.createElement("span");
            title.className = "history-title";
            title.textContent =
                (TYPE_LABELS[item.type] || "Wound") + " on the " + (AREA_LABELS[item.area] || "body");

            const meta = document.createElement("span");
            meta.className = "history-meta";

            const chip = document.createElement("span");
            chip.className = "level-chip " + item.level;
            chip.textContent = LEVEL_NAMES[item.level] || "";

            const date = document.createElement("span");
            date.textContent = formatDate(item.date);

            meta.append(chip, date);
            info.append(title, meta);

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "icon-btn";
            remove.setAttribute("aria-label", "Delete this check");
            remove.innerHTML = '<svg class="icon"><use href="#i-trash"/></svg>';

            remove.addEventListener("click", function () {
                if (!confirm("Delete this check? This can't be undone.")) return;

                saveHistory(getHistory().filter(function (h) {
                    return h.id !== item.id;
                }));

                renderHistory();
            });

            li.append(thumb, info, remove);
            list.appendChild(li);
        });
    }

    /* Delete all checks */

    const clearBtn = $("#clearHistoryBtn");

    if (clearBtn) {
        clearBtn.addEventListener("click", function () {
            if (!getHistory().length) {
                alert("There are no checks to delete.");
                return;
            }

            if (!confirm("Delete all your checks? This can't be undone.")) return;

            localStorage.removeItem(HISTORY_KEY);
            renderHistory();
            hideResult();
        });
    }

    renderHistory();
})();


/* =========================
   Everyday moments carousel
   Glides continuously in an endless loop.
   Pauses while the person hovers or touches it.
========================= */

(function initCarousel() {
    const track = $("[data-carousel]");

    if (!track) return;

    const prev = $("[data-carousel-prev]");
    const next = $("[data-carousel-next]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const slides = $$(".moment", track);

    if (!slides.length) return;

    /* How fast the cards glide, in pixels per second */
    const SPEED = 70;

    let paused = false;
    let holdUntil = 0;

    /* Infinite loop: put a copy of every card before and after the real
       ones. When the scroll drifts into a copy, jump back by one full set,
       so it looks endless. */
    function makeClone(slide) {
        const clone = slide.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.setAttribute("inert", "");
        return clone;
    }

    slides.forEach(function (slide) {
        track.appendChild(makeClone(slide));
    });

    slides.slice().reverse().forEach(function (slide) {
        track.insertBefore(makeClone(slide), track.firstChild);
    });

    function setWidth() {
        return slides[0].offsetLeft - track.children[0].offsetLeft;
    }

    function wrap(left) {
        const width = setWidth();
        if (left < width * 0.5) return left + width;
        if (left >= width * 1.5) return left - width;
        return left;
    }

    let position = setWidth();
    track.scrollLeft = position;

    function isAutoMoving() {
        return !reduceMotion && !paused && performance.now() >= holdUntil;
    }

    /* After the person scrolls (arrows, swipe), keep them inside the loop */
    function recenter() {
        if (isAutoMoving()) return;
        const left = wrap(track.scrollLeft);
        if (left !== track.scrollLeft) track.scrollLeft = left;
        position = track.scrollLeft;
    }

    let scrollEndTimer = null;

    if ("onscrollend" in window) {
        track.addEventListener("scrollend", recenter);
    } else {
        track.addEventListener("scroll", function () {
            clearTimeout(scrollEndTimer);
            scrollEndTimer = setTimeout(recenter, 150);
        }, { passive: true });
    }

    window.addEventListener("resize", function () {
        track.scrollLeft = wrap(track.scrollLeft);
        position = track.scrollLeft;
    });

    function slideWidth() {
        const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
        return slides[0].getBoundingClientRect().width + gap;
    }

    /* Give a manual scroll time to finish before gliding again */
    function hold(ms) {
        holdUntil = performance.now() + ms;
    }

    function go(direction) {
        hold(900);
        track.scrollBy({ left: direction * slideWidth(), behavior: reduceMotion ? "auto" : "smooth" });
    }

    if (prev) prev.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });

    track.addEventListener("mouseenter", function () { paused = true; });
    track.addEventListener("mouseleave", function () { paused = false; });
    track.addEventListener("focusin", function () { paused = true; });
    track.addEventListener("focusout", function () { paused = false; });
    track.addEventListener("touchstart", function () { paused = true; }, { passive: true });
    track.addEventListener("touchend", function () { paused = false; hold(1200); }, { passive: true });

    /* Keyboard: left and right arrows */
    track.addEventListener("keydown", function (event) {
        if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
    });

    if (reduceMotion) return;

    /* Continuous glide, timed by the frame clock so the speed is the
       same on every screen */
    let last = performance.now();

    function tick(now) {
        const seconds = Math.min(now - last, 100) / 1000;
        last = now;

        if (isAutoMoving() && !document.hidden) {
            position = wrap(position + SPEED * seconds);
            track.scrollLeft = position;
        } else {
            position = track.scrollLeft;
        }

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
})();


/* =========================
   Contact form
   Posts to /api/contact, which is the only place that knows the
   SMTP details. Nothing secret can live in this file: the browser
   downloads it, so anyone can read it.
========================= */

(function initContactForm() {
    const form = $("#contactForm");

    if (!form) return;

    const errorBox = $("#contactError");
    const successBox = $("#contactSuccess");
    const submitBtn = $("#contactSubmit");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearError(errorBox);
        successBox.classList.remove("is-visible");

        const name = $("#contactName").value.trim();
        const email = $("#contactEmail").value.trim();
        const topic = $("#contactTopic").value;
        const message = $("#contactMessage").value.trim();

        if (!name) return showError(errorBox, "Please tell us your name.");
        if (!isValidEmail(email)) return showError(errorBox, "Enter a valid email address, like name@example.com.");
        if (message.length < 10) return showError(errorBox, "Please write a bit more so we can help.");

        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    topic: topic,
                    message: message,
                    company: $("#contactCompany").value
                })
            });

            const data = await response.json().catch(function () { return {}; });

            if (!response.ok) {
                throw new Error(data.error || "That didn't send.");
            }

            form.reset();
            successBox.textContent = "Thanks — your message is on its way. We'll reply to " + email + ".";
            successBox.classList.add("is-visible");
        } catch (error) {
            showError(
                errorBox,
                (error.message || "That didn't send.") +
                " You can also write to healthcareplus772@gmail.com."
            );
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Send message";
        }
    });
})();