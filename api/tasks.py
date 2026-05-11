from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from extensions import db, socketio
from models.task import Task
from datetime import datetime

tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.route("/tasks", methods=["GET"])
@login_required
def get_all_tasks():
    """Get all tasks for the logged-in user."""
    status_filter = request.args.get("status")
    priority_filter = request.args.get("priority")

    query = Task.query.filter_by(user_id=current_user.id)
    if status_filter:
        query = query.filter_by(status=status_filter)
    if priority_filter:
        query = query.filter_by(priority=priority_filter)

    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify({"success": True, "tasks": [t.to_dict() for t in tasks]}), 200


@tasks_bp.route("/tasks", methods=["POST"])
@login_required
def add_task():
    """Add a new task."""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided."}), 400

    title = data.get("title", "").strip()
    if not title:
        return jsonify({"success": False, "message": "Title is required."}), 400

    priority = data.get("priority", "medium")
    if priority not in ("low", "medium", "high"):
        return jsonify({"success": False, "message": "Priority must be low, medium, or high."}), 400

    status = data.get("status", "pending")
    if status not in ("pending", "in_progress", "completed"):
        return jsonify({"success": False, "message": "Invalid status value."}), 400

    task = Task(
        title=title,
        description=data.get("description", ""),
        priority=priority,
        status=status,
        user_id=current_user.id
    )
    db.session.add(task)
    db.session.commit()

    socketio.emit("task_added", task.to_dict(), room=str(current_user.id))
    return jsonify({"success": True, "message": "Task created.", "task": task.to_dict()}), 201


@tasks_bp.route("/tasks/<int:task_id>", methods=["PUT"])
@login_required
def update_task(task_id):
    """Update an existing task."""
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({"success": False, "message": "Task not found."}), 404

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided."}), 400

    if "title" in data:
        task.title = data["title"].strip() or task.title
    if "description" in data:
        task.description = data["description"]
    if "priority" in data and data["priority"] in ("low", "medium", "high"):
        task.priority = data["priority"]
    if "status" in data and data["status"] in ("pending", "in_progress", "completed"):
        task.status = data["status"]

    task.updated_at = datetime.utcnow()
    db.session.commit()

    socketio.emit("task_updated", task.to_dict(), room=str(current_user.id))
    return jsonify({"success": True, "message": "Task updated.", "task": task.to_dict()}), 200


@tasks_bp.route("/tasks/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    """Delete a task."""
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({"success": False, "message": "Task not found."}), 404

    task_data = task.to_dict()
    db.session.delete(task)
    db.session.commit()

    socketio.emit("task_deleted", {"id": task_id}, room=str(current_user.id))
    return jsonify({"success": True, "message": "Task deleted.", "task": task_data}), 200