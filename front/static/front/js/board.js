const API = "/api/";

// ── Auth guard ──
const access = localStorage.getItem("access");
if (!access) {
    window.location.href = "/";
}

document.getElementById("nav-user").textContent = localStorage.getItem("username") || "";

// ── Auth helpers ──
function authHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("access"),
    };
}

async function apiFetch(url, options = {}) {
    let res = await fetch(url, options);
    if (res.status === 401) {
        logout();
        return null;
    }
    return res;
}

function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    window.location.href = "/";
}

document.getElementById("logout-btn").addEventListener("click", logout);

// ── Escape HTML ──
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// ── Build a task card element ──
function createCardElement(task) {
    const card = document.createElement("div");
    card.className = "task-card";
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.dataset.title = task.title;
    card.dataset.description = task.description || "";
    card.dataset.status = task.status;

    card.innerHTML = `
        <div class="task-card-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-card-desc">${escapeHtml(task.description)}</div>` : ""}
    `;

    // Click to edit
    card.addEventListener("click", (e) => {
        // Don't open modal if we just finished dragging
        if (card.classList.contains("just-dragged")) {
            card.classList.remove("just-dragged");
            return;
        }
        openEditModal(task);
    });

    // Drag events on card
    card.addEventListener("dragstart", (e) => {
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
    });

    card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        card.classList.add("just-dragged");
        setTimeout(() => card.classList.remove("just-dragged"), 0);
        clearAllIndicators();
    });

    return card;
}

// ── Drag & Drop on columns ──
function setupDropZones() {
    document.querySelectorAll(".task-list").forEach((list) => {
        list.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            list.classList.add("drag-over");

            const afterElement = getDragAfterElement(list, e.clientY);
            const indicator = getOrCreateIndicator(list);

            if (afterElement) {
                list.insertBefore(indicator, afterElement);
            } else {
                list.appendChild(indicator);
            }
        });

        list.addEventListener("dragleave", (e) => {
            // Only remove if actually leaving the list
            if (!list.contains(e.relatedTarget)) {
                list.classList.remove("drag-over");
                removeIndicator(list);
            }
        });

        list.addEventListener("drop", async (e) => {
            e.preventDefault();
            list.classList.remove("drag-over");
            removeIndicator(list);

            const taskId = e.dataTransfer.getData("text/plain");
            const newStatus = list.closest(".column").dataset.status;

            // Find the card being dragged
            const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
            if (!card) return;

            const oldStatus = card.dataset.status;

            // Move card visually immediately
            const afterElement = getDragAfterElement(list, e.clientY);
            if (afterElement) {
                list.insertBefore(card, afterElement);
            } else {
                list.appendChild(card);
            }
            card.dataset.status = newStatus;

            // Update counts visually
            updateCounts();

            // If status changed, send PUT to backend
            if (oldStatus !== newStatus) {
                try {
                    const res = await apiFetch(API + "tasks/" + taskId, {
                        method: "PUT",
                        headers: authHeaders(),
                        body: JSON.stringify({
                            title: card.dataset.title,
                            description: card.dataset.description,
                            status: newStatus,
                        }),
                    });

                    if (!res || !res.ok) {
                        // Revert on failure
                        loadTasks();
                    }
                } catch {
                    loadTasks();
                }
            }
        });
    });
}

// Get the element the dragged card should be placed before
function getDragAfterElement(list, y) {
    const cards = [...list.querySelectorAll(".task-card:not(.dragging)")];

    let closest = null;
    let closestOffset = Number.POSITIVE_INFINITY;

    cards.forEach((card) => {
        const box = card.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > -closestOffset) {
            closestOffset = -offset;
            closest = card;
        }
    });

    return closest;
}

// Drop indicator helpers
function getOrCreateIndicator(list) {
    let indicator = list.querySelector(".drop-indicator");
    if (!indicator) {
        indicator = document.createElement("div");
        indicator.className = "drop-indicator";
    }
    return indicator;
}

function removeIndicator(list) {
    const indicator = list.querySelector(".drop-indicator");
    if (indicator) indicator.remove();
}

function clearAllIndicators() {
    document.querySelectorAll(".drop-indicator").forEach((el) => el.remove());
    document.querySelectorAll(".task-list").forEach((el) => el.classList.remove("drag-over"));
}

// ── Update column counts ──
function updateCounts() {
    ["todo", "in_progress", "done"].forEach((status) => {
        const count = document.querySelectorAll(`#list-${status} .task-card`).length;
        document.getElementById("count-" + status).textContent = count;
    });
}

// ── Load tasks ──
async function loadTasks() {
    const res = await apiFetch(API + "tasks", { headers: authHeaders() });
    if (!res) return;

    const tasks = await res.json();

    document.getElementById("list-todo").innerHTML = "";
    document.getElementById("list-in_progress").innerHTML = "";
    document.getElementById("list-done").innerHTML = "";

    tasks.forEach((task) => {
        const card = createCardElement(task);
        document.getElementById("list-" + task.status).appendChild(card);
    });

    updateCounts();
}

// ── Modal logic ──
const modal = document.getElementById("task-modal");
const form = document.getElementById("task-form");
const deleteBtn = document.getElementById("task-delete-btn");

function openCreateModal(status) {
    document.getElementById("modal-title").textContent = "New Task";
    document.getElementById("task-id").value = "";
    document.getElementById("task-title-input").value = "";
    document.getElementById("task-desc-input").value = "";
    document.getElementById("task-status-input").value = status;
    document.getElementById("task-error").textContent = "";
    deleteBtn.style.display = "none";
    modal.style.display = "flex";
}

function openEditModal(task) {
    document.getElementById("modal-title").textContent = "Edit Task";
    document.getElementById("task-id").value = task.id;
    document.getElementById("task-title-input").value = task.title;
    document.getElementById("task-desc-input").value = task.description || "";
    document.getElementById("task-status-input").value = task.status;
    document.getElementById("task-error").textContent = "";
    deleteBtn.style.display = "inline-block";
    modal.style.display = "flex";
}

function closeModal() {
    modal.style.display = "none";
}

document.getElementById("modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
});

document.querySelectorAll(".btn-add").forEach((btn) => {
    btn.addEventListener("click", () => openCreateModal(btn.dataset.status));
});

// ── Save task ──
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("task-error");
    errorEl.textContent = "";

    const taskId = document.getElementById("task-id").value;
    const body = {
        title: document.getElementById("task-title-input").value.trim(),
        description: document.getElementById("task-desc-input").value.trim(),
        status: document.getElementById("task-status-input").value,
    };

    const url = taskId ? API + "tasks/" + taskId : API + "tasks";
    const method = taskId ? "PUT" : "POST";

    try {
        const res = await apiFetch(url, {
            method,
            headers: authHeaders(),
            body: JSON.stringify(body),
        });
        if (!res) return;

        if (!res.ok) {
            const data = await res.json();
            errorEl.textContent = data.detail || JSON.stringify(data);
            return;
        }

        closeModal();
        loadTasks();
    } catch {
        errorEl.textContent = "Network error.";
    }
});

// ── Delete task ──
deleteBtn.addEventListener("click", async () => {
    const taskId = document.getElementById("task-id").value;
    if (!taskId) return;
    if (!confirm("Delete this task?")) return;

    try {
        const res = await apiFetch(API + "tasks/" + taskId, {
            method: "DELETE",
            headers: authHeaders(),
        });
        if (!res) return;
        closeModal();
        loadTasks();
    } catch {
        document.getElementById("task-error").textContent = "Failed to delete.";
    }
});

// ── Init ──
setupDropZones();
loadTasks();