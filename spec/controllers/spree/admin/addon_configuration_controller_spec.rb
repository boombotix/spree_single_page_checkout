require 'spec_helper'

module Spree
  module Admin
    describe AddonConfigurationController, type: :controller do
      let(:user) { create :admin_user, spree_api_key: SecureRandom.hex(24) }
      let!(:mug) { create :product, name: 'ROR Mug' }
      let!(:bear) { create :product, name: 'Teddy Bear' }
      let(:addon_config) { Spree::SinglePageCheckout::AddonConfiguration.new }

      before do
        allow_any_instance_of(Spree::Admin::BaseController).
          to receive(:spree_current_user).
          and_return(user)
        allow(controller).
          to receive(:authorize!).and_return(true)
      end

      describe '#edit' do
        before do
          addon_config.preferred_addon_variants = [ mug.master.id, bear.master.id]
          spree_get :edit
        end

        it 'provides a collection of variants' do
          variants = Spree::Variant.where(id: addon_config.preferred_addon_variants)
          expect(assigns(:addons)).to eq(variants)
        end

        it 'renders the "edit" template' do
          expect(response).to render_template(:edit)
        end
      end

      describe '#update' do
        before do
          spree_put :update, addon: { variants: [ mug.master.id.to_param ] }, format: :js
        end

        it 'updates the addon configuration' do
          expect(addon_config.preferred_addon_variants).to eq([mug.master.id])
        end

        it 'provides a collection of variants equal to the addons chosen' do
          expected_variants = [mug.master]
          expect(assigns(:addons)).to eq(expected_variants)
        end

        it 'renders the "update" template' do
          expect(response).to render_template(:update)
        end
      end
    end
  end
end

