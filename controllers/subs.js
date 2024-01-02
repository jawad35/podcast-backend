exports.getPrices = async (req, res) => {
    const prices = await stripe.prices.list({
        apiKey: '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',
      });
    
      return res.json(prices);
}