
const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const pool = require("./config/db");
const {
  startLockCleanup
} = require("./services/lockCleanupService");

const PORT = process.env.PORT || 5000;

/*
  Create HTTP server using Express app
*/
const httpServer = http.createServer(app);

/*
  Create Socket.io server
*/
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

/*
  Make Socket.io available inside Express controllers
*/
app.set("io", io);

/*
  Socket.io connection handling
*/
io.on("connection", (socket) => {
  console.log(
    "Socket connected:",
    socket.id
  );

  /*
    User joins a specific event room
  */
  socket.on("join_event", (eventId) => {
    if (!eventId) {
      return;
    }

    const roomName = `event:${eventId}`;

    socket.join(roomName);

    console.log(
      `Socket ${socket.id} joined ${roomName}`
    );
  });

  /*
    User leaves a specific event room
  */
  socket.on("leave_event", (eventId) => {
    if (!eventId) {
      return;
    }

    const roomName = `event:${eventId}`;

    socket.leave(roomName);

    console.log(
      `Socket ${socket.id} left ${roomName}`
    );
  });

  /*
    User disconnects
  */
  socket.on("disconnect", () => {
    console.log(
      "Socket disconnected:",
      socket.id
    );
  });
});

/*
  Start backend server
*/
const startServer = async () => {
  try {
    await pool.query("SELECT NOW()");

    console.log(
      "PostgreSQL connected successfully"
    );

    /*
      Start background expired-seat cleanup
    */
   startLockCleanup(io);

    /*
      Start HTTP + Socket.io server
    */
    httpServer.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });

  } catch (error) {
    console.error(
      "Database connection failed:",
      error.message
    );
  }
};

startServer();
