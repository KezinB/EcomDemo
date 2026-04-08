import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, query, orderBy, deleteDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// IMPORTANT: Fill in your complete Firebase configuration here!
const firebaseConfig = {
  apiKey: "AIzaSyA8ldsq1Ddnx3WdvieX_BaeJH4QlZQ2dIo",
  authDomain: "demoecomm-36e0e.firebaseapp.com",
  projectId: "demoecomm-36e0e",
  storageBucket: "demoecomm-36e0e.firebasestorage.app",
  messagingSenderId: "1030236095434",
  appId: "1:1030236095434:web:f7088b22b801b9c8144533"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const STORAGE_KEY = "voltkart-products";
const CART_KEY = "voltkart-cart";
const CATEGORIES_KEY = "voltkart-categories";

const defaultProducts = [];
const defaultCategories = [];

async function loadProducts() {
  const snapshot = await getDocs(collection(db, "products"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function saveProducts(product) {
  await addDoc(collection(db, "products"), product);
}

async function deleteProduct(productId) {
  await deleteDoc(doc(db, "products", productId));
}

async function updateProduct(productId, data) {
  await updateDoc(doc(db, "products", productId), data);
}

function loadCart() {
  const stored = localStorage.getItem(CART_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

async function loadCategories() {
  const snapshot = await getDocs(collection(db, "categories"));
  return snapshot.docs.map(doc => doc.data().name);
}

async function saveCategory(name) {
  await addDoc(collection(db, "categories"), { name });
}

function getCartTotals(cart) {
  return {
    lines: cart.length,
    quantity: cart.reduce((total, item) => total + item.quantity, 0)
  };
}

function getProductImage(product) {
  if (product.image) {
    return product.image;
  }

  const paletteMap = {
    "Development Boards": ["#0f766e", "#99f6e4"],
    "Passive Components": ["#b45309", "#fde68a"],
    "IoT Modules": ["#2563eb", "#bfdbfe"],
    "Displays": ["#7c3aed", "#ddd6fe"],
    "Sensors": ["#0891b2", "#a5f3fc"],
    "Power & Motion": ["#be123c", "#fecdd3"]
  };

  const [primary, soft] = paletteMap[product.category] || ["#475569", "#e2e8f0"];
  const label = encodeURIComponent(product.name);
  const category = encodeURIComponent(product.category);

  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 420'>
    <defs>
      <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='${primary}'/>
        <stop offset='100%' stop-color='${soft}'/>
      </linearGradient>
    </defs>
    <rect width='640' height='420' rx='36' fill='url(#bg)'/>
    <circle cx='520' cy='100' r='72' fill='rgba(255,255,255,0.28)'/>
    <circle cx='150' cy='310' r='120' fill='rgba(255,255,255,0.16)'/>
    <rect x='72' y='84' width='210' height='132' rx='18' fill='rgba(255,255,255,0.22)'/>
    <rect x='106' y='120' width='142' height='16' rx='8' fill='white' opacity='0.9'/>
    <rect x='106' y='152' width='100' height='16' rx='8' fill='white' opacity='0.65'/>
    <rect x='72' y='250' width='496' height='98' rx='24' fill='rgba(255,255,255,0.2)'/>
    <text x='72' y='376' font-family='Arial, sans-serif' font-size='24' fill='white' opacity='0.92'>${category}</text>
    <text x='72' y='286' font-family='Arial, sans-serif' font-size='36' font-weight='700' fill='white'>${label}</text>
  </svg>`.trim();

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function createProductCard(product, cart) {
  const inCart = cart.find((item) => item.id === product.id);

  return `
    <article class="product-card" data-trigger="details" data-product-id="${product.id}">
      <div class="product-image-wrap">
        <img class="product-image" src="${getProductImage(product)}" alt="${product.name}">
      </div>
      <div class="product-topline">
        <span class="pill">${product.category}</span>
        <span class="pill stock-pill">${product.stock}</span>
      </div>
      <div class="product-info-grid">
        <h4>${product.name}</h4>
        <div class="description-clamp" id="desc-${product.id}">
          ${product.description}
        </div>
        ${product.description.length > 60 ? `<button class="read-more-btn" type="button" data-product-id="${product.id}">Read More</button>` : ""}
      </div>
      <div class="product-meta">
        <span class="price-tag">${product.price}</span>
        <span>${inCart ? `${inCart.quantity} in cart` : "Ready for enquiry"}</span>
      </div>
      <div class="product-actions">
        <button class="primary-button add-to-cart" type="button" data-product-id="${product.id}">
          ${inCart ? "Add More" : "Add to Cart"}
        </button>
        <button class="text-button quick-enquiry" type="button" data-product-id="${product.id}">
          Quick Enquiry
        </button>
      </div>
    </article>
  `;
}

function createCartItem(product, cartItem) {
  return `
    <article class="cart-item">
      <div class="cart-item-row">
        <div>
          <h4>${product.name}</h4>
          <p>${product.category}</p>
        </div>
        <span class="price-tag">${product.price}</span>
      </div>
      <p>${product.stock}</p>
      <div class="cart-item-row">
        <div class="cart-item-controls">
          <button class="qty-button update-cart" type="button" data-product-id="${product.id}" data-direction="down">-</button>
          <span class="qty-value">${cartItem.quantity}</span>
          <button class="qty-button update-cart" type="button" data-product-id="${product.id}" data-direction="up">+</button>
        </div>
        <button class="remove-button remove-from-cart" type="button" data-product-id="${product.id}">Remove</button>
      </div>
    </article>
  `;
}

function buildCartSummaryText(cart, products) {
  if (cart.length === 0) {
    return "";
  }

  return cart
    .map((cartItem) => {
      const product = products.find((item) => item.id === cartItem.id);
      return product ? `${product.name} x ${cartItem.quantity}` : "";
    })
    .filter(Boolean)
    .join("\n");
}

function renderCategoryStrip(categories, updateGrid) {
  const strip = document.getElementById("category-strip");
  if (!strip) return;

  const searchInput = document.getElementById("search-input");

  strip.innerHTML = `
    <button class="category-chip active-chip" type="button" data-filter="all">All Products</button>
    ${categories.map(cat => `<button class="category-chip" type="button" data-filter="${cat}">${cat}</button>`).join("")}
  `;

  const categoryChips = strip.querySelectorAll(".category-chip");
  categoryChips.forEach((chip) => {
    chip.onclick = () => {
      const filter = chip.dataset.filter || "all";
      searchInput.value = filter === "all" ? "" : filter;
      categoryChips.forEach((item) => item.classList.remove("active-chip"));
      chip.classList.add("active-chip");
      updateGrid();
    };
  });
}

function renderCategorySelect(categories) {
  const select = document.getElementById("category-select");
  if (!select) return;

  select.innerHTML = `
    <option value="" disabled selected>Select a category</option>
    ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join("")}
  `;
}

async function renderStorefront() {
  const grid = document.getElementById("product-grid");
  const count = document.getElementById("product-count");
  const searchInput = document.getElementById("search-input");
  
  if (!grid || !count || !searchInput) return;

  const products = await loadProducts();
  const categories = await loadCategories();

  const updateGrid = () => {
    const cart = loadCart();
    const term = searchInput.value.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
      return haystack.includes(term);
    });

    count.textContent = String(products.length);

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="empty-state">No matching components found. Try a different keyword.</div>';
      return;
    }

    grid.innerHTML = filtered.map((product) => createProductCard(product, cart)).join("");
    attachStorefrontActions(products, updateGrid);
  };

  searchInput.oninput = updateGrid;
  renderCategoryStrip(categories, updateGrid);
  updateGrid();
}

function updateCartUi(products) {
  const cart = loadCart();
  const cartItemsNode = document.getElementById("cart-items");
  const cartCount = document.getElementById("cart-count");
  const cartLineCount = document.getElementById("cart-line-count");
  const cartQuantityCount = document.getElementById("cart-quantity-count");
  const cartItemsMetric = document.getElementById("cart-items-metric");
  const enquiryProduct = document.getElementById("enquiry-product");
  const enquiryMessage = document.getElementById("enquiry-message");
  const submitButton = document.getElementById("submit-enquiry");
  const totals = getCartTotals(cart);

  if (cartCount) {
    cartCount.textContent = String(totals.quantity);
  }

  if (cartLineCount) {
    cartLineCount.textContent = String(totals.lines);
  }

  if (cartQuantityCount) {
    cartQuantityCount.textContent = String(totals.quantity);
  }

  if (cartItemsMetric) {
    cartItemsMetric.textContent = String(totals.quantity);
  }

  if (enquiryProduct) {
    enquiryProduct.value = buildCartSummaryText(cart, products);
  }

  if (enquiryMessage && cart.length > 0 && !enquiryMessage.dataset.edited) {
    enquiryMessage.value = "Hello, I would like a quotation and availability update for the items in my enquiry cart.";
  }

  if (submitButton) {
    submitButton.disabled = cart.length === 0;
  }

  if (!cartItemsNode) {
    return;
  }

  if (cart.length === 0) {
    cartItemsNode.innerHTML = '<div class="empty-state">Your cart is empty. Add products to build an enquiry.</div>';
    attachCartActions(products);
    return;
  }

  cartItemsNode.innerHTML = cart
    .map((cartItem) => {
      const product = products.find((item) => item.id === cartItem.id);
      return product ? createCartItem(product, cartItem) : "";
    })
    .join("");

  attachCartActions(products);
}

function addToCart(productId) {
  const cart = loadCart();
  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }

  saveCart(cart);
}

function updateCartQuantity(productId, direction) {
  const cart = loadCart();
  const nextCart = cart
    .map((item) => {
      if (item.id !== productId) {
        return item;
      }

      const nextQuantity = direction === "up" ? item.quantity + 1 : item.quantity - 1;
      return { ...item, quantity: nextQuantity };
    })
    .filter((item) => item.quantity > 0);

  saveCart(nextCart);
}

function removeFromCart(productId) {
  const nextCart = loadCart().filter((item) => item.id !== productId);
  saveCart(nextCart);
}

function attachStorefrontActions(products, rerenderProducts) {
  document.querySelectorAll(".read-more-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const desc = document.getElementById(`desc-${button.dataset.productId}`);
      if (desc) {
        const isExpanded = desc.classList.toggle("expanded");
        button.textContent = isExpanded ? "Read Less" : "Read More";
      }
    });
  });

  document.querySelectorAll(".quick-enquiry").forEach((button) => {
    button.addEventListener("click", () => {
      addToCart(button.dataset.productId);
      updateCartUi(products);
      rerenderProducts();
      toggleCart(true); // Open sidebar immediately for enquiry
    });
  });
}

function attachCartActions(products) {
  document.querySelectorAll(".update-cart").forEach((button) => {
    button.addEventListener("click", () => {
      updateCartQuantity(button.dataset.productId, button.dataset.direction);
      updateCartUi(products);
      renderStorefront();
    });
  });

  document.querySelectorAll(".remove-from-cart").forEach((button) => {
    button.addEventListener("click", () => {
      removeFromCart(button.dataset.productId);
      updateCartUi(products);
      renderStorefront();
    });
  });

  const clearCartButton = document.getElementById("clear-cart");
  if (clearCartButton) {
    clearCartButton.onclick = () => {
      saveCart([]);
      updateCartUi(products);
      renderStorefront();
    };
  }
}

function setupEnquiryForm(products) {
  const form = document.getElementById("enquiry-form");
  const successBanner = document.getElementById("enquiry-success");
  const enquiryMessage = document.getElementById("enquiry-message");

  if (!form || !successBanner) {
    return;
  }

  if (enquiryMessage) {
    enquiryMessage.addEventListener("input", () => {
      enquiryMessage.dataset.edited = "true";
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (loadCart().length === 0) {
      return;
    }

    successBanner.hidden = false;
    form.reset();
    if (enquiryMessage) {
      delete enquiryMessage.dataset.edited;
    }
    saveCart([]);
    updateCartUi(products);
    renderStorefront(products);
  });
}

function createAdminProductItem(product) {
  return `
    <article class="admin-product-item">
      <div class="admin-product-row">
        <div class="admin-item-preview">
          <img src="${getProductImage(product)}" alt="${product.name}">
        </div>
        <div style="flex: 1;">
          <div class="admin-product-row">
            <div>
              <h4>${product.name}</h4>
              <p>${product.category}</p>
            </div>
            <span class="pill">${product.price}</span>
          </div>
        </div>
      </div>
      <p style="margin-top: 12px;">${product.description}</p>
      <div class="admin-product-actions">
        <button class="primary-button edit-product" type="button" data-product-id="${product.id}">Edit Details</button>
        <button class="danger-button delete-product" type="button" data-product-id="${product.id}">Remove</button>
      </div>
    </article>
  `;
}

function renderAdminList(products) {
  const list = document.getElementById("admin-product-list");
  if (!list) {
    return;
  }

  if (products.length === 0) {
    list.innerHTML = '<div class="empty-state">No products yet. Use the form to add the first listing.</div>';
    return;
  }

  list.innerHTML = products.map(createAdminProductItem).join("");

  document.querySelectorAll(".delete-product").forEach((button) => {
    button.addEventListener("click", async () => {
      if (confirm("Are you sure you want to remove this product?")) {
        await deleteProduct(button.dataset.productId);
        const products = await loadProducts();
        renderAdminList(products);
      }
    });
  });

  document.querySelectorAll(".edit-product").forEach((button) => {
    button.addEventListener("click", () => {
      const product = products.find(p => p.id === button.dataset.productId);
      if (product) openEditModal(product);
    });
  });
}

function openEditModal(product) {
  const modal = document.getElementById("edit-modal");
  const form = document.getElementById("edit-form");
  const categories = loadCategories(); // Will be resolved by the caller mostly or we fetch again

  if (!modal || !form) return;

  // Fill form
  // Fill form
  form.productId.value = product.id;
  form.name.value = product.name;
  form.stock.value = product.stock;
  form.description.value = product.description;
  
  // Robust price extraction
  const priceMatch = product.price.match(/\d+(\.\d+)?/);
  form.price.value = priceMatch ? priceMatch[0] : "";

  // Ensure categories are loaded in the select
  loadCategories().then(list => {
    const select = document.getElementById("edit-category-select");
    select.innerHTML = list.map(cat => `<option value="${cat}" ${cat === product.category ? "selected" : ""}>${cat}</option>`).join("");
  });

  modal.hidden = false;
}

async function setupEditLogic() {
  const modal = document.getElementById("edit-modal");
  const form = document.getElementById("edit-form");
  const closeBtn = document.getElementById("close-modal");
  const cancelBtn = document.getElementById("cancel-edit");

  if (!modal || !form) return;

  const closeModal = () => {
    modal.hidden = true;
    form.reset();
  };

  closeBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const saveBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = saveBtn.textContent;
    
    const formData = new FormData(form);
    const productId = formData.get("productId");
    const imageFile = formData.get("image");
    
    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";

      const updateData = {
        name: formData.get("name").trim(),
        category: formData.get("category"),
        price: `Rs. ${formData.get("price")} / piece`,
        stock: formData.get("stock").trim(),
        description: formData.get("description").trim(),
        updatedAt: new Date().toISOString()
      };

      if (imageFile && imageFile.size > 0) {
        // Check for 1MB Firestore limit
        if (imageFile.size > 1048576) {
          throw new Error("Image is too large (max 1MB). Please use a compressed image.");
        }

        updateData.image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.onerror = (err) => reject(new Error("Failed to read image file."));
          reader.readAsDataURL(imageFile);
        });
      }

      await updateProduct(productId, updateData);
      
      closeModal();
      const products = await loadProducts();
      renderAdminList(products);
      
      // Also refresh storefront if visible (silent)
      if (document.getElementById("product-grid")) {
        renderStorefront();
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert("Error saving: " + error.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = originalBtnText;
    }
  });
}

async function setupAdminForm() {
  const form = document.getElementById("admin-form");
  const successBanner = document.getElementById("admin-success");

  if (!form || !successBanner) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const imageFile = formData.get("image");
    let imageDataUrl = "";

    if (imageFile && imageFile.size > 0) {
      imageDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(imageFile);
      });
    }

    const newProduct = {
      name: String(formData.get("name") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      price: `Rs. ${formData.get("price")} / piece`,
      stock: String(formData.get("stock") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      image: imageDataUrl,
      createdAt: new Date().toISOString()
    };

    await saveProducts(newProduct);
    const products = await loadProducts();
    renderAdminList(products);
    form.reset();
    successBanner.hidden = false;
    setTimeout(() => { successBanner.hidden = true; }, 3000);
  });

  const products = await loadProducts();
  renderAdminList(products);
}

async function setupCategoryForm() {
  const form = document.getElementById("category-form");
  const successBanner = document.getElementById("category-success");

  if (!form || !successBanner) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const categoryName = String(formData.get("categoryName") || "").trim();

    if (categoryName) {
      await saveCategory(categoryName);
      const categories = await loadCategories();
      renderCategorySelect(categories);
      form.reset();
      successBanner.hidden = false;
      setTimeout(() => { successBanner.hidden = true; }, 3000);
    }
  });
}

function toggleCart(isOpen) {
  document.body.classList.toggle("cart-open", isOpen);
  if (isOpen) toggleDetails(false); // Close details if cart opens
}

function toggleDetails(isOpen) {
  document.body.classList.toggle("details-open", isOpen);
}

async function openProductDetails(productId) {
  const products = await loadProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const content = document.getElementById('details-content');
  if (!content) return;

  const cart = loadCart();
  const inCart = cart.find(item => item.id === product.id);

  content.innerHTML = `
    <img class="details-hero-image" src="${getProductImage(product)}" alt="${product.name}">
    <div class="details-info">
      <span class="pill">${product.category}</span>
      <h2>${product.name}</h2>
      <div class="details-meta-grid">
        <div class="details-meta-item">
          <span>Price</span>
          <strong>${product.price}</strong>
        </div>
        <div class="details-meta-item">
          <span>Availability</span>
          <strong>${product.stock}</strong>
        </div>
      </div>
      <div class="details-description">
        ${product.description}
      </div>
      <div class="details-actions">
        <button class="primary-button add-to-cart" data-product-id="${product.id}">
          ${inCart ? "Add More to Enquiry" : "Add to Enquiry List"}
        </button>
        <button class="secondary-button" onclick="toggleDetails(false)">Continue Browsing</button>
      </div>
    </div>
  `;

  toggleDetails(true);
}

function setupScrollProgress() {
  const progressBar = document.getElementById("scroll-progress");
  if (!progressBar) return;

  const updateProgress = () => {
    const winScroll = window.pageYOffset || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (height > 0) {
      const scrolled = (winScroll / height) * 100;
      progressBar.style.width = scrolled + "%";
    }
  };

  window.addEventListener('scroll', updateProgress);
  updateProgress(); // Initialize on load
}

async function initializePage() {
  const page = document.body.dataset.page;
  
  if (page === "storefront") {
    setupScrollProgress();
    
    // Sidebar Cart Listeners - ATTACH THESE FIRST
    const closeBtn = document.getElementById('close-cart');
    const overlay = document.getElementById('cart-overlay');

    // Global listener for all Cart Open triggers (Header, Hero, etc.)
    document.addEventListener('click', (e) => {
      // Cart Trigger
      const cartTrigger = e.target.closest('[href="#cart-panel"], .cart-chip');
      if (cartTrigger) {
        e.preventDefault();
        toggleCart(true);
        return;
      }

      // Add to Cart (Delegated for static and dynamic buttons)
      const addBtn = e.target.closest('.add-to-cart');
      if (addBtn) {
        addToCart(addBtn.dataset.productId);
        updateCartUi(products);
        renderStorefront(); // Refresh grid to show "in cart" status
        toggleCart(true);   // Show feedback
        return;
      }

      // Details Trigger
      const detailsTrigger = e.target.closest('[data-trigger="details"]');
      const actionButton = e.target.closest('button, .read-more-btn');
      
      // Open details ONLY if we clicked the card and NOT a button inside it
      if (detailsTrigger && !actionButton) {
        openProductDetails(detailsTrigger.dataset.productId);
        return;
      }
    });

    const closeCartBtn = document.getElementById('close-cart');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeDetailsBtn = document.getElementById('close-details');
    const detailsOverlay = document.getElementById('details-overlay');

    if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
    if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCart(false));
    if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', () => toggleDetails(false));
    if (detailsOverlay) detailsOverlay.addEventListener('click', () => toggleDetails(false));
  }

  // Now load data
  try {
    const categories = await loadCategories();
    const products = await loadProducts();

    if (page === "storefront") {
      await renderStorefront();
      updateCartUi(products);
      setupEnquiryForm(products);
    }

    if (page === "admin") {
      renderCategorySelect(categories);
      await setupAdminForm();
      await setupCategoryForm();
      await setupEditLogic();
    }
  } catch (err) {
    console.warn("Data loading partial failure:", err);
    // Even if data fails, UI listeners above are already active!
  }
}

initializePage();
