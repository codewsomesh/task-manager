"""
Smart Task Management System — Entry Point
"""
from flask import Flask
from config import Config
from extensions import db, bcrypt, login_manager, socketio


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode="gevent")

    from auth.routes import auth_bp
    from api.tasks import tasks_bp
    from api.analytics import analytics_bp
    from main.routes import main_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(tasks_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")
    app.register_blueprint(main_bp)

    with app.app_context():
        db.create_all()

    from websockets import register_socketio_events
    register_socketio_events(socketio)

    return app, socketio

app, socketio = create_app()

if __name__ == "__main__":
    socketio.run(app, debug=False, host="0.0.0.0", port=5000)