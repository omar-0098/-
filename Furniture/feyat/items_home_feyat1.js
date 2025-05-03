fetch("../products-furniturre.json")
.then(response => response.json())
.then(date => {
    console.log(date);

// هذا الكود يخزن ولا يمسح المنتجات
    const cart=JSON.parse(localStorage.getItem("cart")) || []

   

    const elaksar_feyat=document.getElementById("elaksar_feyat")
    const feyat_three=document.getElementById("feyat_three")
    const feyat_four=document.getElementById("feyat_four")
    const feyat_sex=document.getElementById("feyat_sex")









// product-1



////////////////////////////////////////
// product-2
date.forEach(product => {
    if (product.catetory == "feyat_three") {

        const isInCart = cart.some(cartItem => cartItem.id === product.id);

        let oldPrice = product.old_price;
        if (oldPrice === undefined || oldPrice === null) {
            oldPrice = 0;
        }

        const old_price_pragrahp = oldPrice ? `<p class="old_price">جنيه ${oldPrice}</p>` : "";

        const parcent_disc_div = oldPrice > 0 
            ? `<span class="sale_present">%${Math.floor((oldPrice - product.price) / oldPrice * 100)}</span>` 
            : "";

            feyat_three.innerHTML += `
        
        <div class=" product" >
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
                        ${old_price_pragrahp} <!-- استخدام السعر القديم المعدل -->
                        <p><span> <span>${product.price} </span> جنيه</span></p>
                        </div>

                        <div class="size">
                          <p><span> <span>${product.size} </span>: مقاس </span></p>
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











////////////////////////////////////////
// product-3

date.forEach(product => {
    if (product.catetory == "feyat_four") {

        const isInCart = cart.some(cartItem => cartItem.id === product.id);

        let oldPrice = product.old_price;
        if (oldPrice === undefined || oldPrice === null) {
            oldPrice = 0;
        }

        const old_price_pragrahp = oldPrice ? `<p class="old_price">جنيه ${oldPrice}</p>` : "";

        const parcent_disc_div = oldPrice > 0 
            ? `<span class="sale_present">%${Math.floor((oldPrice - product.price) / oldPrice * 100)}</span>` 
            : "";


            feyat_four.innerHTML += `
        
        <div class=" product">
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
                        ${old_price_pragrahp} <!-- استخدام السعر القديم المعدل -->
                        <p><span> <span>${product.price} </span> جنيه</span></p>
                                
                        </div>
                          <div class="size">
                          <p><span> <span>${product.size} </span>: مقاس </span></p>
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



})








