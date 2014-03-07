class CloneTable_cyborg < Cyborg

    attr_reader :name, :description, :main_thread, :path

    def initialize

        #Thread.abort_on_exception=true
        @path = __FILE__
        @name = 'clone_table'
        @description='Transfer table from work to fantom database'
        @stopping = false
        @transfer_pid=nil

        check_config
        start
    end

    def status
        if @main_thread != nil and @main_thread.alive?
            'alive'
        else
            'destroyed'
        end
    end

    def check_config

        timer = $cyborg_conf.get @name, 'timer'
        if timer == nil
            config="
 ###################################
 # Clone table cyborg.
 # ---------------------------------
 #
 # Information: #{@description}
 #
[#{@name}]

 # Run on system start. (yes|no)
enable = yes

 # Time to exec (sec)
timer = 500

 # Time work for warning
work_warning = 100

 # Time work for Killing
work_killing = 200

            "
            $cyborg_conf.add config
        end

    end


    def stop
        @stopping = true

        Thread.new do
            begin
                Process.kill('',@transfer_pid)
                @main_thread.join
            rescue
                Thread.kill(@main_thread)
            end
        end

    end

    def start
        if ($cyborg_conf.get @name, 'enable') == 'yes'
            @stopping = false
            @main_thread = Thread.new { work(); GC.start; }
            #@main_thread.abort_on_exception = true
        end
    end

    def run
        $syslog.add 'Run cyborg once', @name
        begin
            #Thread.new { transfer(); GC.start; Thread.kill(Thread.current); }

            @transfer_pid = Process.fork { transfer() }
            Process.waitpid(@transfer_pid, 0)
                #Process.kill('',@transfer_pid)
            GC.start
        rescue Exception => e
            puts "EXCEPTION: #{e.inspect}"
            puts "MESSAGE: #{e.message}"
        end
    end


    def work
        $syslog.add 'Running', @name

        while true do

            #puts "TIMES: #{Integer($cyborg_conf.get @name,"timer")}"
            Integer($cyborg_conf.get @name, "timer").times do
                if @stopping
                    $syslog.add "Stoping cyborg", @name
                    return
                end
                sleep 1
            end


            begin

                @transfer_pid = Process.fork { transfer() }
                Process.waitpid(@transfer_pid, 0)

                GC.start
            rescue Exception => e
                puts "EXCEPTION: #{e.inspect}"
                puts "MESSAGE: #{e.message}"
            end

        end

    end

    def get_def_value table, column
        #puts "@@@@@@@ #{table} - #{column}"

        @default_value_list.default = "null"
        @default_value_list["#{table.downcase}_#{column}"]
    end

    def watchdog action="start"

        if action == "start"
            @watchdog_thread = Thread.new { watchdog_worker() }
            #@watchdog_thread.abort_on_exception = true
        end

        if action == "stop"
            Thread.kill(@watchdog_thread)
        end

    end

    def watchdog_worker
        show_warning=false
        warning = ($cyborg_conf.get @name, "work_warning").to_i
        kill = ($cyborg_conf.get @name, "work_killing").to_i

        start = Time.now

        while true do

            if (Time.now - start) > warning and !show_warning
                show_warning=true
                $syslog.add "WARNING. Thread worked to long! He will be killed after #{(kill-warning)} seconds. ", @name
            end

            if (Time.now - start) > kill-1
                $syslog.add "WARNING. Thread restart. Thread worked to long! ", @name
                sleep 3
                start
                break
            end

            sleep 1
        end

    end


    def transfer
        watchdog

        #Thread.current.priority = 10
        #Locker.lock "cyborg_#{@name}","transfer"
        @default_value_list = Hash.new
        kill = ($cyborg_conf.get @name, "work_killing").to_i
        pg = Pg_connection.new
        table_lock = Array.new

        @synchronizer = Mutex.new if @synchronizer == nil
        @synchronizer.synchronize do


            execute_time = get_execute_time do
                timeout(kill) do
                    begin
                        $syslog.add "START TRANSFER", @name
                        #begin

                        table_fields = Hash.new
                        table_filters = Hash.new
                        table_filters.default = nil
                        table_fields.default = nil

                        #table_code_filters = Hash.new
                        #table_code_filters.default = nil

                        table_list = Hash.new
                        table_list.default = nil
                        @table_query = Hash.new

                        result = pg.exec('select rp_table, rp_field, rp_filter, rp_default, rp_sqlfilter, rp_codefilter from system.repl_table')
                        result.each do |row|

                            @default_value_list["#{row['rp_table'].downcase}_#{row['rp_field']}"]=row['rp_default']
                            table = row['rp_table'].downcase

                            #puts "T: #{row['rp_table']} r: [#{row['rp_field']}] "

                            if table_list[table] == nil
                                table_list[table] = Array.new
                                table_list[table].push(row['rp_field'])
                            else
                                table_list[table].push(row['rp_field'])
                            end

                            if table_fields[table] != nil
                                table_fields[table]=table_fields[table]+','
                            else
                                table_fields[table]=''
                            end


                            if row['rp_sqlfilter'] != nil
                                table_fields[table] = table_fields[table] + " #{row['rp_sqlfilter']} as #{row['rp_field']} "
                            else
                                table_fields[table] = table_fields[table] + ' ' + row['rp_field']+' '
                            end

                            if row['rp_filter'] != nil
                                if table_filters[table] == nil
                                    table_filters[table]=""
                                end
                                table_filters[table] = table_filters[table] + row['rp_filter']
                            end
                        end


                        table_fields.each do |key, value|
                            filter = ' '
                            if table_filters[key] != nil and table_filters[key].strip.length>1
                                filter = ' where '+table_filters[key]
                            end

                            field_list = table_list[key].map { |i| i }.join(",")
                            @table_query[key] = fix_query_variable("select #{value} from #{key} #{filter} group by #{field_list} ")
                        end

                        # LOCK TABLE
                        @table_query.each { |table, query| table_lock.push "replica.#{table}" }
                        Locker.lock_list table_lock, 'transfer'

                        @table_query.each do |table, query|
                            sql_list=''
                            sql_count=0

                            # LOCK_AGAIN TABLE
                            #Locker.lock_again "cyborg_#{@name}","transfer"
                            #@table_query.each do |table, query|
                            #    Locker.lock_again "replica.#{table}","transfer"
                            #end

                            pg.exec("truncate replica.#{table} ")
                            $syslog.add "Transfer table: #{table}", @name

                            #$syslog.add "SQL: #{query} "
                            insert_str_param=''
                            #insertData=""
                            copy_data = StringIO.new
                            GC.start
                            column_list=''
                            ms = MS_connection.new

                            result = ms.exec(query)
                            $syslog.add "Count: #{result.count} ", @name
                            result.each(:as => :array, :cache_rows => false) do |row|
                                if insert_str_param.length < 1
                                    result.fields.each do |column|
                                        type = get_pg_field_type 'replica', table, column

                                        column_list=column_list+',' if column_list.length > 1

                                        column_list=column_list+column
                                        insert_str_param=insert_str_param + ',' if insert_str_param.length > 1

                                        case type
                                            when 'integer'
                                                insert_str_param=insert_str_param+"[#{column.downcase}]"
                                            when 'character varying'
                                                insert_str_param=insert_str_param+"\"[#{column.downcase}]\""
                                            when 'smallint'
                                                insert_str_param=insert_str_param+"[#{column.downcase}]"
                                            when 'double precision'
                                                insert_str_param=insert_str_param+"[#{column.downcase}]"
                                            when 'real'
                                                insert_str_param=insert_str_param+"[#{column.downcase}]"
                                            when 'char'
                                                insert_str_param=insert_str_param+"\"[#{column.downcase}]\""
                                            when 'bigint'
                                                insert_str_param=insert_str_param+"[#{column.downcase}]"
                                            else
                                                raise "TYPE #{type} NOT FOUND !!!"
                                        end
                                    end

                                    #puts "insert_str_param: #{insert_str_param}"
                                end

                                row_i = String.new insert_str_param
                                result.fields.each do |column|
                                    column_data = row[column]

                                    #puts "row: #{row_i} - D: #{column_data}"

                                    #if column_data.to_s.include? "\"" and table == "tblorders"
                                    #    byebug
                                    #end

                                    if column_data== nil or column_data == ''
                                        row_i["[#{column.downcase}]"]='null'
                                    else
                                        row_i["[#{column.downcase}]"]=column_data.to_s.gsub("''", "'").gsub("\"\"", "\\\"")
                                    end


                                end
                                copy_data << row_i+"\n"


                            end

                            result.cancel
                            ms.close

                            copy_data.rewind
                            #column_list = query[6..query.index('from')]
                            #puts "column_list: #{column_list}"
                            #puts "INS: COPY replica.#{table} (#{column_list}) FROM STDIN WITH csv"
                            #$stderr.puts "Running COPY command with data ..."
                            buf = ''

                            if column_list.length > 1
                                conn = Pg_connection.new
                                conn = conn.getConnection
                                conn.transaction do
                                    conn.exec("COPY replica.#{table} (#{column_list}) FROM STDIN WITH NULL AS 'null' csv QUOTE '\"' ESCAPE '\\' ")
                                    begin
                                        while copy_data.read(256, buf)
                                            ### Uncomment this to test error-handling for exceptions from the reader side:
                                            # raise Errno::ECONNRESET, "socket closed while reading"
                                            #$stderr.puts "  sending %d bytes of data..." % [ buf.length ]
                                            until conn.put_copy_data(buf)
                                                #$stderr.puts "  waiting for connection to be writable..."
                                                sleep 0.1
                                            end
                                        end
                                    rescue Errno => err
                                        errmsg = '%s while reading copy data: %s' % [err.class.name, err.message]
                                        conn.put_copy_end(errmsg)
                                    else
                                        conn.put_copy_end
                                        while res = conn.get_result
                                            if res.result_status != 1
                                                puts copy_data.string+"\n\n\n\n"
                                                raise 'ERROR commit data to postgresql !'
                                            end

                                            #$stderr.puts "Result of COPY is: %s" % [ res.res_status(res.result_status) ]
                                            $syslog.add 'Result: %s' % [res.res_status(res.result_status).downcase], @name

                                        end
                                    end
                                end
                                conn.finish

                                copy_data.truncate 0
                            else
                                #$syslog.add "Not data to transfer"
                            end

                        end

                        @table_query.each do |table, query|
                            $syslog.add "Vacuum table: #{table}", @name
                            pg.exec(" VACUUM replica.#{table} ")
                        end

                            #rescue Exception => e
                            #    pg.transaction :rollback
                            #    $syslog.add "EXCEPTION CYBORG: CLONE TABLE. INFO:#{e.message}\n#{e.backtrace.inspect}", @name
                            #    puts "2EXCEPTION: #{e.inspect}"
                            #    puts "MESSAGE: #{e.message}"
                            #    raise e.message
                            #end

                    rescue Exception => e
                        if e.message != 'execution expired'
                            $syslog.add "EXCEPTION: INFO:#{e.message}\n#{e.backtrace.inspect}", @name
                            puts "EXCEPTION: #{e.inspect}"
                            puts "MESSAGE: #{e.message}"
                            puts "Backtrace: #{e.backtrace.inspect} "
                        else
                            $syslog.add 'EXCEPTION: Execution expired !', @name
                        end
                    end

                end
            end

            # UNLOCK TABLE
            Locker.unlock_list table_lock, 'transfer'
            #@table_query.each do |table, query|
            #    Locker.unlock "replica.#{table}","transfer"
            #end

            pg.close
            #ms.close

            # Create snapshot changes for active users
            Snapshot.get_active_clients.each { |client| Snapshot.gen_all_table_difference client }

            $syslog.add "Execution time: #{seconds2time(execute_time.to_i)} ", @name
            #Locker.unlock "cyborg_#{@name}","transfer"
            watchdog 'stop'
            GC.start


            #byebug
        end

    end

    def fix_query_variable sql

        if sql.include? '{'
            command = sql[sql.index('{')+1..sql.index("}")-1]
            command_full = sql[sql.index('{')..sql.index('}')]
            if command.include? 'date'
                if command.include? '+'
                    add = command[command.index('+')+1..command.length]
                    sql[command_full]=(Time.now+(86400*Integer(add))).strftime('%Y-%m-%d')
                elsif command.include? '-'
                    add = command[command.index('-')+1..command.length]
                    sql[command_full]=(Time.now-(86400*Integer(add))).strftime('%Y-%m-%d')
                else
                    $syslog.add 'SQL INSERT COMMAND NOT FOUND !!!', @name
                    return nil
                end
            end
        end
        sql
    end


    def get_pg_field_type schema, table, field
        type=nil
        pg = Pg_connection.new

        result = pg.exec "select table_schema, table_name, column_name, data_type,character_maximum_length 
        from information_schema.columns
        where table_schema='#{schema}'
        and table_name = '#{table}'
        and column_name = '#{field.downcase}'"

        if result.count > 0
            type = result[0]['data_type']
        end
        pg.close
        #puts "DATA --- #{schema}.#{table}.#{field}: #{type}"
        type
    end

end


$cyborg_list[$cyborg_list.count] = CloneTable_cyborg.new



