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

      // Scroll to center the Payment div on the page

      // Add an event listener to go back to the address stage if that div is
      // clicked on

      // Disable the address-next Button after the animation has run
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

      // Make the API Request to update the order summary
      Spree.singlePageCheckout.updateOrder();

      // Disable the payment-next button after the animation has run.
    }
  });
};
