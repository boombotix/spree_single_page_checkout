require 'spec_helper'

describe 'Single Page Checkout', js: true do
  before do
    addon_config = Spree::SinglePageCheckout::AddonConfiguration.new
    addon_config.preferred_addon_variants = [
      warranty.master.id
    ]
    @address = attributes_for(:address, state: @state)
    @credit_card = attributes_for(:credit_card)
    create(:stock_location)
    create(:shipping_method, zones: [country_zone])
  end

  before :each do
    @order = create(:order_with_totals)
    @order.update_column(:state, 'address')
    create(:tax_rate, tax_category: Spree::TaxCategory.first)
    Spree::OrdersController.any_instance.stub spree_current_user: @order.user
    Spree::OrdersController.any_instance.stub current_order: @order
    Spree::CheckoutController.any_instance.stub spree_current_user: @order.user
    Spree::CheckoutController.any_instance.stub current_order: @order
    Spree::CheckoutController.any_instance.should_receive(:authorize!).with(:edit, @order, nil)
    visit spree.checkout_path
  end

  it 'Moves from Address to Delivery state when address is entered' do
    fill_in_address
    sleep 5.seconds
    state = page.evaluate_script('Spree.singlePageCheckout.state')
    expect(state).to eq('delivery')
  end

  it 'Adds shipping options to the Summary' do
    fill_in_address
    sleep 5.seconds
    expect(page).to have_content(Spree::ShippingMethod.first.name)
  end

  it 'Moves from Delivery to Payment when delivery option selected' do
    fill_in_address
    sleep 5.seconds
    first('label', text: Spree::ShippingMethod.first.name).click
    sleep 5.seconds
    state = page.evaluate_script('Spree.singlePageCheckout.state')
    expect(state).to eq('payment')
  end

  it 'Adds Taxes to the Summary' do
    fill_in_address
    sleep 5.seconds
    expect(page).to have_content("Tax (+#{@order.display_tax_total}")
  end

  it 'Updates the Total' do
    fill_in_address
    sleep 5.seconds
    @order.update!
    expect(page).to have_content("Pay #{@order.display_total}")
  end

  it 'Geolocates the Customer' do
    find('.geoLocator').click
    sleep 5.seconds
    address_val = page.evaluate_script('$(\'#address_address1\').val();')
    expect(address_val).to eq('8000 Sunset Blvd')
  end

  it 'enables the pay now button on valid payment input' do
    fill_in_address
    sleep 5.seconds
    fill_in_payment
    btn_disabled = page.evaluate_script('$(\'#checkout-pay-btn\').hasClass(\'disabled\');')
    expect(btn_disabled).to eq(false)
  end

  def fill_in_address
    fill_in 'address_full_name', with: @address[:firstname] + ' ' + @address[:lastname]
    fill_in 'address_address1', with: @address[:address1]
    fill_in 'address_address2', with: @address[:address2]
    fill_in 'address_city', with: @address[:city]
    fill_in 'address_state_name', with: @address[:state].name
    fill_in 'address_zipcode', with: @address[:zipcode]
    fill_in 'address_phone', with: @address[:phone]
    select 'United States of America', from: 'address_country_id', visible: false
  end

  def fill_in_payment
    fill_in 'name', with: @credit_card[:name]
    fill_in 'number', with: @credit_card[:number]
    fill_in 'verification_value', with: @credit_card[:verification_value]
    fill_in 'date', with: "#{@credit_card[:month]}/#{@credit_card[:year]}"
  end
end
