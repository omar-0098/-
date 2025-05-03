const soldCounts = {};

// ✅ القوائم وفتح وإغلاق القوائم
let categoru_nav_list = document.querySelector(".categoru_nav_list");
function Open_Categ_list() {
  categoru_nav_list.classList.toggle("active");
}

let nav_links = document.querySelector(".nav_links");
function open_Menu() {
  nav_links.classList.toggle("active");
}

let cartPanel = document.querySelector(".cart");
function open_close_cart() {
  cartPanel.classList.toggle("active");
}

// ✅ أسعار الشحن حسب المحافظة
const shippingPrices = {
  cairo: 30, alexandria: 40, giza: 30, aswan: 50, asiyut: 50, beheira: 50,
  beni_suef: 50, dakahlia: 50, damietta: 50, fayoum: 50, gharbia: 50,
  ismailia: 50, kafr_elsheikh: 50, luxor: 60, matrouh: 50, minya: 50,
  monufia: 50, new_valley: 50, north_sinai: 70, port_said: 50, qalyubia: 50,
  qena: 50, red_sea: 50, sharqia: 50, sohag: 50, south_sinai: 70, suez: 50
};

const jsonFiles = [
  "products-shop.json",
  "../products-furniturre.json",
];

// ✅ دالة لرفع الصور إلى ImgBB
async function uploadImage(imagePath) {
  try {
    const fullPath = `../paranes/${imagePath}`;
    const response = await fetch(fullPath);
    const blob = await response.blob();
    
    const formData = new FormData();
    formData.append('image', blob);
    
    const uploadResponse = await fetch('https://api.imgbb.com/1/upload?key=YOUR_IMGBB_API_KEY', {
      method: 'POST',
      body: formData
    });
    
    const data = await uploadResponse.json();
    return data.data.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    return 'رابط_صورة_افتراضية';
  }
}

// ✅ دالة إرسال الطلب إلى جوجل شيتس (محدثة)
async function submitOrderToGoogleSheets() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const governorate = document.getElementById('governorates').value;
  const isPickup = document.getElementById("pickup_from_store")?.checked;
  const shippingCost = isPickup ? 0 : (shippingPrices[governorate] || 0);
  const customerName = document.getElementById('name')?.value || 'غير محدد';
  const customerPhone = document.getElementById('phone')?.value || 'غير محدد';
  const customerAddress = document.getElementById('address')?.value || 'غير محدد';

  const orderData = {
    customer: {
      name: customerName,
      phone: customerPhone,
      address: customerAddress,
      governorate: governorate
    },
    items: [],
    totalPrice: 0,
    shipping: shippingCost,
    timestamp: new Date().toISOString()
  };

  for (const item of cart) {
    try {
      const imageUrl = await uploadImage(item.img);
      const productName = item.name + (item.color ? ` - اللون: ${item.color}` : '');
      
      orderData.items.push({
        name: productName,
        price: item.price,
        quantity: item.quantity,
        imageUrl: imageUrl
      });
      
      orderData.totalPrice += item.price * item.quantity;
    } catch (error) {
      console.error('فشل رفع الصورة:', error);
      orderData.items.push({
        name: item.name + (item.color ? ` - اللون: ${item.color}` : ''),
        price: item.price,
        quantity: item.quantity,
        imageUrl: 'رابط_صورة_افتراضية'
      });
    }
  }

  try {
    const scriptUrl = 'YOUR_GOOGLE_SCRIPT_URL';
    console.log('بيانات الطلب المرسلة:', orderData); // للتتبع
    
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.text();
    console.log('تم الإرسال بنجاح:', result);
    return true;
  } catch (error) {
    console.error('Error submitting order:', error);
    return false;
  }
}

// ✅ دالة تحاول تحمل أول ملف شغال
function fetchFirstAvailableJSON(files) {
  if (files.length === 0) {
    throw new Error("مافي ولا ملف JSON متوفر 😓");
  }

  const currentFile = files[0];
  return fetch(currentFile).then(response => {
    if (!response.ok) {
      return fetchFirstAvailableJSON(files.slice(1));
    }
    return response.json();
  });
}

// ✅ إضافة منتج للسلة (محدثة)
function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existingItem = cart.find(item => 
    item.id === product.id && 
    item.color === (product.color || undefined)
  );
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    const newItem = { 
      ...product, 
      quantity: 1, 
      originalPrice: product.price 
    };
    if (!product.color) delete newItem.color;
    cart.push(newItem);
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCart();
}

// ✅ تحديث الكارت بالكامل (محدثة)
function updateCart() {
  const cartItemsContainer = document.getElementById("cart_items");
  const checkout_items = document.getElementById("checkout_items");
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  let items_input = document.getElementById("items");
  let total_price_input = document.getElementById("total_price");
  let count_items_input = document.getElementById("count_items");

  let total_price = 0;
  let total_count = 0;

  const appliedCoupon = JSON.parse(localStorage.getItem("appliedCoupon"));
  const couponPercent = appliedCoupon?.percent || 0;

  if (checkout_items) {
    checkout_items.innerHTML = "";
    if (items_input) items_input.value = "";
    if (total_price_input) total_price_input.value = "";
    if (count_items_input) count_items_input.value = "";
  }

  if (cartItemsContainer) cartItemsContainer.innerHTML = "";

  cart.forEach((item, index) => {
    const itemPrice = item.originalPrice || item.price;
    const totalItemPrice = itemPrice * item.quantity;

    total_price += totalItemPrice;
    total_count += item.quantity;

    const itemHTML = `
      <div class="item_cart">
        <img src="../paranes/${item.img}">
        <div class="content">
          <h4>${item.name}</h4>
          ${item.color ? `<h5> ${item.color}</h5>` : ""}
          <p class="price_cart">${totalItemPrice} ج</p>
          <div class="quantity_control">
            <button class="decrease_quantity" data-index="${index}">-</button>
            <span class="quantity">${item.quantity}</span>
            <button class="increase_quantity" data-index="${index}">+</button>
          </div>
        </div>
        <button class="delet_item" data-index="${index}"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;

    if (cartItemsContainer) cartItemsContainer.innerHTML += itemHTML;
    if (checkout_items) checkout_items.innerHTML += itemHTML;

    if (items_input) {
      const itemDescription = `${item.name}${item.color ? ` - اللون: ${item.color}` : ''} ---- السعر: ${totalItemPrice} ---- الكمية: ${item.quantity}`;
      items_input.value += itemDescription + '\n';
    }
  });

  const shippingDisplay = document.getElementById("shipping_display");
  const pickupCheckbox = document.getElementById("pickup_from_store");
  const isPickup = pickupCheckbox?.checked;
  const selectedGovernorate = document.getElementById("governorates")?.value;
  const shippingCost = isPickup ? 0 : (shippingPrices[selectedGovernorate] || 0);

  if (shippingDisplay) shippingDisplay.innerText = `${shippingCost} ج`;

  const discountAmount = Math.round(total_price * (couponPercent / 100));
  const discountedTotal = total_price - discountAmount;

  const subtotal_checkout = document.querySelector(".subtotal_checkout");
  const total_checkout = document.querySelector(".total_checkout");
  const discountSpan = document.querySelector(".discount_percent");

  if (subtotal_checkout) subtotal_checkout.innerHTML = `${total_price} ج`;
  if (total_checkout) total_checkout.innerHTML = `${discountedTotal + shippingCost} ج`;
  if (discountSpan) discountSpan.textContent = couponPercent ? `${couponPercent}%` : "0%";

  const price_cart_total = document.querySelector(".price_cart_total");
  const count_item_cart = document.querySelector(".Count_item_cart");
  const count_item_header = document.querySelector(".count_item_header");

  if (price_cart_total) price_cart_total.innerHTML = `${total_price} ج`;
  if (count_item_cart) count_item_cart.innerHTML = total_count;
  if (count_item_header) count_item_header.innerHTML = total_count;

  if (items_input) {
    items_input.value += `\n🚚 شحن (${selectedGovernorate || "غير محددة"}): ${shippingCost} ج`;
    if (total_price_input) total_price_input.value = discountedTotal + shippingCost;
    if (count_items_input) count_items_input.value = total_count;
  }

  const confirmOrderBtn = document.querySelector(".confirm_order");
  if (confirmOrderBtn) {
    confirmOrderBtn.onclick = async function() {
      const success = await submitOrderToGoogleSheets();
      if (success) {
        alert("تم تقديم الطلب بنجاح وسيتم التواصل معك قريباً!");
        localStorage.removeItem('cart');
        updateCart();
      } else {
        alert("حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.");
      }
    };
  }

  document.querySelectorAll(".increase_quantity").forEach(btn => {
    btn.addEventListener("click", () => increaseQuantity(btn.dataset.index));
  });

  document.querySelectorAll(".decrease_quantity").forEach(btn => {
    btn.addEventListener("click", () => decreaseQuantity(btn.dataset.index));
  });

  document.querySelectorAll(".delet_item").forEach(btn => {
    btn.addEventListener("click", () => removForCart(btn.dataset.index));
  });
}

// ✅ تعديل الكمية
function increaseQuantity(index) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart[index].quantity += 1;
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCart();
}

function decreaseQuantity(index) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart[index].quantity > 1) {
    cart[index].quantity -= 1;
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCart();
}

function removForCart(index) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const removed = cart.splice(index, 1)[0];
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCart();
  updateButtonsState(removed.id);
}

function updateButtonsState(productId) {
  document.querySelectorAll(`.btn_add_cart[data-id="${productId}"]`).forEach(button => {
    button.classList.remove('active');
    button.innerHTML = `<i class="fa-solid fa-cart-plus"></i> اضف الي السلة`;
  });
}

// ✅ كوبونات متاحة
const availableCoupons = {
  omar: 10,
  eid: 20,
  ramadan: 15
};

// ✅ تهيئة الصفحة عند التحميل
document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("appliedCouponFromUser")) {
    localStorage.removeItem("appliedCoupon");

    const pickupCheckbox = document.getElementById("pickup_from_store");
    pickupCheckbox?.addEventListener("change", (e) => {
      const governorateDiv = document.getElementById("governorates_wrapper");
      if (governorateDiv) {
        governorateDiv.style.display = e.target.checked ? "none" : "block";
      }
      updateCart();
    });


  }
  updateCart();
  
  fetchFirstAvailableJSON(jsonFiles)
    .then(data => {
      console.log("تم تحميل :", data);
  
      const addToCartBottons = document.querySelectorAll(".btn_add_cart");
  
      addToCartBottons.forEach(button => {
        button.addEventListener("click", (event) => {
          const productId = event.target.getAttribute("data-id");
          const selectedProduct = data.find(product => product.id == productId);
  
          if (!selectedProduct) {
            alert("⚠️ هذا المنتج غير موجود حالياً في البيانات!");
            return;
          }
  
          addToCart(selectedProduct);
  
          const allMatchingBotton = document.querySelectorAll(`.btn_add_cart[data-id="${productId}"]`);
  
          allMatchingBotton.forEach(btn => {
            btn.classList.add("active");
            btn.innerHTML = `<i class="fa-solid fa-cart-plus"></i> تم اضافة الي السلة`;
          });
        });
      });
    })
    .catch(error => {
      console.error("🚫 مشكلة في تحميل الملفات:", error);
    });
});

// ✅ تطبيق الكوبون
document.querySelector(".copon").addEventListener("click", () => {
  const coponInput = document.querySelector(".copon_input").value.trim().toLowerCase();
  if (availableCoupons.hasOwnProperty(coponInput)) {
    const discountPercent = availableCoupons[coponInput];
    localStorage.setItem("appliedCoupon", JSON.stringify({ code: coponInput, percent: discountPercent }));
    localStorage.setItem("appliedCouponFromUser", "true");

    alert(`🎉 تم تطبيق خصم ${discountPercent}% بنجاح!`);
    updateCart();
  } else {
    alert("❌ الكوبون غير صالح!");
  }
});

window.addEventListener("beforeunload", () => {
  localStorage.removeItem("appliedCoupon");
  localStorage.removeItem("appliedCouponFromUser");
});

const governorateSelect = document.getElementById("governorates");
if (governorateSelect) {
  governorateSelect.addEventListener("change", () => {
    updateCart();
  });
}








//////////////////////////////

function setupCartEvents() {
  const cartIcon = document.querySelector(".fa-cart-shopping");

  document.addEventListener("click", function(e) {
    const btn = e.target.closest(".btn_add_cart");
    if (!btn) return;
    e.preventDefault(); // نمنع التنقل الفوري

    const productId = btn.dataset.id;
    const targetUrl = btn.dataset.url;
    const productImage = document.querySelector(`.product-image[data-id="${productId}"]`);

    if (!productImage || !cartIcon) return;

    const imgClone = productImage.cloneNode(true);
    const rect = productImage.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    imgClone.style.position = "fixed";
    imgClone.style.top = `${rect.top}px`;
    imgClone.style.left = `${rect.left}px`;
    imgClone.style.width = `${rect.width}px`;
    imgClone.style.height = `${rect.height}px`;
    imgClone.style.transition = "all 0.8s ease-in-out";
    imgClone.style.zIndex = 9999;

    document.body.appendChild(imgClone);

    setTimeout(() => {
      imgClone.style.top = `${cartRect.top}px`;
      imgClone.style.left = `${cartRect.left}px`;
      imgClone.style.width = "0px";
      imgClone.style.height = "0px";
      imgClone.style.opacity = 0;
    }, 10);

    setTimeout(() => {
      cartIcon.classList.add("shake-cart");
      imgClone.remove();
      setTimeout(() => {
        cartIcon.classList.remove("shake-cart");

        // ✅ ننتقل بعد الانيميشن
        if (targetUrl) {
          window.location.href = targetUrl;
        }

      }, 300);
    }, 900);
  });
}

////////////////////////////



