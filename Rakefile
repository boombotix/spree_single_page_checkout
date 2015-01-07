require 'bundler'
Bundler::GemHelper.install_tasks

require 'rspec/core/rake_task'
require 'spree/testing_support/extension_rake'

RSpec::Core::RakeTask.new

task :default do
  if Dir['spec/dummy'].empty?
    Rake::Task[:test_app].invoke
    Dir.chdir('../../')
  end
  Rake::Task[:spec].invoke
end

desc 'Generates a dummy app for testing'
task :test_app do
  ENV['LIB_NAME'] = 'spree_single_page_checkout'
  require "#{ENV['LIB_NAME']}"

  Spree::DummyGenerator.start([
    "--lib_name=#{ENV['LIB_NAME']}",
  ], database: 'postgresql')
  Spree::InstallGenerator.start([
    "--lib_name=#{ENV['LIB_NAME']}",
    "--auto-accept",
    "--migrate=false",
    "--seed=false",
    "--sample=false",
    "--user_class=Spree::LegacyUser"
  ])

  # Use the postgres database.yml instead of SQLite
  require 'fileutils'
  pg_database = File.expand_path('../support/database.yml')
  dummy_db_config = File.expand_path('config/database.yml')
  cp(pg_database, dummy_db_config)

  puts "Setting up dummy database..."
  cmd = "bundle exec rake db:drop db:create db:migrate db:test:prepare"

  if RUBY_PLATFORM =~ /mswin/ #windows
    cmd += " >nul"
  else
    cmd += " >/dev/null"
  end

  system(cmd)

  begin
    require "generators/#{ENV['LIB_NAME']}/install/install_generator"
    puts 'Running extension installation generator...'
    "#{ENV['LIB_NAME'].camelize}::Generators::InstallGenerator".constantize.start(["--auto-run-migrations"])
  rescue LoadError
    puts 'Skipping installation no generator to run...'
  end
end
