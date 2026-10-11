// backend/server.js

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { verify } = require("./utils/jwt");

// ==============================
// ENVIRONMENT
// ==============================

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// ==============================
// ALLOWED FRONTEND ORIGINS
// ==============================

const allowedOrigins = [
  "http://localhost:5000",
  "http://127.0.0.1:5000",

  // VS Code Live Server
  "http://localhost:5500",
  "http://127.0.0.1:5500",

  // Sometimes Live Server changes ports
  "http://localhost:5501",
  "http://127.0.0.1:5501",
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

// ==============================
// CORS
// ==============================

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an origin, such as Postman,
      // server-to-server requests, or same-origin access.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);

      return callback(
        new Error(`CORS blocked request from ${origin}`)
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ==============================
// MIDDLEWARE
// ==============================

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// ==============================
// DATABASE
// ==============================

connectDB();

// ==============================
// FRONTEND STATIC FILES
// ==============================

const FRONTEND_DIR = path.join(
  __dirname,
  "..",
  "frontend"
);

app.use(express.static(FRONTEND_DIR));

app.use(
  "/images",
  express.static(
    path.join(FRONTEND_DIR, "images")
  )
);

// ==============================
// API ROUTES
// ==============================

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

app.use(
  "/api/quote",
  require("./routes/quoteRoutes")
);

app.use(
  "/api/heart",
  require("./routes/heartRoutes")
);

app.use(
  "/api/leaderboard",
  require("./routes/leaderboardRoutes")
);

// ==============================
// HEALTH CHECK
// ==============================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "HeartPair API is running",
  });
});

// ==============================
// API 404
// ==============================

// Important:
// Unknown /api requests should return JSON,
// NOT index.html.

app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
  });
});

// ==============================
// SPA FALLBACK
// ==============================

app.get("*", (req, res) => {
  res.sendFile(
    path.join(
      FRONTEND_DIR,
      "index.html"
    )
  );
});

// ==============================
// SOCKET.IO
// ==============================

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,

    methods: [
      "GET",
      "POST",
    ],
  },
});

// ==============================
// SOCKET AUTHENTICATION
// ==============================

io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token;

    if (!token) {
      return next(
        new Error("Unauthorized")
      );
    }

    const payload = verify(token);

    socket.userId = payload.id;

    next();
  } catch (error) {
    console.error(
      "Socket authentication error:",
      error.message
    );

    next(
      new Error("Invalid token")
    );
  }
});

// ==============================
// SOCKET EVENTS
// ==============================

io.on("connection", (socket) => {
  console.log(
    "Player connected:",
    socket.userId
  );

  socket.on(
    "scoreUpdate",
    async (data) => {
      try {
        const lbCtrl =
          require("./controllers/leaderboardController");

        const req = {
          body: {
            ...data,
            playerName: socket.userId,
          },
        };

        const res = {
          status(code) {
            this.statusCode = code;
            return this;
          },

          json(obj) {
            io.emit(
              "leaderboardUpdate",
              obj
            );

            return obj;
          },
        };

        await lbCtrl.saveScore(
          req,
          res
        );
      } catch (error) {
        console.error(
          "Score update error:",
          error
        );

        socket.emit(
          "scoreError",
          {
            error:
              "Unable to save score",
          }
        );
      }
    }
  );

  socket.on("disconnect", () => {
    console.log(
      "Player disconnected:",
      socket.userId
    );
  });
});

// ==============================
// GLOBAL ERROR HANDLER
// ==============================

app.use(
  (err, req, res, next) => {
    console.error(
      "Server error:",
      err
    );

    if (res.headersSent) {
      return next(err);
    }

    res.status(
      err.status || 500
    ).json({
      error:
        err.message ||
        "Internal server error",
    });
  }
);

// ==============================
// START SERVER
// ==============================

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );

  console.log(
    `HeartPair: http://localhost:${PORT}`
  );
});