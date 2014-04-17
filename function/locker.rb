#
# Блокировка таблиц и ожидание разблокировки
#
#
#

class Locker
    
    def self.wait? table


        #10.times{
        #    sleep 0.1
        #    puts Locker.info().to_yaml
        #}


        list = Locker.info()

        #byebug
        exist = false
        if table.kind_of? String
            
            if list != nil
                list.each do |row|
                    #puts "#{row['l_table']} == #{table}"
                    if row['l_table'] == table
                        exist = true
                    end
                end
            end
            
        elsif table.kind_of? Array
            
            if list != nil
                list.each do |row|
                    table.each do |table_i|
                        if row['l_table'] == table_i
                            exist = true
                        end
                    end
                end
            end
            
        else 
            raise "Locker.wait? ERROR table type."
        end
            
        exist
    end 
    
    
    def self.lock_list table_list, key
        @synchronizer = Mutex.new if @synchronizer == nil
        
        @synchronizer.synchronize do
            
            while true
            
                exist = false
                list = Locker.info()
                #check already locked table
                if list != nil
                    list.each do |row|
                        table_list.each do |table|
                            if row['l_table'] == table
                                exist = true
                            end
                        end
                    end
                end
            
                if exist
                    sleep 2
                else
                    break
                end
            end
            
            table_list.each do |table|
                Locker.lock table,key
            end
            
        end
    end
    
    def self.unlock_list table_list, key=""
        
        table_list.each do |table|
            Locker.unlock table
        end
        
    end

    
    def self.lock table, key="", info=""
        
        table=table.downcase
        uuid = UUID.new
        locker_id=""
        locker_time=""
        conn = Pg_connection.new
        @last_message=""
        
        while true do
            
            result = conn.exec("select id, l_time, l_key from system.locker where l_table = '#{table}' ") #and l_key ='#{key}' 
            
            if result.count >0 
                
                if result[0]['l_key'] == key and @last_message != "WARNING. TRY lock locked table with same key !!! table: #{table} key:#{key}."
                    @last_message="WARNING. TRY lock locked table with same key !!! table: #{table} key:#{key}."
                    $syslog.add "WARNING. TRY lock locked table with same key !!! table: #{table} key:#{key}."
                end
                
                if result.count>1 and @last_message != "WARNING. Duplicate lock. table: #{table} key:#{key}."
                    @last_message="WARNING. Duplicate lock. table: #{table} key:#{key}." 
                    $syslog.add "WARNING. Duplicate lock. table: #{table} key:#{key}."
                end
                
                locker_id = result[0]['id']
                locker_time = result[0]['l_time']
                Locker.check_timeout locker_id
            else
               
                locker_id = uuid.generate
                locker_time = Time.new.to_i
                conn.exec("insert into system.locker ( id,l_table,l_key,l_time,l_info) values ( '#{locker_id}','#{table}','#{key}','#{locker_time}','#{info}' ) ")
                #$syslog.add "LOCK  #{table}:#{key}:ID:#{locker_id}"
                break
            end
            
            #$syslog.add "WAITING #{table}:#{key}"
            #puts "sleep"
            #sleep 2
            break
        end
        conn.close

     end
  
    
    def self.lock_again table, key="", info=""
        
        table=table.downcase
        uuid = UUID.new
        locker_id=""
        locker_time=""
        conn = Pg_connection.new
        
        result = conn.exec("select id, l_time, l_key from system.locker where l_table = '#{table}' ") #and l_key ='#{key}' 
            
        if result.count >0 
            #$syslog.add "WARNING. TRY lock locked table with same key !!! table: #{table} key:#{key}." if result[0]['l_key'] == key
            #$syslog.add "WARNING. Duplicate lock. table: #{table} key:#{key}." if result.count>1
            locker_id = result[0]['id']
            locker_time = Time.new.to_i
            conn.exec("update system.locker set l_time='#{locker_time}' where id='#{locker_id}' ")
        end
        
        conn.close
    end
    
    
    
    def self.unlock table, key=""
        
        table=table.downcase
        conn = Pg_connection.new
        result = conn.exec("select id,l_time from system.locker where l_table = '#{table}' ") # and l_key ='#{key}'
        if result.count >0 
            #$syslog.add "UNLOCK  #{table}:#{key}:ID:#{result[0]['id']}"
            conn.exec("delete from system.locker where id = '#{result[0]['id']}' ")
        end
        conn.close
    end
    
    def self.info
        conn = Pg_connection.new
        mlock_list=Array.new

        result = conn.exec("select id,l_table,l_key,l_time,l_info from system.locker order by l_time ")
        if result.count >0

            result.each{ |row|

                item = Hash.new
                item["id"]=row['id']
                item["l_table"]=row['l_table']
                item["l_key"]=row['l_key']
                item["l_time"]=row['l_time']
                item["l_info"]=row['l_info']
                mlock_list.push(item);
            }

            #conn.close
            #return result
        end
        conn.close

        mlock_list
    end
    
    def self.clear
        
        conn = Pg_connection.new
        conn.exec("truncate system.locker ")
        conn.close
    end
    
    private
  
    def self.check_timeout locker_id
        conn = Pg_connection.new
      
        result = conn.exec("select id,l_time from system.locker where id = '#{locker_id}' ")
        if result.count >0 
            locker_time = Integer(result[0]['l_time'])
            time_now = Time.new.to_i
            
            if time_now-locker_time > $config.SYSTEM_LOCKER_TIMEOUT
                conn.exec("delete from system.locker where id = '#{locker_id}' ")
                $syslog.add "Timeout locker detected. Deleting lock: #{locker_id}"
            end
        end
        
        conn.close
    end
  
end
