/**
 * Improved Coffee Shop Script
 * - Dynamic cart management with quantity increment
 * - Local currency support (Philippine Peso)
 * - No static cart items on load
 * - Enhanced accessibility
 * - Modernized event handling
 * - Checkout animation and total display
 * - Scroll reveal animations for sections
 */

const navbar = document.querySelector(".navbar");
const searchForm = document.querySelector(".search-form");
const cartItemContainer = document.querySelector(".cart-items-container");
const checkoutBtn = cartItemContainer.querySelector(".checkout-btn"); // Get checkout button reference

const menuBtn = document.querySelector("#menu-btn");
const searchBtn = document.querySelector("#search-btn");
const cartBtn = document.querySelector("#cart-btn");

let cartItems = []; // Array to hold cart items

// Utility to escape HTML for security
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Close all overlays utility
function closeAllOverlays() {
  if (navbar && navbar.classList.contains("active")) {
    navbar.classList.remove("active");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
  }
  if (searchForm && searchForm.classList.contains("active")) {
    searchForm.classList.remove("active");
  }
  if (cartItemContainer && cartItemContainer.classList.contains("active")) {
    cartItemContainer.classList.remove("active");
  }
}

// Hamburger menu toggle
function toggleNavbar() {
  closeAllOverlays(); // Close others before opening this one
  if (navbar) {
    navbar.classList.toggle("active");
    if (menuBtn) {
      menuBtn.setAttribute(
        "aria-expanded",
        navbar.classList.contains("active")
      );
    }
  }
}

// Search form toggle
function toggleSearchForm() {
  closeAllOverlays(); // Close others before opening this one
  if (searchForm) {
    searchForm.classList.toggle("active");
    const searchBox = document.getElementById("search-box");
    if (searchForm.classList.contains("active") && searchBox) {
      searchBox.focus(); // Focus on search input when active
    }
  }
}

// Cart toggle
function toggleCartItem() {
  closeAllOverlays(); // Close others before opening this one
  if (cartItemContainer) {
    cartItemContainer.classList.toggle("active");
  }
}

// Debounce utility to limit function calls on scroll
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Event listeners for header icons
if (menuBtn) menuBtn.addEventListener("click", toggleNavbar);
if (searchBtn) searchBtn.addEventListener("click", toggleSearchForm);
if (cartBtn) cartBtn.addEventListener("click", toggleCartItem);

// Close overlays when scrolling
window.addEventListener("scroll", debounce(closeAllOverlays, 100));

// Close overlays when clicking outside
document.addEventListener("click", function (e) {
  // Check if the click is outside the header, search form, cart, and menu button
  const isHeaderClick = e.target.closest(".header");
  const isSearchFormClick = e.target.closest(".search-form");
  const isCartClick = e.target.closest(".cart-items-container");
  const isMenuBtnClick = e.target.closest("#menu-btn");
  const isSearchBtnClick = e.target.closest("#search-btn");
  const isCartBtnClick = e.target.closest("#cart-btn");
  const isCheckoutModalClick = e.target.closest(".checkout-modal-content"); // For the new modal

  if (
    !isHeaderClick &&
    !isSearchFormClick &&
    !isCartClick &&
    !isMenuBtnClick &&
    !isSearchBtnClick &&
    !isCartBtnClick &&
    !isCheckoutModalClick
  ) {
    closeAllOverlays();
    hideCheckoutModal(); // Also hide checkout modal if clicked outside
  }
});

// Cart functionality: Add/Remove items dynamically
document.addEventListener("click", function (e) {
  // Add to cart: only handle .add-to-cart-btn inside .box
  const addToCartBtn = e.target.closest(".add-to-cart-btn");
  if (addToCartBtn) {
    e.preventDefault(); // Prevent default link behavior
    const box = addToCartBtn.closest(".box");
    if (box) {
      const img = box.getAttribute("data-img") || "";
      const title = box.getAttribute("data-title") || "Item";
      const price = box.getAttribute("data-price") || "0.00"; // Get raw price
      addToCart({ img, title, price });
      toggleCartItem(); // Open cart when item is added
    }
  }

  // Remove from cart: only handle .fa-times inside .cart-items-container
  if (
    e.target.classList.contains("fa-times") &&
    cartItemContainer &&
    cartItemContainer.contains(e.target)
  ) {
    const item = e.target.closest(".cart-item");
    if (item) {
      const index = parseInt(item.getAttribute("data-index"));
      removeItemFromCart(index); // Use the stored index for removal
    }
  }
});

function addToCart({ img, title, price }) {
  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice)) {
    console.error("Invalid price for item:", title, price);
    return;
  }

  const existingItem = cartItems.find((item) => item.title === title);

  if (existingItem) {
    existingItem.quantity++; // Increment quantity if item already exists
  } else {
    const newItem = {
      img: img,
      title: title,
      price: numericPrice,
      quantity: 1, // Default quantity for new item
    };
    cartItems.push(newItem);
  }

  renderCartItems(); // Re-render the entire cart
  updateCartTotal(); // Update total after adding
}

function renderCartItems() {
  // Clear existing items in the DOM (except the checkout button and total)
  const existingCartElements = cartItemContainer.querySelectorAll(
    ".cart-item, .empty-cart-message, .total-price"
  );
  existingCartElements.forEach((item) => {
    if (!item.classList.contains("checkout-btn")) {
      // Don't remove checkout button
      item.remove();
    }
  });

  // Insert new items
  const checkoutBtn = cartItemContainer.querySelector(".checkout-btn");

  if (cartItems.length === 0) {
    // If cart is empty, display a message
    const emptyMessage = document.createElement("p");
    emptyMessage.classList.add("empty-cart-message");
    emptyMessage.textContent = "Your cart is empty.";
    cartItemContainer.insertBefore(emptyMessage, checkoutBtn);
  } else {
    // Add each item from the cartItems array
    cartItems.forEach((item, index) => {
      const cartItemDiv = document.createElement("div");
      cartItemDiv.className = "cart-item";
      cartItemDiv.setAttribute("data-index", index); // Store index for easy removal

      const removeBtn = document.createElement("span");
      removeBtn.className = "fas fa-times";
      removeBtn.setAttribute("aria-label", `Remove ${item.title}`);
      removeBtn.setAttribute("tabindex", "0");
      // Event listener for removal is now handled by the main click listener
      // and uses the data-index attribute to identify the item.

      const image = document.createElement("img");
      image.src = escapeHTML(item.img);
      image.alt = escapeHTML(item.title);

      const content = document.createElement("div");
      content.className = "content";

      const h3 = document.createElement("h3");
      h3.textContent = escapeHTML(item.title);

      const quantityDiv = document.createElement("div"); // New: Display quantity
      quantityDiv.className = "quantity";
      quantityDiv.textContent = `Qty: ${item.quantity}`;

      const priceDiv = document.createElement("div");
      priceDiv.className = "price";
      // Format price to Philippine Peso, showing total for item
      priceDiv.textContent = `₱${(item.price * item.quantity).toFixed(2)}/-`;

      content.appendChild(h3);
      content.appendChild(quantityDiv); // Append quantity
      content.appendChild(priceDiv);

      cartItemDiv.appendChild(removeBtn);
      cartItemDiv.appendChild(image);
      cartItemDiv.appendChild(content);

      cartItemContainer.insertBefore(cartItemDiv, checkoutBtn);
    });
  }
}

function removeItemFromCart(index) {
  if (index > -1 && index < cartItems.length) {
    cartItems.splice(index, 1); // Remove item from array
    renderCartItems(); // Re-render the cart
    updateCartTotal(); // Update total
  }
}

function updateCartTotal() {
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  let totalElement = document.getElementById("cart-total");

  if (!totalElement) {
    totalElement = document.createElement("div");
    totalElement.id = "cart-total";
    totalElement.className = "total-price";
    const checkoutBtn = cartItemContainer.querySelector(".checkout-btn");
    cartItemContainer.insertBefore(totalElement, checkoutBtn);
  }

  totalElement.textContent = `Total: ₱${total.toFixed(2)}/-`;

  // Hide total if cart is empty, otherwise show
  if (cartItems.length === 0) {
    totalElement.style.display = "none";
  } else {
    totalElement.style.display = "block";
  }
}

// Checkout functionality
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", function (e) {
    e.preventDefault();
    if (cartItems.length === 0) {
      // Use a custom message box instead of alert
      showCustomMessage(
        "Your cart is empty. Please add items before checking out.",
        "info"
      );
      return;
    }
    showCheckoutModal();
    // Simulate order processing
    setTimeout(() => {
      cartItems = []; // Clear cart after successful checkout
      renderCartItems();
      updateCartTotal();
      hideCheckoutModal();
      // Updated checkout message
      showCustomMessage(
        "Thank you for your order! Your order is being processed and will be delivered within 15 minutes.",
        "success"
      );
      closeAllOverlays(); // Close cart after checkout
    }, 2000); // Simulate 2-second processing
  });
}

// Custom message box function (replaces alert)
function showCustomMessage(message, type = "info", duration = 3000) {
  let messageBox = document.getElementById("custom-message-box");
  if (!messageBox) {
    messageBox = document.createElement("div");
    messageBox.id = "custom-message-box";
    messageBox.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 15px 25px;
      border-radius: 8px;
      font-size: 1.8rem;
      color: white;
      text-align: center;
      z-index: 1003;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.5s ease, visibility 0.5s ease;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(messageBox);
  }

  // Set background based on message type
  let bgColor = "#333"; // Default info
  if (type === "success") {
    bgColor = "#4CAF50";
  } else if (type === "error") {
    bgColor = "#f44336";
  }
  messageBox.style.backgroundColor = bgColor;
  messageBox.textContent = message;

  messageBox.style.opacity = "1";
  messageBox.style.visibility = "visible";

  setTimeout(() => {
    messageBox.style.opacity = "0";
    messageBox.style.visibility = "hidden";
  }, duration);
}

// Checkout Modal Functions
function showCheckoutModal() {
  let modal = document.getElementById("checkout-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "checkout-modal";
    modal.className = "checkout-modal";
    modal.innerHTML = `
      <div class="checkout-modal-content">
        <h3>Order Confirmed!</h3>
        <p>Your order is being processed. Please wait a moment.</p>
        <div class="loader"></div> <button class="btn close-modal-btn">Close</button>
      </div>
    `;
    document.body.appendChild(modal);

    // Add loader CSS
    const style = document.createElement("style");
    style.innerHTML = `
      .loader {
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--main-color);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    modal
      .querySelector(".close-modal-btn")
      .addEventListener("click", hideCheckoutModal);
  }
  modal.classList.add("active");
}

function hideCheckoutModal() {
  const modal = document.getElementById("checkout-modal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// Scroll Reveal Animation (Intersection Observer)
const sections = document.querySelectorAll("section");

const revealSection = function (entries, observer) {
  const [entry] = entries;

  if (!entry.isIntersecting) return;

  entry.target.classList.remove("section-hidden");
  entry.target.classList.add("section-visible");
  observer.unobserve(entry.target);
};

const sectionObserver = new IntersectionObserver(revealSection, {
  root: null, // viewport
  threshold: 0.15, // 15% of section visible
});

sections.forEach(function (section) {
  section.classList.add("section-hidden"); // Add hidden class initially
  sectionObserver.observe(section);
});

// Ensure cart is empty on load and render initial state
window.addEventListener("DOMContentLoaded", function () {
  cartItems = []; // Ensure cart is truly empty on load
  renderCartItems(); // Render the empty cart state
  updateCartTotal(); // Initialize total (will be 0)

  // Add event listener for contact form submission
  const contactForm = document.querySelector(".contacts form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault(); // Prevent actual form submission
      showCustomMessage(
        "Thank you for your message! We'll get back to you soon.",
        "success"
      );
      contactForm.reset(); // Clear the form
    });
  }
});
