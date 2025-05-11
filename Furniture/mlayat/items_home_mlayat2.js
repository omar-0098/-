fetch("../../products-furniturre.json")
.then(response => response.json())
.then(date => {
    console.log(date);

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const mlayat_child = document.getElementById("mlayat_child");



    date.sort(() => 0.5 - Math.random());




    date.forEach(product => {
        if (product.catetory == "mlayat_child") {

            let displayValue = product.color;
            let label = "اللون";

            if ((!product.color || product.color.trim() === "") && product.size) {
                label = "المقاس";

                // نفصل المقاس بطريقة منظمة
                if (product.size.includes('x')) {
                    const sizes = product.size.split('x').map(s => s.trim());
                    if (sizes.length === 2) {
                        displayValue = ` ${sizes[1]} سم ×  ${sizes[0]} سم`;
                    } else {
                        displayValue = product.size; // fallback
                    }
                } else {
                    displayValue = product.size;
                }
            }

            const isInCart = cart.some(cartItem => cartItem.id === product.id);

            let oldPrice = product.old_price || 0;

            const old_price_pragrahp = oldPrice ? `<p class="old_price">جنيه ${oldPrice}</p>` : "";

            const parcent_disc_div = oldPrice > 0 
                ? `<span class="sale_present">
                %${Math.floor((oldPrice - product.price) / oldPrice * 100)}</span>` 
                : "";

            mlayat_child.innerHTML += `
                <div class="product">
                   ${product.word ? `<p class="ooo">${product.word}</p>` : ""}
                    ${parcent_disc_div}
                    <div class="img_product">
          <a href="${product.link}"> <img src="${product.img}" alt="" class="product-image" data-id="${product.id}"></a>
                    </div>

                    <div class="stars">  
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                    </div>

                        <p class="name_product">${product.name}</p>

                    <div class="price">
                        ${old_price_pragrahp}
                        <p><span><span>${product.price}</span> جنيه</span></p>
                    </div>

                    <div class="size">
                        <p><span><span> ${label} : </span> ${displayValue}</span></p>
                    </div>

                    <div class="icons">
                        <span class="btn_add_cart ${isInCart ? 'active' : ''}" data-id="${product.id}">
                            <i class="fa-solid fa-cart-plus"></i> ${isInCart ? 'تم اضافة الي السلة' : 'اضف الي السلة'}
                        </span>
                    </div>
                </div>
            `;
        }
    });


    setTimeout(setupCartEvents, 100);

});
