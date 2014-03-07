class Replweb_Manager

    def self.exec cmd, user
        ret=""
        cmds = cmd.split(/[_ ]/)

        $replicate_command_list.each do |item|
            if cmds[0] == item.key
                ret = item.exec cmds, user
            end
        end

        ret
    end

end


class Replweb_get
    attr_reader :name, :key

    def initialize()
        @name="geta asdsade"
        @key="get"
    end

    def exec cmd, user
        ret_data=""

        #TODO: Create rescue ))
        #RESCUE ;)


        if cmd[1] == "clients"
            pg = Pg_connection.new
            ret_data="["
            result = pg.exec(" select distinct id,ru_name from system.repl_clients order by ru_name ")
            ret_data += result.map { |row| "{ \"id\":\"#{row['id']}\",\"name\":\"#{row['ru_name']}\" }" }.join(',')
            ret_data += "]"
            pg.close
        end


        #get_tablelist
        if cmd[1] == "tablelist"
            ret="["
            pg = Pg_connection.new

            result = pg.exec(" select distinct lower(rp_table) as table from system.repl_table ")

            if result.count > 0
                #result.each { |row| ret=ret+"#{(ret.length>3 ? "," : "")}{ \"item\":\"#{row['table']}\"  } " }
                ret += result.map { |row| "{ \"item\":\"#{row['table']}\" }" }.join(',')
            end
            ret=ret+"#{(ret.length>3 ? "," : "")}{ \"item\":\"config\"  } "
            pg.close
            ret=ret+"]"
            ret_data = ret

        end

        #get_tablelist
        if cmd[1] == "ftable"
            tableName = cmd[2]

            ret="["
            pg = Pg_connection.new

            column_list=""
            result = pg.exec(" SELECT column_name,data_type FROM information_schema.columns WHERE table_name ='#{tableName}' and table_schema='snapshot' ")
            result.each do |row|
                column_list=column_list+"," if column_list.length>1
                if row['data_type'] == 'character varying'
                    column_list=column_list+"Replace(Replace(#{row['column_name']},'\\','\\\\'),'\"','\\\"') as #{row['column_name']}"
                else
                    column_list=column_list+row['column_name']
                end
            end

            #puts "S:select #{column_list} from snapshot.#{tableName} where repl_client_id='#{user}'"
            result = pg.exec(" select #{column_list} from snapshot.#{tableName} where repl_client_id='#{user}' ")

            if result.count > 0
                result.each do |row|
                    ret=ret+"," if ret.length>2
                    ret=ret+"{"
                    rr=""
                    result.fields.each do |x|
                        rr=rr+"," if rr.length>3;
                        rr=rr+"\"#{x}\":\"#{row[x]}\" ";
                    end
                    ret=ret+rr
                    ret=ret+",\"isnew\":\"0\""
                    ret=ret+"}"
                end

            end
            pg.close
            ret=ret+"]"

            begin
                JSON.parse(ret)
            rescue JSON::ParserError => e
                $syslog.add " ERROR CREATE JSON for table '#{tableName}' and user '#{user}' \n #{e.to_yaml}"
                raise " ERROR CREATE JSON in function [ get_table ] \n #{e.to_yaml}"
            end

            ret_data = ret
        end


        #get_tablelist
        if cmd[1] == "table"
            tableName = cmd[2]

            if tableName == "config"

                pg = Pg_connection.new
                result = pg.exec "select variable, value from management.client_config where user_id='#{user}' order by 1"
                ret_data += "["
                #result.each { |row| ret_data += " #{(ret_data.length > 3? "," : "")}{ \"variable\":\"#{row['variable']}\",\"value\":\"#{row['value']}\" }"  }
                ret_data += result.map { |row| "{ \"variable\":\"#{row['variable']}\",\"value\":\"#{row['value']}\" }" }.join(',')
                ret_data += "]"
                pg.close

            else

                pg = Pg_connection.new
                column_list=""
                result = pg.exec(" SELECT date_time, data FROM snapshot.client_compiled_data where client_id='#{user}' ")
                result.each do |row|
                    time_elepsed_min = (Time.now - Time.parse(row['date_time'], "%d-%m-%Y %H:%M:%S"))/60

                    #puts "DATA time: #{time_elepsed_min} \n#{Time.now.to_s}\n#{Time.parse(row['date_time']).to_s}"
                    if time_elepsed_min < 10

                        precompiled_json_data = YAML::load(Base64.decode64(row['data']))
                        precompiled_json_data.each { |table, value|
                            if table==tableName then
                                ret_data = value; break;
                            end }
                        #byebug
                    else
                        $syslog.add "ReplicateGetData. Precompiled data obsolete!"
                    end

                end
                pg.close

            end

        end

        #begin
        #    JSON.parse(ret_data)
        #rescue JSON::ParserError => e
        #    $syslog.add " ERROR OUTPUT JSON \n #{e.to_yaml}"
        #    raise " ERROR CREATE JSON in function [ get_table ] \n #{e.to_yaml}"
        #end

        ret_data
    end
end
$replicate_command_list[$replicate_command_list.count] = Replweb_get.new


class Replweb_sync_try_data
    attr_reader :name, :key

    def initialize()
        @name="geta asdsade"
        @key="sync-try-data"
    end

    def exec cmd, user
        sync_session_id = cmd[1];
        (Locker.wait? sync_session_id) ? "{\"status\":\"wait\"}" : "{\"status\":\"ok\"}"
    end
end
$replicate_command_list[$replicate_command_list.count] = Replweb_sync_try_data.new


class Replweb_sync_client_data
    attr_reader :name, :key

    def initialize()
        @name="geta asdsade"
        @key="sync-client-data"
    end

    def exec cmd, user
        sync_session_id = cmd[1];
        #byebug
        #(Locker.wait? sync_session_id) ? "{\"status\":\"wait\"}" : "{\"status\":\"ok\"}"
        Snapshot.AddSyncLog(user,sync_session_id,"Send server data to client.",$commit_list[sync_session_id].get_server_data)

        $commit_list[sync_session_id].get_server_data
    end
end
$replicate_command_list[$replicate_command_list.count] = Replweb_sync_client_data.new

class Replweb_sync_client_accept
    attr_reader :name, :key

    def initialize()
        @name="geta asdsade"
        @key="sync-client-accept"
    end

    def exec cmd, user
        sync_session_id = cmd[1];
        md5 = cmd[2];


        $commit_list.delete(sync_session_id)
    end
end
$replicate_command_list[$replicate_command_list.count] = Replweb_sync_client_accept.new


class Replweb_sync_client_deny
    attr_reader :name, :key

    def initialize()
        @name="geta asdsade"
        @key="sync-client-deny"
    end

    def exec cmd, client
        sync_session_id = cmd[1];

        $commit_list[sync_session_id].rollback
        $commit_list.delete(sync_session_id)
    end
end
$replicate_command_list[$replicate_command_list.count] = Replweb_sync_client_deny.new


class Replweb_set

    def self.syslog client, data
        ret_data="ok"
        begin
            pg = Pg_connection.new
            data.split(";").each { |item| pg.exec "insert into management.client_log (id,datetime,info,user_id) values
                                                    (uuid_generate_v1(),'#{(item.split('>')[0]).strip}','#{item.split('>')[1]}','#{client}') "; }
            pg.close
        rescue Exception => e
            $syslog.add "Error insert client log :( \nEX:#{e.to_yaml}"
            ret_data="error"
        end
        ret_data
    end

    def self.sync_data client, data

        commit_session = Snapshot::Commit_session.new
        sync_session_id = commit_session.create client, data
        $syslog.add "START SYNC: #{sync_session_id}"

        if sync_session_id != nil
            $commit_list[sync_session_id]=commit_session
            return sync_session_id
        else
            $syslog.add " ERROR CREATE SYNC_SESSION_ID'"
            #raise " ERROR CREATE JSON in function [ get_form ] \n #{e.to_yaml}"
            return "fail"
        end

    end

    def self.sync_data_finish client, data, sync_session_id

        Snapshot.AddSyncLog(client,sync_session_id,"Client commit data and retry md5. ",data)

        $commit_list[sync_session_id].commit_server_data()
        ret = $commit_list[sync_session_id].verify_md5(data)

        if ret
            $commit_list.delete(sync_session_id)
        else
            $commit_list[sync_session_id].find_errors data
            #$commit_list[sync_session_id].rollback
            $commit_list.delete(sync_session_id)
        end

        Thread.new { Snapshot.gen_all_table_difference client }
        Snapshot.AddSyncLog(client,sync_session_id,"Finish!")
        ret ? "ok" : "fail"
    end


end











