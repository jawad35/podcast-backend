const Stripe = require('stripe');

exports.Stripe = new Stripe(process.env.STRIPE_SECRET_KEY);