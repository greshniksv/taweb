class Mobile
    
    def self.get_json type
        case type.downcase
        when "forms"
            Mobile.get_forms
        when "forms_md5"
            Digest::MD5.hexdigest Mobile.get_forms
        when "images"
            Mobile.get_images
        when "images_md5"
            Digest::MD5.hexdigest Mobile.get_images
        else
            raise "Mobile get_json type not found"
        end
    end

    def self.get_plain type
        case type.downcase
        when "css"
            Mobile.get_css
        when "css_md5"
            Digest::MD5.hexdigest Mobile.get_css
        when "scripts"
            Mobile.get_scripts
        when "scripts_md5"
            Digest::MD5.hexdigest Mobile.get_scripts
        else
            raise "Mobile get_plain type not found"
        end
    end
   
  
    def self.get_main
        
        result = "<style type=\"text/css\"> #{File.read("./mobile/jquery.mobile-1.3.2.min.css")} </style> "
        
        result += "<script type=\"text/javascript\" charset=\"UTF-8\"
                    src=\"data:text/javascript;base64,#{Base64.encode64 (File.read("./mobile/jquery-2.0.3.min.js"))}\"></script>"
        
        result += "<script type=\"text/javascript\" charset=\"UTF-8\"
                    src=\"data:text/javascript;base64,#{Base64.encode64 (File.read("./mobile/jquery.mobile-1.3.2.js"))}\"></script>"

        result += "<script type=\"text/javascript\" charset=\"UTF-8\"
                    src=\"data:text/javascript;base64,#{Base64.encode64 (File.read("./mobile/functions.js"))}\"></script>"

        result += "<script type=\"text/javascript\" charset=\"UTF-8\"
                    src=\"data:text/javascript;base64,#{Base64.encode64 (File.read("./mobile/extern_function.js"))}\"></script>"

        #result += "<script type=\"text/javascript\"
        #            src=\"data:text/javascript;base64,#{Base64.encode64 (File.read("./mobile/taweb_client.js"))}\"></script>"



        result += "<script type=\"text/javascript\"> #{File.read("./mobile/taweb_client.js")} </script>"
        
        result += File.read("./mobile/client.html")
        
        #TODO: create main_app.html is disable !
        #File.open("./mobile/main_app.html",'a'){ |f| f.puts  result }
        
        result
    end
  
    def self.get_css
        files_content=""
        Dir.glob("./mobile/css/*.css").each{ |f| files_content += File.read(f) }
        Dir.glob("./mobile/plugins/**/*.css").each{ |f| files_content += File.read(f) }
        Base64.encode64(files_content).gsub("\n","")
    end
  
    def self.get_scripts
        files_content=""
        Dir.glob("./mobile/plugins/**/*.js").each{ |f| files_content += File.read(f) }
        Dir.glob("./mobile/plugins/**/*.coffee").each{ |f| files_content += CoffeeScript.compile File.read(f) }
        Dir.glob("./mobile/scripts/**/*.js").each{ |f| files_content += File.read(f) }
        Dir.glob("./mobile/scripts/**/*.coffee").each{ |f| files_content += CoffeeScript.compile File.read(f) }
        
        Base64.encode64(files_content).gsub("\n","")
    end
  
    def self.get_forms
        files_content="["
        Dir.glob("./mobile/forms/*.html").each do |f| 
            form = File.read(f)
            form_c = name = icon=""
            line_count=0
            form.each_line do |line|
                
                if line_count == 0
                    line_s = line.split("\"")
                    name=line_s[0]
                    icon=line_s[1]
                else
                    form_c += line
                end
                line_count += 1
            end
            files_content += "," if files_content.length >3
            files_content += "{ \"name\":\"#{name}\",\n\"icon\":\"#{icon}\",\n\"html\":\"#{Base64.encode64(form_c).gsub("\n","")}\" }"           
        end
        files_content += "]"
        
        begin
            JSON.parse(files_content)
        rescue JSON::ParserError => e
            $syslog.add " ERROR CREATE JSON in function [ get_form ] \n #{e.to_yaml}"
            raise " ERROR CREATE JSON in function [ get_form ] \n #{e.to_yaml}"
        end
        
        files_content
    end
  
    def self.get_images
        File.read("./mobile/images.json")
    end
  
end
