
const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const pool = require("./config/db");
const { verifyEmailConnection } = require("./services/emailService");
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
  console.log("Socket connected:", socket.id);

  socket.on("join_event", (eventId) => {
    if (!eventId) return;

    const roomName = `event:${eventId}`;
    socket.join(roomName);

    console.log(`Socket ${socket.id} joined ${roomName}`);
  });

  socket.on("leave_event", (eventId) => {
    if (!eventId) return;

    const roomName = `event:${eventId}`;
    socket.leave(roomName);

    console.log(`Socket ${socket.id} left ${roomName}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

/*
  Start backend server
*/
const startServer = async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected successfully");

    startLockCleanup(io);

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      // Verify Gmail SMTP connection after server starts
      verifyEmailConnection();
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
};

startServer();
