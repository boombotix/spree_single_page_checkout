# encoding: UTF-8
Gem::Specification.new do |s|
  s.platform    = Gem::Platform::RUBY
  s.name        = 'spree_single_page_checkout'
  s.version     = '3.0.0'
  s.summary     = 'Single Page Checkout for the Boombotix store'
  s.required_ruby_version = '>= 2.2.0'

  s.author    = 'Alto Labs'
  s.email     = 'edwin@altolabs.co'
  # s.homepage  = 'http://www.spreecommerce.com'

  s.test_files  = `git ls-files -- {test,spec,features}/*`.split("\n")
  s.require_path = 'lib'
  s.requirements << 'none'

  s.add_dependency 'spree_core', '3.0.0'
  s.add_dependency 'bootstrap-sass',  '~> 3'
  s.add_dependency 'font-awesome-rails', '~> 4.0'
  s.add_dependency 'angularjs-rails', '1.2.16' # Version locked becuase the boombotix app is


  s.add_development_dependency 'pry-rails'
  s.add_development_dependency 'coffee-script'
  s.add_development_dependency 'poltergeist'
  s.add_development_dependency 'capybara'
  s.add_development_dependency 'database_cleaner'
  s.add_development_dependency 'factory_girl', '~> 4.4'
  s.add_development_dependency 'ffaker'
  s.add_development_dependency 'rspec-rails'
  s.add_development_dependency 'sass-rails',  '~> 4.0.3'
  s.add_development_dependency 'selenium-webdriver'
  s.add_development_dependency 'simplecov'
  s.add_development_dependency 'pg'
end
