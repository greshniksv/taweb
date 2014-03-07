#-- gem install pg
#-- libpgsql-ruby1.8, ruby-pg, libpq-dev


class Pg_connection
  
    attr_reader :pgConnection
  
    def initialize()
        @pgConnection = PG.connect( :dbname=> $config.PG_DB, :host=>$config.PG_HOST, :port=>$config.PG_PORT, :user=>$config.PG_LOGIN,:password=>$config.PG_PASS )
    end
  
    def check_connection
        begin
            @pgConnection.exec( "SELECT 1" )
        rescue PG::Error => err
            #$stderr.puts "%p while testing connection: %s" % [ err.class, err.message ]
            $syslog.add "Error exec postgre sql: #{sql} info: #{err.message} ", "database"
            @pgConnection.reset
        end
    end
  
    def getConnection
        @pgConnection
    end
  
    def transaction action
    
        case action
        when :open
            @pgConnection.exec( 'BEGIN' )
        when :commit
            @pgConnection.exec( 'COMMIT' )
        when :rollback
            @pgConnection.exec( 'ROLLBACK' )
        else
            raise "ERROR TRANSACTION COMMAND"
        end
    
    end
  
  
    def exec sql
        begin
            result = @pgConnection.exec sql
        rescue PG::Error => err
            #$syslog.add "Error exec postgre sql: #{sql} ", "database"
            $syslog.add "Error exec postgre sql: #{sql} info: #{err.message} ", "database"
            @pgConnection.reset
            raise "Error exec postgre sql: #{sql} info: #{err.message} "
            nil
        end
    end
    
  
    def close
        @pgConnection.finish
    end
  
end



class MS_connection
  
    def initialize
        #:encoding
        @client = TinyTds::Client.new(:username =>$config.MS_LOGIN , :password =>$config.MS_PASS, 
            :host => $config.MS_HOST, :database => $config.MS_DB)
    end
  
    def exec sql
        
        #begin
        #@client.execute("BEGIN TRANSACTION").do
        result = @client.execute(sql)
        #@client.execute("COMMIT TRANSACTION").do
        #result.do
        #result
        # rescue
        #@client.execute("ROLLBACK TRANSACTION").do
        #raise "Error execute sql: #{sql}"
        #end
    end
  
    def close
        @client.close unless @client.closed?
    end
  
  
end



