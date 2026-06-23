(() => {
  const STORAGE_KEYS = {
    menu: "gharMenu",
    gallery: "gharGallery",
    orders: "gharOrders",
    cart: "gharCart",
    adminToken: "gharAdminToken",
    adminUser: "gharAdminUser",
  };

  const STATUS_OPTIONS = [
    "Pending",
    "Preparing",
    "Ready to Go",
    "On the Way",
    "Delivered",
    "Cancelled",
  ];
  const ORDER_STATUS_FLOW = [
    "Pending",
    "Preparing",
    "Ready to Go",
    "On the Way",
    "Delivered",
  ];

  function getStatusOptionsForOrder(currentStatus) {
    const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
    return currentIndex === -1
      ? ORDER_STATUS_FLOW
      : ORDER_STATUS_FLOW.filter((_, idx) => idx >= currentIndex);
  }

  // Backend URL Configuration
  // For development: uses localhost:3000
  // For production: Update this to your deployed backend URL (e.g., https://your-backend.render.com)
  const BACKEND_URL =
    window.location.protocol === "file:"
      ? "http://localhost:3000"
      : window.__CONFIG?.backendUrl || window.location.origin; // Update this line with your deployed backend URL

  const API_BASE = BACKEND_URL;

  function resolveImageUrl(imagePath) {
    if (!imagePath) return "";
    // If it's an absolute URL already, return as-is
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    // If it starts with a slash, strip it to avoid double slashes
    const cleanPath = imagePath.replace(/^\//, "");
    return `${API_BASE}/${cleanPath}`;
  }

  let adminToken = null;
  let adminUser = null;
  let adminLoggedIn = false;
  let adminLoginPending = null;
  let adminVerifyResendIntervalId = null;

  const defaultMenuItems = [
    {
      id: "full-meal-1",
      category: "full-meal",
      name: "Aloo Tikki",
      description: "Crispy spiced potato cakes served with chutney.",
      price: "PKR 295",
      image: "assets/img/menu/menu-item-1.png",
    },
    {
      id: "full-meal-2",
      category: "full-meal",
      name: "Vegetable Pakora",
      description: "Golden fritters made from fresh vegetables and spices.",
      price: "PKR 345",
      image: "assets/img/menu/menu-item-2.png",
    },
    {
      id: "full-meal-3",
      category: "full-meal",
      name: "Dahi Bhalla",
      description:
        "Soft lentil dumplings served with creamy yogurt and chutney.",
      price: "PKR 375",
      image: "assets/img/menu/menu-item-5.png",
    },
    {
      id: "individual-items-1",
      category: "individual-items",
      name: "Paratha Roll",
      description: "Warm stuffed paratha roll with fresh chutney.",
      price: "PKR 395",
      image: "assets/img/menu/menu-item-1.png",
    },
    {
      id: "individual-items-2",
      category: "individual-items",
      name: "Egg Bhurji",
      description: "Fluffy spiced scrambled eggs with soft bread.",
      price: "PKR 450",
      image: "assets/img/menu/menu-item-2.png",
    },
    {
      id: "full-meal-4",
      category: "full-meal",
      name: "Chicken Curry",
      description: "Home-style chicken curry served with rice or roti.",
      price: "PKR 895",
      image: "assets/img/menu/menu-item-1.png",
    },
    {
      id: "full-meal-5",
      category: "full-meal",
      name: "Dal Makhni",
      description: "Creamy lentils cooked with butter and spices.",
      price: "PKR 825",
      image: "assets/img/menu/menu-item-2.png",
    },
    {
      id: "add-ons-1",
      category: "add-ons",
      name: "Chapli Kebab",
      description: "Spiced beef kebab served with chutney and salad.",
      price: "PKR 895",
      image: "assets/img/menu/menu-item-1.png",
    },
    {
      id: "add-ons-2",
      category: "add-ons",
      name: "Paneer Tikka",
      description: "Marinated paneer grilled to perfection.",
      price: "PKR 745",
      image: "assets/img/menu/menu-item-2.png",
    },
  ];

  const defaultGalleryItems = [
    {
      id: "gallery-1",
      image: "assets/img/gallery/gallery-1.jpg",
      alt: "Home cooked meal",
    },
    {
      id: "gallery-2",
      image: "assets/img/gallery/gallery-2.jpg",
      alt: "Healthy lunchbox",
    },
    {
      id: "gallery-3",
      image: "assets/img/gallery/gallery-3.jpg",
      alt: "Fresh dish",
    },
    {
      id: "gallery-4",
      image: "assets/img/gallery/gallery-4.jpg",
      alt: "Delicious plate",
    },
    {
      id: "gallery-5",
      image: "assets/img/gallery/gallery-5.jpg",
      alt: "Tasty meal",
    },
    {
      id: "gallery-6",
      image: "assets/img/gallery/gallery-6.jpg",
      alt: "Crisp side dish",
    },
  ];

  let menuItems = [];
  let galleryItems = [];
  let orders = [];
  let cart = [];
  let editingMenuId = null;
  let editingGalleryId = null;

  const dom = {
    adminToggle: document.getElementById("admin-toggle"),
    adminPanel: document.getElementById("admin-panel"),
    adminClose: document.getElementById("admin-close"),
    menuAdminList: document.getElementById("menu-admin-list"),
    addMenuButton: document.getElementById("add-menu-item-btn"),
    menuForm: document.getElementById("menu-item-form"),
    menuName: document.getElementById("menu-name"),
    menuCategory: document.getElementById("menu-category"),
    menuPrice: document.getElementById("menu-price"),
    menuImage: document.getElementById("menu-image"),
    menuImageFile: document.getElementById("menu-image-file"),
    menuImagePreview: document.getElementById("menu-image-preview"),
    menuDescription: document.getElementById("menu-description"),
    menuDescriptionHelp: document.getElementById("menu-description-help"),
    menuCancelBtn: document.getElementById("menu-cancel-btn"),
    galleryAdminList: document.getElementById("gallery-admin-list"),
    addGalleryButton: document.getElementById("add-gallery-image-btn"),
    galleryForm: document.getElementById("gallery-item-form"),
    galleryImageUrl: document.getElementById("gallery-image-url"),
    galleryImageFile: document.getElementById("gallery-image-file"),
    galleryImagePreview: document.getElementById("gallery-image-preview"),
    galleryAltText: document.getElementById("gallery-alt-text"),
    galleryCancelBtn: document.getElementById("gallery-cancel-btn"),
    orderForm: document.getElementById("order-form"),
    orderName: document.getElementById("order-name"),
    orderEmail: document.getElementById("order-email"),
    orderPhone: document.getElementById("order-phone"),
    orderAddress: document.getElementById("order-address"),
    orderNotes: document.getElementById("order-notes"),
    orderMessage: document.getElementById("order-message"),
    trackForm: document.getElementById("track-form"),
    trackEmail: document.getElementById("track-email"),
    trackOrderId: document.getElementById("track-order-id"),
    trackResults: document.getElementById("track-results"),
    cartItems: document.getElementById("cart-items"),
    cartTotal: document.getElementById("cart-total"),
    cartEmpty: document.getElementById("cart-empty"),
    cartBadge: document.getElementById("cart-badge"),
    cartTotal: document.getElementById("cart-total"),
    cartEmpty: document.getElementById("cart-empty"),
    adminOrdersList: document.getElementById("admin-orders-list"),
    loginModal: document.getElementById("admin-login-modal"),
    adminLoginForm: document.getElementById("admin-login-form"),
    adminEmail: document.getElementById("admin-email"),
    adminPassword: document.getElementById("admin-password"),
    adminLoginMessage: document.getElementById("admin-login-message"),
    adminLoginStepCredentials: document.getElementById(
      "admin-login-step-credentials",
    ),
    adminLoginStepVerify: document.getElementById("admin-login-step-verify"),
    adminLoginModalTitle: document.getElementById("admin-login-modal-title"),
    adminLoginSubmit: document.getElementById("admin-login-submit"),
    adminVerifyOtp: document.getElementById("admin-verify-otp"),
    adminVerifyEmailMasked: document.getElementById(
      "admin-verify-email-masked",
    ),
    adminVerifyMessage: document.getElementById("admin-verify-message"),
    adminVerifySubmit: document.getElementById("admin-verify-submit"),
    adminVerifyResendTimer: document.getElementById(
      "admin-verify-resend-timer",
    ),
    adminVerifyResend: document.getElementById("admin-verify-resend"),
    adminVerifyBack: document.getElementById("admin-verify-back"),
    adminLogout: document.getElementById("admin-logout"),
  };

  function readStorage(key, fallback) {
    const value = localStorage.getItem(key);
    if (!value) return fallback;
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function saveStorage(key, value) {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  }

  function saveAdminSession(token, user) {
    adminToken = token;
    adminUser = user;
    adminLoggedIn = true;
    saveStorage(STORAGE_KEYS.adminToken, token);
    saveStorage(STORAGE_KEYS.adminUser, user);
  }

  function clearAdminSession() {
    adminToken = null;
    adminUser = null;
    adminLoggedIn = false;
    saveStorage(STORAGE_KEYS.adminToken, null);
    saveStorage(STORAGE_KEYS.adminUser, null);
  }

  function getAuthHeaders() {
    return adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
  }

  function formatPrice(value) {
    const price = parsePrice(value);
    return `PKR ${price.toFixed(0)}`; // No decimals for whole numbers, otherwise show as-is
  }

  function parsePrice(priceStr) {
    const numStr = String(priceStr).replace(/[^\d.]/g, "");
    return parseFloat(numStr) || 0;
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function fetchFromApi(endpoint, options = {}) {
    const config = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },
      ...options,
    };

    if (options.body && typeof options.body !== "string") {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || response.statusText);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async function fetchMenuFromServer() {
    try {
      const menu = await fetchFromApi("/api/menu");
      menuItems = menu;
      saveStorage(STORAGE_KEYS.menu, menuItems);
    } catch (error) {
      menuItems = readStorage(STORAGE_KEYS.menu, defaultMenuItems);
    }
  }

  async function fetchGalleryFromServer() {
    try {
      const gallery = await fetchFromApi("/api/gallery");
      galleryItems = gallery;
      saveStorage(STORAGE_KEYS.gallery, galleryItems);
    } catch (error) {
      galleryItems = readStorage(STORAGE_KEYS.gallery, defaultGalleryItems);
    }
  }

  async function fetchOrdersFromServer() {
    if (!adminLoggedIn) {
      orders = [];
      return;
    }

    try {
      const data = await fetchFromApi("/api/orders", {
        headers: getAuthHeaders(),
      });
      orders = data.filter((order) => order.status !== "Cancelled");
    } catch (error) {
      clearAdminSession();
      orders = [];
      hideAdminPanel();
    }
  }

  async function validateAdminSession() {
    if (!adminLoggedIn) return;
    await fetchOrdersFromServer();
  }

  function showLoginModal() {
    if (!dom.loginModal || typeof bootstrap === "undefined") return;
    const modal = bootstrap.Modal.getOrCreateInstance(dom.loginModal);
    modal.show();
  }

  function hideLoginModal() {
    if (!dom.loginModal || typeof bootstrap === "undefined") return;
    const modal = bootstrap.Modal.getOrCreateInstance(dom.loginModal);
    modal.hide();
  }

  function maskEmailForDisplay(email) {
    const trim = email.trim();
    const at = trim.indexOf("@");
    if (at < 1) return trim;
    const user = trim.slice(0, at);
    const domain = trim.slice(at + 1);
    if (user.length <= 2) return `${user[0]}***@${domain}`;
    const stars = "*".repeat(Math.min(5, Math.max(1, user.length - 2)));
    return `${user[0]}${stars}${user.slice(-1)}@${domain}`;
  }

  function formatResendCountdown(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function clearAdminVerifyResendTimer() {
    if (adminVerifyResendIntervalId) {
      clearInterval(adminVerifyResendIntervalId);
      adminVerifyResendIntervalId = null;
    }
  }

  function getAdminOtpCode() {
    if (!dom.adminVerifyOtp) return "";
    const inputs = dom.adminVerifyOtp.querySelectorAll(".admin-verify-digit");
    return Array.from(inputs)
      .map((el) => el.value.replace(/\D/g, "").slice(-1))
      .join("");
  }

  function clearAdminOtpInputs() {
    if (!dom.adminVerifyOtp) return;
    dom.adminVerifyOtp.querySelectorAll(".admin-verify-digit").forEach((el) => {
      el.value = "";
    });
  }

  function showAdminLoginCredentialsStep() {
    if (dom.adminLoginStepCredentials) {
      dom.adminLoginStepCredentials.classList.remove("d-none");
    }
    if (dom.adminLoginStepVerify) {
      dom.adminLoginStepVerify.classList.add("d-none");
    }
    if (dom.adminLoginModalTitle) {
      dom.adminLoginModalTitle.textContent = "Admin Login";
    }
    clearAdminVerifyResendTimer();
    adminLoginPending = null;
    if (dom.adminVerifyResend) {
      dom.adminVerifyResend.classList.add("d-none");
    }
    if (dom.adminVerifyResendTimer) {
      dom.adminVerifyResendTimer.textContent = "";
      dom.adminVerifyResendTimer.classList.remove("d-none");
    }
  }

  function showAdminLoginVerifyStep(email) {
    if (dom.adminLoginStepCredentials) {
      dom.adminLoginStepCredentials.classList.add("d-none");
    }
    if (dom.adminLoginStepVerify) {
      dom.adminLoginStepVerify.classList.remove("d-none");
    }
    if (dom.adminLoginModalTitle) {
      dom.adminLoginModalTitle.textContent = "Verify code";
    }
    if (dom.adminVerifyEmailMasked) {
      dom.adminVerifyEmailMasked.textContent = maskEmailForDisplay(email);
    }
    if (dom.adminVerifyMessage) {
      dom.adminVerifyMessage.textContent = "";
    }
    clearAdminOtpInputs();
    const firstDigit = dom.adminVerifyOtp?.querySelector(".admin-verify-digit");
    if (firstDigit) {
      setTimeout(() => firstDigit.focus(), 200);
    }
    startAdminVerifyResendCooldown(60);
  }

  function startAdminVerifyResendCooldown(seconds) {
    clearAdminVerifyResendTimer();
    if (!dom.adminVerifyResendTimer || !dom.adminVerifyResend) return;
    dom.adminVerifyResend.classList.add("d-none");
    dom.adminVerifyResendTimer.classList.remove("d-none");
    let left = seconds;
    const tick = () => {
      if (left <= 0) {
        clearAdminVerifyResendTimer();
        if (dom.adminVerifyResendTimer) {
          dom.adminVerifyResendTimer.classList.add("d-none");
        }
        if (dom.adminVerifyResend) {
          dom.adminVerifyResend.classList.remove("d-none");
        }
        return;
      }
      if (dom.adminVerifyResendTimer) {
        dom.adminVerifyResendTimer.textContent = `Resend code in ${formatResendCountdown(left)}`;
      }
      left -= 1;
    };
    tick();
    adminVerifyResendIntervalId = setInterval(tick, 1000);
  }

  function resetAdminLoginModal() {
    showAdminLoginCredentialsStep();
    clearAdminOtpInputs();
    if (dom.adminLoginMessage) {
      dom.adminLoginMessage.textContent = "";
    }
    if (dom.adminVerifyMessage) {
      dom.adminVerifyMessage.textContent = "";
    }
    if (dom.adminLoginSubmit) {
      dom.adminLoginSubmit.disabled = false;
      dom.adminLoginSubmit.textContent = "Sign In";
    }
    if (dom.adminVerifySubmit) {
      dom.adminVerifySubmit.disabled = false;
    }
  }

  function initAdminVerifyOtp() {
    if (!dom.adminVerifyOtp) return;
    const inputs = dom.adminVerifyOtp.querySelectorAll(".admin-verify-digit");
    dom.adminVerifyOtp.addEventListener("paste", (e) => {
      e.preventDefault();
      const digits = (e.clipboardData?.getData("text") || "")
        .replace(/\D/g, "")
        .slice(0, 6);
      inputs.forEach((input, i) => {
        input.value = digits[i] || "";
      });
      const focusIdx = Math.min(Math.max(0, digits.length - 1), 5);
      inputs[focusIdx]?.focus();
    });
    inputs.forEach((input, idx) => {
      input.addEventListener("input", () => {
        const v = input.value.replace(/\D/g, "");
        input.value = v.slice(-1) || "";
        if (input.value && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && idx > 0) {
          inputs[idx - 1].focus();
        }
        if (e.key === "ArrowLeft" && idx > 0) {
          inputs[idx - 1].focus();
        }
        if (e.key === "ArrowRight" && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }
        if (e.key === "Enter") {
          e.preventDefault();
          verifyAdminCode();
        }
      });
    });
  }

  async function verifyAdminCode() {
    if (!adminLoginPending || !dom.adminVerifySubmit) return;
    const code = getAdminOtpCode();
    if (code.length !== 6) {
      if (dom.adminVerifyMessage) {
        dom.adminVerifyMessage.textContent =
          "Please enter all 6 digits of the verification code.";
      }
      return;
    }
    if (dom.adminVerifyMessage) {
      dom.adminVerifyMessage.textContent = "";
    }
    dom.adminVerifySubmit.disabled = true;
    const verifyLabel = dom.adminVerifySubmit.textContent;
    dom.adminVerifySubmit.textContent = "Verifying…";
    try {
      const result = await fetchFromApi("/api/login/verify", {
        method: "POST",
        body: { email: adminLoginPending.email, code },
      });
      saveAdminSession(result.token, result.user);
      clearAdminVerifyResendTimer();
      adminLoginPending = null;
      if (dom.adminLoginMessage) {
        dom.adminLoginMessage.textContent = "";
      }
      hideLoginModal();
      await fetchOrdersFromServer();
      renderAdminOrders();
      showAdminPanel();
      showOrderMessage("Admin signed in successfully.");
    } catch (error) {
      if (dom.adminVerifyMessage) {
        dom.adminVerifyMessage.textContent =
          "Invalid or expired code. Check the email and try again, or resend a new code.";
      }
    } finally {
      dom.adminVerifySubmit.disabled = false;
      dom.adminVerifySubmit.textContent = verifyLabel;
    }
  }

  async function resendAdminVerificationCode() {
    if (!adminLoginPending) return;
    const { email, password } = adminLoginPending;
    if (dom.adminVerifyResend) {
      dom.adminVerifyResend.disabled = true;
    }
    if (dom.adminVerifyMessage) {
      dom.adminVerifyMessage.textContent = "";
    }
    try {
      await fetchFromApi("/api/login", {
        method: "POST",
        body: { email, password },
      });
      clearAdminOtpInputs();
      dom.adminVerifyOtp?.querySelector(".admin-verify-digit")?.focus();
      startAdminVerifyResendCooldown(60);
    } catch (error) {
      if (dom.adminVerifyMessage) {
        dom.adminVerifyMessage.textContent =
          "Could not resend the code. Please try again in a moment.";
      }
    } finally {
      if (dom.adminVerifyResend) {
        dom.adminVerifyResend.disabled = false;
      }
    }
  }

  function adminVerifyBackClick() {
    if (dom.adminPassword) {
      dom.adminPassword.value = "";
    }
    if (dom.adminVerifyMessage) {
      dom.adminVerifyMessage.textContent = "";
    }
    showAdminLoginCredentialsStep();
  }

  async function loginAdmin(event) {
    event.preventDefault();
    if (!dom.adminEmail || !dom.adminPassword) return;

    const email = dom.adminEmail.value.trim();
    const password = dom.adminPassword.value.trim();

    if (!email || !password) {
      if (dom.adminLoginMessage) {
        dom.adminLoginMessage.textContent =
          "Please enter both email and password.";
      }
      return;
    }

    if (dom.adminLoginMessage) {
      dom.adminLoginMessage.textContent = "";
    }

    const submitBtn = dom.adminLoginSubmit;
    const prevLabel = submitBtn ? submitBtn.textContent : "Sign In";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }

    try {
      await fetchFromApi("/api/login", {
        method: "POST",
        body: { email, password },
      });
      adminLoginPending = { email, password };
      showAdminLoginVerifyStep(email);
    } catch (error) {
      if (dom.adminLoginMessage) {
        dom.adminLoginMessage.textContent =
          "Sign-in failed. Check your email, password, and that the server can send mail.";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = prevLabel;
      }
    }
  }

  function logoutAdmin() {
    clearAdminSession();
    hideAdminPanel();
    showOrderMessage("You have been logged out of admin mode.");
  }

  function showImagePreview(fileInput, previewImg) {
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        previewImg.src = e.target.result;
        previewImg.classList.remove("d-none");
      };
      reader.readAsDataURL(file);
    } else {
      previewImg.classList.add("d-none");
    }
  }

  function resetMenuForm() {
    dom.menuForm.classList.add("d-none");
    dom.menuName.value = "";
    dom.menuCategory.value = "starters";
    dom.menuPrice.value = "";
    dom.menuImage.value = "";
    dom.menuImageFile.value = "";
    dom.menuImagePreview.classList.add("d-none");
    dom.menuDescription.value = "";
    setAvailabilityCheckboxes([]);
    const weekGroupSelect = document.getElementById("menu-week-group");
    if (weekGroupSelect) {
      weekGroupSelect.value = "both";
    }
    if (dom.menuDescriptionHelp) {
      dom.menuDescriptionHelp.textContent = "0/20 words • 0/130 chars";
      dom.menuDescriptionHelp.classList.remove("text-danger", "text-warning");
      dom.menuDescriptionHelp.classList.add("text-muted");
    }
    editingMenuId = null;
  }

  function resetGalleryForm() {
    dom.galleryForm.classList.add("d-none");
    dom.galleryImageUrl.value = "";
    dom.galleryImageFile.value = "";
    dom.galleryImagePreview.classList.add("d-none");
    dom.galleryAltText.value = "";
    editingGalleryId = null;
  }

  function loadState() {
    menuItems = readStorage(STORAGE_KEYS.menu, defaultMenuItems);
    galleryItems = readStorage(STORAGE_KEYS.gallery, defaultGalleryItems);
    orders = readStorage(STORAGE_KEYS.orders, []);
    cart = readStorage(STORAGE_KEYS.cart, []);
    adminToken = readStorage(STORAGE_KEYS.adminToken, null);
    adminUser = readStorage(STORAGE_KEYS.adminUser, null);
    adminLoggedIn = !!adminToken;
  }

  function saveState() {
    saveStorage(STORAGE_KEYS.menu, menuItems);
    saveStorage(STORAGE_KEYS.gallery, galleryItems);
    saveStorage(STORAGE_KEYS.cart, cart);
  }

  function findMenuItem(id) {
    return menuItems.find((item) => item.id === id);
  }

  const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function getCurrentDayCode() {
    return new Date().toLocaleDateString("en-US", { weekday: "short" });
  }

  function isMenuItemAvailableToday(item) {
    if (!item || !item.availability) return true;
    const today = getCurrentDayCode();
    const availability = String(item.availability)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!availability.length) return true;
    return availability.includes(today);
  }

  function getSelectedAvailabilityDays() {
    return Array.from(document.querySelectorAll(".menu-availability-checkbox"))
      .filter((input) => input.checked)
      .map((input) => input.value);
  }

  function setAvailabilityCheckboxes(days) {
    const selected = Array.isArray(days)
      ? days
      : String(days || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
    document
      .querySelectorAll(".menu-availability-checkbox")
      .forEach((input) => {
        input.checked = selected.includes(input.value);
      });
  }

  function getCurrentWeekGroup() {
    const date = new Date();
    const dayOfMonth = date.getDate();
    const weekNumber = Math.ceil(dayOfMonth / 7);
    return weekNumber % 2 === 1 ? "1st" : "2nd";
  }

  function isMenuItemAvailableInWeek(item) {
    if (!item || !item.weekGroup || item.weekGroup === "both") return true;
    return String(item.weekGroup) === getCurrentWeekGroup();
  }

  function renderMenu() {
    const today = getCurrentDayCode();
    const currentWeek = getCurrentWeekGroup();
    ["full-meal", "individual-items", "add-ons"].forEach((category) => {
      const row = document.getElementById(`menu-${category}-row`);
      if (!row) return;
      const list = menuItems.filter(
        (item) =>
          item.category === category &&
          isMenuItemAvailableToday(item) &&
          isMenuItemAvailableInWeek(item),
      );
      if (!list.length) {
        row.innerHTML = `<div class="col-12 text-center"><p class="text-muted">No items available in this category for ${today} (${currentWeek} Week).</p></div>`;
        return;
      }
      row.innerHTML = list
        .map(
          (item) => `
          <div class="col-12 col-sm-6 col-md-4 col-lg-4 menu-item">
              <a href="${resolveImageUrl(item.image)}" class="glightbox" data-gallery="images-gallery">
              <img src="${resolveImageUrl(item.image)}" class="menu-img img-fluid" alt="${item.name}" />
            </a>
            <h4>${item.name}</h4>
            <p class="ingredients">${item.description}</p>
            <p class="price">${formatPrice(item.price)}</p>
            <button type="button" class="btn btn-sm btn-outline-success add-to-cart-btn" data-id="${item.id}" data-img="${resolveImageUrl(item.image)}"><span class="btn-label">Add to Cart</span></button>
          </div>
        `,
        )
        .join("");
    });
  }

  function refreshLightbox() {
    if (
      window.galleryLightbox &&
      typeof window.galleryLightbox.reload === "function"
    ) {
      window.galleryLightbox.reload();
    } else {
      window.galleryLightbox = GLightbox({ selector: ".glightbox" });
    }
  }

  function refreshSwipers() {
    if (window.swiperInstances && window.swiperInstances.length) {
      window.swiperInstances.forEach((instance) => {
        if (instance && typeof instance.update === "function") {
          instance.update();
        }
      });
    }
  }

  function renderGallery() {
    const wrapper = document.getElementById("gallery-wrapper");
    if (!wrapper) return;
    wrapper.innerHTML = galleryItems.length
      ? galleryItems
          .map(
            (item) => `
            <div class="swiper-slide">
              <a class="glightbox" data-gallery="images-gallery" href="${resolveImageUrl(item.image)}">
                <img src="${resolveImageUrl(item.image)}" class="img-fluid" alt="${item.alt}" />
              </a>
            </div>
          `,
          )
          .join("")
      : `<div class="swiper-slide"><div class="text-center p-5">No gallery images added yet.</div></div>`;
    refreshLightbox();
    refreshSwipers();
  }

  function renderCart() {
    if (!dom.cartItems || !dom.cartTotal || !dom.cartEmpty) return;
    if (!cart.length) {
      dom.cartItems.innerHTML = "";
      dom.cartTotal.textContent = "PKR 0";
      dom.cartEmpty.classList.remove("d-none");
      return;
    }

    dom.cartEmpty.classList.add("d-none");
    const items = cart.map((cartItem) => {
      const menuItem = findMenuItem(cartItem.id) || {
        name: "Unknown item",
        price: "PKR 0",
      };
      return {
        ...menuItem,
        qty: cartItem.qty,
      };
    });

    dom.cartItems.innerHTML = items
      .map(
        (item) => `
          <li class="d-flex justify-content-between align-items-center mb-2">
            <span>${item.qty} x ${item.name}</span>
            <span class="d-flex gap-2 align-items-center">
              ${item.price}
              <button type="button" class="btn btn-sm btn-outline-danger cart-remove-btn" data-id="${item.id}">-</button>
            </span>
          </li>
        `,
      )
      .join("");

    const total = items.reduce(
      (sum, item) => sum + parsePrice(item.price) * item.qty,
      0,
    );
    dom.cartTotal.textContent = formatPrice(total);
    updateCartBadge();
    document.querySelectorAll(".cart-remove-btn").forEach((button) => {
      button.addEventListener("click", (event) => {
        removeFromCart(event.target.dataset.id);
      });
    });
  }

  // Event delegation for cart buttons - prevents duplicate listeners
  document.addEventListener("click", (event) => {
    const addBtn = event.target.closest(".add-to-cart-btn");
    if (addBtn) {
      event.preventDefault();
      addToCart(addBtn.dataset.id, addBtn);
      return;
    }

    const viewCartBtn = event.target.closest(".view-cart-btn");
    if (viewCartBtn) {
      event.preventDefault();
      const cartModal = document.getElementById("cart-modal");
      if (cartModal && window.bootstrap) {
        bootstrap.Modal.getOrCreateInstance(cartModal).show();
      }
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;
    const menuItem = event.target.closest(".menu-item");
    if (!menuItem) return;

    const addBtn = menuItem.querySelector(".add-to-cart-btn");
    const label = menuItem.querySelector(".btn-label");

    menuItem.classList.remove("touch-active");
    if (addBtn) addBtn.classList.remove("touch-active");
    if (label) label.classList.remove("touch-active");

    // Force reflow to restart animations
    void menuItem.offsetWidth;
    if (addBtn) void addBtn.offsetWidth;
    if (label) void label.offsetWidth;

    menuItem.classList.add("touch-active");
    if (addBtn) addBtn.classList.add("touch-active");
    if (label) label.classList.add("touch-active");

    window.setTimeout(() => {
      menuItem.classList.remove("touch-active");
      if (addBtn) addBtn.classList.remove("touch-active");
      if (label) label.classList.remove("touch-active");
    }, 1800);
  });

  function addToCart(itemId, buttonElement = null) {
    const menuItem = findMenuItem(itemId);
    if (!menuItem) return;

    const existing = cart.find((item) => item.id === itemId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: itemId, qty: 1 });
    }
    saveStorage(STORAGE_KEYS.cart, cart);
    // Defer UI updates (badge, toast, cart render) until after flying animation completes
    const afterAdd = () => {
      renderCart();
      updateCartBadge();
      showToast(`✓ ${menuItem.name} added to cart!`, false, 3000);
    };

    // If there's a source button, animate flying item then call afterAdd
    if (buttonElement) {
      // prefer data-img attribute if set
      const img =
        buttonElement.dataset.img || resolveImageUrl(menuItem.image) || "";
      animateFlyingItem(buttonElement, img, afterAdd);
    } else {
      // no animation possible, run updates immediately
      afterAdd();
    }
  }

  function removeFromCart(itemId) {
    const cartItem = cart.find((item) => item.id === itemId);
    if (!cartItem) return;

    // Decrease quantity, or remove if qty is 1
    if (cartItem.qty > 1) {
      cartItem.qty -= 1;
    } else {
      cart = cart.filter((item) => item.id !== itemId);
    }
    saveStorage(STORAGE_KEYS.cart, cart);
    renderCart();
    updateCartBadge();
  }

  function updateCartBadge() {
    if (!dom.cartBadge) return;
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    dom.cartBadge.textContent = count;
    // pop animation
    dom.cartBadge.classList.remove("badge-pop");
    // trigger reflow to restart animation
    void dom.cartBadge.offsetWidth;
    dom.cartBadge.classList.add("badge-pop");
    setTimeout(() => dom.cartBadge.classList.remove("badge-pop"), 600);
  }

  function animateFlyingItem(
    sourceElement,
    itemImageUrl = "",
    onComplete = null,
  ) {
    const container = document.getElementById("flying-items-container");
    if (!container) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    const sourceRect = sourceElement.getBoundingClientRect();
    const cartButton = document.getElementById("cart-toggle");
    if (!cartButton) {
      if (typeof onComplete === "function") onComplete();
      return;
    }
    const cartRect = cartButton.getBoundingClientRect();

    // Create flying item wrapper
    const flyingItem = document.createElement("div");
    flyingItem.className = "flying-item";

    // create image inside flying item for better visual
    const img = document.createElement("img");
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.display = "block";
    if (itemImageUrl) img.src = itemImageUrl;
    else img.src = "assets/img/menu/menu-item-1.png";

    flyingItem.appendChild(img);

    // size for flying thumbnail
    const size = 48;
    // sourceRect and cartRect are relative to viewport; flying item is fixed, so use them directly
    const startLeft = sourceRect.left + sourceRect.width / 2 - size / 2;
    const startTop = sourceRect.top + sourceRect.height / 2 - size / 2;
    const targetLeft = cartRect.left + cartRect.width / 2 - size / 2;
    const targetTop = cartRect.top + cartRect.height / 2 - size / 2;

    flyingItem.style.left = startLeft + "px";
    flyingItem.style.top = startTop + "px";
    flyingItem.style.width = size + "px";
    flyingItem.style.height = size + "px";

    // compute delta (relative translate values)
    const deltaX = targetLeft - startLeft;
    const deltaY = targetTop - startTop;

    flyingItem.style.setProperty("--fly-x", deltaX + "px");
    flyingItem.style.setProperty("--fly-y", deltaY + "px");

    container.appendChild(flyingItem);

    // cleanup after animation duration
    const duration = 900; // ms
    setTimeout(() => {
      flyingItem.remove();
      if (typeof onComplete === "function") onComplete();
      else updateCartBadge();
    }, duration);
  }

  function requestAdminAccess() {
    if (adminLoggedIn) {
      showAdminPanel();
      return;
    }

    showLoginModal();
  }

  function showAdminPanel() {
    if (!dom.adminPanel || typeof bootstrap === "undefined") return;
    const modal = bootstrap.Modal.getOrCreateInstance(dom.adminPanel);
    modal.show();
    loadAdminReviews();
  }

  function hideAdminPanel() {
    if (!dom.adminPanel || typeof bootstrap === "undefined") return;
    const modal = bootstrap.Modal.getOrCreateInstance(dom.adminPanel);
    modal.hide();
  }

  function renderAdminMenu() {
    if (!dom.menuAdminList) return;
    if (!menuItems.length) {
      dom.menuAdminList.innerHTML =
        '<p class="text-muted">No menu items yet. Add one below.</p>';
      return;
    }

    dom.menuAdminList.innerHTML = menuItems
      .map((item) => {
        const availabilityText =
          item.availability && item.availability.trim()
            ? `Days: ${item.availability}`
            : "Every day";
        const weekLabel =
          item.weekGroup === "1st"
            ? "1st Week"
            : item.weekGroup === "2nd"
              ? "2nd Week"
              : "Every Week";
        return `
          <div class="admin-list-item">
            <div class="d-flex justify-content-between align-items-start gap-3">
              <div>
                <strong>${item.name}</strong>
                <span class="text-muted">(${item.category})</span>
                <p class="mb-1">${item.description}</p>
                <p class="mb-1 text-muted small">${availabilityText} • ${weekLabel}</p>
                <p class="mb-0">${item.price}</p>
              </div>
              <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="admin-action-btn edit-menu-item-btn" data-id="${item.id}">Edit</button>
                <button type="button" class="admin-action-btn" data-id="${item.id}" data-action="delete-menu">Delete</button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    document.querySelectorAll(".edit-menu-item-btn").forEach((button) => {
      button.addEventListener("click", (event) => {
        const id = event.target.dataset.id;
        openMenuForm(id);
      });
    });

    document
      .querySelectorAll('[data-action="delete-menu"]')
      .forEach((button) => {
        button.addEventListener("click", async (event) => {
          const id = event.target.dataset.id;
          try {
            if (adminLoggedIn) {
              await fetchFromApi(`/api/menu/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
              });
            }
            menuItems = menuItems.filter((item) => item.id !== id);
            saveStorage(STORAGE_KEYS.menu, menuItems);
            renderMenu();
            renderAdminMenu();
          } catch (error) {
            showOrderMessage(
              "Unable to delete menu item. Please login again.",
              true,
            );
          }
        });
      });
  }

  function openMenuForm(menuId = null) {
    if (!dom.menuForm) return;
    editingMenuId = menuId;
    dom.menuForm.classList.remove("d-none");
    if (menuId) {
      const item = findMenuItem(menuId);
      if (!item) return;
      dom.menuName.value = item.name;
      dom.menuCategory.value = item.category;
      dom.menuPrice.value = parsePrice(item.price) || "";
      dom.menuImage.value = item.image;
      dom.menuImageFile.value = "";
      if (item.image) {
        dom.menuImagePreview.src = resolveImageUrl(item.image);
        dom.menuImagePreview.classList.remove("d-none");
      } else {
        dom.menuImagePreview.classList.add("d-none");
      }
      dom.menuDescription.value = item.description;
      setAvailabilityCheckboxes(item.availability);
      const weekGroupSelect = document.getElementById("menu-week-group");
      if (weekGroupSelect) {
        weekGroupSelect.value = item.weekGroup || "both";
      }
    } else {
      dom.menuName.value = "";
      dom.menuCategory.value = "starters";
      dom.menuPrice.value = "";
      dom.menuImage.value = "";
      dom.menuImageFile.value = "";
      dom.menuImagePreview.classList.add("d-none");
      dom.menuDescription.value = "";
      setAvailabilityCheckboxes([]);
      const weekGroupSelect = document.getElementById("menu-week-group");
      if (weekGroupSelect) {
        weekGroupSelect.value = "both";
      }
    }
    dom.menuName.focus();
  }

  function trimWords(text, maxWords) {
    if (!text) return "";
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return words.join(" ");
    return words.slice(0, maxWords).join(" ");
  }

  async function saveMenuForm(event) {
    event.preventDefault();
    const name = dom.menuName.value.trim();
    const category = dom.menuCategory.value;
    const price = dom.menuPrice.value.trim();
    let description = dom.menuDescription.value.trim();
    const imageFile = dom.menuImageFile.files[0];
    const imageUrl = dom.menuImage.value.trim();
    const parsedPrice = parsePrice(price);
    const availabilityDays = getSelectedAvailabilityDays();

    // validate description limits: 20 words and 130 characters
    const rawWords = description
      ? description.split(/\s+/).filter(Boolean)
      : [];
    const chars = description.length;
    if (rawWords.length > 20 || chars > 130) {
      if (dom.menuDescriptionHelp) {
        dom.menuDescriptionHelp.textContent = `${rawWords.length}/20 words • ${chars}/130 chars`;
        dom.menuDescriptionHelp.classList.remove("text-muted");
        dom.menuDescriptionHelp.classList.add("text-danger");
      }
      showToast(
        "Description must be 20 words or fewer and 130 characters or fewer.",
        true,
      );
      return;
    }
    if (dom.menuDescriptionHelp) {
      dom.menuDescriptionHelp.textContent = `${rawWords.length}/20 words • ${chars}/130 chars`;
      dom.menuDescriptionHelp.classList.remove("text-danger");
      dom.menuDescriptionHelp.classList.add("text-muted");
    }

    if (!name || !price || !description || parsedPrice <= 0) return;
    if (!imageFile && !imageUrl) return;

    const weekGroup =
      document.getElementById("menu-week-group")?.value || "both";
    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("price", formatPrice(parsedPrice));
    formData.append("description", description);
    formData.append("availability", availabilityDays.join(","));
    formData.append("weekGroup", weekGroup);
    if (imageFile) {
      formData.append("image", imageFile);
    } else {
      formData.append("image", imageUrl);
    }

    if (!adminLoggedIn) {
      throw new Error(
        "Admin authentication required. Please log in before adding or editing menu items.",
      );
    }

    try {
      if (editingMenuId) {
        const response = await fetch(`${API_BASE}/api/menu/${editingMenuId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: formData,
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Server error: ${response.status}`);
        }
        const updated = await response.json();
        menuItems = menuItems.map((item) =>
          item.id === editingMenuId ? updated : item,
        );
      } else {
        const response = await fetch(`${API_BASE}/api/menu`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Server error: ${response.status}`);
        }
        const created = await response.json();
        menuItems.unshift(created);
      }

      saveStorage(STORAGE_KEYS.menu, menuItems);
      renderMenu();
      renderAdminMenu();
      resetMenuForm();
    } catch (error) {
      console.error("Error saving menu item:", error);
      showOrderMessage(
        "Unable to save menu item. Please login again or check your connection.",
        true,
      );
    }
  }

  function renderAdminGallery() {
    if (!dom.galleryAdminList) return;
    if (!galleryItems.length) {
      dom.galleryAdminList.innerHTML =
        '<p class="text-muted">No gallery images yet. Add one below.</p>';
      return;
    }

    dom.galleryAdminList.innerHTML = galleryItems
      .map(
        (item) => `
          <div class="admin-list-item">
            <div class="d-flex justify-content-between align-items-start gap-3">
              <div>
                <strong>${item.alt}</strong>
                <p class="mb-1">${item.image}</p>
              </div>
              <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="admin-action-btn edit-gallery-item-btn" data-id="${item.id}">Edit</button>
                <button type="button" class="admin-action-btn" data-id="${item.id}" data-action="delete-gallery">Delete</button>
              </div>
            </div>
          </div>
        `,
      )
      .join("");

    document.querySelectorAll(".edit-gallery-item-btn").forEach((button) => {
      button.addEventListener("click", (event) => {
        openGalleryForm(event.target.dataset.id);
      });
    });

    document
      .querySelectorAll('[data-action="delete-gallery"]')
      .forEach((button) => {
        button.addEventListener("click", async (event) => {
          const id = event.target.dataset.id;
          try {
            if (adminLoggedIn) {
              await fetchFromApi(`/api/gallery/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
              });
            }
            galleryItems = galleryItems.filter((item) => item.id !== id);
            saveStorage(STORAGE_KEYS.gallery, galleryItems);
            renderGallery();
            renderAdminGallery();
          } catch (error) {
            showOrderMessage(
              "Unable to delete gallery image. Please login again.",
              true,
            );
          }
        });
      });
  }

  function openGalleryForm(galleryId = null) {
    if (!dom.galleryForm) return;
    editingGalleryId = galleryId;
    dom.galleryForm.classList.remove("d-none");
    if (galleryId) {
      const item = galleryItems.find((g) => g.id === galleryId);
      if (!item) return;
      dom.galleryImageUrl.value = item.image;
      dom.galleryImageFile.value = "";
      if (item.image) {
        dom.galleryImagePreview.src = resolveImageUrl(item.image);
        dom.galleryImagePreview.classList.remove("d-none");
      } else {
        dom.galleryImagePreview.classList.add("d-none");
      }
      dom.galleryAltText.value = item.alt;
    } else {
      dom.galleryImageUrl.value = "";
      dom.galleryImageFile.value = "";
      dom.galleryImagePreview.classList.add("d-none");
      dom.galleryAltText.value = "";
    }
    dom.galleryAltText.focus();
  }

  async function saveGalleryForm(event) {
    event.preventDefault();
    const imageFile = dom.galleryImageFile.files[0];
    const imageUrl = dom.galleryImageUrl.value.trim();
    const alt = dom.galleryAltText.value.trim();

    if (!alt) return;
    if (!imageFile && !imageUrl) return;

    const formData = new FormData();
    formData.append("alt", alt);
    if (imageFile) {
      formData.append("image", imageFile);
    } else {
      formData.append("image", imageUrl);
    }

    if (!adminLoggedIn) {
      throw new Error(
        "Admin authentication required. Please log in before adding or editing gallery images.",
      );
    }

    try {
      if (editingGalleryId) {
        const response = await fetch(
          `${API_BASE}/api/gallery/${editingGalleryId}`,
          {
            method: "PUT",
            headers: getAuthHeaders(),
            body: formData,
          },
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Server error: ${response.status}`);
        }
        const updated = await response.json();
        galleryItems = galleryItems.map((item) =>
          item.id === editingGalleryId ? updated : item,
        );
      } else {
        const response = await fetch(`${API_BASE}/api/gallery`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Server error: ${response.status}`);
        }
        const created = await response.json();
        galleryItems.unshift(created);
      }

      saveStorage(STORAGE_KEYS.gallery, galleryItems);
      renderGallery();
      renderAdminGallery();
      resetGalleryForm();
    } catch (error) {
      console.error("Error saving gallery item:", error);
      showOrderMessage(
        "Unable to save gallery image. Please login again or check your connection.",
        true,
      );
    }
  }

  function renderAdminOrders() {
    if (!dom.adminOrdersList) return;
    if (!orders.length) {
      dom.adminOrdersList.innerHTML =
        '<p class="text-muted">No orders have been placed yet.</p>';
      return;
    }

    dom.adminOrdersList.innerHTML = orders
      .map(
        (order) => `
        <div class="admin-list-item">
          <div class="d-flex flex-column flex-md-row justify-content-between gap-3">
            <div>
              <strong>Order ${order.id}</strong>
              <p class="mb-1">${order.customerName} • ${order.email}</p>
              <p class="mb-1"><strong>Phone:</strong> ${order.phone}</p>
              <p class="mb-1">${order.address}</p>
              <p class="mb-1">${order.items
                .map((item) => `${item.qty} x ${item.name}`)
                .join(", ")}</p>
              <p class="mb-0">Total: ${order.total}</p>
            </div>
            <div>
              <label class="form-label">Status</label>
              <select class="form-select order-status-select" data-id="${order.id}">
                ${getStatusOptionsForOrder(order.status)
                  .map(
                    (status) =>
                      `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`,
                  )
                  .join("")}
              </select>
            </div>
          </div>
        </div>
      `,
      )
      .join("");

    document.querySelectorAll(".order-status-select").forEach((select) => {
      select.addEventListener("change", (event) => {
        updateOrderStatus(event.target.dataset.id, event.target.value);
      });
    });
  }

  async function updateOrderStatus(orderId, status) {
    try {
      if (adminLoggedIn) {
        const updated = await fetchFromApi(`/api/orders/${orderId}/status`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: { status },
        });
        orders = orders
          .map((order) => (order.id === orderId ? updated : order))
          .filter((order) => order.status !== "Cancelled");
      } else {
        orders = orders.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        );
      }
      saveStorage(STORAGE_KEYS.orders, orders);
      renderAdminOrders();
    } catch (error) {
      showOrderMessage(
        "Unable to update order status. Please login again.",
        true,
      );
    }
  }

  function showOrderMessage(message, isError = false, duration = 5000) {
    if (!dom.orderMessage) return;
    dom.orderMessage.classList.remove("d-none");
    dom.orderMessage.textContent = message;
    dom.orderMessage.style.color = isError ? "#d9534f" : "#ffffff";
    dom.orderMessage.style.background = isError ? "#f8d7da" : "#2f7d36";
    dom.orderMessage.style.padding = "12px 16px";
    dom.orderMessage.style.borderRadius = "10px";
    setTimeout(() => {
      dom.orderMessage.classList.add("d-none");
    }, duration);
  }

  function showToast(message, isError = false, duration = 3000) {
    const toastElement = document.getElementById("toast-notification");
    const toastHeader = document.getElementById("toast-header");
    const toastBody = document.getElementById("toast-body");

    if (!toastElement || !toastHeader || !toastBody) return;

    toastBody.textContent = message;

    if (isError) {
      toastHeader.style.backgroundColor = "#f8d7da";
      toastHeader.style.borderBottom = "1px solid #f5c6cb";
      toastBody.style.backgroundColor = "#f8f9fa";
      toastBody.style.color = "#721c24";
    } else {
      toastHeader.style.backgroundColor = "#d4edda";
      toastHeader.style.borderBottom = "1px solid #c3e6cb";
      toastBody.style.backgroundColor = "#f8f9fa";
      toastBody.style.color = "#155724";
    }

    // Ensure it's visible, then animate slide/fade in via class
    toastElement.style.display = "block";
    // allow layout then add class
    requestAnimationFrame(() => {
      toastElement.classList.add("showing");
    });

    // hide after duration (remove class then hide element after transition)
    setTimeout(() => {
      toastElement.classList.remove("showing");
      // hide after transition (matching CSS 320ms)
      setTimeout(() => {
        toastElement.style.display = "none";
      }, 340);
    }, duration);
  }

  function hideToast() {
    const toastElement = document.getElementById("toast-notification");
    if (!toastElement) return;
    toastElement.classList.remove("showing");
    setTimeout(() => {
      toastElement.style.display = "none";
    }, 340);
  }

  // Close button handler for the custom toast
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#toast-notification .btn-close");
    if (btn) {
      e.preventDefault();
      hideToast();
    }
  });

  // Admin Review Management
  async function loadAdminReviews() {
    if (!adminLoggedIn) return;
    try {
      const reviews = await fetchFromApi("/api/admin/reviews", {
        headers: getAuthHeaders(),
      });
      renderAdminReviews(reviews);
    } catch (error) {
      console.error("Error loading admin reviews:", error);
    }
  }

  function renderAdminReviews(reviews) {
    const reviewsList = document.getElementById("admin-reviews-list");
    if (!reviewsList) return;

    const validReviews = Array.isArray(reviews)
      ? reviews.filter((review) => review && review.id)
      : [];

    if (Array.isArray(reviews) && validReviews.length !== reviews.length) {
      console.warn(
        "Some admin reviews were skipped because they are missing an id:",
        reviews.filter((review) => !review || !review.id),
      );
    }

    if (!validReviews.length) {
      reviewsList.innerHTML =
        '<p class="text-muted">No valid reviews available.</p>';
      return;
    }

    reviewsList.innerHTML = validReviews
      .map(
        (review) => `
        <div class="admin-list-item" style="border-left: 4px solid ${review.approved ? "#28a745" : "#ffc107"}">
          <div class="d-flex flex-column flex-md-row justify-content-between gap-3">
            <div>
              <strong>${escapeHtml(review.customerName)}</strong>
              <p class="mb-1"><small>${escapeHtml(review.customerEmail)}</small></p>
              <p class="mb-2">"${escapeHtml(review.reviewText)}"</p>
              <p class="mb-1">
                <span style="color: #ffc107;">
                  ${"⭐".repeat(review.rating)}
                </span>
              </p>
              <p class="mb-0"><small>Status: ${review.approved ? '<span class="badge bg-success">Approved</span>' : '<span class="badge bg-warning">Pending</span>'}</small></p>
            </div>
            <div class="d-flex flex-column gap-2">
              ${
                !review.approved
                  ? `
                <button class="btn btn-sm btn-success approve-review-btn" data-id="${escapeHtml(review.id)}">
                  Approve
                </button>
              `
                  : ""
              }
              <button class="btn btn-sm btn-danger reject-review-btn" data-id="${escapeHtml(review.id)}">
                ${review.approved ? "Unapprove" : "Reject"}
              </button>
              <button class="btn btn-sm btn-outline-danger delete-review-btn" data-id="${escapeHtml(review.id)}">
                Delete
              </button>
            </div>
          </div>
        </div>
      `,
      )
      .join("");

    // Add event listeners
    document.querySelectorAll(".approve-review-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const reviewId = e.currentTarget.dataset.id;
        if (!reviewId) return;
        approveReview(reviewId);
      });
    });

    document.querySelectorAll(".reject-review-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const reviewId = e.currentTarget.dataset.id;
        if (!reviewId) return;
        rejectReview(reviewId);
      });
    });

    document.querySelectorAll(".delete-review-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const reviewId = e.currentTarget.dataset.id;
        if (!reviewId) return;
        deleteReview(reviewId);
      });
    });
  }

  async function approveReview(reviewId) {
    try {
      await fetchFromApi(`/api/admin/reviews/${reviewId}/approve`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      loadAdminReviews();
      loadApprovedReviews();
      showOrderMessage("Review approved!");
    } catch (error) {
      showOrderMessage("Unable to approve review.", true);
    }
  }

  async function rejectReview(reviewId) {
    try {
      await fetchFromApi(`/api/admin/reviews/${reviewId}/reject`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      loadAdminReviews();
      loadApprovedReviews();
      showOrderMessage("Review status updated.");
    } catch (error) {
      showOrderMessage("Unable to update review.", true);
    }
  }

  async function deleteReview(reviewId) {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await fetchFromApi(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      loadAdminReviews();
      loadApprovedReviews();
      showOrderMessage("Review deleted.");
    } catch (error) {
      showOrderMessage("Unable to delete review.", true);
    }
  }

  async function placeOrder(event) {
    event.preventDefault();
    if (!cart.length) {
      showOrderMessage(
        "Your cart is empty. Please add items from the menu.",
        true,
      );
      return;
    }

    const name = dom.orderName.value.trim();
    const email = dom.orderEmail.value.trim();
    const phone = dom.orderPhone.value.trim();
    const address = dom.orderAddress.value.trim();
    const notes = dom.orderNotes.value.trim();

    if (!name || !email || !phone || !address) {
      showOrderMessage("Please fill in all required order details.", true);
      return;
    }

    const orderItems = cart.map((cartItem) => {
      const menuItem = findMenuItem(cartItem.id) || {
        name: "Unknown",
        price: "PKR 0",
      };
      return {
        id: cartItem.id,
        name: menuItem.name,
        price: menuItem.price,
        qty: cartItem.qty,
      };
    });

    const total = formatPrice(
      orderItems.reduce(
        (sum, item) => sum + parsePrice(item.price) * item.qty,
        0,
      ),
    );

    try {
      const confirmedOrder = await fetchFromApi("/api/orders", {
        method: "POST",
        body: {
          customerName: name,
          email,
          phone,
          address,
          notes,
          items: orderItems,
          total,
        },
      });

      cart = [];
      saveState();
      renderCart();
      dom.orderForm.reset();
      showOrderMessage(
        `Order placed successfully! Your order ID is ${confirmedOrder.id}. A confirmation email has been sent to ${email}.`,
      );
    } catch (error) {
      showOrderMessage("Unable to place order. Please try again later.", true);
    }
  }

  // Gravatar helper to get profile picture from Gmail
  function getGravatarUrl(email, size = 80) {
    const md5 = function (str) {
      return CryptoJS.MD5(str).toString();
    };
    const hash = md5(email.toLowerCase().trim());
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
  }

  // Review form submission
  async function submitReview(event) {
    event.preventDefault();
    const name = document.getElementById("review-name").value.trim();
    const email = document.getElementById("review-email").value.trim();
    const reviewText = document.getElementById("review-text").value.trim();
    const rating = parseInt(document.getElementById("review-rating").value);

    if (!name || !email || !reviewText || rating === 0) {
      showReviewMessage("Please fill in all fields and select a rating.", true);
      return;
    }

    try {
      const response = await fetchFromApi("/api/reviews", {
        method: "POST",
        body: {
          customerName: name,
          customerEmail: email,
          reviewText,
          rating,
        },
      });

      document.getElementById("review-form").reset();
      document.getElementById("review-rating").value = 0;
      document.querySelectorAll(".star-rating i").forEach((star) => {
        star.classList.remove("active", "bi-star-fill");
        star.classList.add("bi-star");
      });
      showReviewMessage(
        "Thank you! Your review has been submitted and is awaiting approval.",
        false,
      );
    } catch (error) {
      showReviewMessage(
        "Unable to submit review. Please try again later.",
        true,
      );
    }
  }

  function showReviewMessage(message, isError = false) {
    const messageEl = document.getElementById("review-message");
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.className = `review-message ${isError ? "error" : "success"}`;
    messageEl.style.display = "block";
    setTimeout(() => {
      messageEl.style.display = "none";
    }, 5000);
  }

  // Load and display approved reviews
  async function loadApprovedReviews() {
    try {
      const reviews = await fetchFromApi("/api/reviews");
      renderApprovedReviews(reviews);
    } catch (error) {
      console.error("Error loading reviews:", error);
    }
  }

  function renderApprovedReviews(reviews) {
    const swiperWrapper = document.querySelector(
      "#testimonials-swiper-wrapper",
    );
    const testimonialsSection = document.querySelector("#testimonials");

    if (!swiperWrapper) return;

    // If no approved reviews, hide the testimonials section
    if (reviews.length === 0) {
      if (testimonialsSection) {
        testimonialsSection.style.display = "none";
      }
      return;
    }

    // Show the testimonials section
    if (testimonialsSection) {
      testimonialsSection.style.display = "block";
    }

    // Clear existing slides
    swiperWrapper.innerHTML = "";

    // Add reviewed testimonials from database
    reviews.forEach((review) => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";

      const gravatarUrl = getGravatarUrl(review.customerEmail);

      slide.innerHTML = `
        <div class="testimonial-item">
          <div class="row gy-4 justify-content-center">
            <div class="col-lg-6">
              <div class="testimonial-content">
                <p>
                  <i class="bi bi-quote quote-icon-left"></i>
                  <span>${review.reviewText}</span>
                  <i class="bi bi-quote quote-icon-right"></i>
                </p>
                <h3>${review.customerName}</h3>
                <h4>${review.customerEmail}</h4>
                <div class="stars">
                  ${Array(review.rating).fill('<i class="bi bi-star-fill"></i>').join("")}
                </div>
              </div>
            </div>
            <div class="col-lg-2 text-center">
              <img
                src="${gravatarUrl}"
                class="img-fluid testimonial-img"
                alt="${review.customerName}"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      `;

      swiperWrapper.appendChild(slide);
    });

    // Find and update the testimonials Swiper instance
    const testimonialsSwiper = document.querySelector(".swiper-wrapper");
    if (window.swiperInstances && window.swiperInstances.length) {
      // Find the swiper instance that owns the testimonials wrapper
      const testimonialsSwiperInstance = window.swiperInstances.find(
        (instance) => {
          return instance.wrapperEl === swiperWrapper;
        },
      );

      if (testimonialsSwiperInstance) {
        testimonialsSwiperInstance.update();
        testimonialsSwiperInstance.slideTo(0, 0, false);
        if (testimonialsSwiperInstance.autoplay) {
          testimonialsSwiperInstance.autoplay.start();
        }
      }
    }
  }

  function renderTrackResults(foundOrders) {
    if (!dom.trackResults) return;
    if (!foundOrders.length) {
      dom.trackResults.innerHTML =
        '<p class="text-muted">No matching orders found. Verify your email and order ID.</p>';
      return;
    }

    dom.trackResults.innerHTML = foundOrders
      .map(
        (order) => `
        <div class="order-card p-3 mb-3">
          <h5>Order ${order.id}</h5>
          <p><strong>Status:</strong> <span class="order-status-badge">${order.status}</span></p>
          <p><strong>Customer:</strong> ${order.customerName}</p>
          <p><strong>Items:</strong> ${order.items.map((item) => `${item.qty} x ${item.name}`).join(", ")}</p>
          <p><strong>Total:</strong> ${order.total}</p>
          <p><strong>Delivery:</strong> ${order.address}</p>
          ${order.status === "Pending" ? `<button type="button" class="btn btn-sm btn-danger cancel-order-btn" data-order-id="${order.id}">Cancel Pending Order</button>` : ""}
        </div>
      `,
      )
      .join("");

    document.querySelectorAll(".cancel-order-btn").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const orderId = event.target.dataset.orderId;
        await cancelTrackedOrder(orderId);
      });
    });
  }

  async function trackOrders(event) {
    event.preventDefault();
    const email = dom.trackEmail.value.trim().toLowerCase();
    const orderId = dom.trackOrderId.value.trim();
    if (!email) {
      renderTrackResults([]);
      return;
    }

    try {
      const query = new URLSearchParams({
        email,
        ...(orderId ? { orderId } : {}),
      }).toString();
      const data = await fetchFromApi(`/api/orders/track?${query}`);
      renderTrackResults(data);
    } catch (error) {
      showOrderMessage(
        "Unable to find order. Check your details and try again.",
        true,
      );
    }
  }

  async function cancelTrackedOrder(orderId) {
    const email = dom.trackEmail.value.trim().toLowerCase();
    if (!email) {
      showOrderMessage(
        "Enter the email used for this order to cancel it.",
        true,
      );
      return;
    }

    try {
      const canceledOrder = await fetchFromApi(
        `/api/orders/${orderId}/cancel`,
        {
          method: "PUT",
          body: { email },
        },
      );
      renderTrackResults([canceledOrder]);
      showOrderMessage("Order cancelled successfully.");
    } catch (error) {
      showOrderMessage(
        "Unable to cancel order. Only pending orders can be cancelled.",
        true,
      );
    }
  }

  async function init() {
    loadState();
    await Promise.all([fetchMenuFromServer(), fetchGalleryFromServer()]);
    await validateAdminSession();

    renderMenu();
    renderGallery();
    renderCart();
    renderAdminMenu();
    renderAdminGallery();
    renderAdminOrders();
    loadApprovedReviews();

    if (dom.adminToggle) {
      dom.adminToggle.addEventListener("click", requestAdminAccess);
    }
    if (dom.adminClose) {
      dom.adminClose.addEventListener("click", hideAdminPanel);
    }
    if (dom.addMenuButton) {
      dom.addMenuButton.addEventListener("click", () => openMenuForm());
    }
    if (dom.menuForm) {
      dom.menuForm.addEventListener("submit", saveMenuForm);
      if (dom.menuDescription && dom.menuDescriptionHelp) {
        dom.menuDescription.addEventListener("input", (e) => {
          const val = e.target.value || "";
          const words = val.trim().split(/\s+/).filter(Boolean);
          const chars = val.length;
          dom.menuDescriptionHelp.textContent = `${words.length}/20 words • ${chars}/130 chars`;
          if (words.length > 20 || chars > 130) {
            dom.menuDescriptionHelp.classList.remove("text-muted");
            dom.menuDescriptionHelp.classList.add("text-danger");
          } else {
            dom.menuDescriptionHelp.classList.remove("text-danger");
            dom.menuDescriptionHelp.classList.add("text-muted");
          }
        });
      }
    }
    if (dom.addGalleryButton) {
      dom.addGalleryButton.addEventListener("click", () => openGalleryForm());
    }
    if (dom.galleryForm) {
      dom.galleryForm.addEventListener("submit", saveGalleryForm);
    }
    if (dom.orderForm) {
      dom.orderForm.addEventListener("submit", placeOrder);
    }
    if (dom.trackForm) {
      dom.trackForm.addEventListener("submit", trackOrders);
    }

    // Review form listeners
    const reviewForm = document.getElementById("review-form");
    if (reviewForm) {
      reviewForm.addEventListener("submit", submitReview);
    }

    // Star rating listeners
    const starRating = document.getElementById("review-stars");
    if (starRating) {
      const updateStars = (activeCount) => {
        starRating.querySelectorAll("i").forEach((s, index) => {
          const isActive = index < activeCount;
          s.classList.toggle("bi-star-fill", isActive);
          s.classList.toggle("bi-star", !isActive);
          s.classList.toggle("active", isActive);
        });
      };

      starRating.querySelectorAll("i").forEach((star) => {
        star.addEventListener("click", (e) => {
          const rating = parseInt(e.target.dataset.rating, 10);
          document.getElementById("review-rating").value = rating;
          updateStars(rating);
        });
        star.addEventListener("mouseover", (e) => {
          const rating = parseInt(e.target.dataset.rating, 10);
          updateStars(rating);
        });
      });

      starRating.addEventListener("mouseout", () => {
        const currentRating = parseInt(
          document.getElementById("review-rating").value,
          10,
        );
        updateStars(currentRating);
      });
    }

    if (dom.adminLoginForm) {
      dom.adminLoginForm.addEventListener("submit", loginAdmin);
    }
    initAdminVerifyOtp();
    if (dom.adminVerifySubmit) {
      dom.adminVerifySubmit.addEventListener("click", () => {
        verifyAdminCode();
      });
    }
    if (dom.adminVerifyResend) {
      dom.adminVerifyResend.addEventListener("click", () => {
        resendAdminVerificationCode();
      });
    }
    if (dom.adminVerifyBack) {
      dom.adminVerifyBack.addEventListener("click", adminVerifyBackClick);
    }
    if (dom.loginModal) {
      dom.loginModal.addEventListener("hidden.bs.modal", resetAdminLoginModal);
    }
    if (dom.adminLogout) {
      dom.adminLogout.addEventListener("click", logoutAdmin);
    }
    if (dom.menuImageFile) {
      dom.menuImageFile.addEventListener("change", () =>
        showImagePreview(dom.menuImageFile, dom.menuImagePreview),
      );
    }
    if (dom.menuCancelBtn) {
      dom.menuCancelBtn.addEventListener("click", resetMenuForm);
    }
    if (dom.galleryImageFile) {
      dom.galleryImageFile.addEventListener("change", () =>
        showImagePreview(dom.galleryImageFile, dom.galleryImagePreview),
      );
    }
    if (dom.galleryCancelBtn) {
      dom.galleryCancelBtn.addEventListener("click", resetGalleryForm);
    }
  }

  window.addEventListener("load", init);
})();
