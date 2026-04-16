const axios = require("axios");
const paymentStatusStore = require("./paymentStatusStore");

const FIXED_SHIPPING_AMOUNT = 0;
const DEFAULT_ITEM_TITLE = "Produto digital";
const DEFAULT_COUPON_CODE = "NIVUS599";
const DEFAULT_COUPON_DISCOUNT = 4.99;

function normalizeItemPrice(item) {
  const directPrice = Number(item?.price || 0);
  if (directPrice > 0) return directPrice;

  const unitPrice = Number(item?.unitPrice || 0);
  if (unitPrice > 0) return unitPrice;

  return Number(item?.oldPrice || 0);
}

async function createPixPayment({ items, customer, delivery = {}, coupon = {} }) {
  const normalizedItems = Array.isArray(items) ? items : [];
  const originalProductTotal = normalizedItems.reduce((sum, item) => {
    return sum + Number(item?.originalPrice || normalizeItemPrice(item)) * Number(item?.qty || item?.quantity || 1);
  }, 0);
  const productTotal = normalizedItems.reduce((sum, item) => {
    return sum + normalizeItemPrice(item) * Number(item?.qty || item?.quantity || 1);
  }, 0);
  const couponDiscount = Math.max(originalProductTotal - productTotal, 0);
  const couponCode = coupon?.code || (couponDiscount > 0 ? DEFAULT_COUPON_CODE : null);
  const declaredCouponDiscount = Number(coupon?.discount || 0);

  const totalAmount = productTotal + FIXED_SHIPPING_AMOUNT;
  const totalInCents = Math.round(totalAmount * 100);
  const pixEndpoint = process.env.PAYMENT_PIX_ENDPOINT || "/transactions";
  const offerHash = process.env.IRONPAY_OFFER_HASH;
  const productHash = process.env.IRONPAY_PRODUCT_HASH;
  const postbackUrl = process.env.IRONPAY_POSTBACK_URL;
  const expireInDays = Number(process.env.IRONPAY_EXPIRE_IN_DAYS || 1);

  const cart = normalizedItems.map((item) => ({
    product_hash: productHash,
    title: item.title || DEFAULT_ITEM_TITLE,
    cover: item.image || null,
    price: Math.round(normalizeItemPrice(item) * 100),
    quantity: Number(item?.qty || item?.quantity || 1),
    operation_type: 1,
    tangible: false
  }));

  if (!cart.length || totalInCents <= 0) {
    const error = new Error("Carrinho invalido para gerar o pagamento.");
    error.statusCode = 400;
    throw error;
  }

  if (!process.env.PAYMENT_API_URL || !process.env.PAYMENT_API_KEY) {
    const error = new Error("PAYMENT_API_URL ou PAYMENT_API_KEY nao configurado.");
    error.statusCode = 500;
    throw error;
  }

  if (!offerHash || !productHash) {
    const error = new Error("IRONPAY_OFFER_HASH ou IRONPAY_PRODUCT_HASH nao configurado.");
    error.statusCode = 500;
    throw error;
  }

  try {
    const response = await axios.post(
      `${process.env.PAYMENT_API_URL}${pixEndpoint}`,
      {
        offer_hash: offerHash,
        amount: totalInCents,
        payment_method: "pix",
        expire_in_days: expireInDays,
        transaction_origin: "api",
        postback_url: postbackUrl,
        cart,
        customer: {
          name: customer.name,
          email: customer.email,
          phone_number: customer.phone_number || customer.phone || process.env.DEFAULT_PHONE_NUMBER || "",
          document: customer.document || customer.cpf || process.env.DEFAULT_DOCUMENT || "00000000000",
          street_name: customer.street_name || delivery.address || process.env.DEFAULT_STREET_NAME || "Produto Digital",
          number: customer.number || delivery.number || process.env.DEFAULT_ADDRESS_NUMBER || "0",
          complement: customer.complement || delivery.complement || process.env.DEFAULT_COMPLEMENT || "",
          neighborhood: customer.neighborhood || delivery.neighborhood || process.env.DEFAULT_NEIGHBORHOOD || "Centro",
          city: customer.city || delivery.city || process.env.DEFAULT_CITY || "Rio de Janeiro",
          state: customer.state || delivery.state || process.env.DEFAULT_STATE || "RJ",
          zip_code: customer.zip_code || delivery.zip_code || delivery.cep || process.env.DEFAULT_ZIP_CODE || "20000000"
        },
        tracking: {
          src: "",
          utm_source: "",
          utm_medium: "",
          utm_campaign: "",
          utm_term: "",
          utm_content: ""
        },
        metadata: {
          coupon_code: couponCode,
          coupon_discount: Math.round((couponDiscount || declaredCouponDiscount) * 100)
        }
      },
      {
        params: {
          api_token: process.env.PAYMENT_API_KEY
        },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        proxy: false
      }
    );

    const pixCode =
      response.data.pix_code ||
      response.data.pixCode ||
      response.data.pix?.pix_qr_code ||
      response.data.pix_qr_code ||
      null;

    const transactionHash =
      response.data.transaction_hash ||
      response.data.transactionHash ||
      response.data.pix?.transaction_hash ||
      response.data.pix?.transactionHash ||
      null;

    if (!pixCode) {
      const invalidResponseError = new Error("Iron Pay respondeu sem codigo PIX valido.");
      invalidResponseError.statusCode = 502;
      throw invalidResponseError;
    }

    if (transactionHash) {
      paymentStatusStore.savePayment(transactionHash, {
        status: response.data.status || "pending",
        amount: response.data.amount || totalInCents,
        paymentMethod: "pix",
        isPaid: response.data.status === "paid",
        pixCode
      });
    }

    return {
      transaction_hash: transactionHash,
      status: response.data.status || "pending",
      pix_code: pixCode,
      pix_base64:
        response.data.qr_code ||
        response.data.pix_base64 ||
        response.data.qrCode ||
        response.data.pix?.qr_code_base64 ||
        null,
      charged_total: totalAmount,
      product_total: productTotal,
      original_product_total: originalProductTotal,
      discount_total: couponDiscount,
      shipping_total: FIXED_SHIPPING_AMOUNT,
      source: "ironpay"
    };
  } catch (error) {
    const providerError = error.response?.data || error.message;
    const paymentError = new Error(
      `Falha ao gerar PIX na Iron Pay: ${typeof providerError === "string" ? providerError : JSON.stringify(providerError)}`
    );
    paymentError.statusCode = error.response?.status || 502;
    throw paymentError;
  }
}

function getPaymentStatus(transactionHash) {
  return paymentStatusStore.getPayment(transactionHash);
}

module.exports = {
  createPixPayment,
  getPaymentStatus,
  FIXED_SHIPPING_AMOUNT,
  DEFAULT_COUPON_CODE,
  DEFAULT_COUPON_DISCOUNT
};
