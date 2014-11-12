Spree::Core::Engine.add_routes do
  namespace :api, defaults: { format: 'json' } do
    resources :addons, only: [:index]
  end
end
