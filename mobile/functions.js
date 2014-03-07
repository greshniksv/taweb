/**
 * Created with JetBrains RubyMine.
 * User: greshnik sv
 * Date: 11/12/13
 * Time: 3:45 PM
 * To change this template use File | Settings | File Templates.
 */


Ajax =
{
    json: function (url, data, error) {
        if (error != null) {
            $.getJSON(url, data).fail(error);
        }
        else {
            $.getJSON(url, data).fail(function () {
                alert("AJAX GET ERROR!\n URL:" + url);
            });
        }
    },
    get: function (_url, returnF) {
        $.ajax({
            url: _url,
            dataType: "text",
            contentType: "text/plain; charset=utf-8",
            success: function (data) {
                //alert(data);
                returnF(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                returnF(null);
                Loging.Add("Ajax Error: Info(" + errorThrown + ") Text(" + textStatus + ")  ");
                alert("Error ajax: " + errorThrown + " text:" + textStatus);
            }});
    }
}

//#################################################################################################
//#################################################################################################
//#################################################################################################
//#################################################################################################
//                                !!! JAVASCRIPT CONFIG !!!

/**
 * @description ( 0 - 9 ); 9 = + popup alerts :) Don't set 9 ))) it's bad idea.
 * @constant
 * @type Number
 */
var DEBUG_LEVEL = 9;


/**
 *
 * Log managment class
 *
 * @class Logging class
 *
 * @author <a href="mailto:greshnik-sv@ya.ru">Ratkin Sergey</a>
 * @example
 * Loging.Add("Send log");
 */
Loging =
{

    /**
     * Addind information message
     *
     * @function
     *
     * @param {string} info information message
     * @returns {void}
     */
    Add: function (info, debugLevel) {
        debugLevel = typeof debugLevel !== 'undefined' ? debugLevel : 1;

        if (DEBUG_LEVEL < debugLevel) return;

        var MAX_LOG = 500;
        var NORM_LOG = 400;
        var fullDate = new Date()
        FullDate = fullDate.format("yyyy.mm.dd HH:MM:ss.l");

        if (info.length > 200) info = info.substr(0, 200);

        data = STOR.Get("loging", " ");

        var log_list = data.split(';');
        if (log_list.length > MAX_LOG) {
            var to_log = "";
            var cc = 0;
            for (var i = log_list.length - NORM_LOG; i < log_list.length; i++) {
                to_log += log_list[i] + ";";
                cc++;
            }
            data = to_log;
            //alert(cc+" - "+log_list.length);
            //alert(data);
        }

        if (DEBUG_LEVEL > 0) {
            console.log("[" + FullDate + "]> " + info + ";\n");
        }
        STOR.Set("loging", data + "" + FullDate + ">" + info + ";");

    },

    /**
     * Get log list
     *
     * @function
     *
     * @param {EventFunction} returnF Function parameter "returnF(data)"
     * @returns {void}
     */
    Get: function () {
        return STOR.Get("loging", "");
    },

    /**
     * Clear log list
     *
     * @function
     *
     * @returns {void}
     */
    Clear: function () {
        STOR.Set("loging", "");
    }
}


/**
 *
 * @description Storage managment class
 *
 * @class Storage class
 *
 * @author <a href="mailto:greshnik-sv@ya.ru">Ratkin Sergey</a>
 * @example
 * STOR.Set("loging", to_rest);
 */
var STOR =
{
    /** @constant  */
    Prefix: "admc",
    /** @constant  */
    MaxSize: 65536 * 2,
    /**
     *
     * @description Testing storage system.
     *
     * @function
     * @returns {Number} Return: 0 - not support any metod; 1 - support html5_localStorage; 2 - support WebSql;
     */
    Test: function () {
        /*try
         {
         if (window.openDatabase)
         {
         return 2;
         }
         }
         catch(e)
         { }*/

        try {
            if ('localStorage' in window && window['localStorage'] !== null) {
                return 1;
            }
        }
        catch (e) {
            return 0;
        }

        return 0;
    },
    List: function () {
        var storage_item_list = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            var value = localStorage[key];
            storage_item_list.push(key);
        }
        return storage_item_list;
    },


    /**
     * @description Set data to storage block
     *
     * @function
     *
     * @param {string} name Name of storage block
     * @param {string} value Data contained storage block. If value="" storage block will be removed.
     * @returns {void}
     */
    Set: function (name, value) {
        var METOD = STOR.Test();
        var TABLE = "Data_" + STOR.Prefix;

        if (METOD == 0) {
            alert("Browser not support");
        }

        if (METOD == 1) {
            if (value == "") {
                localStorage.removeItem(name);
            }
            else {
                localStorage[name] = value;
            }
        }

        if (METOD == 2) {
            var shortName = 'mydb';
            var version = '1.0';
            var displayName = 'My Important Database';
            var maxSize = STOR.MaxSize; // in bytes
            var db = openDatabase(shortName, version, displayName, maxSize);

            db.transaction(function (tx) {
                tx.executeSql("SELECT COUNT(*) FROM " + TABLE + "", [], function (result) {
                }, function (tx, error) {
                    tx.executeSql("CREATE TABLE " + TABLE + " (name TEXT,value TEXT)", [], null, null);
                })
            });


            db.transaction(function (tx) {

                tx.executeSql("SELECT * FROM " + TABLE + " where name = ? ", [name], function (tx, results) {
                    if (results.rows.length > 0) {
                        if (results.rows.item(0).value == value)
                            return;
                        //alert("update");
                        tx.executeSql("update " + TABLE + " set value=? where name=? ", [value, name]);
                    }
                    else {
                        //alert("Insert");
                        tx.executeSql("insert into " + TABLE + " (name,value) values (?,?)", [name, value]);
                    }

                });

            });

        }

    },
    /**
     * Get data from stotage block.
     *
     * @function
     *
     * @param {string} name Name of storage block.
     * @param {string} defValue Default value if storage block empty.
     * @param {EventFunction} resultF Execute event: "resultF(data);"
     * @returns {void}
     */
    Get: function (name, defValue) {

        var METOD = STOR.Test();
        var TABLE = "Data_" + STOR.Prefix;

        if (METOD == 0) {
            alert("Browser not support");
        }

        if (METOD == 1) {
            if (localStorage[name] == null) {
                if (defValue.length < 1) {
                    //resultF(defValue);
                    return localStorage[name];
                }
                else {
                    localStorage[name] = defValue;
                }
            }
            if (localStorage[name] == 'undefined') localStorage[name] = defValue;
            //resultF(localStorage[name]);
            return localStorage[name];
        }

        if (METOD == 2) {
            var exist_table = false;
            var exist_name = false;
            var shortName = 'mydb';
            var version = '1.0';
            var displayName = 'My Important Database';
            var maxSize = STOR.MaxSize; // in bytes
            var db = openDatabase(shortName, version, displayName, maxSize);

            db.transaction(function (tx) {
                tx.executeSql("SELECT COUNT(*) FROM " + TABLE + "", [], function (result) {
                }, function (tx, error) {
                    tx.executeSql("CREATE TABLE " + TABLE + " (name TEXT,value TEXT)", [], null, null);
                })
            });

            db.transaction(function (tx) {

                tx.executeSql("SELECT * FROM " + TABLE + " where name = ? ", [name], function (tx, results) {
                    //alert(results.rows.length);
                    if (results.rows.length > 0) {
                        resultF(results.rows.item(0).value);
                    }
                    else {
                        //alert("GET: Insert");
                        tx.executeSql('insert into "+TABLE+" (name,value) values (?,?)', [name, defValue]);
                        resultF(defValue);
                    }
                });
            });

        }

    }

}


/**
 *
 * Class contained frequently used function
 *
 * @class frequently used function class
 *
 * @author <a href="mailto:greshnik-sv@ya.ru">Ratkin Sergey</a>
 */
var M =
{
    /**
     *
     * Input commands spliter and verificator
     *
     * @function
     * @param {type} inputCommands Not separated command list
     * @param {type} cmd Command for find
     * @returns {Boolean} If command found return true.
     */

//    inc: function (inputCommands,cmd)
//    {
//        var commandList = inputCommands.split("|");
//        if($.isArray(commandList))
//        {
//            for(var i=0;i<commandList.length;i++)
//            {
//                if(cmd==commandList[i]) return true;
//            }
//        }
//        else
//        {
//            alert("no command list");
//        }
//
//        return false;
//    },

    createUUID: function () {
        // http://www.ietf.org/rfc/rfc4122.txt
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";

        var uuid = s.join("");
        return uuid;
    },
    isInt: function (value) {
        if ((undefined === value) || (null === value)) {
            return false;
        }
        if (typeof value == 'number') {
            return true;
        }
        return !isNaN(value - 0);
    },
    parseJSON: function (json) {
        try {
            return JSON.parse(json);
        }
        catch (err) {
            console.log("Error parse json. Err:" + err);
            return null;
        }
    },
    /**
     * Trim string
     *
     * @function
     * @param {string} str
     * @returns {string}
     */
    trim: function (str) {
        str = str.replace(/^\s+/, '');
        for (var i = str.length - 1; i >= 0; i--) {
            if (/\S/.test(str.charAt(i))) {
                str = str.substring(0, i + 1);
                break;
            }
        }
        return str;
    },
    /**
     * Get size of object
     *
     * @function
     * @param {object} object
     * @returns {Number}
     */
    roughSizeOfObject: function (object) {

        var objectList = [];
        var stack = [object];
        var bytes = 0;

        while (stack.length) {
            var value = stack.pop();

            if (typeof value === 'boolean') {
                bytes += 4;
            }
            else if (typeof value === 'string') {
                bytes += value.length * 2;
            }
            else if (typeof value === 'number') {
                bytes += 8;
            }
            else if
              (
              typeof value === 'object'
                && objectList.indexOf(value) === -1
              ) {
                objectList.push(value);

                for (i in value) {
                    stack.push(value[ i ]);
                }
            }
        }
        return bytes;
    },
    /**
     * Remove char from char array or string.
     *
     * @function
     * @param {string} str
     * @param {string} del_byte
     * @returns {String}
     */
    DelByte: function (str, del_byte) {
        var ret = "";
        for (var i = 0; i < str.length; i++) {
            if (str[i] != del_byte)
                ret += str[i];
        }
        return ret;
    }

}

function sleep(ms) {
    var unixtime_ms = new Date().getTime();
    while (new Date().getTime() < unixtime_ms + ms) {
    }
}

function InArray(array, item) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] != null && array[i] == item)
            return true;
    }
    return false;
}


/**
 *
 * Class contained frequently used function
 *
 * @class frequently used function class
 *
 * @author <a href="mailto:greshnik-sv@ya.ru">Ratkin Sergey</a>
 */
var regFn =
{
    /**
     *
     * Input commands spliter and verificator
     *
     * @function
     * @param {type} inputCommands Not separated command list
     * @param {type} cmd Command for find
     * @returns {Boolean} If command found return true.
     */

//    inc: function (inputCommands,cmd)
//    {
//        var commandList = inputCommands.split("|");
//        if($.isArray(commandList))
//        {
//            for(var i=0;i<commandList.length;i++)
//            {
//                if(cmd==commandList[i]) return true;
//            }
//        }
//        else
//        {
//            alert("no command list");
//        }
//
//        return false;
//    },

    createUUID: function () {
        // http://www.ietf.org/rfc/rfc4122.txt
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";

        var uuid = s.join("");
        return uuid;
    },

    isInt: function (value) {
        if ((undefined === value) || (null === value)) {
            return false;
        }
        if (typeof value == 'number') {
            return true;
        }
        return !isNaN(value - 0);
    },

    parseJSON: function (json) {
        try {
            return JSON.parse(json);
        }
        catch (err) {
            console.log("Error parse json. Err:" + err);
            return null;
        }
    },

    /**
     * Trim string
     *
     * @function
     * @param {string} str
     * @returns {string}
     */
    trim: function (str) {
        str = str.replace(/^\s+/, '');
        for (var i = str.length - 1; i >= 0; i--) {
            if (/\S/.test(str.charAt(i))) {
                str = str.substring(0, i + 1);
                break;
            }
        }
        return str;
    },

    /**
     * Get size of object
     *
     * @function
     * @param {object} object
     * @returns {Number}
     */
    roughSizeOfObject: function (object) {

        var objectList = [];
        var stack = [ object ];
        var bytes = 0;

        while (stack.length) {
            var value = stack.pop();

            if (typeof value === 'boolean') {
                bytes += 4;
            }
            else if (typeof value === 'string') {
                bytes += value.length * 2;
            }
            else if (typeof value === 'number') {
                bytes += 8;
            }
            else if
              (
              typeof value === 'object'
                && objectList.indexOf(value) === -1
              ) {
                objectList.push(value);

                for (i in value) {
                    stack.push(value[ i ]);
                }
            }
        }
        return bytes;
    },

    /**
     * Remove char from char array or string.
     *
     * @function
     * @param {string} str
     * @param {string} del_byte
     * @returns {String}
     */
    DelByte: function (str, del_byte) {
        var ret = "";
        for (var i = 0; i < str.length; i++) {
            if (str[i] != del_byte) ret += str[i];
        }
        return ret;
    }

}


/**
 *
 * Class form input command manager
 *
 * @class form input command manager
 *
 * @author <a href="mailto:greshnik-sv@ya.ru">Ratkin Sergey</a>
 *
 * @example Input data example: [ variable:value;helo:world;... ]
 *
 */
var fic =
{
    add: function (inputCommand, variable, value) {

//        try
//        {
        var returnData = "";
        if (fic.exist(inputCommand, variable) == false) {
            returnData = inputCommand + variable + ":" + value + ";";
        }
        else {
            var commandList = inputCommand.split(";");

            for (var i = 0; i < commandList.length; i++) {
                if (commandList[i].trim().length > 1) {
                    if (commandList[i].split(":").length < 2) {
                        Loging.Add("ERROR. Form input command incorrect format! DATA:[" + commandList[i] + "]");
                    }
                    else {
                        if (commandList[i].split(":")[0].trim() == variable) {
                            returnData += commandList[i].split(":")[0] + ":" + value + ";";
                        }
                        else {
                            returnData += commandList[i] + ";";
                        }
                    }
                }
            }
        }
//        }
//        catch(err)
//        {
//            Loging.Add("FIC.ADD ERROR adding data.");
//        }

        return returnData;
    },
    exist: function (inputCommand, variable) {
        //try
        //  {
        var commandList = inputCommand.split(";");

        for (var i = 0; i < commandList.length; i++) {
            if (commandList[i].trim().length > 1) {
                if (commandList[i].split(":").length < 2) {
                    Loging.Add("ERROR. Form input command incorrect format! DATA:[" + commandList[i] + "]");
                }
                else {
                    if (commandList[i].split(":")[0].trim() == variable) {
                        return true;
                    }
                }
            }
        }
//        }
//        catch(err)
//        {
//            Loging.Add("FIC.EXIST ERROR data.");
//        }
        return false;
    },
    getValue: function (inputCommand, variable, defaultValue) {
        // try
        // {
        defaultValue = typeof defaultValue !== 'undefined' ? defaultValue : null;

        var commandList = inputCommand.split(";");

        for (var i = 0; i < commandList.length; i++) {
            if (commandList[i].trim().length > 1) {
                if (commandList[i].indexOf(":") != -1 && commandList[i].split(":").length < 2) {
                    Loging.Add("ERROR. Form input command incorrect format! DATA:[" + commandList[i] + "]");
                }
                else {
                    if (commandList[i].split(":")[0].trim() == variable) {
                        return commandList[i].split(":")[1];
                    }
                }
            }
        }
//        }
//        catch(err)
//        {
//            Loging.Add("FIC.GETVALUE ERROR adding data.");
//        }
        return defaultValue;
    },
    getVariableList: function (inputCommand) {
        var variableList = new Array();
        var commandList = inputCommand.split(";");

        for (var i = 0; i < commandList.length; i++) {
            if (commandList[i].trim().length > 1) {
                if (commandList[i].split(":").length < 2) {
                    Loging.Add("ERROR. Form input command incorrect format! DATA:[" + commandList[i] + "]");
                }
                else {
                    variableList[variableList.length] = commandList[i].split(":")[0];
                }
            }
        }

        return variableList;
    }
}

var delayedRun=
{
    fun:null,
    timer:null,
    init: function(fn, time)
    {
        delayedRun.fun = fn;
        delayedRun.timer = setTimeout(function(){ delayedRun.run() }, time);
    },
    run: function()
    {
        clearTimeout(delayedRun.timer);
        delayedRun.fun();
    }
}

