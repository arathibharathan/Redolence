const cartAdd = function addToCart(productId, userId, quantity) {
  return new Promise(async (resolve, reject) => {
      try {
          const response = await fetch('/addCartItem', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ productId, quantity, userId }),
          });

          const data = await response.json();

          if (data.success) {
              Swal.fire({
                  title: 'Success!',
                  text: "Product Added To Cart",
                  icon: 'success',
                  confirmButtonText: 'OK'
              });
              resolve(data);
          } else {
              Swal.fire({
                  title: 'Info',
                  text: data.message,
                  icon: 'info',
                  confirmButtonText: 'OK'
              });
              reject(data);
          }
      } catch (error) {
          console.log(error.message);
          reject(error);
      }
  });
}


document.querySelectorAll('.btn-add-to-cart').forEach(button => {
  button.addEventListener('click', function() {
      const productId = this.getAttribute('data-product-id');
      const userId = this.getAttribute('data-user-id');
      const quantity = document.getElementById('qty').value;

      addToCart(productId, userId, quantity)
          .then(result => {
              // Optional: Handle successful cart addition
              console.log('Product added to cart', result);
          })
          .catch(error => {
              // Optional: Handle errors
              console.error('Error adding to cart', error);
          });
  });
});

module.exports = addToCart