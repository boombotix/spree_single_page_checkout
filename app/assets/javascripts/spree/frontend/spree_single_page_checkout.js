//= require handlebars-v2.0.0
//= require jquery.payment
//= require jquery.h5validate
//= require jquery-ui/autocomplete
//= require jquery-ui/effect-shake
//= require jquery.select-to-autocomplete.min

/**
 * Spree Single Page Checkout
 * @author Alto Labs [hi@altolabs.co]
 */

/** Initialize the Spree namespace if undefined. */
if (!window.Spree) { window.Spree = {}; }

/**
 * singlePageCheckout
 * @namespace
 */
Spree.singlePageCheckout = {

    /**
     * An options object to provide custom setup
     * @namespace
     */
    options: {},

    /**
     * A function that checks the validity of both address and payment forms
     * @function
     */
    checkCompleteForm: function () {
      if (Spree.singlePageCheckout.paymentFormValid &&
        Spree.singlePageCheckout.addressFormValid &&
        Spree.singlePageCheckout.state === 'payment') {
        Spree.singlePageCheckout.readyForm();
      } else {
        Spree.singlePageCheckout.disableForm();
      }
    },

    // Activates the pay button
    readyForm: function () {
      $('#checkout-pay-btn').unbind('click').on('click', function () {
        // Remove value from field to prevent submisson
        // of invalid coupon or double submission of valid code
        $('#coupon_code').val('');
        $('#payment-form').submit();
        // Prevent the button from being clicked multiple times & display a
        // 'processing' message
        $(this).removeClass('spc-ready').addClass('disabled processing');
      }).removeClass('disabled need-info').addClass('spc-ready');
    },

    // Disables the pay button
    disableForm: function () {
      var checkoutPayBtn = $('#checkout-pay-btn');
      var buttonPrice = $('#button-price');
      checkoutPayBtn.removeClass('spc-ready');
      checkoutPayBtn.unbind('click').on('click', function () {
        checkoutPayBtn.addClass('disabled need-info');
        $('#pay-button-container').effect('shake');
        setTimeout(function () {
          checkoutPayBtn.removeClass('disabled need-info');
        }, 1000);
      });
    },

    // Listen to inputs on the address box. When it has
    // been completely filled out, make an AJAX call to the
    // Spree API to continue.
    checkoutAddress: function () {

      // Validate the form inputs: sets an error class if the
      // field does not match the 'pattern' attribute
      $('.addressInfo form').h5Validate({
        errorClass: 'validation-error'
      });

      var checkAddressForm = function () {
        var shippingAddressForm = $('#spc-shipping-address form');
        var billingAddressForm = $('#spc-billing-address form');

        var formsValid = function () {
          var shipValidity = shippingAddressForm.h5Validate('allValid');
          var billValidity = billingAddressForm.h5Validate('allValid');

          if (Spree.singlePageCheckout.useSameAddress) {
            return shipValidity;
          } else {
            return (shipValidity && billValidity);
          }
        };

        // if all of the required inputs have been filled out,
        if (formsValid()) {

          // Must be true to activate Pay button
          Spree.singlePageCheckout.addressFormValid = true;
          if (Spree.singlePageCheckout.paymentFormValid &&
            Spree.singlePageCheckout.state == 'payment') {
            Spree.singlePageCheckout.readyForm();
          }


          // Address object constructor



          // Prepare the object for PUT to the server:
          var shippingAddress = new Spree.singlePageCheckout.Address(shippingAddressForm);
          var billingAddress = new Spree.singlePageCheckout.Address(billingAddressForm);
          var data = {
            order: {
              ship_address_attributes: shippingAddress,
              bill_address_attributes: Spree.singlePageCheckout.useSameAddress ?
                shippingAddress : billingAddress
            }
          };

          // make the AJAX request:
          Spree.singlePageCheckout.updateOrder(data).then(function() {
            // If the order hasn't been advanced, advance it to the payment state
            // if (Spree.singlePageCheckout.state === 'address') {
            //   Spree.singlePageCheckout.advanceOrder();
            // }
          });
        } else {
          // Keeps pay button disabled or makes it
          // disabled if it has already been activated
          Spree.singlePageCheckout.addressFormValid = false;
          Spree.singlePageCheckout.disableForm();
        }
      };

      // Run the check once in case address is already loaded from user profile
      checkAddressForm();

      // Listen for changes in the form
      $('.addressInfo input, .addressInfo select').on('change', checkAddressForm);
      $('.country').on('change', function () {
        Spree.singlePageCheckout.checkoutCountry($(this));
      });
    },

    // For countries other than U.S., change state dropdown to text field
    checkoutCountry: function ($countrySelect) {
      var getStates = function () {
        var country_id = $countrySelect.val();
        $.get(Spree.routes.states_search, {
          country_id: country_id
        }, function (data) {
          var $states_container = $countrySelect.parents('.addressInfo').find('.states-container');
          if (data.states.length === 0) {
            $states_container.empty();
            $states_container.append('<input autocomplete="region" class="form-control state validation-error h5-active" id="address_state_name" name="address[state_name]" placeholder="State, Province, or Region" required="required" type="text">');
          } else {
            // Regenerate the <select> with proper options for the selected country
            var all_states = data.states;
            $states_container.empty();
            var selectEl = document.createElement('select');
            selectEl.setAttribute('name', 'address[state_name]');
            selectEl.setAttribute('autocomplete', 'region');
            selectEl.setAttribute('class', 'form-control state');
            selectEl.setAttribute('required', true);
            $.each(all_states, function (index, value) {
              var $el = $(selectEl);
              $el.append($("<option></option>")
                .attr("value", value.name).text(value.name));
            });
            $states_container.append(selectEl);
          }
          // Check address and rebind event handlers
          Spree.singlePageCheckout.checkoutAddress();
        });
      };
      getStates();
    },

    // update the order summary section after a successful request
    updateOrderSummary: function (data) {

      // Handlebars helper to check if two values are equal
      Handlebars.registerHelper('ifEql', function (value1, value2, options) {
        if (value1 === value2) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      });

      // Mutate the data a little bit... we need the total amount for each variable
      // (price * quantity)
      $.each(data.shipments, function (i, shipment) {
        $.each(shipment.manifest, function (j, manifest_item) {
          manifest_item.display_amount = manifest_item.quantity * manifest_item.variant.price;
        });
      });

      // Update the shipping options
      var shipmentTemplate = Handlebars.compile($('#checkout-shipment-template').html());
      $('#line-items').html('');
      $.each(data.shipments, function (idx, shipment) {
        var rendered = shipmentTemplate({
          shipment: shipment,
          number: idx + 1
        });
        $('#line-items').append(rendered);
      });

      // Update line_item promotions
      var items = data.line_items;
      $.each(items, function (index, item) {
        if (item.adjustments.length > 0) {
          for (var j = 0; j < item.adjustments.length; j++) {
            if (item.adjustments[j].source_type == 'Spree::PromotionAction') {
              Spree.singlePageCheckout.promoApproved = true;
              $('#line-item-adjustments').html('<div class="checkbox-box"> ' + item.adjustments[j].label + ' ' + adjustments[j].display_amount + '</div>');
            }
          }
        }
      });

      // Hide the Spree 'No Image Available' image
      var imageElements = $('#line-items').find('img');
      imageElements.each(function () {
        var noImageRegExp = /noimage/;
        var imgEl = $(this);
        if (noImageRegExp.test(imgEl.attr('src')) || !imgEl.attr('src')) {
          imgEl.hide();
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
      } else {
        Spree.singlePageCheckout.checkoutCoupon();
      }

      // Update the payment variable
      if (data.payments.length > 0) {
        Spree.singlePageCheckout.payment = true;
      }

      // Run validation check when delivery options come in
      Spree.singlePageCheckout.checkCompleteForm();
    },

    // Make an API call when the user selects their delivery options
    checkoutDelivery: function (rate_id, shipment_id) {
      var data = {
        order: {
          shipments_attributes: {
            "0" : {
              selected_shipping_rate_id: rate_id,
              id: shipment_id
            }
          }
        }
      };
      Spree.singlePageCheckout.updateOrder(data);
    },

    // Only enable the pay button once all prior steps have been completed.
    checkoutPayment: function () {
      if ($('.paymentInfo').length > 0) {
        $('.paymentInfo input').on('change', function () {

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
          } else {
            payment_validate.name.valid = false;
          }

          $.each(payment_validate, function (key, value) {
            if (value.valid) {
              $(value.id).removeClass('validation-error');
            } else {
              $(value.id).addClass('validation-error');
            }
          });

          if (payment_validate.name.valid && payment_validate.number.valid && payment_validate.date.valid && payment_validate.cvc.valid) {
            Spree.singlePageCheckout.paymentFormValid = true;
          } else {
            Spree.singlePageCheckout.paymentFormValid = false;
          }
          Spree.singlePageCheckout.checkCompleteForm();
        });
      } else {
        $('#checkout-pay-btn').removeClass('disabled');
      }
    },

    // Allows coupon entry and grabs coupon code for an API call
    checkoutCoupon: function () {
      var couponCode = $('#coupon_code');
      if (Spree.singlePageCheckout.state) {
        // Removes the early coupon attempt message
        if (Spree.singlePageCheckout.earlyCouponAttempt === true) {
          $('#coupon-message').remove();
          Spree.singlePageCheckout.earlyCouponAttempt = false;
        }
        couponCode.unbind('keydown paste');
        couponCode.unbind('change').on('change', function () {
          // Only make API call if no coupon has been approved
          if (Spree.singlePageCheckout.promoApproved === false) {
            var entered_code = couponCode.val();
            var data = {
              order: {
                coupon_code: entered_code
              }
            };
            Spree.singlePageCheckout.updateOrder(data);
          } else {
            Spree.singlePageCheckout.couponMessageCreate(
              'A coupon code has already been applied!'
            );
          }
        });
      } else {
        // Disables coupon field if address has not been entered
        couponCode.unbind('keydown paste').on('keydown paste', function () {
          Spree.singlePageCheckout.couponMessageCreate(
            'Please enter address before entering coupon code.'
          );
          // Sets value to true if coupon input attempt was made before address
          Spree.singlePageCheckout.earlyCouponAttempt = true;
          return false;
        });
      }
    },

    couponMessageCreate: function (message) {
      $('#coupon-message').remove();
      var container = $('.paymentInfo');
      var span_tag = $('<span>');
      span_tag.attr('id', 'coupon-message');
      container.append(span_tag);
      span_tag.html(message);
    },
    // Update the order with new info via the API
    updateOrder: function (data) {
    //   var url = '/api/orders/' + Spree.current_order_id + '.json';
    //   return this.apiRequest(url, data, function(response) {
    //     Spree.singlePageCheckout.state = response.state;
    //   });
    // },
    // // Advance the order to the next state
    // advanceOrder : function () {
      // Display a loading message while the API call is in progress.
      $('#line-items').html(
        '<div class="checkout-loading">' +
        '<i class="fa fa-gear fa-spin fa-4x"></i>' +
        '<span>Updating your order...</span></div>'
      );

      var url = '/api/checkouts/' + Spree.current_order_id + '.json';
      data.template = this.options.template || 'spree/api/orders/show_with_manifest';
      return this.apiRequest(url, data, function (response) {
          // Invalid coupons will only return an error message, which
          // removes all shipping selections from the page if updateOrderSummary
          // is called with just that data. updateOrderSummary will only
          // be called if shipment data exists within the response
          if (Object.keys(response).indexOf('shipments') > -1) {
            Spree.singlePageCheckout.updateOrderSummary(response);
          } else {
            // Invalid coupons will still update shipping rate ID's on the
            // backend so another API call must be made to bring the updated
            // ID's onto the page.
            Spree.singlePageCheckout.couponMessageCreate(response.error);
            if (Spree.singlePageCheckout.state) {
              Spree.singlePageCheckout.updateOrder({});
            }
          }
      });

    },
    // function for making Spree API calls
    apiRequest: function (url, data, callback) {
      data.order_token = Spree.current_order_token;
      return $.ajax({
        url: url,
        method: 'PUT',
        dataType: 'json',
        data: data,
        headers: {
          'X-Spree-Token': Spree.current_order_token
        },
        success: callback,
        error: function (response, b, c) {
          Spree.singlePageCheckout.errorHandler(response, b, c);
        }
      });
    },

    // Handle Errors returned from the API
    errorHandler: function (apiResponse, b, c) {
      // This can be built out if need be in the future; Currently the only
      // field that will throw a validation error from the API is the
      // state_name field.
      $('#address_state_name').addClass('validation-error');
    },


    loadAddons: function () {
      var url = '/api/addons';
      $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        data: {},
        success: Spree.singlePageCheckout.loadAddonsSuccess,
        error: function (response) {
          console.log(response);
        }
      });
    },

    loadAddonsSuccess: function (response) {
      if (response.count > 0) {
        var div = document.createElement('p');
        var text = document.createTextNode('You might also like: ');

        div.appendChild(text);
        $('.checkout-addons-header').append(div);

        $.each(response.addons, function (idx) {
          var addon = response.addons[idx];
          Spree.singlePageCheckout.createAddonHTML(addon);
        });
      }
    },

    createAddonHTML: function (addon) {
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
      if (addon.image_url) {
        img.src = addon.image_url;
        img.alt = addon.description;
        img.className = 'accessory-img';
      }

      paragraph.appendChild(paraText);
      label.appendChild(icon);
      if (addon.image_url) {
        label.appendChild(img);
      }
      label.appendChild(text);
      div.appendChild(input);
      div.appendChild(label);

      // Append element to the DOM
      $('.checkout-addons').append(div);
    },

    removeLineItem: function (itemId) {
      Spree.singlePageCheckout.lineItemApiRequest(itemId, 'DELETE');
    },

    addLineItem: function (itemId) {
      Spree.singlePageCheckout.lineItemApiRequest(itemId, 'POST');
    },

    lineItemApiRequest: function (itemId, method) {
      var url = '/api/orders/' + Spree.current_order_id + '/line_items';
      var data = {};
      if (method === 'DELETE') {
        url = url + '/' + itemId;
      } else {
        data.order_token = Spree.current_order_token;
        data.line_item = {
          "variant_id": itemId,
          "quantity": 1
        };
      }

      $.ajax({
        url: url,
        method: method,
        dataType: 'json',
        data: data,
        headers: {
          'X-Spree-Token': Spree.current_order_token
        },
        success: function (response) {
          // THIS IS A HACK.  We should refactor to make this modular/elegant
          // (because eww)
          if (Spree.singlePageCheckout.state !== 'address') {
            Spree.singlePageCheckout.updateOrder({});
          }
        },
        error: function (response) {
          // TODO: Alert on error?
        }
      });
    }
  }; // END Spree.singlePageCheckout


$(document).ready(function () {

  function matchGeoData(address_component, type) {
    if (address_component.types.indexOf(type) !== -1) {
      return true;
    } else {
      return false;
    }
  }

  // Only execute if specific page loads
  if ($('#checkout-content').length > 0) {

    // The initial state of the checkout should be 'address'
    Spree.singlePageCheckout.state = 'address';

    // ADDONS: Listens for clicks on addon items
    $('.checkout-addons').unbind('click').on('click', '.checkbox label', function (evt) {
      evt.preventDefault();
      evt.stopPropagation();

      var el = $(this);
      var itemId = el.siblings('input').attr('value');

      if (el.attr('selected')) {
        Spree.singlePageCheckout.removeLineItem(itemId);
        el.attr('selected', false);
        el.children('i').
        addClass('fa-square-o').
        removeClass('fa-check-square-o');
      } else {
        Spree.singlePageCheckout.addLineItem(itemId);
        el.attr('selected', true);
        el.children('i').
        addClass('fa-check-square-o').
        removeClass('fa-square-o');
      }
    });

    // SHIPMENT METHOD: Listens for clicks on shipment methods and makes an API
    // request when detected.
    $('#line-items').on('click', '.checkbox label', function (e) {
      e.preventDefault();
      e.stopPropagation();

      var el = $(this);
      var rate_id = el.siblings('input').attr('val');
      var shipment_id = el.siblings('input').attr('shipment');

      Spree.singlePageCheckout.checkoutDelivery(rate_id, shipment_id);

      // Displays a spinning gear in place of the checkbox while the AJAX call
      // is run.
      el.children('i').
      removeClass('fa-square-o fa-check-square-o').
      addClass('fa-gear fa-spin');
    });

    var geoSuccessHandler = function (position) {
      var lat = position.coords.latitude,
        lng = position.coords.longitude,
        geocoder = new google.maps.Geocoder(),
        latlng = new google.maps.LatLng(lat, lng);

      geocoder.geocode({
        'latLng': latlng
      }, function (results, status) {
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
            var shippingAddressForm = $('#spc-shipping-address form');
            shippingAddressForm.find('.country option:contains(' + country + ')').attr('selected', true);
            shippingAddressForm.find('.street').val(streetNumber + ' ' + streetName);
            shippingAddressForm.find('.city').val(city);
            shippingAddressForm.find('.zipcode').val(zip);
            shippingAddressForm.find('.state').val(state);
            $('.geoLocator i').removeClass('fa-spin');
          } else {
            $('.geoLocator i').removeClass('fa-spin fa-crosshairs').addClass('fa-exclamation-triangle');
            console.warn('Geocoder failed due to: ' + status);
          }
        }
      });
    };

    $('.geoLocator').unbind('click').on('click', function () {
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

    // Show / Hide the billing address info when the checkbox is clicked
    Spree.singlePageCheckout.useSameAddress = true;
    $('.billing-address-toggle').on('click', function () {
      var el = $(this);
      var faCheckbox = el.siblings('label').find('.fa');
      if (el.is(':checked')) {
        Spree.singlePageCheckout.useSameAddress = true;
        faCheckbox.removeClass('fa-square-o').addClass('fa-check-square-o');
      } else {
        Spree.singlePageCheckout.useSameAddress = false;
        faCheckbox.removeClass('fa-check-square-o').addClass('fa-square-o');
      }
      $('#spc-billing-address').toggle();
    });

    // listen for changes on the address box
    // Spree.singlePageCheckout.checkoutAddress();

    // listen for changes on the payments box
    // Spree.singlePageCheckout.checkoutPayment();

    // Load 'accessories' section
    Spree.singlePageCheckout.loadAddons();

    // Check if promo has been entered upon page refresh
    if ($('.promotion-label').length > 0) {
      Spree.singlePageCheckout.promoApproved = true;
    } else {
      Spree.singlePageCheckout.promoApproved = false;
    }

    // Listen for changes in the promotion code input field
    Spree.singlePageCheckout.checkoutCoupon();
  }
});
