const API = "/api/";

// ── Tab switching ──
document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const tab = btn.dataset.tab;
        document.getElementById("login-form").style.display = tab === "login" ? "block" : "none";
        document.getElementById("register-form").style.display = tab === "register" ? "block" : "none";
        clearErrors();
    });
});

function clearErrors() {
    document.getElementById("login-error").textContent = "";
    document.getElementById("register-error").textContent = "";
}

function showError(id, data) {
    const el = document.getElementById(id);
    if (typeof data === "string") {
        el.textContent = data;
        return;
    }
    // DRF returns {field: [errors]} or {detail: "..."}
    if (data.detail) {
        el.textContent = data.detail;
        return;
    }
    const messages = [];
    for (const [field, errs] of Object.entries(data)) {
        const errList = Array.isArray(errs) ? errs.join(", ") : errs;
        messages.push(`${field}: ${errList}`);
    }
    el.textContent = messages.join(" | ");
}

// ── Redirect if already logged in ──
if (localStorage.getItem("access")) {
    window.location.href = "/board/";
}

// ── Login ──
document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const body = {
        username: document.getElementById("login-username").value.trim(),
        password: document.getElementById("login-password").value,
    };

    try {
        const res = await fetch(API + "login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();

        if (!res.ok) {
            showError("login-error", data);
            return;
        }

        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("username", body.username);
        window.location.href = "/board/";
    } catch (err) {
        showError("login-error", "Network error. Try again.");
    }
});

// ── Register ──
document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const body = {
        username: document.getElementById("reg-username").value.trim(),
        email: document.getElementById("reg-email").value.trim(),
        password: document.getElementById("reg-password").value,
        password_confirm: document.getElementById("reg-password-confirm").value,
    };

    try {
        const res = await fetch(API + "register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();

        if (!res.ok) {
            showError("register-error", data);
            return;
        }

        localStorage.setItem("access", data.tokens.access);
        localStorage.setItem("refresh", data.tokens.refresh);
        localStorage.setItem("username", data.user.username);
        window.location.href = "/board/";
    } catch (err) {
        showError("register-error", "Network error. Try again.");
    }
});