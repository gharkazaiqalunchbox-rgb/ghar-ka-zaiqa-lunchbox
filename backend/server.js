require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const nodemailer = require("nodemailer");
const { db, queries } = require("./data/db");

const app = express();

const port = process.env.PORT || 3000;
const frontendDir = path.join(__dirname, "..", "frontend");
const dataDir = path.join(__dirname, "data");
const assetsDir = path.join(frontendDir, "assets");
const menuImgDir = path.join(assetsDir, "img", "menu");
const galleryImgDir = path.join(assetsDir, "img", "gallery");
const JWT_SECRET = process.env.JWT_SECRET || "GharKaZaiqaSecret2026!";
const ADMIN_ROLE = "admin";

const emailConfig = {
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === "true",
  auth:
    process.env.EMAIL_USER && process.env.EMAIL_PASS
      ? {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        }
      : undefined,
};
const emailFrom =
  process.env.EMAIL_FROM ||
  process.env.EMAIL_USER ||
  "noreply@ghar-ka-zaiqa.com";
const emailTransporter = nodemailer.createTransport(emailConfig);

function isEmailConfigured() {
  return (
    emailConfig.host &&
    emailConfig.port &&
    emailConfig.auth &&
    emailConfig.auth.user &&
    emailConfig.auth.pass
  );
}

async function sendEmail(to, subject, text) {
  if (!isEmailConfigured()) {
    // Development mode: log email to console instead of sending
    console.log(
      `\n[DEV MODE] Email would be sent to ${to}\nSubject: ${subject}\nBody:\n${text}\n`,
    );
    return { accepted: [to] };
  }

  return emailTransporter.sendMail({
    from: emailFrom,
    to,
    subject,
    text,
  });
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Email validation functions
function isValidEmailFormat(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isGmailAccount(email) {
  return email.toLowerCase().endsWith("@gmail.com");
}

function validateEmailAddress(email) {
  const validFormat = isValidEmailFormat(email);
  const isGmail = isGmailAccount(email);

  return {
    valid: validFormat && isGmail,
    message: validFormat
      ? isGmail
        ? null
        : "Only Gmail accounts are allowed for orders"
      : "Invalid email format",
  };
}

app.use(cors());
app.use(express.json());
app.use(express.static(frontendDir));

// Ensure directories exist
function ensureDirectories() {
  [dataDir, menuImgDir, galleryImgDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Multer storage for menu images
const menuStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, menuImgDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `menu-${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// Multer storage for gallery images
const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, galleryImgDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `gallery-${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const uploadMenu = multer({ storage: menuStorage });
const uploadGallery = multer({ storage: galleryStorage });

function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}

function authorize(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    if (payload.role !== ADMIN_ROLE) {
      return res.status(403).json({ error: "Admin role required" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

ensureDirectories();

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Validate email format and Gmail requirement
  const emailValidation = validateEmailAddress(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ error: emailValidation.message });
  }

  try {
    const user = queries.getUserByEmail.get(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const code = generateVerificationCode();
    const verificationId = `login-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    db.transaction(() => {
      queries.deleteExpiredVerifications.run(now);
      queries.createVerification.run(
        verificationId,
        email,
        "admin-login",
        code,
        null,
        expiresAt,
      );
    })();

    await sendEmail(
      email,
      "Ghar Ka Zaiqa Admin Verification Code",
      `Your admin login verification code is ${code}. It expires in 10 minutes.`,
    );

    res.json({
      message: "Verification code sent to admin email.",
      email,
      verificationId,
    });
  } catch (error) {
    console.error("Login verification error:", error);
    res.status(500).json({ error: "Failed to send verification code" });
  }
});

app.post("/api/login/verify", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  try {
    const now = new Date().toISOString();
    let verification;
    db.transaction(() => {
      queries.deleteExpiredVerifications.run(now);
      verification = queries.getVerificationByEmailPurposeCode.get(
        email,
        "admin-login",
        code,
        now,
      );
      if (verification) {
        queries.deleteVerificationById.run(verification.id);
      }
    })();

    if (!verification) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification code" });
    }

    const user = queries.getUserByEmail.get(email);
    if (!user) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "4h" },
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login verification failed:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

app.get("/api/menu", (req, res) => {
  try {
    const menu = queries.getAllMenu.all().map((row) => ({
      id: row.id,
      category: row.category,
      name: row.name,
      description: row.description,
      price: row.price,
      image: row.image,
    }));
    res.json(menu);
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

app.get("/api/gallery", (req, res) => {
  try {
    const gallery = queries.getAllGallery.all().map((row) => ({
      id: row.id,
      image: row.image,
      alt: row.alt,
    }));
    res.json(gallery);
  } catch (error) {
    console.error("Error fetching gallery:", error);
    res.status(500).json({ error: "Failed to fetch gallery" });
  }
});

app.get("/api/orders", authorize, (req, res) => {
  try {
    const orders = queries.getAllOrders
      .all()
      .filter((row) => row.status !== "Cancelled")
      .map((row) => ({
        id: row.id,
        customerName: row.customerName,
        email: row.email,
        phone: row.phone,
        address: row.address,
        notes: row.notes,
        items: JSON.parse(row.items),
        total: row.total,
        status: row.status,
        createdAt: row.createdAt,
      }));
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.get("/api/orders/track", (req, res) => {
  const { email, orderId } = req.query;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const allOrders = queries.getAllOrders.all().map((row) => ({
      id: row.id,
      customerName: row.customerName,
      email: row.email,
      phone: row.phone,
      address: row.address,
      notes: row.notes,
      items: JSON.parse(row.items),
      total: row.total,
      status: row.status,
      createdAt: row.createdAt,
    }));

    const filtered = allOrders.filter((order) => {
      const emailMatch =
        order.email.toLowerCase() === String(email).toLowerCase();
      const idMatch = orderId ? order.id === orderId : true;
      return emailMatch && idMatch && order.status !== "Cancelled";
    });
    res.json(filtered);
  } catch (error) {
    console.error("Error tracking orders:", error);
    res.status(500).json({ error: "Failed to track orders" });
  }
});

app.post("/api/menu", authorize, uploadMenu.single("image"), (req, res) => {
  const item = req.body;
  if (
    !item ||
    !item.name ||
    !item.category ||
    !item.price ||
    !item.description
  ) {
    return res.status(400).json({ error: "Invalid menu item" });
  }

  try {
    const imagePath = req.file
      ? `assets/img/menu/${req.file.filename}`
      : item.image;
    const newItem = {
      id: `menu-${Date.now()}`,
      category: item.category,
      name: item.name,
      description: item.description,
      price: item.price,
      image: imagePath,
    };
    queries.createMenu.run(
      newItem.id,
      newItem.category,
      newItem.name,
      newItem.description,
      newItem.price,
      newItem.image,
    );
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating menu item:", error);
    res.status(500).json({ error: "Failed to create menu item" });
  }
});

app.put("/api/menu/:id", authorize, uploadMenu.single("image"), (req, res) => {
  const { id } = req.params;
  const update = req.body;

  try {
    const oldItem = queries.getMenuById.get(id);
    if (!oldItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const imagePath = req.file
      ? `assets/img/menu/${req.file.filename}`
      : update.image || oldItem.image;

    // Delete old image if a new file is being uploaded and old image exists
    if (req.file && oldItem.image && !oldItem.image.startsWith("http")) {
      const oldImagePath = path.join(frontendDir, oldItem.image);
      deleteFile(oldImagePath);
    }

    queries.updateMenu.run(
      update.category || oldItem.category,
      update.name || oldItem.name,
      update.description || oldItem.description,
      update.price || oldItem.price,
      imagePath,
      id,
    );

    const updated = queries.getMenuById.get(id);
    res.json({
      id: updated.id,
      category: updated.category,
      name: updated.name,
      description: updated.description,
      price: updated.price,
      image: updated.image,
    });
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({ error: "Failed to update menu item" });
  }
});

app.delete("/api/menu/:id", authorize, (req, res) => {
  const { id } = req.params;

  try {
    const item = queries.getMenuById.get(id);
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    if (item.image && !item.image.startsWith("http")) {
      const imagePath = path.join(frontendDir, item.image);
      deleteFile(imagePath);
    }

    queries.deleteMenu.run(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ error: "Failed to delete menu item" });
  }
});

app.post(
  "/api/gallery",
  authorize,
  uploadGallery.single("image"),
  (req, res) => {
    const item = req.body;
    if (!item || !item.alt) {
      return res.status(400).json({ error: "Invalid gallery item" });
    }

    try {
      const imagePath = req.file
        ? `assets/img/gallery/${req.file.filename}`
        : item.image;
      const newItem = {
        id: `gallery-${Date.now()}`,
        image: imagePath,
        alt: item.alt,
      };
      queries.createGallery.run(newItem.id, newItem.image, newItem.alt);
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating gallery item:", error);
      res.status(500).json({ error: "Failed to create gallery item" });
    }
  },
);

app.put(
  "/api/gallery/:id",
  authorize,
  uploadGallery.single("image"),
  (req, res) => {
    const { id } = req.params;
    const update = req.body;

    try {
      const oldItem = queries.getGalleryById.get(id);
      if (!oldItem) {
        return res.status(404).json({ error: "Gallery item not found" });
      }

      const imagePath = req.file
        ? `assets/img/gallery/${req.file.filename}`
        : update.image || oldItem.image;

      // Delete old image if a new file is being uploaded and old image exists
      if (req.file && oldItem.image && !oldItem.image.startsWith("http")) {
        const oldImagePath = path.join(frontendDir, oldItem.image);
        deleteFile(oldImagePath);
      }

      queries.updateGallery.run(imagePath, update.alt || oldItem.alt, id);

      const updated = queries.getGalleryById.get(id);
      res.json({
        id: updated.id,
        image: updated.image,
        alt: updated.alt,
      });
    } catch (error) {
      console.error("Error updating gallery item:", error);
      res.status(500).json({ error: "Failed to update gallery item" });
    }
  },
);

app.delete("/api/gallery/:id", authorize, (req, res) => {
  const { id } = req.params;

  try {
    const item = queries.getGalleryById.get(id);
    if (!item) {
      return res.status(404).json({ error: "Gallery item not found" });
    }

    if (item.image && !item.image.startsWith("http")) {
      const imagePath = path.join(frontendDir, item.image);
      deleteFile(imagePath);
    }

    queries.deleteGallery.run(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting gallery item:", error);
    res.status(500).json({ error: "Failed to delete gallery item" });
  }
});

app.post("/api/orders", async (req, res) => {
  const order = req.body;
  if (
    !order ||
    !order.customerName ||
    !order.email ||
    !order.phone ||
    !order.address ||
    !Array.isArray(order.items)
  ) {
    return res.status(400).json({ error: "Invalid order data" });
  }

  // Validate email format and Gmail requirement
  const emailValidation = validateEmailAddress(order.email);
  if (!emailValidation.valid) {
    return res.status(400).json({ error: emailValidation.message });
  }

  try {
    const orderId = `ORD${Date.now().toString().slice(-6)}`;

    queries.createOrder.run(
      orderId,
      order.customerName,
      order.email,
      order.phone,
      order.address,
      order.notes || "",
      JSON.stringify(order.items),
      order.total,
      "Pending",
    );

    const orderSummary = order.items
      .map((item) => `${item.qty} x ${item.name} (${item.price})`)
      .join("\n");

    const confirmationText =
      "Your order has been confirmed.\n\n" +
      `Order ID: ${orderId}\n\nItems:\n${orderSummary}\n\n` +
      `Delivery: ${order.address}\nTotal: ${order.total}\n\n` +
      "Thank you for ordering from Ghar Ka Zaiqa!";

    await sendEmail(
      order.email,
      "Your Ghar Ka Zaiqa Order is Confirmed",
      confirmationText,
    );

    res.status(201).json({
      id: orderId,
      customerName: order.customerName,
      email: order.email,
      phone: order.phone,
      address: order.address,
      notes: order.notes || "",
      items: order.items,
      total: order.total,
      status: "Pending",
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.put("/api/orders/:id/status", authorize, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const statusFlow = [
    "Pending",
    "Preparing",
    "Ready to Go",
    "On the Way",
    "Delivered",
  ];
  const statusRank = {
    Pending: 0,
    Preparing: 1,
    Ready: 2,
    "Ready to Go": 3,
    "On the Way": 4,
    Delivered: 5,
  };

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }
  if (!statusFlow.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const order = queries.getOrderById.get(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status === "Cancelled") {
      return res
        .status(400)
        .json({ error: "Cancelled orders cannot be updated" });
    }

    if (status === "Cancelled") {
      return res
        .status(400)
        .json({ error: "Use the cancel endpoint to cancel orders" });
    }

    const currentRank = statusRank[order.status] ?? 0;
    const newRank = statusRank[status];
    if (newRank < currentRank) {
      return res.status(400).json({
        error: "Order status cannot be moved backward once it has advanced",
      });
    }

    queries.updateOrderStatus.run(status, id);

    const updated = queries.getOrderById.get(id);
    res.json({
      id: updated.id,
      customerName: updated.customerName,
      email: updated.email,
      phone: updated.phone,
      address: updated.address,
      notes: updated.notes,
      items: JSON.parse(updated.items),
      total: updated.total,
      status: updated.status,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

app.put("/api/orders/:id/cancel", (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ error: "Email is required to cancel an order" });
  }

  try {
    const order = queries.getOrderById.get(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.email.toLowerCase() !== String(email).toLowerCase()) {
      return res
        .status(403)
        .json({ error: "Email does not match order record" });
    }
    if (order.status !== "Pending") {
      return res
        .status(400)
        .json({ error: "Only pending orders can be cancelled" });
    }

    queries.updateOrderStatus.run("Cancelled", id);

    const updated = queries.getOrderById.get(id);
    res.json({
      id: updated.id,
      customerName: updated.customerName,
      email: updated.email,
      phone: updated.phone,
      address: updated.address,
      notes: updated.notes,
      items: JSON.parse(updated.items),
      total: updated.total,
      status: updated.status,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

// Reviews endpoints
app.post("/api/reviews", async (req, res) => {
  const { customerName, customerEmail, reviewText, rating } = req.body;

  if (!customerName || !customerEmail || !reviewText || !rating) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  // Validate email format and Gmail requirement
  const emailValidation = validateEmailAddress(customerEmail);
  if (!emailValidation.valid) {
    return res.status(400).json({ error: emailValidation.message });
  }

  try {
    const reviewId = `REV${Date.now().toString().slice(-6)}`;
    queries.createReview.run(
      reviewId,
      customerName,
      customerEmail,
      reviewText,
      rating,
      0, // starts as unapproved
    );

    res.status(201).json({
      id: reviewId,
      message: "Review submitted successfully. Awaiting admin approval.",
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

app.get("/api/reviews", (req, res) => {
  try {
    const reviews = queries.getApprovedReviews.all();
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Admin review management
app.get("/api/admin/reviews", authorize, (req, res) => {
  try {
    const reviews = queries.getAllReviews.all();
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

app.put("/api/admin/reviews/:id/approve", authorize, (req, res) => {
  const { id } = req.params;

  try {
    const review = queries.getReviewById.get(id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    queries.approveReview.run(id);
    res.json({ message: "Review approved" });
  } catch (error) {
    console.error("Error approving review:", error);
    res.status(500).json({ error: "Failed to approve review" });
  }
});

app.put("/api/admin/reviews/:id/reject", authorize, (req, res) => {
  const { id } = req.params;

  try {
    const review = queries.getReviewById.get(id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    queries.rejectReview.run(id);
    res.json({ message: "Review rejected" });
  } catch (error) {
    console.error("Error rejecting review:", error);
    res.status(500).json({ error: "Failed to reject review" });
  }
});

app.delete("/api/admin/reviews/:id", authorize, (req, res) => {
  const { id } = req.params;

  try {
    const review = queries.getReviewById.get(id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    queries.deleteReview.run(id);
    res.json({ message: "Review deleted" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
