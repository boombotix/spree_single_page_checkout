Deface::Override.new(
  virtual_path: 'spree/admin/shared/sub_menu/_configuration',
  insert_bottom: '[data-hook="admin_configurations_sidebar_menu"]',
  text: '<%= configurations_sidebar_menu_item Spree.t(:addon_configuration), admin_addons_edit_path %>',
  name: 'add_addons_config_to_admin'
)
