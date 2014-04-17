#####################################
# INFO:
# 
# This class only create table and field.
# If field exist and type or size not match will be ignore.
#
# Rus:
# Создание всех таблиц указанных в system.repl_table
# а также набор статических вспомогательных
#


class Cmd_Clone_table_creator

    attr_reader :key, :info

    def initialize
        @key = "createTableClone"
        @info= "Function create table structure for cloning table."
    end

    def exec cmd

        pg = Pg_connection.new
        ms = MS_connection.new
        begin
            pg.transaction :open
            tableList = Array.new
            table_lock = Array.new

            result = pg.exec("select rp_table, rp_field, rp_index from system.repl_table")
            result.each do |row|
                item = Hash.new
                item["table"]=row['rp_table']
                item["field"]=row['rp_field']
                item["index"]=row['rp_index']
                tableList.push(item)

                table_lock[table_lock.count]="replica.#{row['rp_table'].downcase}"
            end


            # LOCK TABLE
            table_lock = table_lock.uniq
            Locker.lock_list table_lock, "Clone_table_creator"
            #table_lock.each do |item| 
            #    Locker.lock "replica.#{item}","Clone_table_creator"
            #end


            tableList.each do |item|

                result = ms.exec("select DATA_TYPE,CHARACTER_MAXIMUM_LENGTH, COLUMN_DEFAULT from INFORMATION_SCHEMA.COLUMNS \
                     where TABLE_NAME='#{item['table']}' and COLUMN_NAME='#{item['field']}'")

                if result.count < 1
                    raise "ERROR geting data for table: #{item['table']} and field: #{item['field']} "
                end

                result.each do |row|

                    ms_data_type = row['DATA_TYPE']
                    data_length = row['CHARACTER_MAXIMUM_LENGTH']
                    data_default = row['COLUMN_DEFAULT']

                    if data_default != nil
                        data_default = data_default.gsub(/[()]/, "")
                        if data_default.gsub(/[()]/, "").downcase.include? "null"
                            data_default = "NULL"
                        else
                            data_default = "#{data_default}"
                        end
                    else
                        data_default = "NULL"
                    end

                    pg_table_type = ""
                    case ms_data_type

                        when "datetime"
                            pg_table_type="character varying(30)"
                        when "money"
                            pg_table_type="double precision"
                        when "real"
                            pg_table_type="real"
                        when "char"
                            pg_table_type="\"char\""
                        when "float"
                            pg_table_type="double precision"
                        when "bigint"
                            pg_table_type="bigint"
                        when "int"
                            pg_table_type="integer"
                        when "nchar"
                            pg_table_type="character varying(#{data_length})"
                        when "varchar"
                            pg_table_type="character varying(#{data_length})"
                        when "nvarchar"
                            pg_table_type="character varying(#{data_length})"
                        when "tinyint"
                            pg_table_type="smallint"
                        when "uniqueidentifier"
                            pg_table_type="character varying(36)"
                        else
                            raise "NOT FOUND DATA TYPE"
                    end

                    #######################
                    # - SCHEMA: replica

                    rez = pg.exec(" SELECT EXISTS(SELECT 1 FROM information_schema.tables 
                             WHERE table_schema='replica' AND table_name='#{item['table'].downcase}') as exist");

                    if rez[0]['exist']=="f"
                        $syslog.add "Create table [replica.#{item['table']}] and field [#{item['field']} #{pg_table_type}] "
                        pg.exec("CREATE TABLE replica.#{item['table'].downcase}
                                (
                                  #{item['field']} #{pg_table_type} DEFAULT #{data_default}
                                )
                                WITH (
                                  OIDS=FALSE
                                ); ")
                        #ALTER TABLE replica.#{item['table']} ;
                        #if item['index'] == 'p'
                        #    pg.exec("ALTER TABLE replica.#{item['table'].downcase} ADD PRIMARY KEY (#{item['field']});")
                        #end

                        if item['index'] == 'i'
                            pg.exec("CREATE INDEX idx_#{item['table'].downcase}_#{item['field']} ON replica.#{item['table'].downcase} USING btree (#{item['field']});")
                        end

                    else

                        begin
                            $syslog.add "Adding field [#{item['field']} #{pg_table_type}] to table replica.#{item['table']} "
                            pg.exec("ALTER TABLE replica.#{item['table'].downcase} ADD COLUMN #{item['field']} #{pg_table_type} DEFAULT #{data_default} ")

                            #if item['index'] == 'p'
                            #    pg.exec("ALTER TABLE replica.#{item['table'].downcase} ADD PRIMARY KEY (#{item['field']});")
                            #end

                            if item['index'] == 'i'
                                pg.exec("CREATE INDEX idx_#{item['table'].downcase}_#{item['field']} ON replica.#{item['table'].downcase} USING btree (#{item['field']});")
                            end
                        rescue
                            $syslog.add "WARNING! ERROR adding field [#{item['field']} #{pg_table_type}] to table replica.#{item['table']} "
                        end

                    end


                    #######################
                    # - SCHEMA: snapshot


                    rez = pg.exec(" SELECT EXISTS(SELECT 1 FROM information_schema.tables 
                             WHERE table_schema='snapshot' AND table_name='#{item['table'].downcase}') as exist");

                    if rez[0]['exist']=="f"
                        $syslog.add "Create table [snapshot.#{item['table']}] and field [#{item['field']} #{pg_table_type}] "
                        pg.exec("CREATE TABLE snapshot.#{item['table'].downcase}
                                (
                                  uuid character varying(36),
                                  repl_client_id character varying(36),
                                  #{item['field']} #{pg_table_type} DEFAULT #{data_default}
                                )
                                WITH (
                                  OIDS=FALSE
                                );

                                CREATE INDEX idx_#{item['table'].downcase}_repl_client_id ON snapshot.#{item['table'].downcase} USING btree (repl_client_id);
                            ")
                        #ALTER TABLE snapshot.#{item['table']} OWNER TO postgres;
                        #ALTER TABLE snapshot.#{item['table'].downcase} ADD PRIMARY KEY (uuid);    


                        # in snapshot can't use automatic primary key :( because use index.
                        #if item['index'] == 'p'
                        #pg.exec("ALTER TABLE snapshot.#{item['table'].downcase} ADD PRIMARY KEY (#{item['field']});")
                        #    pg.exec("CREATE INDEX idx_#{item['table'].downcase}_#{item['field']} ON snapshot.#{item['table'].downcase} USING btree (#{item['field']});")
                        #end

                        if item['index'] == 'i'
                            pg.exec("CREATE INDEX idx_#{item['table'].downcase}_#{item['field']} ON snapshot.#{item['table'].downcase} USING btree (#{item['field']});")
                        end

                    else

                        begin
                            $syslog.add "Adding field [#{item['field']} #{pg_table_type}] to table snapshot.#{item['table']} "
                            pg.exec("ALTER TABLE snapshot.#{item['table'].downcase} ADD COLUMN #{item['field']} #{pg_table_type} DEFAULT #{data_default} ")

                            # in snapshot can't use automatic primary key :( because use index.
                            if item['index'] == 'p'
                                #pg.exec("ALTER TABLE snapshot.#{item['table'].downcase} ADD PRIMARY KEY (#{item['field']});")
                                pg.exec("CREATE INDEX idx_#{item['table'].downcase}_#{item['field']} ON snapshot.#{item['table'].downcase} USING btree (#{item['field']});")
                            end

                            if item['index'] == 'i'
                                pg.exec("CREATE INDEX idx_#{item['table'].downcase}_#{item['field']} ON snapshot.#{item['table'].downcase} USING btree (#{item['field']});")
                            end
                        rescue
                            $syslog.add "WARNING! ERROR adding field [#{item['field']} #{pg_table_type}] to table snapshot.#{item['table']} "
                        end

                    end


                end

            end

            # Create table with primary_keys
            table_prkey_list = Hash.new
            rez = pg.exec(" select rp_table,string_agg(rp_field,E',') as key from system.repl_table where rp_index='p' group by rp_table");
            if rez.count > 0
                rez.each do |row|
                    table_prkey_list[row['rp_table']] = row['key']
                end
            end

            table_prkey_list.each do |table, keys|
                pg.exec "ALTER TABLE snapshot.#{table.downcase} ADD PRIMARY KEY (uuid,#{keys}); "
                pg.exec "ALTER TABLE replica.#{table.downcase} ADD PRIMARY KEY (#{keys}); "
            end


            pg.exec ' CREATE TABLE snapshot.client_compiled_data  (
            client_id  varchar(36) NOT NULL,
            date_time  varchar(19) NULL,
            data      text NULL,
            PRIMARY KEY(client_id,date_time) ) ;
            CREATE INDEX idx_client_compiled_data_client_id ON snapshot.client_compiled_data USING btree (client_id,date_time);"

            pg.exec "CREATE TABLE snapshot.client_query_action  (
            client_id	varchar(36) NULL,
            action   	varchar(500) NULL,
            query    	text NULL,
            PRIMARY KEY(client_id));
            CREATE INDEX idx_client_query_action_id ON snapshot.client_query_action USING btree (client_id,action);"

            pg.exec "CREATE TABLE snapshot.sync_loging  (
            id       	varchar(36) NOT NULL,
            sync_id  	varchar(500) NOT NULL,
            client_id	varchar(36) NOT NULL,
            date_time	varchar(30) NULL,
            info     	text NULL,
            data     	text NULL,
            PRIMARY KEY(id));
            CREATE INDEX idx_sync_loging_client_id ON snapshot.sync_loging USING btree (client_id);
            CREATE INDEX idx_sync_loging_sync_id ON snapshot.sync_loging USING btree (sync_id);'


            pg.transaction :commit
        rescue Exception => e
            $syslog.add 'EXCEPTION CLONE TABLE CREATOR. INFO:#{e.message}\n#{e.backtrace.inspect}'
            $syslog.add 'WORK ABORTED!'
            pg.transaction :rollback

            # LOCK TABLE
            Locker.unlock_list table_lock, 'Clone_table_creator'
            #table_lock.each do |item| 
            #    Locker.unlock "replica.#{item}","Clone_table_creator"
            #end

            return false
        end


        # LOCK TABLE
        Locker.unlock_list table_lock, 'Clone_table_creator'
        #table_lock.each do |item| 
        #    Locker.unlock "replica.#{item}","Clone_table_creator"
        #end
        $syslog.add 'Tables created'

        pg.close
        ms.close
        return true
    end

end

$command_list[$command_list.count] = Cmd_Clone_table_creator.new