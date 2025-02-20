// const { LogarithmicScale } = require('chart.js');
const Razorpay = require('razorpay')

var instance = new Razorpay({
    key_id: 'rzp_test_6damh00ndxLBqq',
    key_secret: 'd7Y4vbTqZb7fOwcYIjWRpt6U',
  });



   

  
async function RazorCreateOrder(amount,invoiceNumber){
   try {
    
    const options = {
      amount: amount * 100,  // amount in the smallest currency unit
      currency: "INR",
      receipt: invoiceNumber
    };
    return await instance.orders.create(options)
   } catch (error) {
    console.log(error);
   }
    
}

async function razorMatchPayment(paymentID){
    
try {
  
  return await instance.payments.fetch(paymentID)
} catch (error) {
  console.log(error);
}
    
    
}

async function razorRefundPayment(paymentID){
 try {
  return await instance.payments.refund(paymentID)
 } catch (error) {
  console.log(error);
 }
}
module.exports = {RazorCreateOrder,razorMatchPayment,razorRefundPayment}