
def get_execute_time
    start = Time.now
    yield
    (Time.now - start).to_i
end

def seconds2time seconds
    #hours = seconds/3600.to_i
    #minutes = (seconds/60 - hours * 60).to_i
    #secondsi = (seconds - (minutes * 60 + hours * 3600))
    
    min = seconds/60
    hour = min/60
    min = (min-(hour*60))
    sec = (seconds-(min*60))
    
    "#{hour}h #{min}m #{sec}s"
end



def get_md5_all_snapshot_table user
    return_data = nil
    pg = Pg_connection.new
    table_list = Array.new
    table_hash = Hash.new
    
    result = pg.exec "select distinct table_name from information_schema.columns where table_schema='snapshot'"
    result.each do |row|
        table_list.push(row['table_name'])
    end
    
    table_list.each do |item|
        table_hash[item]=get_md5_snapshot_table item, user
    end

    pg.close
    table_hash
end

def json_valid?(str)
    begin
        JSON.parse(str)
        return true
    rescue JSON::ParserError
        return false
    end
end

