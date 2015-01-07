module Spree
  module SinglePageCheckout
    class AddonConfiguration < Preferences::Configuration
      preference :addon_variants, :array, default: []
    end
  end
end

