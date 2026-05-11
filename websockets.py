from flask_socketio import join_room, leave_room, emit
from flask_login import current_user


def register_socketio_events(socketio):

    @socketio.on("connect")
    def handle_connect():
        if current_user.is_authenticated:
            join_room(str(current_user.id))
            emit("connected", {"message": f"Welcome {current_user.username}! Real-time updates active."})

    @socketio.on("disconnect")
    def handle_disconnect():
        if current_user.is_authenticated:
            leave_room(str(current_user.id))

    @socketio.on("ping_server")
    def handle_ping(data):
        emit("pong_client", {"message": "Server is alive!", "data": data})