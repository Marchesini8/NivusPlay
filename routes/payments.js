const express = require("express");
const paymentService = require("../services/paymentService");

const router = express.Router();

router.post("/checkout", async (req, res) => {
  try {
    const { items, customer, delivery } = req.body;

    if (!Array.isArray(items) || !items.length || !customer) {
      return res.status(400).json({ error: "Dados invalidos para o checkout." });
    }

    const payment = await paymentService.createPixPayment({
      items,
      customer,
      delivery
    });

    return res.json(payment);
  } catch (error) {
    console.error("Erro ao criar pagamento:", error.message);
    return res.status(error.statusCode || 500).json({
      error: error.message || "Erro ao criar pagamento."
    });
  }
});

router.get("/status/:transactionHash", (req, res) => {
  try {
    const payment = paymentService.getPaymentStatus(req.params.transactionHash);

    if (!payment) {
      return res.json({
        transactionHash: req.params.transactionHash,
        status: "pending",
        isPaid: false
      });
    }

    return res.json(payment);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Erro ao consultar pagamento."
    });
  }
});

module.exports = router;
