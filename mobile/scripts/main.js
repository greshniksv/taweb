/**
 * Main menu creator
 *
 * @function
 *
 * @param {type} counterToNewRow
 * @param {type} countIconOnRow
 * @returns {String}
 */
function MAIN_MENU_CREATOR(counterToNewRow, countIconOnRow) {

    var html = "";
    FORM.GetList(function (formList) {

        for (var i = 0; i < formList.length; i++) {

            if (formList[i].indexOf('*') != -1) {
                counterToNewRow++;
                //alert(formList[i]+"---");
                form_item = FORM.Get(formList[i]);

                //alert(form_item);

                var skip = false;
                var tr = "";

                if (counterToNewRow >= countIconOnRow) {
                    counterToNewRow = 0;
                    tr = "</tr><tr>";
                }

                if (formList[i].replace('*', '') == "Справочник клиентов") {
                    html += tr + "<td class='menu_item' onclick=\"ShowCustomersAndShop()\" > " +
                        " <table width='100%'><tr><td align='center'> <img src='" + form_item[0] + "' /> </td></tr>" +
                        "<tr><td align='center'> Справочник клиентов </td></tr></table> </td>";

                    skip = true;
                }

                if (!skip) {
                    html += tr + "<td class='menu_item' onclick=\"FORM.RunForm('" + formList[i].replace('*', '') + "','',Test)\" > " +
                        " <table width='100%'><tr><td align='center'> <img src='" + form_item[0] + "' /> </td></tr>" +
                        "<tr><td align='center'> " + formList[i].replace('*', '') + " </td></tr></table> </td>";
                }


            }


        }

    });
    return html;
}

/*
 *  MENU FUNCTION
 */

function ShowCustomersAndShop() {
    //RunForm('Справочник клиентов','select',function(data){ RunForm('Справочник магазинов',data);  });
    FORM.RunForm('Справочник клиентов', 'select|shop', null);
}


/**
 * Form manager 0.0.1
 *
 * @version 0.0.1
 *
 * @class form manager class.
 *
 * @author <a href="mailto:greshnik-sv@ya.ru">Ratkin Sergey</a>
 *
 * @example
 * FORM.Set(name, form_data);
 *
 * @constructor
 */

var FORM =
{
    /**
     * Get form by name from storage
     *
     * @function
     * @param {string} formName
     * @param {EventFunction} returnF Invoke: returnF(data.split('~')) DataFormat: name~image~content
     * @returns {void}
     */
    Get: function (formName, returnF) {
        var data = STOR.Get("form_" + $.trim(formName), " ");

        if (data == " ") {
            alert('ERROR FORM NOT FOUND! \n Name:[' + $.trim(formName)+"]");
        }
        //returnF();
        return data.split('~');
    },
    /**
     * Set form to storage
     *
     * @function
     * @param {type} formName
     * @param {type} Data
     * @returns {void}
     */
    Set: function (formName, Data) {
        STOR.Set("form_" + formName, Data);
        var data = STOR.Get("form_list", " ");

        var exist = false;
        var form_list = data.split('~');

        for (var j = 0; j < form_list.length; j++) {
            if (form_list[j] == formName) {
                exist = true;
                break;
            }
        }
        if (!exist) {
            STOR.Set("form_list", (data!=" "?data:"") + formName + "~");
        }

    },
    /**
     * Get form list
     *
     * @function
     * @param {EventFunction} returnF Invoke: returnF(data.split('~')); Notice: Main from contain '*'
     * @returns {void}
     */
    GetList: function (returnF) {
        returnF(STOR.Get("form_list", " ").split('~'));
    },
    Find: function (formName, returnF) {
        data = STOR.Get("form_list", "");
        var formList = data.split('~');

        for (var i = 0; i < formList.length; i++) {
            if (formList[i] == formName) {
                returnF(formName);
                return null;
            }

            if (formList[i] == formName + "*") {
                returnF(formName + "*");
                return null;
            }
        }
        returnF(null);

    },
    /**
     * Clear all from from storage
     *
     * @function
     * @param {EventFunction} returnF Processing events
     * @returns {void}
     */
    Clear: function (returnF) {
        data = STOR.Get("form_list", " ")
        var form_list = data.split('~');
        var exist = false;
        for (var i = 0; i < form_list.length; i++) {
            STOR.Set("form_" + form_list[i], "");
        }
        STOR.Set("form_list", "");
        //returnF();
    },
    /**
     * Run main form
     *
     * @function
     * @param {string} form Form name
     * @param {string} info Data send to form
     * @param {EventFunction} returnF Invoke: returnF(data);
     * @returns {void}
     */
//    RunMainForm: function (form,info,returnF)
//    {
//        CrossReturnFunction = function(data){ if(returnF!=null){ returnF(data); } }
//        CrossDataFunction = info;
//
//        FORM.Get(form+"*", function(data){  
//
//            //$("#upperform_main_head").html(form); 
//           $("#upperform_main_table").html("LOADING!!").trigger("create");
//            //$("#upperform_main_head").load(form); 
//            //$("#upperform_main_table").load(data[1]); 
//            //$('#upperform_main_table tr').remove();
//            //$("#upperform_background_div").css("display","block");
//            //$("#upperform_main_div").css("display","block");
//             $("#upperform_background_div").fadeIn(500, function() { $("#upperform_main_table").html(data[1]).trigger("create"); });
//             $("#upperform_main_div").fadeIn(500, function() {  });
//            
//        });
//
//    },
    /**
     * Run regular form
     *
     * @function
     * @param {string} form Form name
     * @param {string} info Data send to form
     * @param {EventFunction} returnF Invoke: returnF(data);
     * @returns {void}
     */
    RunForm: function (form, info, returnF) {
        CrossReturnFunction = function (data) {
            if (returnF != null) {
                returnF(data);
            }
        }
        CrossDataFunction = info;

        FORM.Find(form, function (formName) {

            data = FORM.Get(formName)
            //$("#upperform_main_head").value(form);
            $("#upperform_main_table").html("LOADING!!").trigger("create");
            //$("#upperform_main_head").load(form);
            //$("#upperform_main_table").load(data[1]);
            //$('#upperform_main_table tr').remove();
            //$("#upperform_background_div").css("display","block");
            //$("#upperform_main_div").css("display","block");
            $("#upperform_background_div").fadeIn(500, function () {
                $("#upperform_main_table").html(data[1]).trigger("create");
            });
            $("#upperform_main_div").fadeIn(500, function () {
            });
        });


    }

}

   