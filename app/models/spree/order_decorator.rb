Spree::Order.class_eval do
  after_save :update_shipping_and_tax
  remove_checkout_step :confirm

  private

  def update_shipping_and_tax
    self.shipments.each do |shipment|
      shipment.refresh_rates
      shipment.update_amounts
    end
    line_items.each do |line_item|
      line_item.send(:update_tax_charge)
    end
    self.update!
  end

end
