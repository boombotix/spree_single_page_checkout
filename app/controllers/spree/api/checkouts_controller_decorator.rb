Spree::Api::CheckoutsController.class_eval do
  def spc_update
    spc_load_order
    authorize! :update, @order, order_token
    if @order.update_from_params(params, permitted_checkout_attributes, request.headers.env)

      # Add the coupon code if present and one hasn't already been applied
      if @order.can_add_coupon? && nested_params[:coupon_code]
        handler = Spree::PromotionHandler::Coupon.new(@order).apply

        if handler.error.present?
          spc_errors[:coupon] = handler.error
        end
      end

      # Hackish way of getting fresh info
      @order.update(state: :address)
      2.times { @order.next }

      respond_with(@order, default_template: 'spree/api/orders/show_with_manifest', status: 200)
    else
      invalid_resource! @order
    end
  end

  def spc_purchase
    spc_load_order
    authorize! :update, @order, order_token

    while @order.next; end
    redirect_to @order
  end

  def spc_update_shipments
    spc_load_order
    authorize! :update, @order, order_token

    @shipment = Spree::Shipment.find(params[:checkout][:id])
    @shipment.selected_shipping_rate_id = params[:checkout][:selected_shipping_rate_id]

    updater = Spree::OrderUpdater.new(@order)
    updater.update_shipment_total

    @order.reload
    respond_with(@order, default_template: 'spree/api/orders/show_with_manifest', status: 200)
  end

  private

  def spc_errors
    @spc_errors ||= {}
  end

  def spc_load_order
    @order = Spree::Order.eager_load(
      :shipments,
      :payments,
      :bill_address,
      :ship_address,
      line_items: [
        variant: [
          :images,
          :stock_items
        ]
      ]
    ).find_by(number: params[:id])
    raise_insufficient_quantity and return if @order.insufficient_stock_lines.present?
  end
end
