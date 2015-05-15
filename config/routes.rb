Spree::Core::Engine.add_routes do
  namespace :api, defaults: { format: 'json' } do
    resources :addons, only: [:index]
    match 'checkouts/:id/single' => 'checkouts#spc_update', via: [:put]
    match 'checkouts/:id/purchase' => 'checkouts#spc_purchase', via: [:put]
    match 'checkouts/:id/shipments' => 'checkouts#spc_update_shipments', via: [:put]
  end
  namespace :admin do
    match 'addons/edit', to: 'addon_configuration#edit', via: [:get]
    match 'addons', to: 'addon_configuration#update', via: [:patch, :put]
  end
end
