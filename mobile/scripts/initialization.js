
/*####################################################################################*/
/*####################################################################################*/
/*####################################################################################*/
//                                  INITIALIZATION
    
    
    

/**
 * Initialization class 0.0.1
 * 
 * @version 0.0.1
 *
 * Class for download all data from server.
 *
 * @class Class for download all data from server.
 * 
 * @author <a href="mailto:greshnik-sv@ya.ru">Ratkin Sergey</a>
 *
 * @example
 * Initialization.Start();
 * 
 * @constructor
 */

var Initialization=
{
    
    /**
     * @description Starting initialization
     * 
     * @function
     * @returns {void}
     */
    Start: function () 
    {
        Initialization.LoadUsers();
    },
    
    /**
     * @description Loading user list and show.
     * 
     * @function
     * @returns {void}
     */
    LoadUsers: function () 
    {
        Ajax.GetJSON("server.php?act=users", function(json){ 
            if(json!=null)
            {
                Loging.Add("Download users: "+Math.round(JSON.stringify(json).length/1024)+"kb");
                //var out = JSON.stringify(json);
                
                var user_id="";
                STOR.Get("user_id", "", function(data)
                {
                    if(data.length>0){user_id = data;}
                });
                    
                var combo="<select  data-theme='a' id='choise_user'>";
                for(var i=0;i<json.users.items.length;i++)
                {
                    if(user_id == json.users.items[i]._id)
                    {
                        combo+="<option selected=\"selected\" value=\""+json.users.items[i]._id+"\">"+json.users.items[i]._name+"</option>";
                    }
                    else
                    {
                        combo+="<option value=\""+json.users.items[i]._id+"\">"+json.users.items[i]._name+"</option>";
                    }

                    
                }
                combo+="<select>";

               //"<table width='100%' border='1' align='center'>"+
               var choiseForm="<br/><br/><br/><table id='tblInit' width='300px' align='center'> "+
                   "<tr><td id='InitTdCaption' colspan='2' align='center' valign='center'> Выберите торгового </td></tr>"+
                   "<tr><td id='InitTdComboBox' colspan='2' align='center' valign='center'> "+combo+" </td></tr>"+
                   "<tr><td colspan='2' align='center' valign='center'> </br></br> </td></tr>"+
                   "<tr><td id='InitTdButtons' align='center' valign='center'> "+
                   "<a id='btnInitNext'  data-theme='a' onclick=\"Initialization.ChoiseUser()\" data-role=\"button\">Далее</a> </td><td> "+
                   "<a id='btnInitCancel' data-theme='a' onclick=\"CloseForegroundForm()\" data-role=\"button\">Отмена</a> "+
                   " </td></tr></table>";

                $("#upperform_background_div").css("display","block");
                $("#upperform_main_div").css("display","block");
                //$('#upperform_main_table tr').remove();
                $('#upperform_main_table').html(choiseForm);
                $("#upperform_main_div").trigger("create");

                $('#upperform_main_head').html("<b> Выбор пользователя <b>");
                
            }
            else
            {
                alert("Нет ответа от сервера !");
            }
        });
    },
    
    /**
     * @description Function for choise initialization user.
     * 
     * @function
     * @returns {void}
     */
    ChoiseUser: function ()
    {
        STOR.Set("user_id", $("#choise_user").val());
        STOR.Set("user_name", $("#choise_user option:selected").html());
        setTimeout('Initialization.LoadStores()', LoadingTimeout);
        
        $("#upperform_background_div").css("display","block");
        $("#upperform_main_div").css("display","block");
        $('#upperform_main_table').html("<div class='scroll' id='loading_log'>  </div> ");
        $('#upperform_main_head').html("<b> Синхронизация данных <b>");
        
        $("#loading_log").css("height",$("#upperform_main_div").height()-50).
            css("width",$("#upperform_main_div").width()-30);

        AddLoaginLog("Strat");
        
        AddLoaginLog("Установка торгового");
    },
    
    
    
    /**
     * @description Get stores from server
     * 
     * @function
     * @returns {void}
     */
    LoadStores: function ()
    {
        AddLoaginLog("Загрузка складов");
        
        STOR.Get("user_id", "", function(user_id)
        {
            Ajax.GetJSON("server.php?act=stores&prm="+user_id, function(json){ 
            if(json!=null)
            {
                Loging.Add("Download stores: "+Math.round(JSON.stringify(json).length/1024)+"kb");
                //var out = new XMLSerializer().serializeToString(xml);
                var out = JSON.stringify(json);
                STOR.Set("stores", out);
                setTimeout('Initialization.LoadProductRest()', LoadingTimeout);
            }
            else
            {
                alert("Нет ответа от сервера !");
            }
         });
            
        });
    },
    
    /**
     * @description Get product rest from server
     * 
     * @function
     * @returns {void}
     */
    LoadProductRest: function ()
    {
        AddLoaginLog("Загрузка остатков");

        STOR.Get("user_id", "", function(user_id)
        {
            Ajax.GetJSON("server.php?act=rests&prm="+user_id, function(json)
            { 
                if(json!=null)
                {
                    Loging.Add("Download rest: "+Math.round(JSON.stringify(json).length/1024)+"kb");
                    //var out = new XMLSerializer().serializeToString(xml);
                    var out = JSON.stringify(json);
                    STOR.Set("products_rest", out);
                    setTimeout('Initialization.LoadCustomers()', LoadingTimeout);
                }
                else
                {
                    alert("Нет ответа от сервера !");
                }
            });
            
        });
    },
    
    /**
     * @description Get customers from server
     * 
     * @function
     * @returns {void}
     */
    LoadCustomers: function ()
    {
        AddLoaginLog("Загрузка клиентов");

        STOR.Get("user_id", "", function(user_id)
        {
            Ajax.GetJSON("server.php?act=customers&prm="+user_id, function(json)
            { 
                if(json!=null)
                {
                    Loging.Add("Download customers: "+Math.round(JSON.stringify(json).length/1024)+"kb");
                    //var out = new XMLSerializer().serializeToString(xml);
                    var out = JSON.stringify(json);
                    STOR.Set("customers", out);
                    setTimeout('Initialization.LoadShops()', LoadingTimeout);
                }
                else
                {
                    alert("Нет ответа от сервера !");
                }
            });
            
        });
    },
    
    /**
     * @description Get shops from server
     * 
     * @function
     * @returns {void}
     */
    LoadShops: function ()
    {
        AddLoaginLog("Загрузка магазинов");

        STOR.Get("user_id", "", function(user_id)
        {
            Ajax.GetJSON("server.php?act=shops&prm="+user_id, function(json)
            { 
                if(json!=null)
                {
                    Loging.Add("Download shops: "+Math.round(JSON.stringify(json).length/1024)+"kb");
                    //var out = new XMLSerializer().serializeToString(xml);
                    var out = JSON.stringify(json);
                    STOR.Set("shops", out);
                    setTimeout('Initialization.LoadDiscount()', LoadingTimeout);
                }
                else
                {
                    alert("Нет ответа от сервера !");
                }
            });
            
        });
    },
    
    /**
     * @description Get discount from server
     * 
     * @function
     * @returns {void}
     */
    LoadDiscount: function ()
    {
        AddLoaginLog("Загрузка скидок");
        Ajax.GetJSON("server.php?act=discount", function(json)
        { 
            if(json!=null)
            {
                Loging.Add("Download discount: "+Math.round(JSON.stringify(json).length/1024)+"kb");
                //var out = new XMLSerializer().serializeToString(xml);
                var out = JSON.stringify(json);
                STOR.Set("discounts", out);
                setTimeout('Initialization.LoadOrders()', LoadingTimeout);
            }
            else
            {
                alert("Нет ответа от сервера !");
            }
        });
    },
    
    /**
     * @description Get orders from server
     * 
     * @function
     * @returns {void}
     */
    LoadOrders: function ()
    {
        AddLoaginLog("Загрузка накладных");

        STOR.Get("user_id", "", function(user_id)
        {
            Ajax.GetJSON("server.php?act=orders&prm="+user_id, function(json)
            { 
                if(json!=null)
                {
                    Loging.Add("Download orders: "+Math.round(JSON.stringify(json).length/1024)+"kb");
                    //var out = new XMLSerializer().serializeToString(xml);
                    var out = JSON.stringify(json);
                    STOR.Set("orders", out);
                    //setTimeout('LoadL3o()', LoadingTimeout);
                    setTimeout('Initialization.LoadConfig()', LoadingTimeout);
                }
                else
                {
                    alert("Нет ответа от сервера !");
                }
            });
            
        });
    },
    
    
//    
//    function LoadL3o()
//    {
//        AddLoaginLog("Загрузка последних 3х заказов");
//
//        STOR.Get("user_id", "", function(user_id)
//        {
//            Ajax.GetJSON("server.php?act=l3o&prm="+user_id, function(json)
//            { 
//                if(json!=null)
//                {
//                    Loging.Add("Download last orders: "+Math.round(JSON.stringify(json).length/1024)+"kb");
//                    //var out = new XMLSerializer().serializeToString(xml);
//                    var out = JSON.stringify(json);
//                    STOR.Set("lastOrder", out);
//                    setTimeout('LoadConfig()', LoadingTimeout);
//                }
//                else
//                {
//                    alert("Нет ответа от сервера !");
//                }
//            });
//            
//        });
//    }
    
    /**
     * @description Get configs from server
     * 
     * @function
     * @returns {void}
     */
    LoadConfig: function ()
    {
        AddLoaginLog("Загрузка настроек");

        STOR.Get("user_id", "", function(user_id)
        {
            Ajax.GetJSON("server.php?act=config&prm="+user_id, function(json)
            { 
                if(json!=null)
                {
                    Loging.Add("Download config: "+Math.round(JSON.stringify(json).length/1024)+"kb");
                    //var out = new XMLSerializer().serializeToString(xml);
                    var out = JSON.stringify(json);
                    STOR.Set("config", out);
                    
                    setTimeout('Drawing()', LoadingTimeout);
                    //setTimeout('ShowMenu()', LoadingTimeout);
                    CloseForegroundForm();
                }
                else
                {
                    alert("Нет ответа от сервера !");
                }
            });
            
        });
    }
}