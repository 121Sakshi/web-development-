
from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import os

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "tasks.db")


def init_db():
    with sqlite3.connect(DATABASE) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                priority TEXT NOT NULL DEFAULT 'Medium',
                due_date TEXT DEFAULT '',
                completed INTEGER NOT NULL DEFAULT 0
            )
        """)


@app.route("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/style.css")
def stylesheet():
    return send_from_directory(BASE_DIR, "style.css")


@app.route("/script.js")
def javascript():
    return send_from_directory(BASE_DIR, "script.js")


@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    with sqlite3.connect(DATABASE) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM tasks ORDER BY completed ASC, id DESC"
        ).fetchall()
    return jsonify([dict(row) for row in rows])


@app.route("/api/tasks", methods=["POST"])
def add_task():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    description = str(data.get("description", "")).strip()
    priority = data.get("priority", "Medium")
    due_date = data.get("due_date", "")

    if not title:
        return jsonify({"error": "Please enter a task title."}), 400

    if priority not in ("Low", "Medium", "High"):
        return jsonify({"error": "Invalid priority."}), 400

    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.execute("""
            INSERT INTO tasks (title, description, priority, due_date)
            VALUES (?, ?, ?, ?)
        """, (title, description, priority, due_date))

        task_id = cursor.lastrowid

    return jsonify({
        "message": "Task added successfully!",
        "id": task_id
    }), 201


@app.route("/api/tasks/<int:task_id>", methods=["PATCH"])
def update_task(task_id):
    data = request.get_json(silent=True) or {}

    with sqlite3.connect(DATABASE) as conn:
        row = conn.execute(
            "SELECT id FROM tasks WHERE id = ?", (task_id,)
        ).fetchone()

        if row is None:
            return jsonify({"error": "Task not found."}), 404

        if "completed" in data:
            completed = data["completed"]
            if not isinstance(completed, bool):
                return jsonify({"error": "Invalid completion value."}), 400

            conn.execute(
                "UPDATE tasks SET completed = ? WHERE id = ?",
                (int(completed), task_id)
            )

    return jsonify({"message": "Task updated successfully!"})


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.execute(
            "DELETE FROM tasks WHERE id = ?", (task_id,)
        )

        if cursor.rowcount == 0:
            return jsonify({"error": "Task not found."}), 404

    return jsonify({"message": "Task deleted successfully!"})


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
