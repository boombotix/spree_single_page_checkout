/**
 * Move the Checkout to the 'Payment' input, setting the Address form to
 * disabled.
 */
// Spree.singlePageCheckout.addressNext = function() {
//   $('#address-next').click(function(e){
//     var $this = $(this);
//
//     if ($this.hasClass('spc-disabled')) {
//       return null;
//     } else {
//       console.log('addressNext');
//       $('.paymentInfo').
//         removeClass('spc-disabled').
//         enableForm();
//       $('.addressInfo').
//         addClass('spc-disabled').
//         disableForm();
//
//       // Spree.singlePageCheckout.updateOrder();
//       // Spree.singlePageCheckout.apiRequest(
//       //     '/api/checkouts/' + Spree.current_order_id + '.json',
//       //     { order: Spree.singlePageCheckout.currentOrder }
//       //   ).done(Spree.singlePageCheckout.updateOrderSummary);
//       // Scroll to center the Payment div on the page
//
//       // Add an event listener to go back to the address stage if that div is
//       // clicked on
//
//       // Disable the address-next Button after the animation has run
//       setTimeout(function() { $this.addClass('spc-disabled'); }, 650);
//     }
//   });
// };

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
      $('.info').
        addClass('spc-disabled').
        disableForm();

      // Scroll to the top of the SPC


      Spree.singlePageCheckout.updatePayment().
        done([
            Spree.singlePageCheckout.updateOrderSummary,
            Spree.singlePageCheckout.readyForm,
            Spree.singlePageCheckout.reviseInfo
        ]);

      // Disable the payment-next button after the animation has run.
      setTimeout(function() { $this.addClass('spc-disabled'); }, 650);
    }
  });
};

Spree.singlePageCheckout.reviseInfo = function() {
  $('.info').on('click', function() {
    // Remove the disabled class
    $infoEls = $('.info');
    $infoEls.removeClass('spc-disabled');
    // Re-enable the input forms
    $infoEls.enableForm();
    // Disable the Pay-now button
    Spree.singlePageCheckout.disableForm();
  });
};
