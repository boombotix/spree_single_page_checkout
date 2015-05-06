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
  this.bill_address = null;
  this.ship_address = null;
  this.email = null;
  this.state = null;
  this.payments_attributes = [];
};

/**
 * Represents a payment
 * @constructor
 * @memberof singlePageCheckout
 * @param {number} payment_id - ID of Spree payment method
 */
Spree.singlePageCheckout.Payment = function (payment_id) {
  var payment = this[payment_id] = {};
  payment.number = null;
  payment.month = null;
  payment.year = null;
  payment.verification_value = null;
  payment.name = null;
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
  var shipment = this["0"] = {};
  shipment.selected_shipping_rate_id = shipping_rate_id;
  shipment.id = shipment_id;
};
