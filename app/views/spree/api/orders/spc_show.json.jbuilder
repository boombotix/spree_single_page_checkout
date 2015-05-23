json.(@order,
      :id,
      :number,
      :item_total,
      :total,
      :ship_total,
      :state,
      :adjustment_total,
      :payment_total,
      :shipment_state,
      :email
     )

json.display_item_total @order.display_item_total.to_s
json.display_tax_total @order.display_tax_total.to_s
json.display_ship_total @order.ship_total.to_s
json.display_total @order.display_total.to_s
json.display_additional_tax_total @order.display_additional_tax_total.to_s

json.token @order.guest_token
json.adjustments @order.adjustments do |adjustment|
  json.(adjustment, :label, :amount)
  json.display_amount adjustment.display_amount.to_s
end

json.line_items @order.line_items do |li|
  json.(li, :id, :quantity, :price, :variant_id)
  json.single_display_amount li.single_display_amount.to_s
  json.display_amount li.display_amount.to_s
  json.total li.total
  json.variant do
    json.(li.variant, :id, :name, :sku, :price, :slug)
    json.display_price li.variant.display_price.to_s
    json.images li.variant.images[0...1] do |image|
      json.id image.id
      json.mini_url image.attachment.url(:mini)
      json.small_url image.attachment.url(:small)
      json.large_url image.attachment.url(:large)
      json.product_url image.attachment.url(:product)
    end
  end
  json.adjustments li.adjustments do |adjustment|
    json.(adjustment, :label, :amount)
    json.display_amount adjustment.display_amount.to_s
  end
end

json.shipments @order.shipments do |shipment|
  json.(shipment, :id, :number, :cost)
  json.shipping_rates shipment.shipping_rates do |rate|
    json.(rate, :id, :name, :cost, :selected, :shipping_method_id, :shipping_method_code)
    json.display_cost rate.display_cost.to_s
  end
  json.shipping_methods shipment.shipping_methods do |method|
    json.(method, :id, :name)
  end
  json.selected_shipping_rate do
    json.(shipment.selected_shipping_rate, :id, :name, :selected, :cost, :shipping_method_id)
    json.display_cost shipment.selected_shipping_rate.display_cost.to_s
  end
  json.manifest shipment.manifest do |manifest_item|
    json.quantity manifest_item.quantity
    json.variant do
      json.(manifest_item.variant, :id, :sku, :slug, :name, :price)
      json.display_price manifest_item.variant.display_price.to_s
      json.images manifest_item.variant.images[0...1] do |image|
        json.id image.id
        json.mini_url image.attachment.url(:mini)
        json.small_url image.attachment.url(:small)
        json.large_url image.attachment.url(:large)
        json.product_url image.attachment.url(:product)
      end
    end
  end
end

json.errors do
  binding.pry
  @spc_errors.try(:to_json)
end
