class Snapshot

    # Извоель активных клиентов
    def self.get_active_clients pg=nil
        client_list = Array.new
        opened_connection=false

        opened_connection=true if pg == nil
        pg = Pg_connection.new if pg == nil
        rez = pg.exec "select client_id from system.repl_clients_status where name='create' "

        rez.each { |row| client_list.push row['client_id'] } if rez.count > 0

        pg.close if opened_connection
        client_list
    end

    # Создание снапшота для клиента
    def self.create client_id
        table_list = Hash.new
        uuid = UUID.new
        #user_id = cmd[1]

        execute_time = get_execute_time do
            begin

                $syslog.add "Snapshot_Creator: Create snapshot for user: #{client_id} "
                pg = Pg_connection.new
                table_lock = Array.new

                #get table list
                result = pg.exec "select lower(st_table) as st_table,st_filter from system.snapshot_table "

                if result.count > 0
                    result.each do |row|
                        table_list[row['st_table']] = row['st_filter']

                        table_lock.push("snapshot.#{row['st_table']}_#{client_id}")
                        table_lock.push("replica.#{row['st_table']}")
                    end
                end

                # LOCK TABLE
                table_lock = table_lock.uniq
                if Locker.wait? table_lock
                    return "[{\"status\":\"wait\"}]"
                end
                Locker.lock_list table_lock, 'Create snapshot'
                #table_lock.each do |item| 
                #    Locker.lock 'snapshot.#{item}_#{user_id}','Create snapshot'
                #    Locker.lock 'replica.#{item}','Create snapshot'
                #end

                table_list.each do |table, sql_filter|

                    #sql_filter['[user_id]']=user_id
                    sql_filter = sql_filter.gsub '[user_id]', client_id
                    pg.exec("delete from snapshot.#{table} where repl_client_id='#{client_id}' ")
                    #puts 'SQL: #{'insert into snapshot.#{table} #{sql_filter} '}'
                    result = pg.exec("insert into snapshot.#{table} #{sql_filter} ")
                    $syslog.add "Snapshot_Creator: Processing table: #{table} count: #{result.cmd_tuples} "
                    pg.exec("VACUUM snapshot.#{table} ")

                end

                pg.exec "delete from system.repl_clients_status where client_id='#{client_id}' and name='create' "
                pg.exec "INSERT INTO system.repl_clients_status(client_id, name, value) VALUES('#{client_id}', 'create', '#{Time.now.strftime('%d-%m-%Y %H:%M:%S')}')"

                #Create precompile json data
                result = pg.exec 'select distinct lower(rp_table) as table from system.repl_table'
                precompile=Hash.new
                if result.count > 0
                    result.each do |row|
                        $syslog.add "Snapshot_Creator: Create precompile data for table: #{row['table']} "
                        precompile[row['table']] = Replweb_Manager.exec("get_ftable_#{row['table']}", client_id)
                    end
                end

                pg.exec "delete from snapshot.client_compiled_data where client_id='#{client_id}' "
                pg.exec "insert into snapshot.client_compiled_data(client_id, date_time, data) values ('#{client_id}','#{Time.now.strftime('%d-%m-%Y %H:%M:%S')}','#{ Base64.encode64(precompile.to_yaml).gsub("\n",'') }')"

                # generate difference data
                Snapshot.gen_all_table_difference client_id

            rescue Exception => e
                $syslog.add "EXCEPTION CYBIRG: INFO:#{e.message}\n#{e.backtrace.inspect}"
                puts "EXCEPTION: #{e.inspect}"
                puts "MESSAGE: #{e.message}"
            end

            # UNLOCK TABLE
            Locker.unlock_list table_lock, 'Create snapshot'
            #table_lock.each do |item| 
            #    Locker.unlock 'snapshot.#{item}_#{user_id}','Create snapshot'
            #    Locker.unlock 'replica.#{item}','Create snapshot'
            #end

            pg.close
        end

        $syslog.add "Snapshot for user: #{client_id} created. Time: #{seconds2time(execute_time)} "
        return "[{\"status\":\"ok\"}]"
    end

    # Получить МД5 таблицы снапшота клиента
    def self.get_md5_table user_id, table, pg=nil
        close_connection = false


        if pg == nil
            pg = Pg_connection.new
            close_connection = true
        end

        #puts "select uuid from snapshot.#{table} where repl_client_id='#{user_id}' "
        result = pg.exec "select uuid from snapshot.#{table} where repl_client_id='#{user_id}' order by uuid "
        data = result.map { |row| row["uuid"] }.join(',')
        puts data #.gsub(",",",\n")
        pg.close if close_connection
        Digest::MD5.hexdigest data
    end

    # Получить разницы между основной таблицей и репликационной для клиента, вернет JSON
    def self.gen_table_difference_json user_id, table_name, pg
        #pg = Pg_connection.new
        pg2 = Pg_connection.new
        uuid = UUID.new
        deleting_rows=0
        inserting_rows=0
        rez = pg.exec "select column_name from information_schema.columns where table_schema='replica' and lower(table_name)=lower('#{table_name}') "

        table_list =''
        snapshot_sql =''
        if rez.count > 0
            #rez.each do
            #    table_list=table_list+"," if table_list.length > 1
            #    table_list=table_list+row['column_name']
            #end
            table_list = rez.map { |row| row['column_name'] }.join(",")
        end

        rez = pg.exec "SELECT st_filter FROM system.snapshot_table where lower(st_table)= lower('#{table_name}') "
        if rez.count > 0
            snapshot_sql=rez[0]['st_filter']
        end

        snapshot_sql = snapshot_sql.gsub "[user_id]", user_id
        #puts "T: #{table_name} L:#{snapshot_sql.index("from")} S:#{snapshot_sql}"

        snapshot_sql = snapshot_sql[snapshot_sql.downcase.index("from")..snapshot_sql.length]
        insert_sql = "select #{table_list} #{snapshot_sql} \nexcept select #{table_list} from snapshot.#{table_name} where repl_client_id='#{user_id}' "
        delete_sql = "select #{table_list} from snapshot.#{table_name} where repl_client_id='#{user_id}' \nexcept select #{table_list} #{snapshot_sql} "

        #puts "D:#{delete_sql}\n\n"
        #puts "I:#{insert_sql}\n\n"

        #delete_list = Array.new
        #insert_list = Array.new
        change_json= StringIO.new
        change_json<<"\n\"#{table_name}\":{\n"


        change_json<< "\"delete\": [\n"
        first_row=true
        rez = pg.exec delete_sql
        deleting_rows += rez.count

        if rez.count > 0
            puts "Table #{table_name} delete: #{rez.count}"
            rez.each do |row|

                change_json << "," if !first_row
                first_row=false

                find_uuid_sql = " select uuid from snapshot.#{table_name} where "
                rez.fields.each { |column|

                    if row[column]!=nil and row[column]!="" then
                        find_uuid_sql += "and" if first_row
                        first_row=true
                        find_uuid_sql += " #{column}='#{row[column].gsub("'","''")}' \n "
                    end

                }

                #puts find_uuid_sql;
                uuid_i=""

                urez = pg2.exec find_uuid_sql
                if urez.count != 1
                    puts "Not found UUID in snapshot.#{table_name} for delete !"
                else
                    uuid_i = urez[0]["uuid"]
                end

                first_row=false
                change_json<< "{\n"+rez.fields.map { |column|
                    if row[column]!=nil then
                        " \"#{column}\":\"#{row[column].gsub("\"", "\\\"")}\"\n "
                    else
                        " \"#{column}\":\"#{row[column]}\"\n "
                    end }.join(",")+",\"uuid\":\"#{uuid_i}\" "+"}\n"

            end

        end
        change_json<<"\n],"

        change_json<<"\n\"insert\":[\n"
        first_row=true
        rez = pg.exec insert_sql
        inserting_rows += rez.count

        if rez.count > 0
            puts "Table #{table_name} insert: #{rez.count}"
            rez.each do |row|
                rows_column = ""
                rows_value = ""
                row_s=""
                row_s=row_s+"," if !first_row
                first_row=false
                row_s=row_s+"{\n"
                rez.fields.each do |column|

                    row_s=row_s+"," if row_s.length>3

                    if row[column]!=nil
                        row_s=row_s+" \"#{column}\":\"#{row[column].gsub("\"", "\\\"")}\"\n "
                    else
                        row_s=row_s+" \"#{column}\":\"#{row[column]}\"\n "
                    end

                    #rows_column=rows_column+',' if rows_column.length > 1
                    #rows_value=rows_value+',' if rows_value.length > 1
                    #rows_column=rows_column+column
                    #rows_value=rows_value+"'#{row[column]}'"
                end
                row_s=row_s+",\"uuid\":\"#{uuid.generate}\"\n "

                #insert_list.push "insert into snapshot.#{table_name} (#{rows_column}) values (#{rows_value}) "

                row_s=row_s+"}\n"

                change_json<< row_s
            end
        end

        change_json<< "\n]"
        change_json<< '}'

        pg2.close


        if deleting_rows > 0 or inserting_rows > 0
            change_json.string
        else
            ""
        end

    end

    # Получить разницы между основными таблицами и репликационными для клиента,
    # Рузультат запишет в:
    # "insert into snapshot.client_query_action (client_id,action,query) values ('#{client_id}','tables_change','#{Base64.encode64(change_json.string)}') "
    #
    #
    def self.gen_all_table_difference client_id
        $syslog.add "Get table difference, user: #{client_id}"
        pg = Pg_connection.new

        change_json= StringIO.new
        change_json<<"{\"tables\":["

        rez = pg.exec 'select distinct lower(rp_table) as rp_table from system.repl_table order by 1 '

        first_row=true
        if rez.count > 0
            rez.each do |row|
                #puts "Get table difference for table: #{row['rp_table']}"
                data = Snapshot.gen_table_difference_json(client_id, row['rp_table'], pg)
                change_json<<',' if !first_row and data.length > 5
                first_row = false if data.length > 5
                change_json<< "{#{data}}" if data.length > 3
            end
        end

        change_json<<']}'

        #puts change_json.string

        begin
            JSON.parse(change_json.string)
        rescue JSON::ParserError => e
            $syslog.add "TableDifferense. Error json structure !\n #{e.message}"
            raise "TableDifferense. Error json structure !\n #{e.message}"
            pg.close
            return
        end

        pg.exec "delete from snapshot.client_query_action where client_id='#{client_id}' and action = 'tables_change' "
        pg.exec "insert into snapshot.client_query_action (client_id,action,query) values ('#{client_id}','tables_change','#{Base64.encode64(change_json.string)}') "
        pg.close
    end

    # Применение изменений к снапшотам
    def self.commit_json json, client_id

        #puts "WRITE TO SNAPSHOT SERVER DATA: \n #{json}"
        pg = Pg_connection.new
        jdata = JSON.parse(json)

        #puts "\n\nJ:#{jdata.to_yaml}\n\n\n"
        sql_list= StringIO.new
        sql_list << 'BEGIN;'

        jdata['tables'].map do |table_name|
            table_name.each do |table, data|

                #puts "#{table}:\n\n#{data}\n\n"

                data['delete'].each do |hash_row|
                    #puts "H:#{hash_row}\n\n"

                    first=true
                    sql="delete from snapshot.#{table} where "
                    hash_row.each do |column, value|
                        if first == true
                            first=false
                        else
                            sql=sql+' and '
                        end

                        sql += (value.length>0 ? "#{column}='#{value.gsub("'","''")}'" : "#{column} isnull")

                        #puts "C:#{column}, V:#{value}\n "
                    end
                    #puts "DELETE: #{sql}"
                    #pg.exec(sql)
                    sql_list << "#{sql};"

                end


                data['insert'].each do |hash_row|

                    first = true
                    columns = values = ''
                    sql="insert into snapshot.#{table} "
                    hash_row.each do |column, value|
                        if first == true
                            first=false
                        else
                            values=values+','
                            columns=columns+','
                        end

                        columns += "#{column}"
                        values += (value.length>0 ? "'#{value.gsub("'","''")}'" : 'null')

                    end
                    columns=columns+',repl_client_id'
                    values=values+",'#{client_id}'"

                    sql=sql+"(#{columns}) values (#{values})"
                    #puts "INSERT: #{sql}"
                    #pg.exec(sql)
                    sql_list << "#{sql};"
                end

            end
        end
        sql_list << 'COMMIT;'
        pg.exec(sql_list.string)

        pg.close
    end

    # Получить список запросов для изменения снапшота
    def self.get_commit_client_changes client_id
        pg = Pg_connection.new
        rez = pg.exec " SELECT query FROM snapshot.client_query_action where action = 'tables_change' and client_id='#{client_id}' "
        if rez.count > 0
            #, user_id, pg
            return Base64.decode64(rez[0]['query'])
        end
        pg.close

        nil
    end

    # Получить список запросов для изменения снапшота и применить
    def self.commit_client_changes client_id
        #5e9f7140-00d1-0131-1c38-485b39432295
        pg = Pg_connection.new
        rez = pg.exec " SELECT query FROM snapshot.client_query_action where action = 'tables_change' and client_id='#{client_id}' "
        if rez.count > 0
            Snapshot.commit_json( Base64.decode64(rez[0]['query']), client_id )
        end
        pg.close
    end

    # Получить МД5 для шнапотной таблицы пользователя.
    def self.get_md5_snapshot_table table_name, user
        return_data = nil
        pg = Pg_connection.new
        result = pg.exec("select uuid from snapshot.#{table_name} where repl_client_id='#{user}' order by uuid")
        data = result.map { |i| i['uuid'] }.join("_")
        return_data = Digest::MD5.hexdigest(data)
        pg.close
        return_data
    end


# ----------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------
# COMMIT_SESSION

    class Commit_session

        attr_reader :sync_session_id, :create_time

        # Создать репликационную сесию
        def create user, data

            @create_time = Time.now
            @rollback_list=[]
            r = Random.new
            rand_list = [('a'..'z'), (0..9)].map { |i| i.to_a }.join
            @sync_session_id="syncsession#{user}#{Time.now.strftime("%d%m%Y%H%M%S%L")}#{(1..8).map { rand_list[r.rand(rand_list.length)] }.join}"
            Snapshot.AddSyncLog(user, @sync_session_id, "Start sync id: #{@sync_session_id}", data)

            begin
                @commit_data = JSON.parse(data)
                @commit_user = user
            rescue JSON::ParserError => e
                return nil
            end

            Thread.new { commit_sync_data() }

            @sync_session_id
        end

        # Применение полученных данных от клиента, и сверка МД5
        def commit_sync_data

            Locker.lock @sync_session_id, 'sync session'
            pg = Pg_connection.new
            #sync_data = JSON.parse(data)

            #sync_data.initial_md5
            #sync_data.commit_md5
            #sync_data.new_data - json /table* /rows*
            sleep 1

            puts ((Locker.wait? @sync_session_id) ? 'LOCKED' : 'NOT LOCKED!')

            $syslog.add 'Check snapshot client_initial data.'


            begin

                @commit_data['initial_md5'].each do |item|
                    #puts " #{item['table']} - #{item['md5']} "
                    if item['table'] != 'config'
                        if Snapshot.get_md5_snapshot_table(item['table'], @commit_user) != item['md5']

                            Snapshot.AddSyncLog(@commit_user, @sync_session_id, "InitialSnapshot. Not math table: #{item['table']}")

                            puts "MD5 mismatch: #{item['table']}"
                            raise "MD5 mismatch: #{item['table']}"
                        end
                    end
                end
                Snapshot.AddSyncLog(@commit_user, @sync_session_id, 'Finish check InitialSnapshot')

                $syslog.add 'Check new client_commit data'

                new_data_in_tables=''
                @commit_data['commit_md5'].each do |item|
                    #puts " #{item['table']} - #{item['md5']} "
                    if item['table'] != 'config'
                        if Snapshot.get_md5_snapshot_table(item['table'], @commit_user) != item['md5']
                            puts "New data in table: #{item['table']}"
                            new_data_in_tables += item['table']+"; "
                        end
                    end
                end

                Snapshot.AddSyncLog(@commit_user, @sync_session_id, "Found new data from client in table: #{new_data_in_tables}")

                commit_json @commit_data

            rescue Exception => e
                $syslog.add "EXCEPTION CYBIRG: INFO:#{e.message}\n#{e.backtrace.inspect}"
                puts "EXCEPTION: #{e.inspect}"
                puts "MESSAGE: #{e.message}"
            end

            puts 'Unlock!'
            pg.close
            Locker.unlock @sync_session_id, 'sync session'
        end

        # Применение изменений в базу Основную, Локальную и Снапшоты
        def commit_json json # table:data
            # find auto increment field and delete them from json.

            #puts "FROM CLIENT: #{json.to_json}\n\n\n"

            Snapshot.AddSyncLog(@commit_user, @sync_session_id, 'Insert new data to MS');
            $syslog.add 'Commit to ms'
            # Insert to MS SQL
            ms = MS_connection.new
            json['new_data'].each do |r|
                table_name = r['table']
                insert_sql=[]
                autoinc=[]
                result = ms.exec("select COLUMN_NAME
            from INFORMATION_SCHEMA.COLUMNS
            where TABLE_SCHEMA = 'dbo'
            and COLUMNPROPERTY(object_id(TABLE_NAME), COLUMN_NAME, 'IsIdentity') = 1
            and TABLE_NAME = '#{table_name}' ")
                result.each { |row| autoinc.push(row['COLUMN_NAME']) }


                r['data'].each do |hash_row|
                    columns=''
                    datas=''
                    hash_row.each do |column, data|
                        go_next = false
                        autoinc.each { |i| go_next = true if i == column }
                        go_next = true if column == 'uuid'
                        go_next = true if column == 'repl_client_id'
                        go_next = true if column == 'isnew'
                        next if go_next

                        columns += (columns.length > 2 ? "," : "")+"#{column}"
                        datas += (datas.length > 2 ? "," : "")+"'#{data}'"
                    end


                    if autoinc.count >0

                        begin
                            result = ms.exec ("BEGIN TRANSACTION insert_trans;
                        insert into #{table_name} ( #{columns} ) values ( #{datas} );
                        SELECT IDENT_CURRENT('#{table_name}') as id;
                        COMMIT TRANSACTION insert_trans;")
                        rescue Exception => e
                            $syslog.add "EXCEPTION commit auto_increment data: INFO:#{e.message}\n#{e.backtrace.inspect}"

                            Snapshot.AddSyncLog(@commit_user, @sync_session_id, "EXCEPTION commit to MS auto_increment data: INFO:#{e.message}\n#{e.backtrace.inspect}")

                            puts "MESSAGE: #{e.message}"
                            puts "EXCEPTION: #{e.inspect}"
                        end
                        #byebug

                        if result.count > 0
                            hash_row[autoinc[0]]= result.first['id'].to_i
                        else
                            $syslog.add "ERROR commit data to main_db ! Sql: [insert into #{table_name} ( #{columns} ) values ( #{datas} );] "
                            raise "ERROR commit data to main_db !"
                        end
                    else
                        insert_sql.push "insert into #{table_name} ( #{columns} ) values ( #{datas} );\n"
                    end

                end


                r['data'].each do |hash_row|
                    deletes = ""
                    hash_row.each do |column, data|
                        go_next = false
                        go_next = true if column == 'uuid'
                        go_next = true if column == 'repl_client_id'
                        go_next = true if column == 'isnew'
                        next if go_next

                        deletes += (deletes.length > 1 ? " and " : "")+"#{column}='#{data}'"
                    end
                    @rollback_list.push "delete from #{table_name} where #{deletes}"
                end


                begin
                    result = ms.exec ("BEGIN TRANSACTION insert_trans;\n #{insert_sql.map { |i| i }.join} COMMIT TRANSACTION insert_trans;")
                rescue Exception => e
                    $syslog.add "EXCEPTION commit non auto_increment data: INFO:#{e.message}\n#{e.backtrace.inspect}"

                    Snapshot.AddSyncLog(@commit_user, @sync_session_id, "EXCEPTION commit to MS non auto_increment data: INFO:#{e.message}\n#{e.backtrace.inspect}")

                    puts "MESSAGE: #{e.message}"
                    puts "EXCEPTION: #{e.inspect}"
                    raise "ERROR commit data to main_db !"
                end


            end
            ms.close

            Snapshot.AddSyncLog(@commit_user, @sync_session_id, 'Insert new data to snapshot');
            $syslog.add 'Commit to postgres'
            pg = Pg_connection.new
            json['new_data'].each do |r|
                table_name = r['table']
                insert_sql=[]

                r['data'].each do |hash_row|
                    columns = datas = deletes = ''
                    hash_row.each do |column, data|
                        next if column == 'isnew'

                        columns += (columns.length > 1 ? ',' : '')+"#{column}"

                        if data.length > 0
                            datas += (datas.length > 1 ? ',' : '')+"'#{data}'"
                            deletes += (deletes.length > 1 ? ' and ' : '')+"#{column}='#{data}'"
                        else
                            datas += (datas.length > 1 ? ',' : '')+'null'
                            deletes += (deletes.length > 1 ? ' and ' : '')+"#{column} isnull"
                        end

                    end
                    insert_sql.push "insert into snapshot.#{table_name} ( #{columns} ) values ( #{datas} );\n"
                    @rollback_list.push "delete from snapshot.#{table_name} where #{deletes}"
                end


                begin
                    result = pg.exec ("BEGIN;\n #{insert_sql.map { |i| i }.join} COMMIT;")
                rescue Exception => e
                    $syslog.add "EXCEPTION commit postgres_db data: INFO:#{e.message}\n#{e.backtrace.inspect}"

                    Snapshot.AddSyncLog(@commit_user, @sync_session_id, "EXCEPTION commit postgres_db data: INFO:#{e.message}\n#{e.backtrace.inspect}")

                    puts "MESSAGE: #{e.message}"
                    puts "EXCEPTION: #{e.inspect}"
                    rollback
                    raise 'ERROR commit data to postgres_db !'
                end
            end
            pg.close

            #puts json.to_yaml
            #puts "\n\n\n"
            $syslog.add 'Commit OK!'

            Snapshot.AddSyncLog(@commit_user, @sync_session_id, 'Verify table md5 after insert');
            $syslog.add 'Verify client commit md5'
            @commit_data['commit_md5'].each do |item|
                #puts " #{item['table']} - #{item['md5']} "
                if item['table'] != 'config'
                    if Snapshot.get_md5_snapshot_table(item['table'], @commit_user) != item['md5']
                        puts "MD5 mismatch: #{item['table']}"
                        Snapshot.AddSyncLog(@commit_user, @sync_session_id, "Mismatch md5 for table: #{item['table']} ");
                    end
                end
            end

            $syslog.add 'Finish OK!'

        end

        # Проверка МД5 таблиц
        def verify_md5(data)
            ret=true

            Snapshot.AddSyncLog(@commit_user, @sync_session_id, 'Final verify md5')

            begin
                jdata = JSON.parse(data)
            rescue JSON::ParserError => e
                raise 'final incoming json md5 data incorrect '
            end

            jdata['initial_md5'].each do |item|
                if item['table'] != 'config'
                    if Snapshot.get_md5_snapshot_table(item['table'], @commit_user) != item['md5']
                        puts "MD5 mismatch ! #{item['table']}"
                        Snapshot.AddSyncLog(@commit_user, @sync_session_id, "Mismatch md5 for table: #{item['table']}")
                        ret=false
                    end
                end
            end

            ret
        end


        def commit_server_data
            Snapshot.commit_client_changes @commit_user
        end


        def get_server_data
            Snapshot.get_commit_client_changes @commit_user
        end

        # Поиск ошибок в репликации
        def find_errors(data)
            #@commit_data

            begin
                jdata = JSON.parse(data)
            rescue JSON::ParserError => e
                raise 'final incoming json md5 data incorrect '
            end

            puts "Start find errors!"
            pg = Pg_connection.new
            table_list = Array.new
            jdata['initial_md5'].each do |item|
                if item['table'] != 'config'
                    if Snapshot.get_md5_snapshot_table(item['table'], @commit_user) != item['md5']
                        puts "MD5 mismatch ! #{item['table']}"
                        table_list.push(item['table'])
                    end
                end
            end

            table_list.each do |miss_table|

                uuid_list_server=Array.new
                uuid_list=nil
                jdata['uuid_list'].each do |item|
                    uuid_list = item['uuid'].split(";") if item['table'] == miss_table
                end

                result = pg.exec("select uuid from snapshot.#{miss_table} where repl_client_id='#{@commit_user}' order by uuid")
                result.each do |i|
                    #byebug
                    uuid_list_server.push i['uuid']
                    unless uuid_list.include? i['uuid']
                        puts "In client table:#{miss_table} not found id: #{i['uuid']}"
                    end

                end

                uuid_list.each do |uuid|
                    unless uuid_list_server.include? uuid
                        puts "In server table:#{miss_table} not found id: #{i['uuid']}"
                    end
                end

            end

            pg.close

        end

        # Откат изменений рпликации
        def rollback
            $syslog.add 'Rollback data !'

            pg = Pg_connection.new
            ms = MS_connection.new

            @rollback_list.each do |item|
                begin
                    if item.include? 'snapshot.'
                        puts "DELETE PG: #{item} "
                        pg.exec item
                    else
                        puts "DELETE MS: #{item} "
                        ms.exec item
                    end
                rescue
                end
            end

            pg.close
            ms.close

            $syslog.add "Rollback data OK"

            true
        end

    end

    def self.AddSyncLog user, sync_id, info, data=nil
        pg = Pg_connection.new

        t=Time.new
        date = t.strftime('%Y-%m-%d %H:%M:%S_')+t.to_f.to_s[t.to_f.to_s.index('.')+1..-1]
        format_data = data != nil ? Base64.encode64(data.to_yaml).gsub("\n", '') : ''

        pg.exec " insert into snapshot.sync_loging (id,sync_id,client_id,date_time,info,data) values
                     (uuid_generate_v1(),'#{sync_id}','#{user}','#{date}','#{info}','#{ format_data }') "

        pg.close
    end


end




