const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fileUpload = require("express-fileupload");

const PORT = "8000";
const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use("/uploads", express.static("uploads"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:3000" },
});

let rooms = {};

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on("join_room", ({ room, username, password }, callback) => {
    if (!rooms[room]) {
      rooms[room] = { users: {}, password: password || null, typingUsers: {} };
    } else {
      if (rooms[room].password && rooms[room].password !== password) {
        return callback({ error: "Incorrect password" });
      }
    }
    rooms[room].users[socket.id] = username;
    socket.join(room);
    callback({ success: true });

    io.to(room).emit("room_users", Object.values(rooms[room].users));
  });

  socket.on("send_message", (data) => {
    io.to(data.room).emit("receive_message", data);
  });

  socket.on("typing", ({ room, username }) => {
    if (!rooms[room]) return;

    if (username) {
      rooms[room].typingUsers[socket.id] = username;
    } else {
      delete rooms[room].typingUsers[socket.id];
    }

    io.to(room).emit("show_typing", Object.values(rooms[room].typingUsers));
  });

  socket.on("disconnecting", () => {
    for (let room of socket.rooms) {
      if (rooms[room]) {
        delete rooms[room].users[socket.id];
        delete rooms[room].typingUsers[socket.id];
        io.to(room).emit("room_users", Object.values(rooms[room].users));
        io.to(room).emit("show_typing", Object.values(rooms[room].typingUsers));
      }
    }
  });
});

app.post("/upload", (req, res) => {
  if (!req.files) return res.status(400).send("No file uploaded.");
  const file = req.files.file;
  const uploadPath = __dirname + "/uploads/" + file.name;

  file.mv(uploadPath, (err) => {
    if (err) return res.status(500).send(err);
    res.send({ filePath: `http://localhost:8000/uploads/${file.name}` });
  });
});

server.listen(PORT, () => {
  console.log(`SERVER RUNNING on ${PORT}`);
});
