

#####################################
# INFO:
# 
# Обработчий команд
# 
#

class Command
    
    def self.execute cmd
        cmds = cmd.split(/[_ ]/)
        
        ret="Command '#{cmds[0]}' not found !"
        $command_list.each do |item|
            if cmds[0] == item.key
                ret = item.exec cmds
            end
        end
        
        ret
        
    end
    
end

# Список доступных команд
class Cmd_Help
    
    attr_reader :key,:info
    
    def initialize
        @key = "help"
        @info= "Return command list"
    end
    
    def exec cmd
        
        help_info="[\n"
        $command_list.each do |item|
            if help_info.length>3 
                help_info=help_info+","
            end
            help_info = help_info+"{ \"key\":\"#{item.key}\" , \"info\":\"#{item.info}\" }\n"
        end
        help_info=help_info+"]"
        help_info
    end
    
end
$command_list[$command_list.count] = Cmd_Help.new

# Инициализация создания снапшота для клиента
class Cmd_Snapshot_Creator
    
    attr_reader :key,:info
    
    def initialize
        @key = "snapshot-init"
        @info= ""
    end
    
    def exec cmd
        ret=""
        pg = Pg_connection.new
        
        table_lock = Array.new
        #get table list
        result = pg.exec "select lower(st_table) as st_table,st_filter from system.snapshot_table "
        
        # LOCK TABLE
        result.each { |row| table_lock.push("snapshot.#{row['st_table']}_#{cmd[1]}"); table_lock.push("replica.#{row['st_table']}") } if result.count > 0
        table_lock = table_lock.uniq
        return "{\"status\":\"wait\"}" if Locker.wait? table_lock

        result = pg.exec "select count(*) as count from system.repl_clients where id='#{cmd[1]}'"
        return "{\"status\":\"Client not found !\"}" if result[0]['count'].to_i <= 0

        column_list=""
        result = pg.exec(" SELECT date_time, data FROM snapshot.client_compiled_data where client_id='#{cmd[1]}' ")
        result.each do |row|
            time_elepsed_min = (Time.now - Time.parse(row['date_time'],"%d-%m-%Y %H:%M:%S"))/60
            if time_elepsed_min >= 10
                Thread.new { Snapshot.create cmd[1] }
                ret="{\"status\":\"run\"}"
            else
                $syslog.add "Snapshot precompile data for user #{cmd[1]} actual !"
                ret="{\"status\":\"ok\"}"
            end
        end

        if result.count == 0
            Thread.new { Snapshot.create cmd[1] }
            ret="{\"status\":\"run\"}"
        end

        pg.close
        
        #Thread.new { Snapshot.create cmd[1] }
        ret
    end
       
    
end
$command_list[$command_list.count] = Cmd_Snapshot_Creator.new



class Cmd_test1
    
    attr_reader :key,:info
    
    def initialize
        @key = "test"
        @info= "testing"
    end
    
    def exec cmd

        Snapshot.get_active_clients.each{ |client| Snapshot.gen_all_table_difference client  }
        #Snapshot.gen_all_table_difference "5e9f7140-00d1-0131-1c38-485b39432295"
        #Snapshot.commit_client_changes "5e9f7140-00d1-0131-1c38-485b39432295"
    end
end

$command_list[$command_list.count] = Cmd_test1.new


class Cmd_test
    
    attr_reader :key,:info
    
    def initialize
        @key = "bbb"
        @info= "testing"
    end
    
    def exec cmd
        puts "PREVED !"
        Snapshot.get_md5_table "5ec1e2a0-00d1-0131-1c38-485b39432295",cmd[1]
    end
end

$command_list[$command_list.count] = Cmd_test.new

# Список доступных клиентов
class Cmd_get_client_list

    attr_reader :key,:info

    def initialize
        @key = "get-client-list"
        @info= "testing"
    end

    def exec cmd

        pg = Pg_connection.new
        result = pg.exec "select id, ru_name from system.repl_clients "
        ret = "["+result.map{|i| "{\"name\":\"#{i['ru_name']}\",\"id\":\"#{i['id']}\"  }" }.join(",")+"]"
        pg.close

        ret
    end
end

$command_list[$command_list.count] = Cmd_get_client_list.new


# Извлечь репликационные логи по клиенту
#
class Cmd_get_sync_log

    attr_reader :key,:info

    def initialize
        @key = "get-sync-log"
        @info= "testing"
    end

    def exec cmd

        user = cmd[1]
        date = cmd[2] # 2013-12-01
        pg = Pg_connection.new
        result = pg.exec "select date_time,info,data,sync_id from snapshot.sync_loging where client_id='#{user}' "
        ret = "["+result.map{|i| "{\"date_time\":\"#{i['date_time']}\",\"info\":\"#{i['info']}\",
                                    \"data\":\"#{i['data'].gsub("\n","")}\",\"sync_id\":\"#{i['sync_id']}\"  }" }.join(",")+"]"
        pg.close

        ret
    end
end

$command_list[$command_list.count] = Cmd_get_sync_log.new

