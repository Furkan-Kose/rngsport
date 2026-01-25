import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";

import orderRoutes from "./routes/order.route.js";
import paymentRoutes from "./routes/payment.route.js";
import packageRoutes from "./routes/package.route.js";
import authRoutes from "./routes/auth.route.js";
import reservationRoutes from "./routes/reservation.route.js";

const app = express();

const corsOptions = {
  origin: 'http://localhost:5173', 
  credentials: true,              
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/reservations", reservationRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || "Sunucu hatası",
  });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server: http://localhost:${port}`);
});
