const User = require("../models/user");
const { Stripe } = require("../utils/stripe");

exports.getPrices = async (req, res) => {
    await Stripe.prices.list().then(pricelist => {
        return res.json({success:true, prices:pricelist})
      }).catch(err => {
        return res.json({success:false, prices:[]})
      });
      // return res.json({ success: false, message: 'Something went wrong!' })
}
exports.createSession = async (req, res) => {
  const user = await User.findOne({ email: req.user });

  const session = await Stripe.checkout.sessions.create(
    {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: req.body.priceId,
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000/articles",
      cancel_url: "http://localhost:3000/article-plans",
      customer: user.stripeCustomerId,
    },
    {
      apiKey: process.env.STRIPE_SECRET_KEY,
    }
  );

  return res.json(session);
};

exports.createSubscription = async (req, res) => {
 // Use an existing Customer ID if this is a returning customer.

 const {amount, name, email } = req.body

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
};

