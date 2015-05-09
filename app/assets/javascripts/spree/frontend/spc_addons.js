// Addons Foor the Single Page Checkout
$(function() {
  $.extend(Spree.singlePageCheckout, {
    loadAddons: function() {
      var url = '/api/addons';
      $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        data: {},
        success: Spree.singlePageCheckout.loadAddonsSuccess,
        error: function(response) {
          console.log(response);
        }
      });
    },

    loadAddonsSuccess: function(response) {
      if (response.count > 0) {
        var div = document.createElement('p');
        var text = document.createTextNode('You might also like: ');

        div.appendChild(text);
        $('.checkout-addons-header').append(div);

        $.each(response.addons, function(idx) {
          var addon = response.addons[idx];
          Spree.singlePageCheckout.createAddonHTML(addon);
        });
      }
    },

    createAddonHTML: function(addon) {
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

    removeLineItem: function(itemId) {
      Spree.singlePageCheckout.lineItemApiRequest(itemId, 'DELETE');
    },

    addLineItem: function(itemId) {
      Spree.singlePageCheckout.lineItemApiRequest(itemId, 'POST');
    },

    lineItemApiRequest: function(itemId, method) {
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
        success: function(response) {
          // THIS IS A HACK.  We should refactor to make this modular/elegant
          // (because eww)
          if (Spree.singlePageCheckout.state !== 'address') {
            // Spree.singlePageCheckout.updateOrder({});
          }
        },
        error: function(response) {
          // TODO: Alert on error?
        }
      });
    }
  });
});
