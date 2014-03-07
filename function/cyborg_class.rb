
class Cyborg
    attr_reader :name,:description, :main_thread, :path 
  
    def run
        puts "Run cyborg: #{@name}:#{@description}"
    end  
    
    def to_s
        "#{@name}:#{@description}"
    end
end

class CyborgManage
  
    def self.unload name
        $syslog.add "Cyborg [#{name}] unload ! "
        $cyborg_list.each do |cyborg| 
            if cyborg.name == name 
                cyborg.stop 
                $cyborg_list.delete(cyborg) 
                break 
            end 
        end 
    end
    
    def self.run name
        $syslog.add "Cyborg [#{name}] once run "
        $cyborg_list.each do |cyborg| 
            if cyborg.name == name 
                cyborg.run
                break
            end 
        end
    end
    
    def self.restart name
        
        $syslog.add "Cyborg [#{name}] restart ", name
        $syslog.add "Cyborg [#{name}] restart "
        
        cyborg_path=nil
        $cyborg_list.each do |cyborg| 

            if cyborg.name == name
                cyborg_path=cyborg.path
                cyborg.stop
            end
        end
        
        if cyborg_path == nil
            $syslog.add "Error RESTART. Cyborg #{name} not found !"
        else
            cyborg.start
        end
    end
    
    def self.stop name
        
        $syslog.add "Cyborg [#{name}] stoping ", name
        $syslog.add "Cyborg [#{name}] stoping "
        cyborg_path=nil
        $cyborg_list.each do |cyborg| 

            if cyborg.name == name
                cyborg_path=cyborg.path
                cyborg.stop
                break
            end
        end
        
        if cyborg_path == nil
            $syslog.add "Error STOP. Cyborg #{name} not found !"
        end
    end
    
    def self.start name
        
        $syslog.add "Cyborg [#{name}] starting ", name
        $syslog.add "Cyborg [#{name}] starting "
        cyborg_path=nil
        $cyborg_list.each do |cyborg| 
            if cyborg.name == name
                cyborg_path=cyborg.path
                cyborg.start
                break
            end
        end
        
        if cyborg_path == nil
            $syslog.add "Error STOP. Cyborg #{name} not found !"
        end
    end
    
    def self.status name
        cyborg_path=nil
        $cyborg_list.each do |cyborg| 
            if cyborg.name == name
                cyborg_path=cyborg.path
                return cyborg.status
            end
        end
        
        if cyborg_path == nil
            $syslog.add "Error STOP. Cyborg #{name} not found !"
            return nil
        end
    end
    
    
    def self.stop_all 
        $cyborg_list.each do |cyborg| 
            $syslog.add "Cyborg [#{cyborg.name}] stoping " 
            
            begin
                cyborg.stop
            rescue Exception => e
                puts "EXCEPTION: #{e.inspect}"
                puts "MESSAGE: #{e.message}"
            end
             
        end 
    end 
    
    
end