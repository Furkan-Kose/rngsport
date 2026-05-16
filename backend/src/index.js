import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";

import orderRoutes from "./routes/order.route.js";
import paymentRoutes from "./routes/payment.route.js";
import packageRoutes from "./routes/package.route.js";
import authRoutes from "./routes/auth.route.js";
import reservationRoutes from "./routes/reservation.route.js";
import shootingListRoutes from "./routes/shootingList.route.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: ["https://ritmikacup.netlify.app", "https://ritmikacup.com", "http://localhost:5173"],
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
};

// iyzico callback için CORS bypass
app.use((req, res, next) => {
  if (req.path === "/api/payment/callback") {
    return next(); // CORS uygulamadan devam et
  }
  cors(corsOptions)(req, res, next);
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/shooting-list", shootingListRoutes);

app.use(errorHandler);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server: http://localhost:${port}`);
});
