Spree::Order.class_eval do
  remove_checkout_step :confirm
end
