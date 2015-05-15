/**
 * Represents an Address.
 * @constructor
 * @param {object} $form - A jQuery object referencing an address form
 * @memberof singlePageCheckout
 */
Spree.singlePageCheckout.Address = function ($form) {
  this.address1 = $form.find('.street').val();
  this.address2 = $form.find('.apt').val();
  this.city = $form.find('.city').val();
  this.state_name = $form.find('.state').val();
  this.zipcode = $form.find('.zipcode').val();
  this.country_id = $form.find('.country').val();
  this.phone = $form.find('.phone').val();

  var fullName = $form.find('.name').val();
  var split = fullName.split(' ');
  this.firstname = split[0];
  this.lastname = split[split.length - 1];
};

/**
 * Represents an Order
 * @constructor
 * @memberof singlePageCheckout
 */
Spree.singlePageCheckout.Order = function () {
  this.bill_address_attributes = null;
  this.ship_address_attributes = null;
  this.shipments_attributes = null;
  this.payments_attributes = [];
  this.coupon_code = null;

  // Add the payment method ID to the payment methods array
  // var paymentMethodId = $('#payment_method_id').val();
  // this.payments_attributes.push({ payment_method_id: paymentMethodId });
};

/**
 * Represents a payment
 * @constructor
 * @memberof singlePageCheckout
 * @param {number} payment_id - ID of Spree payment method
 */
Spree.singlePageCheckout.Payment = function ($form) {
  var paymentId = $('#payment_method_id').val();
  var payment = this[paymentId] = {};
  payment.number = $form.find('#number').val();
  payment.month = $form.find('#date').val().substr(0,2);
  payment.year = $form.find('#date').val().substr(5,2);
  payment.verification_value = $form.find('#verification_value').val();
  payment.name = $form.find('#name').val();
};

/**
 * Represents a shipment method
 * @constructor
 * @memberof singlePageCheckout
 * @param {number} shipping_rate_id - ID of Spree Shipping Rate / Method to be
 *    used by shipment
 * @param {number} shipment_id - ID of the Shipment that is to be updated
 */
Spree.singlePageCheckout.ShipmentMethod = function (shipping_rate_id,
    shipment_id) {
  this.selected_shipping_rate_id = shipping_rate_id;
  this.id = shipment_id;
};
