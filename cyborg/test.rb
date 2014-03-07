
class Test_cyborg < Cyborg
  
    attr_reader :name,:description,:main_thread, :path
  
    def initialize
        @path = __FILE__
        @status = :stop
        @name = "test_cyborg"
        @description = "description of test cyborg"
        @stoping = false
        checkConfig
        start
    end
  
    def status
        begin
            if @main_thread1 != nil and @main_thread1.alive? 
                "alive"
            else
                "destroyed"
            end
        rescue
            "destroyed"
        end
    end
  
    def run
      
    end
  
    def start
        @stoping = false
        @main_thread1 = Thread.new { work }
        #@main_thread1.abort_on_exception = true
    end
  
    def stop
        Thread.kill(@main_thread1)
        #begin
        #    @stoping = true
        #    @main_thread.join
        #rescue
        #    Thread.kill(@main_thread) 
        #end
    end
  
    def checkConfig
      
        timer = $cyborg_conf.get @name,"timer"
        if timer == nil
            config="
###################################
# TEST CONFIG
# ---------------------------------
#
# Information: #{@description}
#
[#{@name}]

 # (yes/no)
load = yes

 # 
timer = 100

            "
            $cyborg_conf.add config
        end
      
    end
  
    def work
        
        # Unload cyborg if load != yes
        unless $cyborg_conf.get(@name,"load") == "yes"
            Thread.new { CyborgManage.unload @name }
        end
        
        $syslog.add "Runing", @name
        incrementor=1;
        while true do
            Locker.lock "cyborg_#{@name}","work"
      
            $syslog.add incrementor.to_s, @name
            incrementor+=1
      
            Locker.unlock "cyborg_#{@name}","work"
            5.times { return if @stoping;  sleep 1;  }
      
        end
    end
  
end


$cyborg_list[$cyborg_list.count] = Test_cyborg.new
