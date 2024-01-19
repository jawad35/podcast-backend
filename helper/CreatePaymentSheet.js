const { Stripe } = require("../utils/stripe");

exports.CreatePayment = async(name, email, amount) => {
    const customer = await Stripe.customers.create({
        name: name,
        email: email,
      })
       const ephemeralKey = await Stripe.ephemeralKeys.create(
         {customer: customer.id},
         {apiVersion: '2022-11-15'}
       );
       const paymentIntent = await Stripe.paymentIntents.create({
         amount: amount,
         currency: 'usd',
         customer: customer.id,
         payment_method_types: [ 'card'],
       });
      
       res.json({
         paymentIntent: paymentIntent.client_secret,
         ephemeralKey: ephemeralKey.secret,
         customer: customer.id,
       }); 
}