//#######################################################################################
//#######################################################################################
//#######################################################################################
//#######################################################################################
//                                TAWEB_CLIENT

var taweb_client =
{
    Host: "",
    APIKey: "",
    Progress: "",
    Info: null,
    Client: "",
    ReturnF: null,

    // Инициализация классовых переменных
    Initialize: function (host, api_key, progress, info, returnF)
    {
        this.Host = host;
        this.APIKey = api_key;
        this.Progress = progress;
        this.Info = info;
        this.Client = STOR.Get("client_id", "none");
        this.ReturnF = returnF;

        if (this.Info == null)
        {
            this.Info = function (data)
            { /*do nothing*/
            }
        }
    },

    // Загрузка клиентов и отображение их выбора
    StartClientInitialize: function (returnF)
    {
        taweb_client.ReturnF = returnF;
        Ajax.json("http://" + taweb_client.Host + "/replicate/get_clients/" + taweb_client.client + "  "
         , function (client_list)
         {
             //returnF(table_content);

             var combo = "<select  data-theme='a' id='choice_client'>";
             for (var i = 0; i < client_list.length; i++)
             {
                 if (taweb_client.Client == client_list[i].id)
                 {
                     combo += "<option selected=\"selected\" value=\"" + client_list[i].id + "\">" + client_list[i].name + "</option>";
                 }
                 else {
                     combo += "<option value=\"" + client_list[i].id + "\">" + client_list[i].name + "</option>";
                 }
             }
             combo += "<select>";

             //"<table width='100%' border='1' align='center'>"+
             var choiseForm = "<br/><br/><br/><table id='tblInit' width='300px' align='center'> " +
              "<tr><td id='InitTdCaption' colspan='2' align='center' valign='center'> Choice TA </td></tr>" +
              "<tr><td id='InitTdComboBox' colspan='2' align='center' valign='center'> " + combo + " </td></tr>" +
              "<tr><td colspan='2' align='center' valign='center'> </br></br> </td></tr>" +
              "<tr><td id='InitTdButtons' align='center' valign='center'> " +
              "<a id='btnInitNext'  data-theme='a' onclick=\"taweb_client.ChoiceClient()\" data-role=\"button\">Далее</a> </td><td> " +
              "<a id='btnInitCancel' data-theme='a' onclick=\"CloseForegroundForm()\" data-role=\"button\">Отмена</a> " +
              " </td></tr></table>";

             $("#upperform_background_div").css("display", "block");
             $("#upperform_main_div").css("display", "block");
             //$('#upperform_main_table tr').remove();
             $('#upperform_main_table').html(choiseForm);
             $("#upperform_main_div").trigger("create");

             $('#upperform_main_head').html("<b> Выбор пользователя <b>");
         });
    },

    // Выбор клиента
    ChoiceClient: function ()
    {

        STOR.Set("client_id", $("#choice_client").val());
        STOR.Set("client_name", $("#choice_client option:selected").html());
        //setTimeout('Initialization.LoadStores()', LoadingTimeout);

        $("#upperform_background_div").css("display", "block");
        $("#upperform_main_div").css("display", "block");
        $('#upperform_main_table').html("<div class='scroll' id='loading_log'>  </div> ");
        $('#upperform_main_head').html("<b> Синхронизация данных <b>");

        $("#loading_log").css("height", $("#upperform_main_div").height() - 50).
         css("width", $("#upperform_main_div").width() - 30);

        AddLoaginLog("Strat");

        AddLoaginLog("Установка торгового");

        taweb_client.ClientInit(STOR.Get("client_id", "none"), taweb_client.ReturnF);

    },

    // Загрузка указанной таблицы
    DownloadTable: function (table_list)
    {
        if (table_list == null)
        {
            taweb_client.Info("Download table stopped. List is null !");
            return;
        }
        if (table_list.length <= 0)
        {
            taweb_client.Info("Download finished");
            CloseForegroundForm();
            taweb_client.ReturnF();
            return;
        }

        var table = table_list[0].item;
        //delete table_list[0];
        table_list.splice(0, 1);
        taweb_client.Info("Download table: " + table);
        //console.log("http://" + taweb.Host + "/replicate/get_table_" + table + "/" + taweb.client + "  ")

        Ajax.json("http://" + taweb_client.Host + "/replicate/get_table_" + table + "/" + taweb_client.Client + "  "
         , function (table_content)
         {
             STOR.Set(table + "_" + taweb_client.Client, JSON.stringify(table_content));
             taweb_client.DownloadTable(table_list);
         });
    },
    // очистка локал стореджа и запрос снапшота и загрузка таблиц
    ClientInit: function (client, returnF)
    {
        taweb_client.ReinitData();
        this.Client = client;

        if (returnF!=undefined){ taweb_client.ReturnF = returnF; }

        STOR.Set("client_id", client);

     taweb_client.Info("Get table list");
        Ajax.json("http://" + taweb_client.Host + "/" + taweb_client.APIKey + "/command/snapshot-init_" + taweb_client.Client,
         function (data)
         {

             if (data.status == "wait")
             {
                 taweb_client.Info("Server busy, try again later.");
                 //taweb_client.ClientInitTimer = setTimeout('taweb_client.ClientInit("' + client + '");', 5000);
                 delayedRun.init(function(){ taweb_client.ClientInit(client) },5000);
                 return;
             }
             else if (data.status == "run")
             {
                 taweb_client.Info("Init starting on server. Waiting.");
                 //taweb_client.ClientInitTimer = setTimeout('taweb_client.ClientInit("' + client + '");', 5000);
                 delayedRun.init(function(){ taweb_client.ClientInit(client) },5000);
                 return;
             }
             else if (data.status == "ok")
             {
                 /* continue */
                 Ajax.json("http://" + taweb_client.Host + "/replicate/get_tablelist/" + taweb_client.Client,
                  function (data)
                  {
                      taweb_client.DownloadTable(data);
                  });
             }
             else {
                 taweb_client.Info("Server response: " + data.status);
                 return;
             }
         });

    },

    // Генерация данных для реплицирования
    // - Начальные МД5
    // - Конечные МД5 (Начальные + новые данные)
    // - Новые данные
    // - Список ИД таблиц для дебага
    GenSyncData: function ()
    {
        var stor_list = STOR.List();
        var table_list = [];
        var json_str = "{"

        for (var i = 0; i < stor_list.length; i++)
        {
            if (stor_list[i].indexOf(taweb_client.Client) != -1)
            {
                table_list.push(stor_list[i].replace("_" + taweb_client.Client, ""));
            }
        }

        json_str += "\"initial_md5\":[";
        for (var i = 0; i < table_list.length; i++)
        {
            json_str += (i != 0 ? "," : "") + " {\"table\":\"" + table_list[i] + "\", \"md5\":\"" + taweb_client.GetMd5Table(table_list[i],
             0) + "\"}";
        }
        json_str += "],";

        json_str += "\"commit_md5\":[";
        for (var i = 0; i < table_list.length; i++)
        {
            table = table_list[i].replace("_" + taweb_client.Client, "");
            json_str += (i != 0 ? "," : "") + " {\"table\":\"" + table_list[i] + "\", \"md5\":\"" + taweb_client.GetMd5Table(table_list[i],
             2) + "\"}";
        }
        json_str += "],";

        json_str += "\"new_data\":[";
        var first_row = 0;
        for (var i = 0; i < table_list.length; i++)
        {
            var new_data = taweb_client.GetTableLinq(table_list[i]).Where(function (i)
            {
                return i.isnew == true
            });
            if (new_data.items.length > 0)
            {
                if (first_row != 0) json_str += ",";
                first_row = 1;
                json_str += "{ \"table\":\"" + table_list[i] + "\", \"data\": ";
                json_str += JSON.stringify(new_data.items);
                json_str += "}";
            }
        }
        json_str += "],";

        json_str += "\"uuid_list\":[";
        var first_row = 0;
        for (var i = 0; i < table_list.length; i++)
        {
            if (first_row != 0) json_str += ",";
            first_row = 1;
            json_str += "{ \"table\":\"" + table_list[i] + "\", \"uuid\": ";

            var table = taweb_client.GetTableLinq(table_list[i]).OrderBy(function(i){ return i.uuid });

            var uuid="";
            for(var j=0;j<table.items.length;j++)
            {
                uuid+=table.items[j].uuid + ";"
            }
            json_str += "\""+uuid+"\"";

            json_str += "}";
        }
        json_str += "]";



        json_str += "}"
        //console.log(json_str);
        return json_str;
    },
    // Отправка сислога
    SendLog: function (data, returnF)
    {
        if (typeof data == "undefined")
        {
            returnF();
            return;
        }
        if (data.split(';').length < 5)
        {
            returnF();
            return;
        }

        console.log("Send log");
        $.ajax({
            type: "POST",
            url: taweb_client.Host+"/replicate/syslog",
            data: {'data': data, 'client': this.Client},
            success: function (msg)
            {
                //alert("Form Submitted: " + msg);
                if (msg != "ok")
                {
                    alert("Error send log !");
                }
                else {
                    returnF();
                }
            }
        });
    },
    // Отправка данных для репоикации
    send_sync_data: function (returnF)
    {

        var sync_data = taweb_client.GenSyncData();
        taweb_client.ReturnF = returnF;

        $.ajax({
            type: "POST",
            url: taweb_client.Host+"/replicate/sync_data",
            data: {'data': sync_data, 'client': this.Client},
            success: function (msg)
            {
                //alert("Form Submitted: " + msg);
                if (msg == "fail")
                {
                    alert("Server responce:" + msg);
                    alert("Error send sync data !");
                    returnF();
                }
                else {
                    //get_sync_data();
                    //alert("S");
                    //taweb_client.try_get_sync_data_timer = setTimeout(taweb_client.try_get_sync_data(msg), 2000);
                    delayedRun.init(function(){ taweb_client.try_get_sync_data(msg) }, 100);
                }
            }
        });
    },
    // Загрузка ответа репликации от сервера
    try_get_sync_data: function (sync_id)
    {
        taweb_client.client = STOR.Get("client_id", "none");

        Ajax.json("http://" + taweb_client.Host + "/replicate/sync-try-data_" + sync_id + "/" + taweb_client.client + "  "
         , function (sync_try)
         {
            console.log("TRY ansver: "+sync_try.status);
             if (sync_try.status == "wait")
             {
                 delayedRun.init(function(){ taweb_client.try_get_sync_data(sync_id) }, 1000);
                 return;
             }
             else if (sync_try.status == "ok")
             {
                 taweb_client.CommitIsNew();

                 Ajax.json("http://" + taweb_client.Host + "/replicate/sync-client-data_" + sync_id + "/" + taweb_client.client + "  "
                  , function (sync_data)
                  {

                      console.log(JSON.stringify(sync_data));
                      //taweb_client.commit_sync_data(sync_data);

                      if (taweb_client.commit_sync_data(sync_data))
                      {
                          taweb_client.client = STOR.Get("client_id", "none");
                          md5_data = taweb_client.GenSyncData();

                          $.ajax({
                              type: "POST",
                              url: "/replicate/sync_data_finish",
                              data: {'data': md5_data, 'client': taweb_client.client, 'sync_id': sync_id },
                              success: function (msg)
                              {
                                  //alert("Form Submitted: " + msg);
                                  if (msg == "fail")
                                  {
                                      alert("Server responce:" + msg);
                                      alert("Error send sync data !");
                                      returnF();
                                  }
                                  else if (msg == "ok")
                                  {
                                      alert("Horosho !!!");
                                      taweb_client.ReturnF();
                                  }
                                  else {
                                      alert("FIN. :( Server responce:" + msg);
                                  }
                              }
                          });

                          /*Ajax.json("http://" + taweb_client.Host + "/replicate/sync-client-accept_" + sync_id + "_" + calcMD5(JSON.stringify(sync_data)) + "/" + taweb_client.client + "  "
                           , function (sync_data)
                           {
                           console.log(JSON.stringify(sync_data));
                           });*/
                      }
                      else {
                          Ajax.json("http://" + taweb_client.Host + "/replicate/sync-client-deny_" + sync_id + "_" + calcMD5(JSON.stringify(sync_data)) + "/" + taweb_client.client + "  "
                           , function (sync_data)
                           {

                               console.log(JSON.stringify(sync_data));
                               taweb_client.ReturnF();
                           });

                      }
                      //console.log(JSON.stringify(sync_data));

                  });

             }
             else {
                 alert("Unknown response: " + JSON.stringify(sync_try));
             }

         });
    },
    // Применение новых данным к текущим таблицам
    commit_sync_data: function (data)
    {
        taweb_client.ReinitData();
        taweb_client.Client = STOR.Get("client_id", "none");

        for (var i = 0; i < data.tables.length; i++)
        {
            for (var table_name in data.tables[i])
            {

                var uuid_list = []
                for (var item in data.tables[i][table_name].delete)
                {
                    for (var vv in data.tables[i][table_name].delete[item])
                    {
                        if (vv == 'uuid')
                        {
                            uuid_list.push(data.tables[i][table_name].delete[item][vv]);
                        }

                        //console.log(JSON.stringify());
                    }
                }
                //alert(uuid_list);
                if (!taweb_client.RemoveRow(table_name, uuid_list))
                { return false; }

                try {
                    var table_data = JSON.parse(STOR.Get(table_name.toLowerCase() + "_" + taweb_client.Client, ""));
                    for (var item in data.tables[i][table_name].insert)
                    {
                        var new_row = data.tables[i][table_name].insert[item];
                        new_row['isnew']="0"
                        //console.log("push new data: "+table_name);
                        //console.log(new_row);
                        table_data.push(new_row);
                    }
                    STOR.Set(table_name.toLowerCase() + "_" + taweb_client.Client, JSON.stringify(table_data));
                }
                catch (e)
                {
                    return false;
                }

            }

        }

        return true
    },
    // Обнуление массивов
    ReinitData: function()
    {
        /*Reinit data*/
        taweb_client.CompiledData.CustomerShopList=null;
        taweb_client.CompiledData.ProductRestList=null;
    },
    // #################################################################################################################
    // #################################################################################################################
    // #################################################################################################################
    // #################################################################################################################
    //                                              DATA

    // Запрос таблицы в JSON
    GetTableLinq: function (table_name)
    {
        var json;

        if (STOR.Get(table_name.toLowerCase() + "_" + taweb_client.Client, "") != null)
        {
            json = JSON.parse(STOR.Get(table_name.toLowerCase() + "_" + taweb_client.Client, ""));
        }
        else {
            console.log("not found table: " + table_name.toLowerCase() + "_" + taweb_client.Client);
            return null;
        }
        return JSLINQ(json)
    },

    // Удаление пометок о том что ров новый.
    CommitIsNew: function ()
    {
        taweb_client.Client = STOR.Get("client_id", "none");
        var store_list = STOR.List();

        for (var i = 0; i < store_list.length; i++)
        {
            if (store_list[i].indexOf("_" + taweb_client.Client) != -1)
            {
                var data = JSON.parse(STOR.Get(store_list[i], ""));
                if (JSLINQ(data).Count(function (i) { return i.isnew == true }) > 0)
                {

                    var sort_data = JSLINQ(data).OrderByDescending(function (i) { return i.isnew });

                    for (var j = 0; j < sort_data.items.length; j++)
                    {
                        if (sort_data.items[j].isnew == true)
                        {
                            sort_data.items[j].isnew = false;
                        }
                        else {
                            break;
                        }
                    }

                    STOR.Set(store_list[i], JSON.stringify(sort_data.items));
                }
            }
        }

    },

    RemoveRow: function (table_name, data)
    {
        try {
            taweb_client.Client = STOR.Get("client_id", "none");
            var table_real_name = table_name.toLowerCase() + "_" + taweb_client.Client;
            var data = taweb_client.GetTableLinq(table_name).Where(function (i) { return !InArray(data, i.uuid) });
            STOR.Set(table_real_name, JSON.stringify(data.items));
        }
        catch (e)
        {
            alert("ERROR remove list:" + e);
            return false;
        }

        return true;
    },
    AddRow: function (table_name, data)
    {

        /* If data[?] contain #. Must get max element +1 */
        var table = STOR.Get(table_name.toLowerCase() + "_" + taweb_client.Client, null);

        if (table != null)
        {
            table = JSON.parse(table);
            try {

                data["isnew"] = "0";
                data["repl_client_id"] = taweb_client.Client;
                data["uuid"] = uuid.v4();

                for (var property in data)
                {
                    if (data[property] == "#")
                    {
                        var ret = taweb_client.GetTableLinq(table_name).
                         OrderByDescending(function (i) { return i[property]}).First(function (i) { return true; });

                        if (ret != null)
                        {
                            data[property] = parseInt(ret[property]) + 1;
                        }
                        else {
                            alert("ERROR get max element for table:" + table_name + " element:" + property);
                        }
                    }

                    if (data[property] == "#uuid")
                    {
                        data[property] = uuid.v4();
                    }
                }

                //console.log("adding: "+JSON.stringify(data));
                table.push(data);
                STOR.Set(table_name.toLowerCase() + "_" + taweb_client.Client, JSON.stringify(table));
                return true;
            }
            catch (err)
            {
                alert(err);
                return false;
            }
        }
    },
    CompiledData: {
        CustomerShopList: null,
        ProductRestList:null
    },
    // Функции для форм
    GetFormData: {

        // Выбор накладных (Шапка)
        Orders: function (date_from, date_to, store_id)
        {
            order_list = taweb_client.GetTableLinq('tblorders').
             Where(function (item)
             {
                 return date_from <= new Date(Date.parse(item.odate)).getTime() && date_to >= new Date(Date.parse(item.odate)).getTime() && (item.ostoreid == store_id);
             }).
             OrderBy(function (item)
             {
                 return taweb_client.GetData.CustomerNameByShopId(item.oshopid);
             });

            //console.log(JSON.stringify(order_list));

            for (var i = 0; i < order_list.items.length; i++)
            {

                order_list.items[i].odate = order_list.items[i].odate.substring(5, 10).split("-")[1] + "-" +
                 order_list.items[i].odate.substring(5, 10).split("-")[0];

                order_list.items[i].ocreatedate = order_list.items[i].ocreatedate.substring(5,10).split("-")[1] + "-" +
                 order_list.items[i].ocreatedate.substring(5, 10).split("-")[0];

                order_list.items[i]['shop_name'] = taweb_client.GetData.ShopName(order_list.items[i].oshopid);
                order_list.items[i]['customer_name'] = taweb_client.GetData.CustomerNameByShopId(order_list.items[i].oshopid);
                order_list.items[i]['official_name'] = (order_list.items[i].oisofficial == "0" ? "Нет" : "Да");
            }

            //console.log(JSON.stringify(order_list));
            return order_list;
        },

        // Выбор накладных (Детали)
        OrderDetails: function (order_id)
        {

            var item_list = taweb_client.GetTableLinq('tblorderdetails').
             Where(function (item)
             {
                 return item.odorderid == order_id
             }).
             OrderBy(function (item)
             {
                 return taweb_client.GetData.ProductName(item.odproductid)
             });

            for (var i = 0; i < item_list.items.length; i++)
            {
                item_list.items[i]['product_name'] = taweb_client.GetData.ProductName(item_list.items[i].odproductid);
            }

            return item_list;
        },
        // Выбор продуктов с остатками
        ProductRest: function()
        {
            if(taweb_client.CompiledData.ProductRestList==null)
            {
                productRestList=[]

                var products = taweb_client.GetTableLinq("tblproducts");
                var reserves = taweb_client.GetTableLinq("tblreserves");

                for(var i=0;i<reserves.items.length;i++)
                {
                    for(var j=0;j<products.items.length;j++)
                    {
                        if(products.items[j].id ==reserves.items[i].rproductid )
                        {
                            productRestList.push({
                                id:reserves.items[i].rproductid,
                                rstoreid:reserves.items[i].rstoreid,
                                rproductavailcount:reserves.items[i].rproductavailcount,
                                pname:products.items[j].pname,
                                ppiecesinbox:products.items[j].ppiecesinbox
                            });
                            break;
                        }
                    }
                }

                taweb_client.CompiledData.ProductRestList = productRestList;
            }

            return JSLINQ(taweb_client.CompiledData.ProductRestList);
        }

    },
    GetData: {
        Config: function (variable)
        {
            return taweb_client.GetTableLinq("config").Where(function (item)
            {
                return item.variable == variable;
            }).items[0].value;
        },
        ShopName: function (shop_id)
        {
            if (taweb_client.CompiledData.CustomerShopList == null) taweb_client.GetData.GenCustomerNameByShopIdList();

            for (var i = 0; i < taweb_client.CompiledData.CustomerShopList.items.length; i++)
            {
                if (taweb_client.CompiledData.CustomerShopList.items[i].id == shop_id)
                {
                    return taweb_client.CompiledData.CustomerShopList.items[i].sname;
                }
            }
            return null;
        },
        CustomerName: function (customer_id)
        {
            return taweb_client.GetTableLinq("tblcustomers").Where(function (item)
            {
                return item.id == customer_id;
            }).items[0].cname;
        },
        GenCustomerNameByShopIdList: function ()
        {
            var data;
            var shops = taweb_client.GetTableLinq("tblshops");
            var customers = taweb_client.GetTableLinq("tblcustomers");

            for (var j = 0; j < shops.items.length; j++)
            {
                var cust_name = ""
                for (var i = 0; i < customers.items.length; i++)
                {
                    if (shops.items[j].scustomerid == customers.items[i].id)
                    {
                        cust_name = customers.items[i].cname;
                    }
                }

                shops.items[j]['customer_name'] = cust_name;
            }

            try {
                taweb_client.CompiledData.CustomerShopList = shops;
            }
            catch (err)
            {
                console.log("Error generate taweb_client.CompiledData.CustomerShopList. DATA:\n" + shops);
            }

        },
        CustomerNameByShopId: function (shop_id)
        {
            if (taweb_client.CompiledData.CustomerShopList == null) taweb_client.GetData.GenCustomerNameByShopIdList();

            for (var i = 0; i < taweb_client.CompiledData.CustomerShopList.items.length; i++)
            {
                if (taweb_client.CompiledData.CustomerShopList.items[i].id == shop_id)
                {
                    return taweb_client.CompiledData.CustomerShopList.items[i].customer_name;
                }
            }
            return null;
        },
        CustomerIdByShopId: function (shop_id)
        {
            if (taweb_client.CompiledData.CustomerShopList == null) taweb_client.GetData.GenCustomerNameByShopIdList();

            for (var i = 0; i < taweb_client.CompiledData.CustomerShopList.items.length; i++)
            {
                if (taweb_client.CompiledData.CustomerShopList.items[i].id == shop_id)
                {
                    return taweb_client.CompiledData.CustomerShopList.items[i].scustomerid;
                }
            }
            return null;
        },
        ProductName: function (product_id)
        {
            return taweb_client.GetTableLinq("tblproducts").Where(function (item)
            {
                return item.id == product_id;
            }).items[0].pname;
        },
        StoreName: function (store_id)
        {
            return taweb_client.GetTableLinq("tblstores").Where(function (item)
            {
                return item.id == store_id;
            }).items[0].sname;
        },
        PriceForCustomer: function (productid, customer_id, store_id)
        {
            //console.log(productid+"|"+customer_id+"|"+store_id);
            var price = new Array();
            var group = new Array();
            var priceNum;
            var custDiscount;

            var prodl = taweb_client.GetTableLinq("tblreserves").Where(function (item)
            {
                return item.rstoreid == store_id
            }).
             Where(function (item)
             {
                 return item.rproductid == productid;
             });

            if (prodl.items.count > 1)
            {
                alert("Too many result");
                /**/
            }

            if (prodl.items.length < 1)
            {
                alert("Not found product.S:"+store_id+" P:"+productid);
                /**/
            }

            //console.log( JSON.stringify(prodl) );

            price[0] = null;
            price[1] = prodl.items[0].rproductprice1;
            price[2] = prodl.items[0].rproductprice2;
            price[3] = prodl.items[0].rproductprice3;
            price[4] = prodl.items[0].rproductprice4;
            price[5] = prodl.items[0].rproductprice5;

            var prod = taweb_client.GetTableLinq("tblproducts").Where(function (item)
            {
                return item.id == productid
            });
            if (prod.items.count > 1)
            {
                alert("Too many result");
                /**/
            }

            if (prod.items.count < 1)
            {
                alert("No 2 result");
                /**/
            }

            //console.log( JSON.stringify(prod) );

            group[0] = null;
            group[1] = prod.items[0].pgroupid1;
            group[2] = prod.items[0].pgroupid2;
            group[3] = prod.items[0].pgroupid3;

            var cust = taweb_client.GetTableLinq("tblcustomers").Where(function (item)
            {
                return item.id == customer_id
            });
            if (cust.items.count > 1)
            {
                alert("Too many result");
                /**/
            }

            if (cust.items.count < 1)
            {
                alert("No 1 result");
                /**/
            }
            console.log( JSON.stringify(cust) );

            var customerDiscountGroupId = cust.items[0].cdiscountgroupid;
            console.log(customerDiscountGroupId);

            if (customerDiscountGroupId=='0') return price[1];

            var disg = taweb_client.GetTableLinq("tbldiscountgroupdetails").Where(function (item)
            {
                return item.dgddiscountgroupid == customerDiscountGroupId;
            })
             .Where(function (item)
             {
                 return InArray(group, item.dgdproductgroupid)
             });

            if (disg.items.count > 1)
            {
                alert("Too many result");
                /**/
            }

            if (disg.items.length < 1)
            {
                alert("No result :(");
                /**/
            }

            console.log( JSON.stringify(disg) );


            var priceForCustomer = price[disg.items[0].dgdpricenum] * (1 - disg.items[0].dgddiscount / 100);
            return parseFloat(priceForCustomer).toFixed(2);
        }
    },
    GetMd5Table: function (table_name, isnew)
    {
        var data = taweb_client.GetTableLinq(table_name).Where(function (item)
        {
            return (isnew == 2 ? true : (item.isnew == (isnew == 0 ? "0" : "1")));
        }).OrderBy(function (item)
         {
             return item.uuid
         });

        var id_list = "";
        for (var i = 0; i < data.items.length; i++)
        {
            if (id_list.length > 3)
            {
                id_list += "_";
            }
            id_list += data.items[i]['uuid'];
        }
        //console.log("DATA "+table_name+":["+id_list+"]");
        return calcMD5(id_list);
    }


}
