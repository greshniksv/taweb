class Integrity_broken

    def self.do ( ident, command, act=:add )
        pg = Pg_connection.new

        if act == :add
            pg.exec "insert into system.integrity_broken (id,name, command) value (uuid_generate_v1(),'#{ident}','#{Base64.encode64(command)}') "
        else # :remove
            pg.exec "delete from system.integrity_broken where name = '#{ident}' "
        end

        pg.close
    end

    def self.fix_all_broken
        pg = Pg_connection.new
        result = pg.exec " select id, command system.integrity_broken where name = '#{ident}' "
        

        Base64.decode64()

        pg.close
    end


    def self.broken? ( ident )
        pg = Pg_connection.new

            result = pg.exec " select count(id) as count system.integrity_broken where name = '#{ident}' "
            if result[0]['count'].to_i > 0
                return true
            else
                return false
            end

        pg.close
    end
end