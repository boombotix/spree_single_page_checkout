Spree::Api::LineItemsController.class_eval do
  private

  # override this method to use a line_item's variant_id as well during lookup
  #  - Allows for kinda crappy javascript, but prevents complex refactoring ATM
  #  - TODO:  Clean up the JS and remove this override
  def find_line_item
    id = params[:id].to_i
    order.line_items.detect { |line_item|
      line_item.id == id || line_item.variant_id == id
    } or raise ActiveRecord::RecordNotFound
  end
end
