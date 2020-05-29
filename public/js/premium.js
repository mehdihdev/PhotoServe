var stripe = require('stripe')('sk_test_zMLclFRUPJiYNNpVp2agy2lw00dViSI4Ob');

stripe.products.retrieve(
  'prod_HMhOQPP2TdhbnZ',
  function(err, product) {
    // asynchronously called
  }
);