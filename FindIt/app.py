
import os
import sqlite3
import uuid
from flask import Flask, request, jsonify, send_file, send_from_directory
from werkzeug.utils import secure_filename

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "findit.db")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


# Connect to database and create or update table
def init_db():
    with sqlite3.connect(DATABASE) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                location TEXT NOT NULL,
                contact TEXT NOT NULL,
                description TEXT,
                image TEXT
            )
        """)

        # Add image column to an existing database if necessary.
        columns = {
            row[1]
            for row in conn.execute("PRAGMA table_info(reports)")
        }

        if "image" not in columns:
            conn.execute("ALTER TABLE reports ADD COLUMN image TEXT")


# Home page
@app.route("/")
def home():
    return send_file(os.path.join(BASE_DIR, "index.html"))


# Serve uploaded photos
@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# Test backend
@app.route("/api/test")
def test():
    return jsonify({
        "message": "FindIt backend connected successfully!"
    })


# Save item report, with an optional photo
@app.route("/api/report", methods=["POST"])
def report_item():
    if request.is_json:
        data = request.get_json(silent=True) or {}
        name = data.get("name", "").strip()
        item_type = data.get("type", "").strip()
        location = data.get("location", "").strip()
        contact = data.get("contact", "").strip()
        description = data.get("description", "").strip()
        image_file = None
    else:
        name = request.form.get("name", "").strip()
        item_type = request.form.get("type", "").strip()
        location = request.form.get("location", "").strip()
        contact = request.form.get("contact", "").strip()
        description = request.form.get("description", "").strip()
        image_file = request.files.get("image")

    if not name or not location or not contact:
        return jsonify({
            "error": "Name, location and contact are required."
        }), 400

    if item_type not in ("Lost", "Found"):
        return jsonify({
            "error": "Choose Lost or Found."
        }), 400

    image_filename = None

    if image_file and image_file.filename:
        if not allowed_file(image_file.filename):
            return jsonify({
                "error": "Use a JPG, JPEG, PNG, or WebP image."
            }), 400

        # Check the declared image type as an additional basic safeguard.
        if image_file.mimetype not in (
            "image/jpeg", "image/png", "image/webp"
        ):
            return jsonify({
                "error": "The uploaded file must be an image."
            }), 400

        original_name = secure_filename(image_file.filename)
        extension = original_name.rsplit(".", 1)[1].lower()
        image_filename = f"{uuid.uuid4().hex}.{extension}"

        image_path = os.path.join(UPLOAD_FOLDER, image_filename)
        image_file.save(image_path)

    try:
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.execute("""
                INSERT INTO reports
                (name, type, location, contact, description, image)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                name, item_type, location,
                contact, description, image_filename
            ))

            report_id = cursor.lastrowid

    except Exception:
        # Avoid leaving an unreferenced file if saving the report fails.
        if image_filename:
            image_path = os.path.join(UPLOAD_FOLDER, image_filename)
            if os.path.exists(image_path):
                os.remove(image_path)
        raise

    return jsonify({
        "message": "Report saved successfully!",
        "id": report_id
    }), 201


# Retrieve reports from database
@app.route("/api/items")
def get_items():
    with sqlite3.connect(DATABASE) as conn:
        conn.row_factory = sqlite3.Row

        rows = conn.execute("""
            SELECT id, name, type, location, description, image
            FROM reports
            ORDER BY id DESC
        """).fetchall()

        items = [dict(row) for row in rows]

    for item in items:
        if item["image"]:
            item["image"] = "/uploads/" + item["image"]

    return jsonify(items)


# Friendly response if the uploaded request exceeds 5 MB
@app.errorhandler(413)
def file_too_large(error):
    return jsonify({
        "error": "The uploaded image is too large. Maximum size is 5 MB."
    }), 413


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
