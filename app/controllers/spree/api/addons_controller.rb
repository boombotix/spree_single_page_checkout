module Spree
  module Api
    class AddonsController < Spree::Api::BaseController
      def index
        # re-implement this with your own in a decorator; this placeholder
        # should allow the basic implementation to stand
        @addons = Kaminari.paginate_array([]).page(params[:page]).per(params[:per_page])
        respond_with(@addons)
      end
    end
  end
end
