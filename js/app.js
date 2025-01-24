const productGrid = document.getElementById("product-grid");
const cartItems = document.getElementById("cart-items");
const totalItems = document.getElementById("total-items");
const totalPrice = document.getElementById("total-price");

let cart = JSON.parse(localStorage.getItem("cart")) || {};
let products = [];

// Fetch products from data.json
fetch("data/data.json")
    .then((response) => response.json())
    .then((data) => {
        products = data;
        renderProducts();
        updateCartDisplay();
    });

// Render product cards
function renderProducts() {
    productGrid.innerHTML = products
        .map((product) => {
            // Check if the product is out of stock (stock is 0)
            const isOutOfStock = product.rating.count <= 0;
            
            // Check if the product is in the cart and its quantity
            const isInCart = cart[product.id] && cart[product.id].quantity >= product.rating.count;

            return `
                <div class="col-md-4">
                    <div class="product-card">
                        <img src="${product.image}" class="product-img" alt="${product.title}">
                        <div class="product-body">
                            <h5 class="product-title">${product.title}</h5>
                            <p class="product-price">Rs.${product.price.toFixed(2)}</p>
                            <p class="product-stock">Stock: ${product.rating.count}</p>
                            <button class="btn btn-primary add-to-cart" data-id="${product.id}" ${isOutOfStock ? "disabled" : ""}>
                                ${isOutOfStock ? "Out of Stock" : "Add to Cart"}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        })
        .join(""); // Join ensures no commas appear between items

    // Add event listener to the "Add to Cart" buttons
    document.querySelectorAll(".add-to-cart").forEach((button) => {
        button.addEventListener("click", (e) => {
            const productId = e.target.dataset.id;
            addToCart(productId); // Call the addToCart function when the button is clicked
        });
    });
}

// Add to cart
function addToCart(productId) {
    const product = products.find((p) => p.id == productId);

    if (!cart[productId]) {
        cart[productId] = {
            ...product,
            quantity: 1,
        };
    } else {
        // Only add if the quantity is less than the available stock
        if (cart[productId].quantity < product.rating.count) {
            cart[productId].quantity++;
        } else {
            showNotification(`Cannot add more. Stock limit reached for ${product.title}`);
            return;
        }
    }

    product.rating.count--; // Decrease stock when added to cart

    if (product.rating.count <= 0) {
        product.rating.count = 0;
    }

    showNotification(`${product.title} added to cart!`);
    saveCart();
    renderProducts();
    updateCartDisplay();
}

// Update cart display
function updateCartDisplay() {
    const cartArray = Object.values(cart);
    cartItems.innerHTML = cartArray
        .map((item) => {
            const unitPrice = getDiscountedPrice(item);
            const product = products.find(p => p.id === item.id); // Get product to check stock
            const maxAddQuantity = product.rating.count + item.quantity; // Total available quantity

            return `
                <div class="cart-item">
                    <img src="${item.image}" class="product-img" alt="${item.title}">
                    <span>${item.title} (x${item.quantity})</span>
                    <span>Rs.${(unitPrice * item.quantity).toFixed(2)}</span>

                    <!-- Minus button to decrease quantity -->
                    <span onclick="changeQuantity(${item.id}, -1)" class="cart-quantity-control">
                        <i class="bi bi-dash-circle"></i>
                    </span>

                    <!-- Plus button to increase quantity -->
                    <span onclick="changeQuantity(${item.id}, 1)" class="cart-quantity-control" 
                        ${item.quantity >= maxAddQuantity ? "disabled" : ""}>
                        <i class="bi bi-plus-circle"></i>
                    </span>

                    <!-- Trash icon to remove item from cart -->
                    <span onclick="removeFromCart(${item.id})">
                        <i class="bi bi-trash3-fill" style="color:red;"></i>
                    </span>
                </div>
            `;
        })
        .join("");

    const total = cartArray.reduce((acc, item) => acc + getDiscountedPrice(item) * item.quantity, 0);

    totalItems.textContent = cartArray.length;
    totalPrice.textContent = total.toFixed(2);
}

// Change quantity (add or subtract)
function changeQuantity(productId, change) {
    const product = cart[productId];
    const productInStock = products.find((p) => p.id === productId);  // Get the product to check stock

    if (product) {
        const maxAddQuantity = productInStock.rating.count + product.quantity;  // Calculate how many more can be added
        const newQuantity = product.quantity + change;

        // Check if we are trying to decrease the quantity below 1
        if (newQuantity <= 0) {
            removeFromCart(productId);  // If quantity is 0 or below, remove the product from the cart
        } else if (newQuantity <= maxAddQuantity) {
            // Update quantity if within available stock
            product.quantity = newQuantity;
            productInStock.rating.count -= change;  // Update stock count accordingly

            if (productInStock.rating.count < 0) {
                productInStock.rating.count = 0;
            }

            saveCart();
            updateCartDisplay();  // Re-render cart with updated quantity
            renderProducts();  // Re-render product grid with updated stock
        } else {
            // Show notification if we try to add more than the available stock
            showNotification(`Cannot add more of ${product.title}. Stock limit reached!`);
        }
    }
}

// Remove item from cart
function removeFromCart(productId) {
    const product = cart[productId];
    if (product) {
        products.find((p) => p.id == productId).rating.count += product.quantity;  // Return stock to available
        delete cart[productId];  // Remove product from the cart
    }

    // saveCart();
    updateCartDisplay();
    renderProducts();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// Show notifications
function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification show";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

// Get discounted price based on quantity
function getDiscountedPrice(item) {
    if (item.quantity > 5) {
        return item.price * 0.9;
    } else if (item.quantity > 2) {
        return item.price * 0.95;
    }
    return item.price;
}
