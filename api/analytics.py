from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from models.task import Task
import pandas as pd
import numpy as np

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/analytics", methods=["GET"])
@login_required
def get_analytics():
    """Return task analytics using Pandas and NumPy."""
    tasks = Task.query.filter_by(user_id=current_user.id).all()

    if not tasks:
        return jsonify({
            "success": True,
            "analytics": {
                "total_tasks": 0,
                "completed_tasks": 0,
                "pending_tasks": 0,
                "in_progress_tasks": 0,
                "completion_percentage": 0.0,
                "priority_breakdown": {"low": 0, "medium": 0, "high": 0},
                "avg_tasks_per_priority": 0.0
            }
        }), 200

    df = pd.DataFrame([t.to_dict() for t in tasks])
    df["created_at"] = pd.to_datetime(df["created_at"])

    total = len(df)
    completed = int(np.sum(df["status"] == "completed"))
    pending = int(np.sum(df["status"] == "pending"))
    in_progress = int(np.sum(df["status"] == "in_progress"))
    completion_pct = round(float(np.round((completed / total) * 100, 2)), 2)

    priority_counts = df["priority"].value_counts().to_dict()
    priority_breakdown = {
        "low": int(priority_counts.get("low", 0)),
        "medium": int(priority_counts.get("medium", 0)),
        "high": int(priority_counts.get("high", 0))
    }

    counts_array = np.array(list(priority_breakdown.values()))
    avg_per_priority = round(float(np.mean(counts_array)), 2)

    return jsonify({
        "success": True,
        "analytics": {
            "total_tasks": total,
            "completed_tasks": completed,
            "pending_tasks": pending,
            "in_progress_tasks": in_progress,
            "completion_percentage": completion_pct,
            "priority_breakdown": priority_breakdown,
            "avg_tasks_per_priority": avg_per_priority
        }
    }), 200