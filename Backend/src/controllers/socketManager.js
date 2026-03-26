let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("SOMETHING CONNECTED:", socket.id);

        socket.on("join-call", (path) => {
            if (!path) return;

            if (!connections[path]) {
                connections[path] = [];
            }

            if (!connections[path].includes(socket.id)) {
                connections[path].push(socket.id);
            }

            timeOnline[socket.id] = new Date();

            for (let i = 0; i < connections[path].length; i++) {
                io.to(connections[path][i]).emit("user-joined", socket.id, connections[path]);
            }

            if (messages[path]) {
                for (let i = 0; i < messages[path].length; i++) {
                    io.to(socket.id).emit(
                        "chat-message",
                        messages[path][i].data,
                        messages[path][i].sender,
                        messages[path][i]["socket-id-sender"]
                    );
                }
            }
        });

        socket.on("signal", (toId, message) => {
            if (!toId) return;
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections).reduce(
                ([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                },
                ["", false]
            );

            if (found) {
                if (!messages[matchingRoom]) {
                    messages[matchingRoom] = [];
                }

                messages[matchingRoom].push({
                    sender,
                    data,
                    "socket-id-sender": socket.id
                });

                console.log("message", matchingRoom, ":", sender, data);

                connections[matchingRoom].forEach((memberSocketId) => {
                    io.to(memberSocketId).emit("chat-message", data, sender, socket.id);
                });
            }
        });

        socket.on("disconnect", () => {
            console.log("DISCONNECTED:", socket.id);

            const joinedTime = timeOnline[socket.id];
            if (joinedTime) {
                const diffTime = Math.abs(new Date() - joinedTime);
                console.log(`Socket ${socket.id} was online for ${diffTime} ms`);
                delete timeOnline[socket.id];
            }

            for (const [roomKey, roomUsers] of Object.entries(connections)) {
                if (roomUsers.includes(socket.id)) {
                    connections[roomKey] = roomUsers.filter((id) => id !== socket.id);

                    connections[roomKey].forEach((memberSocketId) => {
                        io.to(memberSocketId).emit("user-left", socket.id);
                    });

                    if (connections[roomKey].length === 0) {
                        delete connections[roomKey];
                        delete messages[roomKey];
                    }

                    break;
                }
            }
        });
    });
};