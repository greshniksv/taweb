def check_key key
  
    if key==$config.API_KEY
        true
    else
        false
    end
  
end


class App < Sinatra::Application
   
    
    #################################################################################
    #################################################################################
    ## -- /replicate/:command/:user

    #Access-Control-Allow-Origin

    #!HELP: get_tablelist/ad0d5462-2fe3-11e3-a3dd-485b39432295
    get "/replicate/:command/:client" do
        response.headers['Access-Control-Allow-Origin'] = '*'
        $syslog.add "API REPL= Exec client: #{params[:client]} command: #{params[:command]} "
        Replweb_Manager.exec params[:command], params[:client]
    end

    post '/replicate/:command' do
        response.headers['Access-Control-Allow-Origin'] = '*'
        #puts "DATA:#{params.to_yaml}"
        puts "POST: #{params[:command]}"
        ret = Replweb_set.syslog params[:client],params[:data] if params[:command] == "syslog"
        ret = Replweb_set.sync_data params[:client],params[:data] if params[:command] == "sync_data"
        ret = Replweb_set.sync_data_finish( params[:client], params[:data], params[:sync_id] ) if params[:command] == "sync_data_finish"

        ret
    end
    
    
    
    #################################################################################
    #################################################################################
    ## -- /mobile

    get "/mobile_main" do
        
        response.headers['Access-Control-Allow-Origin'] = '*'
        content_type 'text/html'
        Mobile.get_main
    end


    get "/images/:file" do

        response.headers['Access-Control-Allow-Origin'] = '*'
        content_type 'image/jpeg'
        File.read("./mobile/images/#{params[:file]}")
    end

    get "/mobile_plain/:action" do
    
        response.headers['Access-Control-Allow-Origin'] = '*'
        content_type 'text/plain'
    
        Mobile.get_plain params[:action]
    end
    
    get "/mobile_json/:action" do
    
        response.headers['Access-Control-Allow-Origin'] = '*'
        content_type 'application/json'
    
        Mobile.get_json params[:action]
    end
    
    
    #################################################################################
    #################################################################################
    # -- CHECK KEY

    get "/:key/*" do
  
        response.headers['Access-Control-Allow-Origin'] = '*'
        content_type 'application/json'
    
        if !check_key params[:key]
            $syslog.add "Not autorized request from ip: #{request.ip} ", "api"
            halt 401, "Error autentification from ip: #{request.ip}"
        else
            pass
        end
  
    end


    #################################################################################
    #################################################################################
    # -- ROOT

    get "/" do
        "TAWEB"
    end


    #################################################################################
    #################################################################################
    # -- cyborg_list


    get "/:key/cyborg_list" do
    
        unless $cyborg_list ==nil
            ret="["
            $cyborg_list.each do |cyborg|
                if ret.length>3 
                    ret=ret+","
                end
                ret = " #{ret} { \"value\":\"#{cyborg.name}\", \"description\":\"#{cyborg.description}\", \"status\":\"#{CyborgManage.status(cyborg.name) }\"   }\n "
            end
            ret+"]"
        else
            "ERROR"
        end
  
    end


    #################################################################################
    #################################################################################
    # -- /syslog/:name


    get "/:key/syslog/:name" do
        
        log_list = $syslog.get params[:name] 
        ret="["
        unless log_list==nil
            log_list.each do |item|
                if ret.length>3 
                    ret=ret+","
                end
            
                #if item.include? "\""
                #    item.gsub "\"","\\\""
                #end
                
                #item = item.gsub "\\\"","\""
                item = item.gsub "\"","(34.ch)"
                item = item.gsub "'","(39.ch)"
                item = item.gsub "\n","(13.ch)"
                item = item.gsub "\\","(92.ch)"
                #
                #item = URI.escape item
                #item = item.delete("\n")
                #item["\""]="\\\""
                ret=ret+" { \"item\": \"#{item}\"  }\n "
            end
            ret=ret+"]"
        else
            #"Not found #{params[:name]} log "
            ret = "{}"
        end
        ret
    end


    #################################################################################
    #################################################################################
    ## -- /cyborg/:cyborg/:action


    get "/:key/cyborg/:cyborg/:action" do
    
        $syslog.add "API= Cyborg: #{params[:cyborg]}  Action: #{params[:action]} " 
    
        # action: start ,stop, restart, run, status
    
        if params[:action] == "stop" 
        
            CyborgManage.stop params[:cyborg]
        
        elsif params[:action] == "restart"
        
            CyborgManage.restart params[:cyborg]
        
        elsif params[:action] == "run"
        
            CyborgManage.run params[:cyborg]
        
        elsif params[:action] == "start"
        
            CyborgManage.start params[:cyborg]
        
        elsif params[:action] == "status"
        
            CyborgManage.status params[:cyborg]   
        
        else
            $syslog.add "API= Action: #{params[:action]}  not found !"
        end
        "{\"status\":\"ok\"}"
    end

    #################################################################################
    #################################################################################
    ## -- /locker_list


    get "/:key/locker_list" do
    
        linfo = Locker.info
        return "{}" if linfo==nil
        ret="["
        linfo.each do |row|
            if ret.length>3 
                ret=ret+","
            end
            ret=ret+" { \"id\": \"#{row['id']}\", \"table\": \"#{row['l_table']}\", \"key\": \"#{row['l_key']}\", \"time\": \"#{row['l_time']}\" }\n "
        end
        ret+"]"
    
    end

    #################################################################################
    #################################################################################
    ## -- /command/:command


    get "/:key/command/:command" do
        $syslog.add "API= Exec command: #{params[:command]} " 
        ret = Command.execute (params[:command])
        if ret == nil or ret == ""
            "{\"status\":\"nothing\"}"
        else
            ret
        end
    end



    #################################################################################
    #################################################################################
    ## -- Get conflict info

    get "/:key/conflict/:id" do
    
        response.headers['Access-Control-Allow-Origin'] = '*'
        content_type 'text/html'
    
        Conflict.web_info params[:id]
    end


    #################################################################################
    #################################################################################
    ## -- Resolve conflict

    get "/:key/conflict/:id/:action" do
    
        response.headers['Access-Control-Allow-Origin'] = '*'
        content_type 'text/html'
    
        Conflict.web_resolve params[:id], params[:action]
    end


    #################################################################################
    #################################################################################
    ## -- /system_info

    get "/:key/system_info" do
    
        response.headers['Access-Control-Allow-Origin'] = '*'
        content_type 'text/html'
    
        file = "<script type=\"text/javascript\">"
        file = file + File.read("./mobile/jquery-2.0.3.min.js")
        file = file + "</script>"
        file + File.read("./sysinfo.html").gsub("[web_key]",$config.API_KEY)
    
    end


    #################################################################################
    #################################################################################
    ## -- /sync_log_viewer

    get "/:key/sync_log_viewer" do

        response.headers['Access-Control-Allow-Origin'] = '*'
        content_type 'text/html'

        file = "<script type=\"text/javascript\">"
        file = file + File.read("./mobile/jquery-2.0.3.min.js")
        file = file + "</script>"
        file + File.read("./sync_log_viewer.html").gsub("[web_key]",$config.API_KEY)

    end



    #################################################################################
    #################################################################################
    ## -- /plugin test
   
    get "/:key/plugin_test/:plugin/:file/:type" do
        
        response.headers['Access-Control-Allow-Origin'] = '*'
        content_type 'application/javascript' if params[:type].downcase == "java"
        content_type 'text/html' if params[:type].downcase == "html"
        content_type 'text/css' if params[:type].downcase == "css"
        
        test_file= "./mobile/plugins/#{params[:plugin]}/#{params[:file]}"
        if File.exist? test_file
            
            if test_file.include? ".coffee"
                CoffeeScript.compile test_file
            else
                File.read(test_file)
            end
            
        else
            "FILE NOT FOUIND!"
        end
    end
    
  
    #################################################################################
    #################################################################################
    # -- ON NOT FOUND

    get "/*" do
        "Error loading page: #{params[:splat]} "
    end
end