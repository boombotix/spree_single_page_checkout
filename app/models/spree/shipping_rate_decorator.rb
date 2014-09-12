Spree::ShippingRate.class_eval do
  belongs_to :shipment, class_name: 'Spree::Shipment', touch: true
end
