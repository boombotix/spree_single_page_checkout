object false
node(:count) { @addons.count }
node(:total_count) { @addons.total_count }
node(:current_page) { params[:page] ? params[:page].to_i : 1 }
node(:per_page) { params[:per_page] || Kaminari.config.default_per_page }
node(:pages) { @addons.num_pages }
child @addons => :addons do
  attributes(*product_attributes)
end
