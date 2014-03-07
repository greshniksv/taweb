
class SmtpItem
	attr_reader :host,:port,:user,:pass,:auth

	def initialize(host, port, user, pass, auth)
		@host = host; @port = port; @user = user
		@pass = pass; @auth = auth
	end

	def info
		"#{@host}:#{@port}"
	end

	def to_s
		"#{@host}:#{@port}_#{@user}_#{@auth}"
	end
end


class Config_default
  
  attr_reader :PG_HOST,:PG_PORT,:PG_LOGIN,:PG_PASS,:PG_DB,
    :MS_HOST,:MS_PORT,:MS_DB,:MS_LOGIN,:MS_PASS,
    :MAIL_FROM, :MAIL_TO,:SMTP_LIST,:CYBORG_LOG_COUNT,:MAIN_LOG_COUNT,
    :API_KEY,:SYSTEM_LOCKER_TIMEOUT,:LOG_FILE, :CYBORG_CONFIG,
    :WEB_URL
  
  def initialize
    
    @API_KEY='123456'
    @SYSTEM_LOCKER_TIMEOUT='1200'
    @LOG_FILE='./engine.log'
    @CYBORG_CONFIG = './cyborgs.conf'
    @WEB_URL="localhost:4567"
    
    @PG_HOST='host.com'
    @PG_PORT=5432
    @PG_DB=''
    @PG_LOGIN=''
    @PG_PASS=''
    
    @MS_HOST='ms_host.com'
    @MS_PORT=1734
    @MS_DB='itdb'
    @MS_LOGIN=''
    @MS_PASS='itdb'
    
    @MAIL_FROM='MAIL_FROM'
    @MAIL_TO = {}
		@MAIL_TO[0]="greshnik-sv@yandex.ru"
		@MAIL_TO[1]="loh_p@ukr.net"
    
    @CYBORG_LOG_COUNT=100
    @MAIN_LOG_COUNT=100
    
    
    
    @SMTP_LIST = {}
 		@SMTP_LIST[0] = SmtpItem.new "mail.iteam.net.ua","25","office@lat.lg.ua","pass",:login
		@SMTP_LIST[1] = SmtpItem.new "smtp.gmail.com","587","login","pass",:login
    
  end
  
end