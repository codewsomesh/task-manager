// ===== WebSocket Setup =====
const socket = io();

socket.on("connect", () => {
  console.log("WebSocket connected:", socket.id);
});

socket.on("connected", (data) => {
  showNotification("🟢 " + data.message);
});

socket.on("task_added", (task) => {
  showNotification(`➕ New task added: "${task.title}"`);
  loadTasks();
  loadAnalytics();
});

socket.on("task_updated", (task) => {
  showNotification(`✏️ Task updated: "${task.title}"`);
  loadTasks();
  loadAnalytics();
});

socket.on("task_deleted", (data) => {
  showNotification(`🗑️ Task removed.`);
  loadTasks();
  loadAnalytics();
});

// ===== Notification =====
function showNotification(msg) {
  const banner = document.getElementById("notification-banner");
  if (!banner) return;
  banner.textContent = msg;
  banner.classList.remove("hidden");
  clearTimeout(banner._timeout);
  banner._timeout = setTimeout(() => banner.classList.add("hidden"), 3500);
}

// ===== Analytics =====
async function loadAnalytics() {
  try {
    const res = await fetch("/api/analytics");
    const data = await res.json();
    if (!data.success) return;
    const a = data.analytics;

    setText("stat-total", a.total_tasks);
    setText("stat-completed", a.completed_tasks);
    setText("stat-pending", a.pending_tasks);
    setText("stat-progress", a.in_progress_tasks);
    setText("completion-pct", a.completion_percentage);

    const fill = document.getElementById("progress-fill");
    if (fill) fill.style.width = a.completion_percentage + "%";

    const breakdown = document.getElementById("priority-breakdown");
    if (breakdown) {
      breakdown.innerHTML = `
                <span class="priority-pill high">🔴 High: ${a.priority_breakdown.high}</span>
                <span class="priority-pill medium">🟡 Medium: ${a.priority_breakdown.medium}</span>
                <span class="priority-pill low">🟢 Low: ${a.priority_breakdown.low}</span>
            `;
    }
  } catch (e) {
    console.error("Analytics error:", e);
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ===== Load Tasks =====
async function loadTasks() {
  const statusFilter = document.getElementById("filter-status")?.value || "";
  const priorityFilter =
    document.getElementById("filter-priority")?.value || "";

  let url = "/api/tasks";
  const params = new URLSearchParams();
  if (statusFilter) params.append("status", statusFilter);
  if (priorityFilter) params.append("priority", priorityFilter);
  if (params.toString()) url += "?" + params.toString();

  const list = document.getElementById("tasks-list");
  if (!list) return;
  list.innerHTML = `<div class="loading">Loading tasks...</div>`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) {
      list.innerHTML = `<div class="empty-state"><p>Failed to load tasks.</p></div>`;
      return;
    }

    if (!data.tasks.length) {
      list.innerHTML = `<div class="empty-state">📭<p>No tasks found. Add one above!</p></div>`;
      return;
    }

    list.innerHTML = data.tasks.map(renderTask).join("");
  } catch (e) {
    list.innerHTML = `<div class="empty-state"><p>Error loading tasks.</p></div>`;
  }
}

function renderTask(task) {
  const completedClass = task.status === "completed" ? "completed-task" : "";
  const date = new Date(task.created_at).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const desc = task.description
    ? `<div class="task-desc">${escHtml(task.description)}</div>`
    : "";

  return `
    <div class="task-card ${completedClass}" id="task-${task.id}">
        <div class="task-left">
            <div class="task-title">${escHtml(task.title)}</div>
            ${desc}
            <div class="task-meta">
                <span class="badge badge-${task.priority}">${priorityLabel(task.priority)}</span>
                <span class="badge badge-${task.status}">${statusLabel(task.status)}</span>
                <span class="task-date">📅 ${date}</span>
            </div>
        </div>
        <div class="task-actions">
            <button class="btn btn-outline btn-sm" onclick="openEditModal(${task.id},'${escJs(task.title)}','${escJs(task.description || "")}','${task.priority}','${task.status}')">✏️</button>
            <button class="btn btn-danger btn-sm"  onclick="deleteTask(${task.id})">🗑️</button>
        </div>
    </div>`;
}

function priorityLabel(p) {
  return { low: "🟢 Low", medium: "🟡 Medium", high: "🔴 High" }[p] || p;
}
function statusLabel(s) {
  return (
    {
      pending: "⏳ Pending",
      in_progress: "🔄 In Progress",
      completed: "✅ Completed",
    }[s] || s
  );
}

// ===== Add Task =====
async function addTask() {
  const title = document.getElementById("task-title")?.value.trim();
  const description = document.getElementById("task-description")?.value.trim();
  const priority = document.getElementById("task-priority")?.value;
  const status = document.getElementById("task-status")?.value;

  if (!title) {
    showNotification("⚠️ Title is required!");
    return;
  }

  try {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, priority, status }),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById("task-title").value = "";
      document.getElementById("task-description").value = "";
      document.getElementById("task-priority").value = "medium";
      document.getElementById("task-status").value = "pending";
    } else {
      showNotification("❌ " + data.message);
    }
  } catch (e) {
    showNotification("❌ Failed to add task.");
  }
}

// ===== Delete Task =====
async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  try {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!data.success) showNotification("❌ " + data.message);
  } catch (e) {
    showNotification("❌ Failed to delete task.");
  }
}

// ===== Edit Modal =====
let editingTaskId = null;

function openEditModal(id, title, desc, priority, status) {
  editingTaskId = id;
  document.getElementById("edit-title").value = title;
  document.getElementById("edit-description").value = desc;
  document.getElementById("edit-priority").value = priority;
  document.getElementById("edit-status").value = status;
  document.getElementById("edit-modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("edit-modal").classList.add("hidden");
  editingTaskId = null;
}

async function saveEdit() {
  if (!editingTaskId) return;
  const payload = {
    title: document.getElementById("edit-title").value.trim(),
    description: document.getElementById("edit-description").value.trim(),
    priority: document.getElementById("edit-priority").value,
    status: document.getElementById("edit-status").value,
  };
  if (!payload.title) {
    showNotification("⚠️ Title is required!");
    return;
  }

  try {
    const res = await fetch(`/api/tasks/${editingTaskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      closeModal();
    } else {
      showNotification("❌ " + data.message);
    }
  } catch (e) {
    showNotification("❌ Failed to update task.");
  }
}

// ===== Escape Helpers =====
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escJs(str) {
  return String(str).replace(/'/g, "\\'").replace(/\n/g, "\\n");
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("tasks-list")) {
    loadTasks();
    loadAnalytics();
  }
});
