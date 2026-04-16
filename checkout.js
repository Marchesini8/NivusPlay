const PRODUCTS = {
  "gamepass-ultimate": {
    title: "Codigo Gamepass Ultimate",
    description: "Codigo original para resgate da assinatura individual.",
    price: 39.9,
    image: "assets/products/gamepass-ultimate.jpg"
  },
  "ps-deluxe": {
    title: "Codigo PS Deluxe",
    description: "Codigo original para resgate do catalogo completo.",
    price: 34.9,
    image: "assets/products/ps-deluxe.jpg"
  },
  "chatgpt-pro": {
    title: "5 Contas GPT Plus",
    description: "Acesso individual pronto para revenda com ativacao rapida.",
    price: 29.9,
    image: "assets/products/chatgpt-pro.jpg"
  },
  "capcut-pro": {
    title: "5 Contas CapCut Pro",
    description: "Plano premium individual com recursos ilimitados.",
    price: 24.9,
    image: "assets/products/capcut-pro.jpg"
  },
  "netflix-pro": {
    title: "Netflix Familia",
    description: "5 contas para revenda com estabilidade e sem quedas.",
    price: 19.9,
    image: "assets/products/netflix-pro.jpg"
  },
  "steam-keys": {
    title: "10 Keys Steam",
    description: "Key aleatoria premium com ativacao automatica.",
    price: 14.9,
    image: "assets/products/steam-keys.jpg"
  }
};

const COUPON = {
  code: "NIVUS599",
  discount: 5.99
};

const params = new URLSearchParams(window.location.search);
const selectedSlug = params.get("product") || "gamepass-ultimate";
const selectedProduct = PRODUCTS[selectedSlug] || PRODUCTS["gamepass-ultimate"];
const discountedTotal = Math.max(selectedProduct.price - COUPON.discount, 0.01);

const productImage = document.getElementById("product-image");
const productTitle = document.getElementById("product-title");
const productDescription = document.getElementById("product-description");
const summaryProductPrice = document.getElementById("summary-product-price");
const summaryDiscountPrice = document.getElementById("summary-discount-price");
const summaryTotalPrice = document.getElementById("summary-total-price");
const feedback = document.getElementById("checkout-feedback");
const checkoutForm = document.getElementById("checkout-form");
const checkoutSubmit = document.getElementById("checkout-submit");
const pixResult = document.getElementById("pix-result");
const pixImage = document.getElementById("pix-image");
const pixCode = document.getElementById("pix-code");
const copyPixButton = document.getElementById("copy-pix-button");
const couponModal = document.getElementById("coupon-modal");
const couponModalClose = document.getElementById("coupon-modal-close");
const couponModalAction = document.getElementById("coupon-modal-action");

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function fillProductSummary() {
  productImage.src = selectedProduct.image;
  productImage.alt = selectedProduct.title;
  productTitle.textContent = selectedProduct.title;
  productDescription.textContent = selectedProduct.description;
  summaryProductPrice.textContent = formatCurrency(selectedProduct.price);
  summaryDiscountPrice.textContent = `-${formatCurrency(COUPON.discount)}`;
  summaryTotalPrice.textContent = formatCurrency(discountedTotal);
}

function renderPixQr(base64Qr, rawPixCode) {
  const source = base64Qr
    ? `data:image/png;base64,${base64Qr}`
    : `https://quickchart.io/qr?size=320&text=${encodeURIComponent(rawPixCode)}`;

  pixImage.src = source;
  pixCode.value = rawPixCode;
  pixResult.hidden = false;
}

function normalizeDigits(value) {
  return value.replace(/\D/g, "");
}

function hideCouponModal() {
  couponModal.classList.remove("is-visible");
  couponModal.setAttribute("aria-hidden", "true");
}

function showCouponModal() {
  window.setTimeout(() => {
    couponModal.classList.add("is-visible");
    couponModal.setAttribute("aria-hidden", "false");
  }, 450);
}

document.getElementById("customer-phone").addEventListener("input", (event) => {
  const digits = normalizeDigits(event.target.value).slice(0, 11);
  event.target.value = digits
    .replace(/^(\d{2})(\d)/g, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
});

document.querySelectorAll("[data-close-coupon]").forEach((element) => {
  element.addEventListener("click", hideCouponModal);
});

couponModalClose.addEventListener("click", hideCouponModal);
couponModalAction.addEventListener("click", hideCouponModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideCouponModal();
  }
});

copyPixButton.addEventListener("click", async () => {
  if (!pixCode.value) return;
  await navigator.clipboard.writeText(pixCode.value);
  copyPixButton.textContent = "Copiado";
  setTimeout(() => {
    copyPixButton.textContent = "Copiar";
  }, 1800);
});

checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  feedback.textContent = "";
  checkoutSubmit.disabled = true;
  checkoutSubmit.textContent = "Gerando PIX...";

  const payload = {
    items: [
      {
        title: selectedProduct.title,
        price: discountedTotal,
        originalPrice: selectedProduct.price,
        quantity: 1,
        image: selectedProduct.image
      }
    ],
    coupon: {
      code: COUPON.code,
      discount: COUPON.discount
    },
    customer: {
      name: document.getElementById("customer-name").value.trim(),
      email: document.getElementById("customer-email").value.trim(),
      phone: document.getElementById("customer-phone").value.trim()
    }
  };

  try {
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Nao foi possivel gerar o PIX.");
    }

    const rawPixCode = data.pix_code || data.pix_qr_code;

    if (!rawPixCode) {
      throw new Error("A Iron Pay nao retornou um codigo PIX valido.");
    }

    renderPixQr(data.pix_base64, rawPixCode);
    feedback.textContent = "PIX gerado com sucesso. Copie o codigo ou escaneie o QR Code.";
  } catch (error) {
    feedback.textContent = error.message;
  } finally {
    checkoutSubmit.disabled = false;
    checkoutSubmit.textContent = "Gerar PIX agora";
  }
});

fillProductSummary();
showCouponModal();
