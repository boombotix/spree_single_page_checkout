module Spree
  module Api
    class AddonsController < Spree::Api::BaseController
      skip_filter :authenticate_user, :load_user

      def index
        # re-implement this with your own in a decorator; this placeholder
        # should allow the basic implementation to stand
        @addons = Kaminari.paginate_array(addon_variants).page(params[:page]).per(params[:per_page])
        respond_with(@addons)
      end

      private

      def addon_variants
        configuration = Spree::SinglePageCheckout::AddonConfiguration.new
        Spree::Variant.where(id: configuration.preferred_addon_variants)
      end
    end
  end
end
