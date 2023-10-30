// const app = require("express")();
// const server = require("http").createServer(app);
// const cors = require("cors");

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { config } from "dotenv";
config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

//database
const user_to_room = [];
const socketid_to_name = new Map();

const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Running");
});

//functions

function roomFinder(room) {
  const output = user_to_room.filter((data) => {
    return data.room == room;
  });

  return output;
}

function DeleteUser(id) {
  const index = user_to_room.findIndex((data) => {
    return data.peerId == id;
  });

  const delUser = user_to_room.splice(index, 1);

  return delUser;
}

//sockets

io.on("connection", (socket) => {
  socket.on("join-room", ({ name, room, peerId }) => {
    // console.log(name, room);
    socket.join(room);
    user_to_room.push({ name, room, peerId });
    socketid_to_name.set(socket.id, peerId);

    const members = roomFinder(room);
    // console.log(members);

    socket.emit("room-joined", { name, room });
    // console.log(`details send`);
    socket.emit("details", { name, room, peerId });
    io.to(room).emit("members", members);

    socket.on("disconnect", (reason) => {
      const peerID = socketid_to_name.get(socket.id);

      const user = DeleteUser(peerID);
      // console.log(`room`, user[0].room);

      io.to(user[0].room).emit("left", `${user[0].name} left the room`);

      const members = roomFinder(user[0].room);
      io.to(user[0].room).emit("members", members);
      // console.log(`${user[0].name} left`);
    });
  });
});

httpServer.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
