// the installer will append this file to the app vendored assets here: vendor/assets/javascripts/spree/frontend/all.js'

// ================================================= //
//  Javascript  for Single Page Checkout extension   //
// ================================================= //

// Initialize the Spree object
if (Spree === undefined) {
  var Spree = {};
}

// *************************
// NOTE: The single-page checkout is currently coded to only
// handle a single shipment per order.
// *************************

// The Spree Checkout pattern requires that a checkout
// moves through different states: address, delivery,
// payment, confirm, and complete. API calls must be
// made in this order.

// Namespace the functions of the single page checkout to prevent possible collisions
Spree.singlePageCheckout = function() {};

// Listen to inputs on the address box. When it has
// been completely filled out, make an AJAX call to the
// Spree API to continue.
Spree.singlePageCheckout.checkoutAddress = function() {

  // Validate the form inputs: sets an error class if the
  // field does not match the 'pattern' attribute
  $('.addressInfo form').h5Validate({
    errorClass: 'validation-error'
  });

  var checkAddressForm = function() {
    // if all of the required inputs have been filled out,
    if ($('.addressInfo form').h5Validate('allValid')) {
      // prepare some of the data:
      var data,
        fullName = $('#address_full_name').val(),
        splitNames,
        firstName,
        lastName,
        addressInfo;

      splitNames = fullName.split(' ');
      firstName = splitNames[0];
      lastName = splitNames[splitNames.length - 1];
      addressInfo = {
        firstname: firstName,
        lastname: lastName,
        // full_name: fullName,
        address1: $('#address_address1').val(),
        address2: $('#address_address2').val(),
        city: $('#address_city').val(),
        phone: $('#address_phone').val(),
        zipcode: $('#address_zipcode').val(),
        state_name: $('#address_state_name').val(),
        country_id: $('#address_country_id').val()
      };

      // Prepare the object for PUT to the server:
      data = {
        order: {
          bill_address_attributes: addressInfo,
          ship_address_attributes: addressInfo
        }
      };

      // make the AJAX request:
      Spree.singlePageCheckout.apiRequest(data);
    }
  };

  // Run the check once in case address is already loaded from user profile
  checkAddressForm();

  // Listen for changes in the form
  $('.addressInfo input').on('blur change', checkAddressForm);
};

// update the order summary section after a successful request
Spree.singlePageCheckout.updateOrderSummary = function(data) {
  // Clear any old data
  $('.checkout-shipping').html('');

  // Update the shipping options
  var shipment_info = data.shipments[0];
  var selected_shipping_rate = shipment_info.selected_shipping_rate ? shipment_info.selected_shipping_rate.id : null;

  if (shipment_info.shipping_rates.length >= 1) {
    for(var i = 0; i < shipment_info.shipping_rates.length; i++) {

      // Construct a new element for each shipping option
      var div = document.createElement('div');
      var input = document.createElement('input');
      var label = document.createElement('label');
      var icon = document.createElement('i');
      var text = document.createTextNode(shipment_info.shipping_rates[i].name + ' (+ ' + shipment_info.shipping_rates[i].display_cost + ' )');
      var shipment_rate_id = shipment_info.shipping_rates[i].id;
      var shipment_id = shipment_info.id;

      div.className = 'checkbox';
      input.setAttribute('type', 'radio');
      input.setAttribute('name', 'checkout_shipping');
      input.setAttribute('shipment', shipment_id);
      input.setAttribute('val', shipment_rate_id);
      input.id = 'checkout_shipping' + shipment_rate_id;
      label.setAttribute('for', 'checkout_shipping' + shipment_rate_id);
      if (selected_shipping_rate == shipment_rate_id) {
        icon.className = 'fa fa-check-square-o';
      } else {
        icon.className = 'fa fa-square-o';
      }

      label.appendChild(icon);
      label.appendChild(text);

      div.appendChild(input);
      div.appendChild(label);

      // Append shipping option element to the DOM
      $('.checkout-shipping').append(div);
    }
  }

  // Update taxes and total
  Spree.singlePageCheckout.total = data.total;
  var taxes = data.display_additional_tax_total;

  $('#taxes').html('<div class="checkbox-box"> Tax (+' + taxes + ')</div>');
  $('.checkout-total').html(data.display_total);

  // Update the state of the checkout
  Spree.singlePageCheckout.state = data.state;

  // Update the payment variable
  if (data.payments.length > 0) {
    Spree.singlePageCheckout.payment = true;
  }
};




// Make an API call when the user selects their delivery options
Spree.singlePageCheckout.checkoutDelivery = function(rate_id, shipment_id) {
  var data = {
      order: {
        shipments_attributes: [
          {
            selected_shipping_rate_id: rate_id,
            id: shipment_id
          }
        ]
      }
    };
  Spree.singlePageCheckout.apiRequest(data);
};

// Only enable the pay button once all prior steps have been completed.
Spree.singlePageCheckout.checkoutPayment = function() {
  if ($('.paymentInfo').length > 0) { 
    $('.paymentInfo input').on('blur', function(){
      // validate each of the fields
      var cart_number_valid = $.payment.validateCardNumber($('#number').val()),
        cart_date_valid = $.payment.validateCardExpiry($('#date').val().substr(0, 2), $('#date').val().substr(5, 2)),
        cvc_valid = $.payment.validateCardCVC($('#verification_value').val());

      if (cart_number_valid && cart_date_valid && cvc_valid) {
        $('#checkout-pay-btn').removeClass('disabled');
        $('#checkout-pay-btn').unbind('click').on('click', function() {
          $('#payment-form').submit();
        });
      }
    });
  } else {
    $('#checkout-pay-btn').removeClass('disabled');
  }
};

// function for making Spree API calls
Spree.singlePageCheckout.apiRequest = function(data) {
  var url = '/api/checkouts/' + Spree.current_order_id ;
  data.order_token = Spree.current_order_token;
  $.ajax({
    url: url,
    method: 'PUT',
    dataType: 'json',
    data: data,
    headers: { 'X-Spree-Token': Spree.current_order_token },
    success: function(response) {
      Spree.singlePageCheckout.updateOrderSummary(response);
    },
    error: function(response, b,c ) {
      Spree.singlePageCheckout.errorHandler(response,b,c);
    }
  });
};

// Handle Errors returned from the API
Spree.singlePageCheckout.errorHandler = function(apiResponse, b, c) {
  // This can be built out if need be in the future; Currently the only 
  // field that will throw a validation error from the API is the 
  // state_name field.
  $('#address_state_name').addClass('validation-error');
};


$(document).ready(function() {


  $('.checkout-shipping').unbind('click').on('click', '.checkbox label', function(e) {
    e.preventDefault();
    e.stopPropagation();

    var rate_id = $(this).siblings('input').attr('val');
    var shipment_id = $(this).siblings('input').attr('shipment');

    Spree.singlePageCheckout.checkoutDelivery(rate_id, shipment_id);

    if ($(this).children('i').hasClass('fa-square-o')) {
      $(this).children('i').removeClass('fa-square-o').addClass('fa-check-square-o');
    } else {
      $(this).children('i').removeClass('fa-check-square-o').addClass('fa-square-o');
    }
  });


  function matchGeoData(address_component, type) {
    if (address_component.types.indexOf(type) !== -1) {
      return true;
    } else {
      return false;
    }
  }

  var geoSuccessHandler = function(position) {
    var lat = position.coords.latitude,
      lng = position.coords.longitude,
      geocoder = new google.maps.Geocoder(),
      latlng = new google.maps.LatLng(lat, lng);

    geocoder.geocode({
      'latLng': latlng
    }, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        if (results[0]) {

          $('.fa-crosshairs').removeClass('fa-spin');

          // Give me address in multiple objects
          var addressComponents = results[0].address_components,
            streetNumber,
            streetName,
            zip,
            city,
            state,
            country;

          for (var i = 0; i < addressComponents.length; i++) {
            var c = addressComponents[i];
            if (matchGeoData(c, 'street_number')) {
              streetNumber = c.long_name;
            }
            if (matchGeoData(c, 'route')) {
              streetName = c.short_name;
            }
            if (matchGeoData(c, 'postal_code')) {
              zip = c.long_name;
            }
            if (matchGeoData(c, 'locality')) {
              city = c.long_name;
            }
            if (matchGeoData(c, 'administrative_area_level_1')) {
              state = c.long_name;
            }
            if (matchGeoData(c, 'administrative_area_level_1')) {
              country = c.long_name;
            }
          }

          // Populate the address form
          $('#address_country_id option:contains(' + country + ')').attr('selected', true);
          $('#address_address1').val(streetNumber + ' ' + streetName);
          $('#address_city').val(city);
          $('#address_zipcode').val(zip);
          $('#address_state_name').val(state);


        } else {
          alert('Geocoder failed due to: ' + status);
        }
      }
    });
  };

  $('.geoLocator').unbind('click').on('click', function() {
    navigator.geolocation.getCurrentPosition(geoSuccessHandler, null, {
      enableHighAccuracy: true
    });
    $(this).find('i').toggleClass('fa-spin');
  });

  $('#number').payment('formatCardNumber');
  $('#date').payment('formatCardExpiry');
  $('#verification_value').payment('formatCardCVC');

  // Country Selector
  $('#address_country_id').selectToAutocomplete();

  // listen for changes on the address box
  Spree.singlePageCheckout.checkoutAddress();

  // listen for changes on the payments box
  Spree.singlePageCheckout.checkoutPayment();

});
