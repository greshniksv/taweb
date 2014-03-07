
class LoggingSystem
  
    def initialize
        #@storage = Hash.new
    end
    
    def add (info, thread='main')
        
        thread='main' if thread == nil
        inf = Time.now.strftime('%d-%m-%Y %H:%M:%S')+">#{info} "

        pg = Pg_connection.new

        result = pg.exec 'SELECT count(id) as count FROM system.execute_log'

        if result[0]['count'].to_i > 500

            result = pg.exec ' delete from system.execute_log where id in (SELECT id FROM system.execute_log order by date_time asc limit 200) '
        end

        pg.exec 'insert into system.execute_log (id, date_time, queue, data) values (uuid_generate_v1(),\'%s\',\'%s\',\'%s\')  ' %
                    [Time.now.strftime('%d-%m-%Y %H:%M:%S'),thread,info ]

        pg.close


        File.open($config.LOG_FILE,'a'){ |f| f.puts Time.now.strftime("%d-%m-%Y %H:%M:%S")+"["+thread+(" "*(15-thread.length))+"] #{info} " }
    
        #if @storage[thread] == nil
        #    @storage[thread]=[inf]
        #else
        #
        #    if @storage[thread].count>$config.MAIN_LOG_COUNT
        #       @storage[thread]=@storage[thread][1..-1]
        #    end
        #
        #    @storage[thread].push(inf)
        #end
    
        puts "#{thread}: - #{info} "
        
    end
  
    def get ( thread )
        #@storage[thread]

        ret=nil
        pg = Pg_connection.new
        result = pg.exec 'SELECT id, date_time, queue, data FROM system.execute_log where queue = \'%s\' order by date_time ' % thread
        ret = result.map{|row| row['date_time']+' > '+row['data'] }
        pg.close

        ret
    end
  
end

