# encoding: UTF-8
Gem::Specification.new do |s|
  s.platform    = Gem::Platform::RUBY
  s.name        = 'spree_single_page_checkout'
  s.version     = '2.2.2'
  s.summary     = 'Single Page Checkout for the Boombotix store'
  s.required_ruby_version = '>= 1.9.3'

  s.author    = 'Alto Labs'
  s.email     = 'edwin@altolabs.co'
  # s.homepage  = 'http://www.spreecommerce.com'

  s.test_files  = `git ls-files -- {test,spec,features}/*`.split("\n")
  s.require_path = 'lib'
  s.requirements << 'none'

  s.add_dependency 'spree_core', '~> 2.2.2'
  s.add_dependency 'bootstrap-sass',  '~> 3'
  s.add_dependency 'font-awesome-rails', '~> 4.0'

  s.add_development_dependency 'pry'
  s.add_development_dependency 'poltergeist'
  s.add_development_dependency 'capybara'
  s.add_development_dependency 'database_cleaner'
  s.add_development_dependency 'factory_girl', '~> 4.4'
  s.add_development_dependency 'ffaker'
  s.add_development_dependency 'rspec-rails',  '~> 2.13'
  s.add_development_dependency 'sass-rails',  '~> 4.0.3'
  s.add_development_dependency 'selenium-webdriver'
  s.add_development_dependency 'simplecov'
  s.add_development_dependency 'sqlite3'

end
