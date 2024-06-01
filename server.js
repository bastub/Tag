const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

let players = {};

io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  players[socket.id] = {
    id: socket.id,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    direction: "none",
    name: "Player " + socket.id,
    isLoup: false,
  };

  if (Object.keys(players).length > 1) {
    loupExists = false;
    for (const playerId in players) {
      if (players[playerId].isLoup) {
        loupExists = true;
        break;
      }
    }
    if (!loupExists) {
      players[socket.id].isLoup = true;
    }
    console.log("Il y a un loup !");
  }

  socket.emit("currentPlayers", players);
  socket.broadcast.emit("newPlayer", players[socket.id]);

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
    delete players[socket.id];
    io.emit("playerDisconnected", socket.id);
  });

  socket.on("playerMovement", (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].direction = movementData.direction;
      socket.broadcast.emit("playerMoved", players[socket.id]);
    }
  });

  socket.on("tag", (taggedPlayerId) => {
    if (players[taggedPlayerId]) {
      players[socket.id].isLoup = false;
      players[taggedPlayerId].isLoup = true;
      io.emit("playerTagged", {
        tagger: socket.id,
        tagged: taggedPlayerId,
        lastTaggedTime: Date.now(),
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
