require 'spec_helper'

module Spree
  module Admin
    describe 'Addon Configuration', type: :feature, js: true do
      let(:admin_user) { create :admin_user, spree_api_key: SecureRandom.hex(24) }
      let!(:mug) { create :product, name: 'ROR Mug' }
      let!(:tote) { create :product, name: 'ROR Tote Bag' }

      before :each do
        allow_any_instance_of(Spree::Admin::BaseController).
          to receive(:spree_current_user).
          and_return(admin_user)
        clear_addons
      end

      describe 'Product Selection' do
        before :each do
          visit_addon_configuration
        end

        context 'when a product name is entered' do
          it 'displays the matching product name' do
            choose_product mug, false
            expect(find('.select2-results')).
              to have_content(mug.name)
          end
        end

        context 'when the "Add to Addons" button is clicked' do
          it 'add the chosen product to the list of addons' do
            choose_product mug
            expect(find('#addons')).to have_content(mug.name)
          end
        end

        context 'when a second item is selected' do
          before do
            choose_product mug
          end

          it 'adds it to the list of addons' do
            choose_product tote
            expect(find('#addons')).to have_content(tote.name)
          end
        end
      end

      describe 'Product Removal', order: :defined do
        context 'when the delete button is clicked' do
          before do
            addon_config = Spree::SinglePageCheckout::AddonConfiguration.new
            addon_config.preferred_addon_variants = [mug.master.id, tote.master.id]
            visit_addon_configuration
          end

          it 'removes the products from addons' do
            find('.variant', text: mug.name).find('.remove-addon').click
            expect(find('#addons')).to_not have_content(mug.name)
          end

          it 'does not remove other addons' do
            expect(find('#addons')).to have_content(tote.name)
          end
        end
      end
    end
  end
end

def visit_addon_configuration
  visit spree.admin_path
  click_on 'Configuration'
  click_on 'Addon Configuration'
end

def choose_product(product, select = true)
  find('.select2-choice').click
  find('.select2-input').set(product.name)
  if select
    find('.select2-result', text: product.name).click
    click_on 'Add to Addons'
  end
end

def clear_addons
  addon_config = Spree::SinglePageCheckout::AddonConfiguration.new
  addon_config.preferred_addon_variants = []
end

