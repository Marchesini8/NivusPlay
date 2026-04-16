require("dotenv").config();

const express = require("express");
const path = require("path");

const paymentRoutes = require("./routes/payments");
const webhookRoutes = require("./routes/webhooks");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
const ROOT_DIR = __dirname;

app.use(express.json());
app.use(express.static(ROOT_DIR, { index: false }));

app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    port: PORT,
    uptime: Math.round(process.uptime())
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

app.get("/checkout", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "checkout.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`Servidor online em http://localhost:${PORT}`);
});
