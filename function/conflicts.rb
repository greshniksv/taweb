#
# Класс отображающий все возможные проблему и возможность их решения
#
#
#

class Conflict
    
    def self.create info, data
        conn = Pg_connection.new
        uuid = UUID.new
        new_id = uuid.generate
        
        url="http://#{$config.WEB_URL}/#{$config.API_KEY}/conflict/#{new_id}"
        
        html = "
        <style type=\"text/css\">
        .PopupPanel
        {
            border: solid 1px black;
            position: absolute;
            left: 50%;
            top: 50%;
            background-color: white;
            z-index: 100;

            height: 400px;
            margin-top: -200px;

            width: 600px;
            margin-left: -300px;
        }
        
        .header
        {
        background: rgb(255,48,25); /* Old browsers */
        background: -moz-linear-gradient(top, rgba(255,48,25,1) 0%, rgba(207,4,4,1) 100%); /* FF3.6+ */
        background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(255,48,25,1)), color-stop(100%,rgba(207,4,4,1))); /* Chrome,Safari4+ */
        background: -webkit-linear-gradient(top, rgba(255,48,25,1) 0%,rgba(207,4,4,1) 100%); /* Chrome10+,Safari5.1+ */
        background: -o-linear-gradient(top, rgba(255,48,25,1) 0%,rgba(207,4,4,1) 100%); /* Opera 11.10+ */
        background: -ms-linear-gradient(top, rgba(255,48,25,1) 0%,rgba(207,4,4,1) 100%); /* IE10+ */
        background: linear-gradient(to bottom, rgba(255,48,25,1) 0%,rgba(207,4,4,1) 100%); /* W3C */
        filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#ff3019', endColorstr='#cf0404',GradientType=0 ); /* IE6-9 */
        }

        .info
        {
            background: rgb(255,255,255); /* Old browsers */
            background: -moz-linear-gradient(top, rgba(255,255,255,1) 0%, rgba(229,229,229,1) 100%); /* FF3.6+ */
            background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(255,255,255,1)), color-stop(100%,rgba(229,229,229,1))); /* Chrome,Safari4+ */
            background: -webkit-linear-gradient(top, rgba(255,255,255,1) 0%,rgba(229,229,229,1) 100%); /* Chrome10+,Safari5.1+ */
            background: -o-linear-gradient(top, rgba(255,255,255,1) 0%,rgba(229,229,229,1) 100%); /* Opera 11.10+ */
            background: -ms-linear-gradient(top, rgba(255,255,255,1) 0%,rgba(229,229,229,1) 100%); /* IE10+ */
            background: linear-gradient(to bottom, rgba(255,255,255,1) 0%,rgba(229,229,229,1) 100%); /* W3C */

            font-family: ABeeZee;
        color: #2E2E2E;
        font-size: 17px;
        background-color: #FFFFFF;
        letter-spacing: 0.6pt;
        word-spacing: 2pt;
        padding: 14px;

        }

        </style>
        
        <div class='PopupPanel' ><table width=100% > 
        <tr><th class='header' height='30'  colspan='2' >  <table width='100%'><tr><th> TAWEB. WARNING! You have new conflict. Conflict ##{new_id} </th></tr></table> </th></tr>
        <tr><td colspan='2' class='info' height='345' valign='top' > #{info} <br><br> Details <a href='#{url}'>here</a> </td></tr>
        </table> </div> 
        "
        
        
        MyMail.send html,"TAWEB. WARNING! You have new conflict !"
        
        conn.exec "insert into system.repl_conflict (id,rc_info,rc_data) values ('#{new_id}','#{info}','#{data}') "
        
        conn.close
    end
    
    
    def self.web_info id

        info="..."
        data=nil
        next_id=""
          
        conn = Pg_connection.new
      
        # gen conflict ist
        info=" <div style='width: 550px; height: 290px; overflow: auto; font-size: 14px'> <table> <tr><td> <b> Conflict list</b> </td></tr> "
        result = conn.exec("select id,rc_info,rc_data from system.repl_conflict rc  ")
        if result.count >0 
            result.each do |row|
                inf = row['rc_info']
                dat = row['rc_data']
                iid = row['id']
                info=info+"<tr><td> <a href='#{iid}'> #{inf} </a></td></tr> "
            end
        end
        info=info+"</table></div>"
        
        
        result = conn.exec("select id,rc_info,rc_data,
                            ( select id from system.repl_conflict rc1 where rc1.id <> rc.id limit 1 ) as next 
                            from system.repl_conflict rc where id = '#{id}' ")
        if result.count >0 
            
            info = result[0]['rc_info']
            data = result[0]['rc_data']
            next_id = result[0]['next']
           
        end
        
        conn.close
        
        resolve_button = "<tr class='info' ><td style='cursor:hand' width='49%' align='center' onclick=\"window.location='#{id}/allow'\" > <a href='#{id}/allow'> Allow </a> </td>
        <td style='cursor:hand' align='center' height='50' onclick=\"window.location='#{id}/discard'\" > <a href='#{id}/discard'>  Discard </a> </td></tr>"
        resolve_button="" if data == nil
        
        
        "
        <style type=\"text/css\">
        .PopupPanel
        {
            border: solid 1px black;
            position: absolute;
            left: 50%;
            top: 50%;
            background-color: white;
            z-index: 100;

            height: 400px;
            margin-top: -200px;

            width: 600px;
            margin-left: -300px;
        }
        
        .header
        {
        background: rgb(255,48,25); /* Old browsers */
        background: -moz-linear-gradient(top, rgba(255,48,25,1) 0%, rgba(207,4,4,1) 100%); /* FF3.6+ */
        background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(255,48,25,1)), color-stop(100%,rgba(207,4,4,1))); /* Chrome,Safari4+ */
        background: -webkit-linear-gradient(top, rgba(255,48,25,1) 0%,rgba(207,4,4,1) 100%); /* Chrome10+,Safari5.1+ */
        background: -o-linear-gradient(top, rgba(255,48,25,1) 0%,rgba(207,4,4,1) 100%); /* Opera 11.10+ */
        background: -ms-linear-gradient(top, rgba(255,48,25,1) 0%,rgba(207,4,4,1) 100%); /* IE10+ */
        background: linear-gradient(to bottom, rgba(255,48,25,1) 0%,rgba(207,4,4,1) 100%); /* W3C */
        filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#ff3019', endColorstr='#cf0404',GradientType=0 ); /* IE6-9 */
        }

        .info
        {
            background: rgb(255,255,255); /* Old browsers */
            background: -moz-linear-gradient(top, rgba(255,255,255,1) 0%, rgba(229,229,229,1) 100%); /* FF3.6+ */
            background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(255,255,255,1)), color-stop(100%,rgba(229,229,229,1))); /* Chrome,Safari4+ */
            background: -webkit-linear-gradient(top, rgba(255,255,255,1) 0%,rgba(229,229,229,1) 100%); /* Chrome10+,Safari5.1+ */
            background: -o-linear-gradient(top, rgba(255,255,255,1) 0%,rgba(229,229,229,1) 100%); /* Opera 11.10+ */
            background: -ms-linear-gradient(top, rgba(255,255,255,1) 0%,rgba(229,229,229,1) 100%); /* IE10+ */
            background: linear-gradient(to bottom, rgba(255,255,255,1) 0%,rgba(229,229,229,1) 100%); /* W3C */

            font-family: ABeeZee;
        color: #2E2E2E;
        font-size: 17px;
        background-color: #FFFFFF;
        letter-spacing: 0.6pt;
        word-spacing: 2pt;
        padding: 14px;

        }

        </style>
        <div class='PopupPanel' ><table width=100% > 
        <tr><th class='header' height='30'  colspan='2' >  <table width='100%'><tr><th>  Conflict ##{id} </th><th width='60'>  <a href='list'> more #> </a> </th></tr></table> </th></tr>
        <tr><td colspan='2' class='info' height='310' valign='top' > #{info} </td></tr>
        #{resolve_button}
        </table> </div> 
        "
        
    end
    
    def self.web_resolve id, action
        
        info="Conflict not found !!!<br>Close this window and drink some cofee<br>ww<br>ww<br>ww<br>ww<br>ww<br>ww"
        data=nil
        next_id=""
          
        conn = Pg_connection.new
      
        result = conn.exec("select id as next from system.repl_conflict rc1 limit 1")
        if result.count > 0
            next_id = result[0]['next']
        end
        
        result = conn.exec("select id,rc_info,rc_data from system.repl_conflict rc where id = '#{id}' ")
        if result.count >0 
            
            info = result[0]['rc_info']
            data = result[0]['rc_data']
            
            if action == 'discard'
                conn.exec( "delete from system.repl_conflict where id = '#{id}'" )
            elsif action == 'allow'
                
                begin
                    eval data
                rescue Exception => e  
                    $syslog.add "EXCEPTION: error exec conflict DATA. INFO:#{e.message}\n#{e.backtrace.inspect}"
                end
                    
                #conn.exec( data )
                conn.exec( "delete from system.repl_conflict where id = '#{id}'" )
            else
                raise "ERROR. Action not found"
            end
           
        end
        
        conn.close
        
        
        "
        <style type=\"text/css\">
        .PopupPanel
        {
            border: solid 1px black;
            position: absolute;
            left: 50%;
            top: 50%;
            background-color: white;
            z-index: 100;

            height: 400px;
            margin-top: -200px;

            width: 600px;
            margin-left: -300px;
        }
        
        .header
        {
        background: rgb(255,48,25); /* Old browsers */
        background: -moz-linear-gradient(top, rgba(255,48,25,1) 0%, rgba(207,4,4,1) 100%); /* FF3.6+ */
        background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(255,48,25,1)), color-stop(100%,rgba(207,4,4,1))); /* Chrome,Safari4+ */
        background: -webkit-linear-gradient(top, rgba(255,48,25,1) 0%,rgba(207,4,4,1) 100%); /* Chrome10+,Safari5.1+ */
        background: -o-linear-gradient(top, rgba(255,48,25,1) 0%,rgba(207,4,4,1) 100%); /* Opera 11.10+ */
        background: -ms-linear-gradient(top, rgba(255,48,25,1) 0%,rgba(207,4,4,1) 100%); /* IE10+ */
        background: linear-gradient(to bottom, rgba(255,48,25,1) 0%,rgba(207,4,4,1) 100%); /* W3C */
        filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#ff3019', endColorstr='#cf0404',GradientType=0 ); /* IE6-9 */
        }

        .info
        {
            background: rgb(255,255,255); /* Old browsers */
            background: -moz-linear-gradient(top, rgba(255,255,255,1) 0%, rgba(229,229,229,1) 100%); /* FF3.6+ */
            background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(255,255,255,1)), color-stop(100%,rgba(229,229,229,1))); /* Chrome,Safari4+ */
            background: -webkit-linear-gradient(top, rgba(255,255,255,1) 0%,rgba(229,229,229,1) 100%); /* Chrome10+,Safari5.1+ */
            background: -o-linear-gradient(top, rgba(255,255,255,1) 0%,rgba(229,229,229,1) 100%); /* Opera 11.10+ */
            background: -ms-linear-gradient(top, rgba(255,255,255,1) 0%,rgba(229,229,229,1) 100%); /* IE10+ */
            background: linear-gradient(to bottom, rgba(255,255,255,1) 0%,rgba(229,229,229,1) 100%); /* W3C */

            font-family: ABeeZee;
        color: #2E2E2E;
        font-size: 17px;
        background-color: #FFFFFF;
        letter-spacing: 0.6pt;
        word-spacing: 2pt;
        padding: 14px;
        text-align='center'

        }

        </style>
        
        <div class='PopupPanel' ><table width=100% > 
        <tr><th class='header' colspan='2' height='30' >  <table width='100%'><tr><th>  Conflict ##{id} </th><th width='60'>  <a href='../list'> more #> </a> </th></tr></table> </th></tr>
        <tr><td colspan='2' class='info' height='345' valign='top'  > <br> <br> !!! CONFLICT ##{id} RESOLVED !!! </td></tr>
        </table> </div> 
        "
        
    end
    
    
    
    
    
    
end



