object @order
extends "spree/api/orders/order"

if lookup_context.find_all("spree/api/orders/#{root_object.state}").present?
  extends "spree/api/orders/#{root_object.state}"
end

child :billing_address => :bill_address do
  extends "spree/api/addresses/show"
end

child :shipping_address => :ship_address do
  extends "spree/api/addresses/show"
end

child :line_items => :line_items do
  extends "spree/api/line_items/show"
end

child :payments => :payments do
  attributes *payment_attributes

  child :payment_method => :payment_method do
    attributes :id, :name
  end

  child :source => :source do
    attributes *payment_source_attributes
    if @current_user_roles.include?('admin')
      attributes *payment_source_attributes.concat([:gateway_customer_profile_id, :gateway_payment_profile_id])
    else
      attributes *payment_source_attributes
    end
  end
end

# This is the only difference from the regualr Spree API... we need ALL of the
# shipment info for the SPC.
child :shipments => :shipments do
  extends "spree/api/shipments/show"
end

child :adjustments => :adjustments do
  extends "spree/api/adjustments/show"
end

# Necessary for backend's order interface
node :permissions do
  { can_update: current_ability.can?(:update, root_object) }
end

child :valid_credit_cards => :credit_cards do
  extends "spree/api/credit_cards/show"
end

