
class MyMail

    def self.send data, header="TAWEB Information", filename = nil

        $syslog.add " SendMail Header: #{header} "
        
        unless filename == nil
            filecontent = File.read(filename)
            encodedcontent = [filecontent].pack("m")   # base64
        end

        body = "This is a test email with an attachement."

        #marker = "AUNIQUEMARKER"
        marker = (0...50).map{ ('a'..'z').to_a[rand(26)] }.join

        $config.MAIL_TO.each do |key, mailto|
            #$syslog.add "Send mail to: #{mailto} "
            
            unless filename == nil
                part =<<EOF
From: #{$config.MAIL_FROM}
To: #{mailto}
Subject: #{header}
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary=#{marker}
--#{marker}

#{data}
 
--#{marker}
content-type: application/dbase; name="#{File.basename(filename)}"
content-transfer-encoding: base64
content-disposition: attachment; filename="#{File.basename(filename)}"

#{encodedcontent}

--#{marker}--
EOF
            else
                part =<<EOF
From: #{$config.MAIL_FROM}
To: #{mailto}
Subject: #{header}
MIME-Version: 1.0
Content-Type: text/html; boundary=#{marker}

#{data}

EOF

            end      
            
            $config.SMTP_LIST.size.times do |i|
                #$syslog.add "Trying to send via #{$config.SMTP_LIST[i].info} "
                begin 
                    Net::SMTP.enable_tls(OpenSSL::SSL::VERIFY_NONE)
                    Net::SMTP.start($config.SMTP_LIST[i].host, $config.SMTP_LIST[i].port, 'gmail.com', $config.SMTP_LIST[i].user, $config.SMTP_LIST[i].pass, $config.SMTP_LIST[i].auth) do |smtp|
                        $syslog.add "Sending result:"+smtp.send_message(part, $config.MAIL_FROM, mailto).to_yaml.delete("\n")
                    end
                    break
                rescue Exception => e  
                    $syslog.add "Exception occured in sending email: #{e} "
                end
            end
        end



    end
end





