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

Spree.singlePageCheckout.checkCompleteForm = function() {
  // Checks validity of both address and payment forms, and makes sure the order state is in 'payment'
  if (Spree.singlePageCheckout.paymentFormValid && Spree.singlePageCheckout.addressFormValid && Spree.singlePageCheckout.state == 'payment') {
    Spree.singlePageCheckout.readyForm();
  }
  else {
    Spree.singlePageCheckout.disableForm();
  }
};

// Activates the pay button
Spree.singlePageCheckout.readyForm = function() {
  $('#checkout-pay-btn').unbind('click').on('click', function() {
    // Remove value from field to prevent submisson
    // of invalid coupon or double submission of valid code
    $('#coupon_code').val('');
    $('#payment-form').submit();
  });
};

// Disables the pay button
Spree.singlePageCheckout.disableForm = function() {
  var checkoutPayBtn = $('#checkout-pay-btn');
  var buttonPrice = $('#button-price');
  checkoutPayBtn.unbind('click').on('click', function() {
    $(this).addClass('disabled need-info');
    $('#pay-button-container').effect('shake');
    buttonPrice.fadeOut('fast', function() {
      $('#need-info-message').fadeIn('fast', function() {
        $(this).delay(1500).fadeOut('slow', function() {
          buttonPrice.fadeIn('slow', function() {
            checkoutPayBtn.removeClass('disabled need-info');
          });
        });
      });
    });
  });
};

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

      // Must be true to activate Pay button
      Spree.singlePageCheckout.addressFormValid = true;
      if (Spree.singlePageCheckout.paymentFormValid && Spree.singlePageCheckout.state == 'payment') {
        Spree.singlePageCheckout.readyForm();
      }

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
    else {
      // Keeps pay button disabled or makes it
      // disabled if it has already been activated
      Spree.singlePageCheckout.addressFormValid = false;
      Spree.singlePageCheckout.disableForm();
    }
  };

  // Run the check once in case address is already loaded from user profile
  checkAddressForm();

  // Listen for changes in the form
  $('.addressInfo input').unbind('change').on('change', checkAddressForm);
  $('.addressInfo select').unbind('change').on('change', checkAddressForm);
  $('.addressInfo #address_country_id').unbind('change').on('change', function() {
    Spree.singlePageCheckout.checkoutCountry();
  });
};

// For countries other than U.S., change state dropdown to text field
Spree.singlePageCheckout.checkoutCountry = function() {
  var getStates = function() {
    var country_id = $('#address_country_id').val();
    $.get(Spree.routes.states_search, {country_id: country_id}, function(data) {
      var $states_container;
      if (data.states.length === 0) {
        $states_container = $('#states-container');
        $states_container.empty();
        $states_container.append('<input autocomplete="region" class="form-control state validation-error h5-active" id="address_state_name" name="address[state_name]" placeholder="State, Province, or Region" required="required" type="text">');
      }
      else {
        var all_states = data.states;
        $states_container = $('#states-container');
        $states_container.empty();
        $states_container.append('<select autocomplete="region" class="form-control state validation-error h5-active" id="address_state_name" name="address[state_name]" required="required"></select>');
        var $el = $('#address_state_name');
        $.each(all_states, function(index, value) {
          $el.append($("<option></option>")
             .attr("value", value.name).text(value.name));
        });
      }
      // Check address and rebind event handlers
      Spree.singlePageCheckout.checkoutAddress();
    });
  };
  // Run once when page loads
  getStates();
};

// update the order summary section after a successful request
Spree.singlePageCheckout.updateOrderSummary = function(data) {
  // Clear any old data
  $('.checkout-shipping').html('');

  // Update the shipping options
  var shipment_info;
  if (Spree.singlePageCheckout.shipment_id) {
    $.each(data.shipments, function(key, value) {
      if (value.id == Spree.singlePageCheckout.shipment_id) {
        shipment_info = value;
      }
    });
  }

  if (shipment_info === undefined) {
    shipment_info = data.shipments[0];
    Spree.singlePageCheckout.shipment_id = data.shipments[0].id;
  }

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

  // Update line_item promotions
  var items = data.line_items;
  $.each(items, function(index, item) {
    if (item.adjustments.length > 0) {
      for (var j = 0; j < item.adjustments.length; j++) {
        if (item.adjustments[j].source_type == 'Spree::PromotionAction') {
          Spree.singlePageCheckout.promoApproved = true;
          $('#line-item-adjustments').html('<div class="checkbox-box"> ' + item.adjustments[j].label + ' ' + adjustments[j].display_amount + '</div>');
        }
      }
    }
  });

  // Update whole order promotions
  var adjustments = data.adjustments;
  if (adjustments.length > 0) {
    for (var i = 0; i < adjustments.length; i++) {
      if (adjustments[i].source_type == 'Spree::PromotionAction') {
        Spree.singlePageCheckout.promoApproved = true;
        $('#order-adjustments').html('<div class="checkbox-box"> ' + adjustments[i].label + ' ' + adjustments[i].display_amount + '</div>');
      }
    }
  }

  // Update taxes and total
  Spree.singlePageCheckout.total = data.total;
  var taxes = data.display_additional_tax_total;

  $('#taxes').html('<div class="checkbox-box"> Tax (+' + taxes + ')</div>');
  $('.checkout-total').html(data.display_total);

  // Update the state of the checkout
  Spree.singlePageCheckout.state = data.state;

  if (Spree.singlePageCheckout.promoApproved === true) {
    $('#coupon-message').remove();
    var container = $('.paymentInfo');
    var span_tag = $('<span>');
    span_tag.attr('id', 'coupon-message');
    container.append(span_tag);
    span_tag.html('Coupon code successfully applied!');
  }
  else {
    Spree.singlePageCheckout.checkoutCoupon();
  }

  // Update the payment variable
  if (data.payments.length > 0) {
    Spree.singlePageCheckout.payment = true;
  }

  // Run validation check when delivery options come in
  Spree.singlePageCheckout.checkCompleteForm();
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
    $('.paymentInfo input').on('change', function(){

      var payment_validate = {
        name: {
          id: '#name'
        },
        number: {
          id: '#number'
        },
        date: {
          id: '#date'
        },
        cvc: {
          id: '#verification_value'
        }
      };

      var card_date = $('#date').val();
      payment_validate.number.valid = $.payment.validateCardNumber($('#number').val());
      payment_validate.date.valid = $.payment.validateCardExpiry(card_date.substr(0, 2), card_date.substr(5, 2));
      payment_validate.cvc.valid = $.payment.validateCardCVC($('#verification_value').val());

      if ($('#name').val().length > 0) {
        payment_validate.name.valid = true;
      }
      else {
        payment_validate.name.valid = false;
      }

      $.each(payment_validate, function(key, value) {
        if (value.valid) {
          $(value.id).removeClass('validation-error');
        }
        else {
          $(value.id).addClass('validation-error');
        }
      });

      if (payment_validate.name.valid && payment_validate.number.valid && payment_validate.date.valid && payment_validate.cvc.valid) {
        Spree.singlePageCheckout.paymentFormValid = true;
      }
      else {
        Spree.singlePageCheckout.paymentFormValid = false;
      }
      Spree.singlePageCheckout.checkCompleteForm();
    });
  } else {
    $('#checkout-pay-btn').removeClass('disabled');
  }
};

// Allows coupon entry and grabs coupon code for an API call
Spree.singlePageCheckout.checkoutCoupon = function() {
  var couponCode = $('#coupon_code');
  if (Spree.singlePageCheckout.state) {
    // Removes the early coupon attempt message
    if (Spree.singlePageCheckout.earlyCouponAttempt === true) {
      $('#coupon-message').remove();
      Spree.singlePageCheckout.earlyCouponAttempt = false;
    }
    couponCode.unbind('keydown paste');
    couponCode.unbind('change').on('change', function() {
      // Only make API call if no coupon has been approved
      if (Spree.singlePageCheckout.promoApproved === false) {
        var entered_code = couponCode.val();
        var data = {
          order: {
            coupon_code: entered_code
          }
        };
        Spree.singlePageCheckout.apiRequest(data);
      }
      else {
        Spree.singlePageCheckout.couponMessageCreate('A coupon code has already been applied!');
      }
    });
  }
  else {
    // Disables coupon field if address has not been entered
    couponCode.unbind('keydown paste').on('keydown paste', function() {
      Spree.singlePageCheckout.couponMessageCreate('Please enter in address before entering coupon code.');
      // Sets value to true if coupon input attempt was made before address
      Spree.singlePageCheckout.earlyCouponAttempt = true;
      return false;
    });
  }
};

Spree.singlePageCheckout.couponMessageCreate = function(message) {
  $('#coupon-message').remove();
  var container = $('.paymentInfo');
  var span_tag = $('<span>');
  span_tag.attr('id', 'coupon-message');
  container.append(span_tag);
  span_tag.html(message);
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
      // Invalid coupons will only return an error message, which
      // removes all shipping selections from the page if updateOrderSummary
      // is called with just that data. updateOrderSummary will only
      // be called if shipment data exists within the response
      if (Object.keys(response).indexOf('shipments') > -1) {
        // Delivery state should only exist temporarily. When delivery options
        // get pulled in, there is already a pre-selected shipping rate. Order
        // should then advance to 'payment' state.
        if (response.state == 'delivery') {
          var rate_id = response.shipments[0].selected_shipping_rate.id;
          Spree.singlePageCheckout.shipment_id = response.shipments[0].id;
          Spree.singlePageCheckout.checkoutDelivery(rate_id, Spree.singlePageCheckout.shipment_id);
        }
        else {
          Spree.singlePageCheckout.updateOrderSummary(response);
        }
      }
      else {
        // Invalid coupons will still update shipping rate ID's on the
        // backend so another API call must be made to bring the updated
        // ID's onto the page.
        Spree.singlePageCheckout.couponMessageCreate(response.error);
        if (Spree.singlePageCheckout.state) {
          Spree.singlePageCheckout.apiRequest({});
        }
      }
    },
    error: function(response, b, c) {
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


Spree.singlePageCheckout.loadAddons = function() {
    var url = '/api/addons';
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        data: { 'order_id': Spree.current_order_id,
                'order_token': Spree.current_order_token },
        success: Spree.singlePageCheckout.loadAddonsSuccess,
        error: function(response) {
            console.log(response);
        }
    });
};

Spree.singlePageCheckout.loadAddonsSuccess = function(response) {
    if (response.count > 0) {
        var div = document.createElement('p');
        var text = document.createTextNode('Accessories: ');

        div.appendChild(text);
        $('.checkout-addons-header').append(div);

        $.each(response.addons, function(idx) {
            var addon = response.addons[idx];
            Spree.singlePageCheckout.createAddonHTML(addon);
        });
    }
}

Spree.singlePageCheckout.createAddonHTML = function(addon) {
    var div = document.createElement('div');
    var paragraph = document.createElement('p');
    var label = document.createElement('label');
    var input = document.createElement('input');
    var icon = document.createElement('i');
    var img = document.createElement('img');
    var text = document.createTextNode(addon.name + ' (+ ' + addon.display_price + ' )');
    var paraText = document.createTextNode('Accessories: ');

    div.className = 'checkbox';
    input.setAttribute('value', addon.id);
    input.setAttribute('style', 'display: none;');
    label.setAttribute('for', 'checkout_addon' + addon.id);

    icon.className = 'fa fa-square-o';
    img.src = addon.image_url;
    img.alt = addon.description;

    paragraph.appendChild(paraText);
    label.appendChild(icon);
    label.appendChild(img);
    label.appendChild(text);
    div.appendChild(input);
    div.appendChild(label);

    // Append element to the DOM
    $('.checkout-addons').append(div);
};

Spree.singlePageCheckout.removeLineItem = function(itemId) {
    Spree.singlePageCheckout.lineItemApiRequest(itemId, 'DELETE');
};

Spree.singlePageCheckout.addLineItem = function(itemId) {
    Spree.singlePageCheckout.lineItemApiRequest(itemId, 'POST');
};

Spree.singlePageCheckout.lineItemApiRequest = function(itemId, method) {
    var url = '/api/orders/' + Spree.current_order_id + '/line_items';
    var data = {};
    if (method === 'DELETE') {
        url = url + '/' + itemId;
    } else {
        data.order_token = Spree.current_order_token;
        data.line_item =  {
            "variant_id": itemId,
            "quantity": 1
        }
    }

    $.ajax({
        url: url,
        method: method,
        dataType: 'json',
        data: data,
        headers: { 'X-Spree-Token': Spree.current_order_token },
        success: function(response) {
            console.log(response);
            // THIS IS A HACK.  We should refactor to make this modular/elegant
            // (because eww)
            Spree.singlePageCheckout.apiRequest({});
        },
        error: function(response) {
            // TODO: Alert on error?
            console.log(response);
        }
    });
};


$(document).ready(function() {

  // Only execute if specific page loads
  if ($('#checkout-content').length > 0) {

    $('.checkout-addons').unbind('click').on('click', '.checkbox label', function(evt) {
      evt.preventDefault();
      evt.stopPropagation();

      var thisElement = $(this);
      var itemId = thisElement.siblings('input').attr('value');

      // We should probably store these in a data structure instead of relying
      // on the CSS class, but this works for now.
      if (thisElement.children('i').hasClass('fa-square-o')) {
        Spree.singlePageCheckout.addLineItem(itemId);
        thisElement.children('i').removeClass('fa-square-o').addClass('fa-check-square-o');
      } else {
        Spree.singlePageCheckout.removeLineItem(itemId);
        thisElement.children('i').removeClass('fa-check-square-o').addClass('fa-square-o');
      }
    });

    $('.checkout-shipping').unbind('click').on('click', '.checkbox label', function(e) {
      e.preventDefault();
      e.stopPropagation();

      var rate_id = $(this).siblings('input').attr('val');
      var shipment_id = $(this).siblings('input').attr('shipment');

      Spree.singlePageCheckout.shipment_id = shipment_id;
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

    // Set state if upon page refresh
    if ($('#address_full_name').val().length > 0) {
      Spree.singlePageCheckout.state = 'delivery';
    }

    // listen for changes on the address box
    Spree.singlePageCheckout.checkoutAddress();

    // listen for changes on the payments box
    Spree.singlePageCheckout.checkoutPayment();

    // Run once when page loads
    Spree.singlePageCheckout.checkoutCountry();

    // Load 'accessories' section
    Spree.singlePageCheckout.loadAddons();

    // Check if promo has been entered upon page refresh
    if ($('.promotion-label').length > 0) {
      Spree.singlePageCheckout.promoApproved = true;
    }
    else {
      Spree.singlePageCheckout.promoApproved = false;
    }

    // Listen for changes in the promotion code input field
    Spree.singlePageCheckout.checkoutCoupon();
  }
});
