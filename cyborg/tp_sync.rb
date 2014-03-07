
class TPSync_cyborg < Cyborg
  
    attr_reader :name,:description,:main_thread, :path
  
    def initialize
        @path = __FILE__
        @status = :stop
        @name = "tpsync_cyborg"
        @description = "Synhronize trade agent information"
        @stoping = false
        checkConfig
        start
    end
  
    def status
        begin
            if @main_thread != nil and @main_thread.alive? 
                "alive"
            else
                "destroyed"
            end
        rescue
            "destroyed"
        end
    end
  
    def run
        Locker.lock "cyborg_#{@name}","work"
        begin
            tp_sync
        rescue Exception => e
            $syslog.add "EXCEPTION CYBIRG: INFO:#{e.message}\n#{e.backtrace.inspect}", @name
            puts "EXCEPTION: #{e.inspect}"
            puts "MESSAGE: #{e.message}"
        end
        Locker.unlock "cyborg_#{@name}","work"
    end
  
    def start
        if ($cyborg_conf.get @name,"enable") == "yes"
            @stoping = false
            @main_thread = Thread.new { work }
            #@main_thread.abort_on_exception = true
        end
    end
  
    def stop
        begin
            @stoping = true
            @main_thread.join
        rescue
            Thread.kill(@main_thread) 
        end
    end
  
    def checkConfig
      
        timer = $cyborg_conf.get @name,"timer"
        if timer == nil
            config="
###################################
# TP_SYNC CONFIG
# ---------------------------------
#
# Information: #{@description}
#
[#{@name}]

 # Run on system start. (yes|no)
enable = yes

 # Time to exec (sec)
timer = 500
  
          
            "
            $cyborg_conf.add config
        end
      
    end
  
    def work
        $syslog.add "Runing", @name
        while true do
             
            Integer($cyborg_conf.get @name,"timer").times { return if @stoping;  sleep 1;  }
            
            Locker.lock "cyborg_#{@name}","work"
            begin
                tp_sync
            rescue Exception => e
                $syslog.add "EXCEPTION CYBIRG: INFO:#{e.message}\n#{e.backtrace.inspect}", @name
                puts "EXCEPTION: #{e.inspect}"
                puts "MESSAGE: #{e.message}"
            end
            Locker.unlock "cyborg_#{@name}","work"
           
        end
    end
    
    def tp_sync
        #Locker.lock "system.repl_users","tp_sync"
        uuid = UUID.new
        insert=0
        update=0
        delete=0
        
        @synchronizer = Mutex.new if @synchronizer == nil
        @synchronizer.synchronize do
            
            execute_time = get_execute_time do
            
                begin
                    $syslog.add "Start transfer", @name
                    pg = Pg_connection.new
                    pg.transaction :open
                
                    table_lock=Array.new 
                    query=""
                    user_list = Hash.new
                    exist_user_list = Hash.new
            
                    result = pg.exec(" select value from system.repl_config where variable='repl_user_query_locker' ")
                    table_lock=result[0]['value'].split(',') 
            
                    #locker_list.each { |item| Locker.lock item,"tp_sync" }
                    Locker.lock_list table_lock,"tp_sync"
            
            
                    result = pg.exec(" select value from system.repl_config where variable='repl_user_query' ")
                    query=result[0]['value']
            
                    result = pg.exec(query) # {query}: sql query returning 'id' and 'name' keys.
                    result.each do |row|
                        user_list[row['id']]=row['name']
                    end
            
                    $syslog.add "New user count: #{user_list.count}", @name
            
                    result = pg.exec("select ru_ex_id as id, ru_name as name from system.repl_clients order by 1 ")
                    result.each do |row|
                        exist_user_list[row['id']]=row['name']
                    end
            
                    $syslog.add "Exist user count: #{exist_user_list.count}", @name
            
                    #find new user and change name
                    user_list.each do |nkey,nvalue|
                
                        exist=false
                        exist_user_list.each do |okey,ovalue|
                            if okey == nkey
                                if nvalue != ovalue
                                    #user name changed
                                        
                                    fix="
                            pg = Pg_connection.new; 
                            pg.exec(\"update system.repl_clients set ru_name=''#{nvalue}'' where  ru_ex_id = ''#{nkey}'' \") ; 
                            pg.close "
                            
                                    Conflict.create "Warning! User name chamged.<br> OldName:#{ovalue}<br> NewName:#{nvalue}<br> You whont accept ?", fix
                                    update=update+1
                            
                                    exist=true
                                else
                                    exist=true
                                end
                        
                            end
                        end
                
                        unless exist
                    
                            new_id = uuid.generate
                            pg.exec(" insert into system.repl_clients (id,ru_ex_id,ru_name) values ('#{new_id}','#{nkey}','#{nvalue}') ")
                            insert=insert+1
                        end
                
                    end
                
                    # find deleting users
                    exist_user_list.each do |okey,ovalue|
                
                        exist = false
                        user_list.each do |nkey,nvalue|
                            exist = true if okey == nkey
                        end
                
                        unless exist
                            fix="
                     pg = Pg_connection.new; 
                     pg.exec(\"delete from system.repl_clients where  ru_ex_id = ''#{okey}'' \"); 
                     pg.close"
                    
                            #Conflict.create "Warning! User be deleted!<br>Name:#{ovalue}<br>ID:#{okey}.<br>Accept ?", fix
                            delete=delete+1
                        end
                
                    end
                
                    pg.transaction :commit
                    pg.close
                rescue Exception => e
                    pg.transaction :rollback
                    $syslog.add "EXCEPTION CYBIRG: INFO:#{e.message}\n#{e.backtrace.inspect}", @name
                    puts "EXCEPTION: #{e.inspect}"
                    puts "MESSAGE: #{e.message}"
                end
            
                #Locker.unlock "system.repl_users","tp_sync"
                #locker_list.each { |item| Locker.unlock item,"tp_sync" }
                Locker.unlock_list table_lock,"tp_sync"
                $syslog.add "Insert:#{insert}, Update:#{update}, Delete:#{delete} ", @name
            
            end
            
            $syslog.add "Execution time: #{execute_time} ", @name
            $syslog.add "Complete", @name
        end
        
       
    end
  
end


$cyborg_list[$cyborg_list.count] = TPSync_cyborg.new
