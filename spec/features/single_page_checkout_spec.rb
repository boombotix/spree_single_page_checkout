require 'spec_helper'

describe 'Single Page Checkout', type: :feature, js: true do
  let!(:country) { create(:country, states_required: true) }
  let!(:state) { create(:state, country: country) }
  let!(:shipping_method) { create(:shipping_method) }
  let!(:stock_location) { create(:stock_location) }
  let!(:mug) { create(:product, name: 'RoR Mug') }
  let!(:tote) { create(:product, name: 'RoR Tote Bag') }
  let!(:warranty) { create(:product, name: 'Extended Warranty') }
  let!(:payment_method) { create(:credit_card_payment_method) }
  let!(:zone) { create(:zone) }


  before do
    addon_config = Spree::SinglePageCheckout::AddonConfiguration.new
    addon_config.preferred_addon_variants = [
      warranty.master.id,
      tote.master.id
    ]
    @address = attributes_for(:address, state: state)
    @credit_card = attributes_for(:credit_card)
  end

  before :each do
    stock_location.stock_items.update_all(count_on_hand: 2)
    add_mug_to_cart
    Spree::Order.last.update_column(:email, "test@example.com")
    click_button "Checkout"
    @order = Spree::Order.last
  end

  it 'Adds shipping options to the Summary' do
    fill_in_address
    expect(page).to have_content(Spree::ShippingMethod.first.name)
  end

  context 'when the billing address is different from the shipping address' do
    let!(:billing_address) do
      attributes_for(
        :address,
        firstname: 'Kathryn',
        lastname: 'Janeway',
        address1: '35 Keyes Ave',
        city: 'San Francisco',
        zipcode: '94129',
        state: state
      )
    end

    it 'shows the billing address form' do
      find('.billing-address-toggle').trigger('click')
      expect(page).to have_selector('#spc-billing-address', visible: true)
    end

    it 'updates the order with the two seperate addresses' do
      find('.billing-address-toggle').trigger('click')
      fill_in_address
      fill_in_address('billing', billing_address)
      wait_for_ajax
      @order.reload
      expect(@order.billing_address.address1).to eq(billing_address[:address1])
    end
  end

  it 'Moves from Delivery to Payment when delivery option selected' do
    fill_in_address
    find('.checkout-shipping').first('label').click
    wait_for_ajax
    state = page.evaluate_script('Spree.singlePageCheckout.state')
    expect(state).to eq('payment')
  end

  it 'Adds Taxes to the Summary' do
    fill_in_address
    expect(page).to have_content("Tax (+#{@order.display_tax_total}")
  end

  it 'Updates the Total' do
    fill_in_address
    @order.update!
    expect(page).to have_content("Pay #{@order.display_total}")
  end

  it 'Geolocates the Customer' do
    skip # To be removed.
    find('.geoLocator').click
    sleep 3.seconds
    expect(find('#spc-shipping-address .street').value).to eq('8000 Sunset Blvd')
  end

  context 'when payment info has been filled out' do
    before do
      fill_in_address
      fill_in_payment
      wait_for_ajax
    end

    it 'enables the pay now button' do
      btn_disabled = page.evaluate_script('$(\'#checkout-pay-btn\').hasClass(\'disabled\');')
      expect(btn_disabled).to eq(false)
    end

    it 'changes the button text to "PLACE ORDER"' do
      expect(find('#checkout-pay-btn')).to have_content('PLACE ORDER')
    end
  end

  it 'Displays addons in order summary' do
    expect(find('.checkout-addons')).
      to have_content(warranty.name)
  end

  context 'when there is more than one of the same item in a shipment' do
    before do
      add_mug_to_cart # Add a second mug to the order
      click_button 'Checkout'
      fill_in_address
      wait_for_ajax
    end

    it 'displays an amount that is equal to quantity x price' do
      expect(find('#line-items')).to have_content(mug.price * 2)
    end
  end

  context 'when addon chosen and the address is filled out', order: :defined do
    before do
      fill_in_address
      sleep 5.seconds
      find('.checkout-addons').find('label', text: warranty.name).click
      sleep 10.seconds
    end

    it 'adds addon to order' do
      expect(find('#line-items')).
        to have_content(warranty.name)
    end

    it 'updates order summary' do
      addon_price = warranty.price
      original_order_total = @order.item_total
      total_with_addon = addon_price + original_order_total
      expect(first('.checkout-total')).
        to have_content(total_with_addon.to_s)
    end

  end

  context 'when another addon is selected' do
    before do
      fill_in_address
      find('.checkout-addons').find('label', text: warranty.name).click
      sleep 5.seconds
      find('.checkout-addons').find('label', text: tote.name).click
      sleep 10.seconds
    end

    it 'adds it to the order' do
      expect(find('#line-items')).
        to have_content(tote.name)
      expect(find('#line-items')).
        to have_content(warranty.name)
    end

    it 'updates the order total' do
      addon_cost = warranty.price + tote.price
      original_order_total = @order.item_total
      total_with_addons = addon_cost + original_order_total
      expect(first('.checkout-total')).
        to have_content(total_with_addons.to_s)
    end
  end

  def fill_in_address(type = 'shipping', address = @address)
    form = find("#spc-#{type}-address")
    form.fill_in 'address[full_name]', with: address[:firstname] + ' ' + address[:lastname]
    form.fill_in 'address[address1]', with: address[:address1]
    form.fill_in 'address[address2]', with: address[:address2]
    form.fill_in 'address[city]', with: address[:city]
    form.select address[:state], from: 'address[state_name]'
    form.fill_in 'address[zipcode]', with: address[:zipcode]
    form.fill_in 'address[phone]', with: address[:phone]
    form.select 'United States of America', from: 'address[country_id]', visible: false
  end

  def fill_in_payment
    fill_in 'name', with: @credit_card[:name]
    fill_in 'number', with: @credit_card[:number]
    fill_in 'verification_value', with: @credit_card[:verification_value]
    fill_in 'date', with: "#{@credit_card[:month]}/#{@credit_card[:year]}"
  end

  def add_mug_to_cart
    visit spree.root_path
    click_link mug.name
    click_button "add-to-cart-button"
  end
end
