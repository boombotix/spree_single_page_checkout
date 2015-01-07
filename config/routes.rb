Spree::Core::Engine.add_routes do
  namespace :api, defaults: { format: 'json' } do
    resources :addons, only: [:index]
  end
  namespace :admin do
    match 'addons/edit', to: 'addon_configuration#edit', via: [:get]
    match 'addons', to: 'addon_configuration#update', via: [:patch, :put]
  end
end
