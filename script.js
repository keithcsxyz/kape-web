/**
 * Improved Coffee Shop Script
 * - Dynamic cart management with quantity increment
 * - Local currency support (Philippine Peso)
 * - No static cart items on load
 * - Enhanced accessibility
 * - Modernized event handling
 * - Checkout animation and total display
 * - Scroll reveal animations for sections
 * - Fixed modal close button positioning and functionality
 * - Improved error handling and element existence checks
 * - Removed redundant navbar toggle logic (Bootstrap handles it)
 * - Adjusted z-indexes for modals
 */

// const navbar = document.querySelector(".navbar"); // Not directly used for custom toggle anymore
const searchForm = document.querySelector(".search-form");
const cartItemContainer = document.querySelector(".cart-items-container");

// const menuBtn = document.querySelector("#menu-btn"); // Bootstrap handles this button's main functionality
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

// Close all custom overlays utility
function closeAllOverlays() {
  // Note: Bootstrap's navbar collapse is handled by Bootstrap's JS
  // No need to manually remove .active from the main navbar for this purpose.

  if (searchForm && searchForm.classList.contains("active")) {
    searchForm.classList.remove("active");
  }
  if (cartItemContainer && cartItemContainer.classList.contains("active")) {
    cartItemContainer.classList.remove("active");
  }
}

// REMOVED: toggleNavbar function - Bootstrap handles collapse via data attributes

// Search form toggle
function toggleSearchForm() {
  // Close cart if open, before opening search
  if (cartItemContainer && cartItemContainer.classList.contains("active")) {
    cartItemContainer.classList.remove("active");
  }
  if (searchForm) {
    searchForm.classList.toggle("active");
    const searchBox = document.getElementById("search-box");
    if (searchForm.classList.contains("active") && searchBox) {
      searchBox.focus();
    }
  }
}

// Cart toggle
function toggleCartItem() {
  // Close search if open, before opening cart
  if (searchForm && searchForm.classList.contains("active")) {
    searchForm.classList.remove("active");
  }
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
// if (menuBtn) menuBtn.addEventListener("click", toggleNavbar); // REMOVED: Bootstrap handles menu toggle
if (searchBtn) searchBtn.addEventListener("click", toggleSearchForm);
if (cartBtn) cartBtn.addEventListener("click", toggleCartItem);

// Close custom overlays when scrolling
window.addEventListener("scroll", debounce(closeAllOverlays, 100));

// Close custom overlays when clicking outside
document.addEventListener("click", function (e) {
  const isHeaderContentClick = e.target.closest(
    ".header .navbar-brand, .header .navbar-nav, .header .d-flex > .fas"
  ); // More specific clicks within header
  const isSearchFormClick = e.target.closest(".search-form");
  const isCartClick = e.target.closest(".cart-items-container");
  const isCheckoutModalClick = e.target.closest(".checkout-modal-content");

  // Check if the click target is one of the toggle buttons themselves
  const isMenuButton = e.target.closest(".navbar-toggler"); // Bootstrap's menu button
  const isSearchButton = e.target.closest("#search-btn");
  const isCartButton = e.target.closest("#cart-btn");

  if (
    !isHeaderContentClick && // if not a click on general header content
    !isSearchFormClick &&
    !isCartClick &&
    !isCheckoutModalClick &&
    !isMenuButton && // and not a click on the menu toggle button itself
    !isSearchButton && // and not a click on the search toggle button
    !isCartButton // and not a click on the cart toggle button
  ) {
    // Check if the click is outside the Bootstrap collapsed menu as well
    const navbarCollapse = document.querySelector(".navbar-collapse");
    if (
      navbarCollapse &&
      !navbarCollapse.contains(e.target) &&
      !e.target.closest(".navbar-toggler")
    ) {
      // If Bootstrap menu is open and click is outside, Bootstrap handles its closing.
      // We only need to close our custom overlays.
      closeAllOverlays();
    } else if (!navbarCollapse || !navbarCollapse.classList.contains("show")) {
      // If bootstrap menu is not open or doesn't exist, close our overlays
      closeAllOverlays();
    }
    hideCheckoutModal(); // Also hide checkout modal if clicked outside
  }
});

// Cart functionality: Add/Remove items dynamically
document.addEventListener("click", function (e) {
  const addToCartBtn = e.target.closest(".add-to-cart-btn");
  if (addToCartBtn) {
    e.preventDefault();
    const box = addToCartBtn.closest(".box"); // Ensure it's from a product/menu box
    if (box) {
      const img = box.dataset.img || box.querySelector("img")?.src || ""; // Use dataset or find img src
      const title =
        box.dataset.title || box.querySelector("h3")?.textContent || "Item";
      const price =
        box.dataset.price ||
        box.querySelector(".price")?.textContent.match(/[\d\.]+/)?.[0] ||
        "0.00";
      addToCart({ img, title, price });
      if (!cartItemContainer.classList.contains("active")) {
        toggleCartItem(); // Open cart when item is added, if not already open
      }
    }
  }

  if (
    e.target.classList.contains("fa-times") &&
    cartItemContainer &&
    cartItemContainer.contains(e.target)
  ) {
    const itemElement = e.target.closest(".cart-item");
    if (itemElement) {
      const index = parseInt(itemElement.getAttribute("data-index"));
      if (!isNaN(index)) {
        removeItemFromCart(index);
      }
    }
  }
});

function addToCart({ img, title, price }) {
  const numericPrice = parseFloat(String(price).replace(/[^0-9.]/g, "")); // Clean price string
  if (isNaN(numericPrice)) {
    console.error("Invalid price for item:", title, price);
    return;
  }

  const existingItem = cartItems.find((item) => item.title === title);

  if (existingItem) {
    existingItem.quantity++;
  } else {
    const newItem = {
      img: img,
      title: title,
      price: numericPrice,
      quantity: 1,
    };
    cartItems.push(newItem);
  }

  renderCartItems();
  updateCartTotal();
}

function renderCartItems() {
  if (!cartItemContainer) return;

  const existingCartElements = cartItemContainer.querySelectorAll(
    ".cart-item, .empty-cart-message, .total-price"
  );
  existingCartElements.forEach((item) => {
    item.remove();
  });

  let checkoutBtn = cartItemContainer.querySelector(".checkout-btn");
  if (!checkoutBtn) {
    // The checkout button is now static in the HTML, so this block might not be needed
    // if it's guaranteed to be there. If it's dynamically added, this is fine.
    // For this example, assuming it's in the HTML:
    checkoutBtn = document.querySelector(".cart-items-container .checkout-btn");
    if (!checkoutBtn) {
      // If truly not found, create it (fallback)
      checkoutBtn = document.createElement("a"); // was button, but HTML has <a>
      checkoutBtn.href = "#"; //
      checkoutBtn.className = "btn checkout-btn";
      checkoutBtn.textContent = "Checkout Now"; // Match HTML
      cartItemContainer.appendChild(checkoutBtn);
    }
  }

  // Ensure checkout button has the event listener (if it wasn't there or re-added)
  // To prevent multiple listeners, consider adding it once on DOMContentLoaded
  // For simplicity here, re-adding if it was dynamically created (but check HTML first)

  if (cartItems.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.classList.add("empty-cart-message");
    emptyMessage.textContent = "Your cart is empty.";
    cartItemContainer.insertBefore(emptyMessage, checkoutBtn); // Insert before checkout button
  } else {
    cartItems.forEach((item, index) => {
      const cartItemDiv = document.createElement("div");
      cartItemDiv.className = "cart-item";
      cartItemDiv.setAttribute("data-index", index);

      const removeBtn = document.createElement("span");
      removeBtn.className = "fas fa-times";
      removeBtn.setAttribute("aria-label", `Remove ${escapeHTML(item.title)}`);
      removeBtn.setAttribute("tabindex", "0");
      removeBtn.style.cursor = "pointer";

      const image = document.createElement("img");
      image.src = escapeHTML(item.img);
      image.alt = escapeHTML(item.title);

      const content = document.createElement("div");
      content.className = "content";

      const h3 = document.createElement("h3");
      h3.textContent = escapeHTML(item.title);

      const quantityDiv = document.createElement("div");
      quantityDiv.className = "quantity"; // Consider styling this class
      quantityDiv.textContent = `Qty: ${item.quantity}`;

      const priceDiv = document.createElement("div");
      priceDiv.className = "price";
      priceDiv.textContent = `₱${(item.price * item.quantity).toFixed(2)}`; // Removed /-

      content.appendChild(h3);
      content.appendChild(quantityDiv);
      content.appendChild(priceDiv);

      cartItemDiv.appendChild(removeBtn);
      cartItemDiv.appendChild(image);
      cartItemDiv.appendChild(content);

      cartItemContainer.insertBefore(cartItemDiv, checkoutBtn); // Insert before checkout button
    });
  }
}

function removeItemFromCart(index) {
  if (index > -1 && index < cartItems.length) {
    cartItems.splice(index, 1);
    renderCartItems();
    updateCartTotal();
  }
}

function updateCartTotal() {
  if (!cartItemContainer) return;

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  let totalElement = cartItemContainer.querySelector("#cart-total"); // Use querySelector for consistency

  if (!totalElement) {
    totalElement = document.createElement("div");
    totalElement.id = "cart-total";
    totalElement.className = "total-price"; // Matches CSS for styling
    const checkoutBtn = cartItemContainer.querySelector(".checkout-btn");
    if (checkoutBtn) {
      cartItemContainer.insertBefore(totalElement, checkoutBtn);
    } else {
      cartItemContainer.appendChild(totalElement); // Fallback if no checkout button
    }
  }

  totalElement.textContent = `Total: ₱${total.toFixed(2)}`; // Removed /-

  if (cartItems.length === 0) {
    totalElement.style.display = "none";
  } else {
    totalElement.style.display = "block"; // Or "flex", "grid" depending on layout
  }
}

function showCustomMessage(message, type = "info", duration = 3000) {
  let messageBox = document.getElementById("custom-message-box");
  if (!messageBox) {
    messageBox = document.createElement("div");
    messageBox.id = "custom-message-box";
    // Apply styles via CSS or ensure they are robust
    messageBox.style.cssText = `
      position: fixed;
      top: 20px; /* Or below a fixed header: e.g., calc(var(--header-height, 9.5rem) + 20px) */
      left: 50%;
      transform: translateX(-50%);
      padding: 15px 25px;
      border-radius: 8px;
      font-size: 1.6rem; /* Adjusted from 1.8rem for potentially better fit */
      color: white;
      text-align: center;
      z-index: 1060; /* <<< INCREASED Z-INDEX */
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.5s ease, visibility 0.5s ease, top 0.5s ease;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      max-width: 90%;
      word-wrap: break-word;
    `;
    document.body.appendChild(messageBox);
  }

  let bgColor = "#333";
  if (type === "success") bgColor = "#4CAF50";
  else if (type === "error") bgColor = "#f44336";
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
    // Create if it doesn't exist (though it's in CSS, JS might need to activate it)
    // This dynamic creation is okay if HTML doesn't include it.
    // However, the provided HTML does NOT have the modal structure.
    // The CSS in style.css defines .checkout-modal.
    // So, we should assume it exists in HTML or create it if truly dynamic.
    // Let's assume it's NOT in HTML and this script creates it:
    modal = document.createElement("div");
    modal.id = "checkout-modal"; // This ID is targeted by CSS .checkout-modal
    modal.className = "checkout-modal"; // Class for CSS styling
    // style.css has styles for .checkout-modal, .checkout-modal-content

    const modalContent = document.createElement("div");
    modalContent.className = "checkout-modal-content";

    modalContent.innerHTML = `
      <h3>Order Confirmed!</h3>
      <p>Your order is being processed. Please wait a moment.</p>
      <div class="loader" style="
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--main-color, #d3ad7f);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
      "></div>
      <button class="btn close-modal-btn">Close</button>
    `;
    // Note: The styles for h3, p, btn inside modalContent should come from style.css

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    if (!document.getElementById("modal-spinner-css")) {
      const style = document.createElement("style");
      style.id = "modal-spinner-css";
      style.innerHTML = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    modal
      .querySelector(".close-modal-btn")
      .addEventListener("click", hideCheckoutModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        hideCheckoutModal();
      }
    });
  }
  // If modal structure is already in HTML and hidden by CSS:
  // modal = document.getElementById("checkout-modal");

  if (modal) {
    // Ensure modal exists before trying to activate
    modal.classList.add("active"); // This class should trigger visibility via CSS
  } else {
    console.error("Checkout modal element not found or created.");
  }
}

function hideCheckoutModal() {
  const modal = document.getElementById("checkout-modal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// Scroll Reveal Animation (Intersection Observer)
function initScrollReveal() {
  const sections = document.querySelectorAll("section.section-hidden"); // Be more specific if needed

  if (sections.length === 0) {
    // If sections don't have .section-hidden initially, add it
    document
      .querySelectorAll("section")
      .forEach((sec) => sec.classList.add("section-hidden"));
    // Then re-query
    // sections = document.querySelectorAll("section.section-hidden");
    // Or, better, ensure sections in HTML that need reveal have this class,
    // or apply it here before observing.
  }

  const revealSection = function (entries, observer) {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("section-visible");
      entry.target.classList.remove("section-hidden"); // Remove hidden after visible for transition
      observer.unobserve(entry.target);
    });
  };

  const sectionObserver = new IntersectionObserver(revealSection, {
    root: null,
    threshold: 0.15,
  });

  document.querySelectorAll("section").forEach(function (section) {
    // Ensure all sections start hidden if they are to be revealed
    if (!section.classList.contains("section-visible")) {
      // Avoid re-hiding already visible
      section.classList.add("section-hidden");
    }
    sectionObserver.observe(section);
  });
}

// Initialize everything when DOM is loaded
window.addEventListener("DOMContentLoaded", function () {
  cartItems = [];
  renderCartItems();
  updateCartTotal();
  initScrollReveal();

  const contactForm = document.querySelector(".contacts form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      showCustomMessage(
        "Thank you for your message! We'll get back to you soon.",
        "success"
      );
      contactForm.reset();
    });
  }

  // Add event listener for the statically placed checkout button in cart
  const staticCheckoutBtn = document.querySelector(
    ".cart-items-container .checkout-btn"
  );
  if (staticCheckoutBtn) {
    staticCheckoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (cartItems.length === 0) {
        showCustomMessage(
          "Your cart is empty. Please add items before checking out.",
          "info"
        );
        return;
      }
      showCheckoutModal();
      setTimeout(() => {
        cartItems = [];
        renderCartItems();
        updateCartTotal();
        hideCheckoutModal();
        showCustomMessage(
          "Thank you for your order! Your order is being processed and will be delivered within 15 minutes.",
          "success"
        );
        if (
          cartItemContainer &&
          cartItemContainer.classList.contains("active")
        ) {
          cartItemContainer.classList.remove("active"); // Close cart panel
        }
      }, 2000);
    });
  }
});
