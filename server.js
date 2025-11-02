const http = require("http");
const socketIo = require("socket.io");

const { app, allowedOrigins } = require("./app");
const { initializeDatabase } = require("./db/arango");

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE"],
    credentials: false,
  },
});

app.set("io", io);

const PORT = parseInt(process.env.PORT, 10) || 5004;
const HOST = process.env.HOST || process.env.VPS_ADDRESS || "0.0.0.0";

initializeDatabase()
  .then(() => {
    server.listen(PORT, HOST, () => {
      console.log(`🚀 Comment API running on http://${HOST}:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  });
