
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const searchBox = document.getElementById("searchBox");
const filter = document.getElementById("filter");
const message = document.getElementById("message");

let tasks = [];

async function api(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
    }

    return data;
}

async function loadTasks() {
    try {
        tasks = await api("/api/tasks");
        displayTasks();
    } catch (error) {
        message.textContent = "Could not load tasks. Check the Flask server.";
    }
}

function displayTasks() {
    const query = searchBox.value.trim().toLowerCase();
    const selected = filter.value;

    const filtered = tasks.filter(task => {
        const matchesSearch =
            task.title.toLowerCase().includes(query) ||
            (task.description || "").toLowerCase().includes(query);

        let matchesFilter = true;

        if (selected === "Pending") {
            matchesFilter = !task.completed;
        } else if (selected === "Completed") {
            matchesFilter = Boolean(task.completed);
        } else if (["High", "Medium", "Low"].includes(selected)) {
            matchesFilter = task.priority === selected;
        }

        return matchesSearch && matchesFilter;
    });

    document.getElementById("totalCount").textContent = tasks.length;
    document.getElementById("pendingCount").textContent =
        tasks.filter(task => !task.completed).length;
    document.getElementById("completedCount").textContent =
        tasks.filter(task => Boolean(task.completed)).length;

    taskList.replaceChildren();

    if (filtered.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent = tasks.length
            ? "No tasks match your search or filter."
            : "No tasks yet. Add your first task!";
        taskList.appendChild(empty);
        return;
    }

    filtered.forEach(task => {
        const card = document.createElement("article");
        card.className = "task-card";

        if (task.completed) {
            card.classList.add("is-completed");
        }

        const top = document.createElement("div");
        top.className = "task-top";

        const titleArea = document.createElement("div");
        titleArea.className = "task-title-area";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(task.completed);
        checkbox.setAttribute("aria-label", "Complete " + task.title);
        checkbox.addEventListener("change", () => {
            toggleTask(task.id, checkbox.checked);
        });

        const title = document.createElement("h3");
        title.textContent = task.title;
        titleArea.append(checkbox, title);

        const badge = document.createElement("span");
        badge.className = "priority " + task.priority.toLowerCase();
        badge.textContent = task.priority;

        top.append(titleArea, badge);
        card.appendChild(top);

        if (task.description) {
            const description = document.createElement("p");
            description.className = "task-description";
            description.textContent = task.description;
            card.appendChild(description);
        }

        const bottom = document.createElement("div");
        bottom.className = "task-bottom";

        const due = document.createElement("span");
        due.className = "due-date";
        due.textContent = task.due_date
            ? "Due: " + task.due_date
            : "No due date";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        bottom.append(due, deleteButton);
        card.appendChild(bottom);
        taskList.appendChild(card);
    });
}

taskForm.addEventListener("submit", async event => {
    event.preventDefault();

    const data = {
        title: document.getElementById("title").value.trim(),
        description: document.getElementById("description").value.trim(),
        priority: document.getElementById("priority").value,
        due_date: document.getElementById("dueDate").value
    };

    if (!data.title) {
        message.textContent = "Please enter a task title.";
        return;
    }

    try {
        const result = await api("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        message.textContent = result.message;
        taskForm.reset();
        document.getElementById("priority").value = "Medium";
        await loadTasks();
    } catch (error) {
        message.textContent = error.message;
    }
});

async function toggleTask(id, completed) {
    try {
        await api("/api/tasks/" + id, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed })
        });

        await loadTasks();
    } catch (error) {
        message.textContent = error.message;
        await loadTasks();
    }
}

async function deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    try {
        await api("/api/tasks/" + id, { method: "DELETE" });
        message.textContent = "Task deleted successfully.";
        await loadTasks();
    } catch (error) {
        message.textContent = error.message;
    }
}

searchBox.addEventListener("input", displayTasks);
filter.addEventListener("change", displayTasks);

loadTasks();
