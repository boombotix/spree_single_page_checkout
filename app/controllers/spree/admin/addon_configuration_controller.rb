module Spree
  module Admin
    class AddonConfigurationController < Spree::Admin::BaseController
      def edit
        @addons = get_addons
      end

      def update
        variant_ids = addon_params['variants'].collect(&:to_i)
        set_addons(variant_ids)
        @addons = get_addons
        respond_to do |format|
          format.js { render :update }
        end
      end

      private

      def addon_params
        params.require(:addon).permit(:variants => [])
      end

      def configuration
        Spree::SinglePageCheckout::AddonConfiguration.new
      end

      def get_addons
        Spree::Variant.where(id: configuration.preferred_addon_variants)
      end

      def set_addons(variants)
        configuration.preferred_addon_variants = variants
      end
    end
  end
end
