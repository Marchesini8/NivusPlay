const PRODUCTS = {
  "gamepass-ultimate": {
    title: "Codigo Gamepass Ultimate Mensal",
    description: "Codigo original para resgate da assinatura mensal individual.",
    price: 17.9,
    image: "assets/products/gamepass-ultimate.jpg",
    upgrades: [
      {
        id: "trimestral",
        badge: "Recomendado",
        title: "Codigo Trimestral",
        description: "Valido por 3 meses",
        price: 9.99,
        label: "por apenas R$ 9,99",
        image: "assets/xbox-logo.png"
      },
      {
        id: "anual",
        badge: "Custo beneficio",
        title: "Codigo Anual",
        description: "Valido por 1 ano",
        price: 19.9,
        label: "por apenas R$ 19,90",
        image: "assets/xbox-logo.png"
      }
    ]
  },
  "ps-deluxe": {
    title: "Codigo PS Deluxe Mensal",
    description: "Codigo original para resgate mensal do catalogo completo.",
    price: 17.9,
    image: "assets/products/ps-deluxe.jpg",
    upgrades: [
      {
        id: "trimestral",
        badge: "Recomendado",
        title: "Codigo Trimestral",
        description: "Valido por 3 meses",
        price: 9.99,
        label: "por apenas R$ 9,99",
        image: "assets/psn-logo.png"
      },
      {
        id: "anual",
        badge: "Custo beneficio",
        title: "Codigo Anual",
        description: "Valido por 1 ano",
        price: 19.9,
        label: "por apenas R$ 19,90",
        image: "assets/psn-logo.png"
      }
    ]
  },
  "chatgpt-pro": {
    title: "5 Contas GPT Plus",
    description: "Acesso individual pronto para revenda com ativacao rapida.",
    price: 15,
    image: "assets/products/chatgpt-pro.jpg"
  },
  "capcut-pro": {
    title: "5 Contas CapCut Pro",
    description: "Plano premium individual com recursos ilimitados.",
    price: 15,
    image: "assets/products/capcut-pro.jpg"
  },
  "netflix-pro": {
    title: "Netflix Familia",
    description: "5 contas para revenda com estabilidade e sem quedas.",
    price: 15,
    image: "assets/products/netflix-pro.jpg"
  },
  "steam-keys": {
    title: "10 Keys Steam",
    description: "Key aleatoria premium com ativacao automatica.",
    price: 9.99,
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
let selectedUpgradeId = null;

const productImage = document.getElementById("product-image");
const productTitle = document.getElementById("product-title");
const productDescription = document.getElementById("product-description");
const summaryProductPrice = document.getElementById("summary-product-price");
const summaryDiscountPrice = document.getElementById("summary-discount-price");
const summaryUpgradeRow = document.getElementById("summary-upgrade-row");
const summaryUpgradeLabel = document.getElementById("summary-upgrade-label");
const summaryUpgradePrice = document.getElementById("summary-upgrade-price");
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
const checkoutUpgradeCard = document.getElementById("checkout-upgrade-card");
const checkoutUpgradeOptions = document.getElementById("checkout-upgrade-options");

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function getSelectedUpgrade() {
  return selectedProduct.upgrades?.find((upgrade) => upgrade.id === selectedUpgradeId) || null;
}

function getDiscountedBasePrice() {
  return Math.max(selectedProduct.price - COUPON.discount, 0.01);
}

function getCheckoutTotal() {
  return getDiscountedBasePrice() + (getSelectedUpgrade()?.price || 0);
}

function fillProductSummary() {
  productImage.src = selectedProduct.image;
  productImage.alt = selectedProduct.title;
  productTitle.textContent = selectedProduct.title;
  productDescription.textContent = selectedProduct.description;
  summaryProductPrice.textContent = formatCurrency(selectedProduct.price);
  summaryDiscountPrice.textContent = `-${formatCurrency(COUPON.discount)}`;
  summaryTotalPrice.textContent = formatCurrency(getCheckoutTotal());
  updateUpgradeSummary();
}

function updateUpgradeSummary() {
  const selectedUpgrade = getSelectedUpgrade();

  if (!selectedUpgrade) {
    summaryUpgradeRow.hidden = true;
    summaryUpgradeLabel.textContent = "Opcao adicional";
    summaryUpgradePrice.textContent = formatCurrency(0);
    summaryTotalPrice.textContent = formatCurrency(getCheckoutTotal());
    return;
  }

  summaryUpgradeRow.hidden = false;
  summaryUpgradeLabel.textContent = selectedUpgrade.title;
  summaryUpgradePrice.textContent = formatCurrency(selectedUpgrade.price);
  summaryTotalPrice.textContent = formatCurrency(getCheckoutTotal());
}

function renderUpgradeOptions() {
  const upgrades = selectedProduct.upgrades || [];

  if (!upgrades.length) {
    checkoutUpgradeCard.hidden = true;
    return;
  }

  checkoutUpgradeCard.hidden = false;
  checkoutUpgradeOptions.innerHTML = upgrades
    .map((upgrade) => {
      const checked = selectedUpgradeId === upgrade.id ? "checked" : "";
      const selectedClass = selectedUpgradeId === upgrade.id ? "is-selected" : "";
      return `
        <article class="checkout-upgrade-option ${selectedClass}" data-upgrade-option="${upgrade.id}">
          <span class="checkout-upgrade-badge">${upgrade.badge}</span>
          <label>
            <input type="checkbox" name="checkout-upgrade" value="${upgrade.id}" ${checked}>
            <span class="checkout-upgrade-check" aria-hidden="true"></span>
            <span class="checkout-upgrade-platform">
              <img src="${upgrade.image}" alt="">
            </span>
            <span class="checkout-upgrade-copy">
              <strong>${upgrade.title}</strong>
              <span>${upgrade.description}</span>
            </span>
            <span class="checkout-upgrade-price">
              <strong>${upgrade.label}</strong>
              <span>Adicionar ao pedido</span>
            </span>
          </label>
        </article>
      `;
    })
    .join("");

  checkoutUpgradeOptions.querySelectorAll('input[name="checkout-upgrade"]').forEach((input) => {
    input.addEventListener("change", () => {
      selectedUpgradeId = selectedUpgradeId === input.value ? null : input.value;
      renderUpgradeOptions();
      updateUpgradeSummary();
    });
  });
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
        price: getDiscountedBasePrice(),
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

  const selectedUpgrade = getSelectedUpgrade();

  if (selectedUpgrade) {
    payload.items.push({
      title: `${selectedProduct.title} - ${selectedUpgrade.title}`,
      price: selectedUpgrade.price,
      quantity: 1,
      image: selectedUpgrade.image
    });
  }

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
renderUpgradeOptions();
showCouponModal();
