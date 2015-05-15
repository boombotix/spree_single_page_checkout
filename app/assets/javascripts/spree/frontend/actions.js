/**
 * Move the Checkout to the 'Payment' input, setting the Address form to
 * disabled.
 */
Spree.singlePageCheckout.addressNext = function() {
  $('#address-next').click(function(e){
    var $this = $(this);

    if ($this.hasClass('spc-disabled')) {
      return null;
    } else {
      console.log('addressNext');
      $('.paymentInfo').
        removeClass('spc-disabled').
        enableForm();
      $('.addressInfo').
        addClass('spc-disabled').
        disableForm();

      // Spree.singlePageCheckout.updateOrder();
      // Spree.singlePageCheckout.apiRequest(
      //     '/api/checkouts/' + Spree.current_order_id + '.json',
      //     { order: Spree.singlePageCheckout.currentOrder }
      //   ).done(Spree.singlePageCheckout.updateOrderSummary);
      // Scroll to center the Payment div on the page

      // Add an event listener to go back to the address stage if that div is
      // clicked on

      // Disable the address-next Button after the animation has run
      setTimeout(function() { $this.addClass('spc-disabled'); }, 650);
    }
  });
};

/**
 * Move the Checkout to the 'Confirm' phase, setting the payment form to
 * disabled.
 */
Spree.singlePageCheckout.paymentNext = function() {
  $('#payment-next').click(function(e){
    var $this = $(this);

    if ($this.hasClass('spc-disabled')) {
      return null;
    } else {
      $('.paymentInfo').
        addClass('spc-disabled').
        disableForm();

      // Scroll to the top of the SPC


      // Display a loading message while we make API requests...
      $('#line-items').html(
        '<div class="checkout-loading">' +
        '<i class="fa fa-gear fa-spin fa-4x"></i>' +
        '<span>Updating your order...</span></div>'
      );

      Spree.singlePageCheckout.updatePayment().
        done([Spree.singlePageCheckout.updateOrderSummary,
            Spree.singlePageCheckout.readyForm]);

      // Disable the payment-next button after the animation has run.
      setTimeout(function() { $this.addClass('spc-disabled'); }, 650);
    }
  });
};
