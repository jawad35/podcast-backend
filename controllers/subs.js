const stripe = require('stripe');

exports.getPrices = async (req, res) => {
    await stripe.prices.list({
        apiKey: 'sk_test_51MslBhAeOlKaLrSIQFHv1AWeWHWLiONnauCw7vLShk221OX68JjXjacq9hwFdMNTj9eONk7dW221xrWWm71p1KIu0045Tjg5HQ',
      }).then(pricelist => {
        console.log(pricelist.data, 'helo')
        return res.json({success:true, prices:pricelist})
      });
      // return res.json({ success: false, message: 'Something went wrong!' })
}
exports.createSubscription = async (req, res) => {
  const { paymentMethodId, priceId } = req.body;

  try {
    // Create a customer
    const customer = await stripe.customers.create({
      payment_method: paymentMethodId,
      email: 'customer@example.com',
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
    });

    res.json(subscription);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Subscription failed' });
  }
};