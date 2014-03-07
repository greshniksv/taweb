#!/usr/bin/env ruby
# -*- coding: utf-8 -*-

#  gem install pg
# gem install coffee-script


require 'rubygems'
require 'yaml'
require 'sinatra'
require 'pg'
require 'uuid'
require 'tiny_tds'
require 'mail'
require 'stringio'
require 'json'
require 'coffee-script'
require 'byebug'
require "base64"
require 'digest/md5'
require 'rdoc/rdoc'

include ObjectSpace

Net.instance_eval { remove_const :SMTPSession } if defined?(Net::SMTPSession)
require 'net/pop'
Net::POP.instance_eval { remove_const :Revision } if defined?(Net::POP::Revision)
Net.instance_eval { remove_const :POP } if defined?(Net::POP)
Net.instance_eval { remove_const :POPSession } if defined?(Net::POPSession)
Net.instance_eval { remove_const :POP3Session } if defined?(Net::POP3Session)
Net.instance_eval { remove_const :APOPSession } if defined?(Net::APOPSession)
require 'tlsmail'

$BUILD_VERSION="0.0.626"             






# -= STOPING SYSTEM =-

def Stoping code
    puts "\n"
    $syslog.add "Prepeare to stop"
    CyborgManage.stop_all
    abort
end

class BuildAutoincrement
    def self.exec
        return unless File.exist?("./debug")
        position   =0
        find_string=nil
        new_line   =false
        f          = File.open(__FILE__, "r+")
        f.each_line { |line|
            if line.include? "$BUILD_VERSION" then    
                find_string = line; break
            end }
        if find_string==nil then
            yield "Warning. '$BUILD_VERSION=\"0.0.0\"' not found !"; return;
        end
        position = f.pos
        f.seek(-find_string.length, IO::SEEK_CUR)
        find_string_list    = find_string.split(/[."]/)
        find_string_list[3] = find_string_list[3].to_i+1
        new_build           = "#{find_string_list[0]}\"#{find_string_list[1]}.#{find_string_list[2]}.#{find_string_list[3]}\""
        f.print new_build
        new_line = new_build.length>=find_string.length
        f.print " "*((find_string.length-new_build.length)-1) if new_build.length<find_string.length
        f.close

        if new_line
            content = File.read(__FILE__)
            File.open(__FILE__, 'w+') { |f| f.write(content[0..position] + content[position..content.length]) }
        end

    end
end




# -=STARTING =- 
Kernel.trap('INT') { |code| Stoping code }
puts "Running"
$command_list = []
$replicate_command_list = []

# LOADING FUNCTION
function_count=0
Dir.chdir("./function")
dir_list = Dir.glob("*.rb")
Dir.chdir("..")
dir_list.each{|item| puts " - Load function: "+item; require "./function/"+item; function_count=function_count+1;  }


# GLOBAL VARIABLES
$cyborg_list = []
$commit_list = Hash.new
#$VERSION="0.0.1"


  
  
# LOADING CONFIG
unless File.exist? './server.conf' then
    $config  = Config_default.new
    File.open('./server.conf','w') do |f|
        f.write $config.to_yaml
        f.close
    end
    puts "\033[32m Create config file! \e[0m"
    puts "Default config contain incorrect data, so program will be stop. \033[31m Edit config !\e[0m"
    abort
else
    $config = YAML::load File.open("./server.conf")
end

BuildAutoincrement.exec { |i| puts i } 
$syslog = LoggingSystem.new
$cyborg_conf = Cyborg_config.new
Locker.clear

# LOADING CYBORG
Dir.chdir("./cyborg")
dir_list = Dir.glob("*.rb")
Dir.chdir('..')
dir_list.each{|item| puts " - Load cyborg: "+item; require "./cyborg/"+item;  }

sleep 1
$syslog.add "System started "

# ROBOT INFORMATION
$syslog.add "Load #{$cyborg_list.count} cyborg"
$syslog.add "Load #{function_count} function"

use Rack::ShowExceptions
 
#----debug
#byebug

#CyborgManage.stop_all

set :bind, '0.0.0.0'
set :port, 4567
set :logging, false

App.new


#byebug