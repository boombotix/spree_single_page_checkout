Deface::Override.new(
  virtual_path: 'spree/checkout/edit',
  replace_contents: '#checkout',
  partial: 'spree/checkout/single_page_checkout',
  name: 'single_page_checkout'
  )
