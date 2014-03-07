

class Cyborg_config
    
    def initialize
       @config_list = Hash.new
       @config_list.default = nil
       reload
    end
    
    def get cyborg, variable
        
        unless @config_list[cyborg] == nil
            @config_list[cyborg][variable]
        else
            nil
        end
        
    end
    
    def add data
        File.open($config.CYBORG_CONFIG,'a'){ |f| f.puts data }
        reload
    end
    
    private 
    
    def reload
        
        fcc = File.open($config.CYBORG_CONFIG).read
        fcc.gsub!(/\r\n?/, "\n")
        section="main"
        fcc.each_line do |line|
            if !line.include? '#' and line.include? '='
                
                variable = line[0..line.index('=')-1].strip 
                value = line[line.index('=')+1..line.size].strip
                #puts "RELOAD: #{section} #{variable} [#{value}] "
                @config_list[section] = Hash.new if @config_list[section] == nil
                
                @config_list[section][variable]=value
            elsif !line.include? '#' and line.include? '['
                section=line[line.index('[')+1..line.index(']')-1]
            end
        end
        #puts @config_list.to_yaml
    end
    
end


