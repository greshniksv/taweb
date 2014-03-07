/**
 * Created with JetBrains RubyMine.
 * User: greshnik
 * Date: 11/12/13
 * Time: 3:50 PM
 * To change this template use File | Settings | File Templates.
 */


/**
 * @class Base64
 *
 * @description Base64.js
 *
 * @version v 2.6 2012/08/24 05:23:18
 *
 * @author dankogai Exp
 *
 * @see <a href="http://www.opensource.org/licenses/mit-license.php" > Licensed under the MIT license. </a>
 * @see <a href="http://en.wikipedia.org/wiki/Base64"> References </a>
 */

(function (global) {
    'use strict';
// if node.js, we use Buffer
    var buffer;
    if (typeof module !== 'undefined' && module.exports) {
        buffer = require('buffer').Buffer;
    }
// constants
    var b64chars
        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var b64tab = function (bin) {
        var t = {};
        for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
        return t;
    }(b64chars);
    var fromCharCode = String.fromCharCode;
// encoder stuff
    var cb_utob = function (c) {
        var cc = c.charCodeAt(0);
        return cc < 0x80 ? c
            : cc < 0x800 ? fromCharCode(0xc0 | (cc >>> 6))
            + fromCharCode(0x80 | (cc & 0x3f))
            : fromCharCode(0xe0 | ((cc >>> 12) & 0x0f))
            + fromCharCode(0x80 | ((cc >>> 6) & 0x3f))
            + fromCharCode(0x80 | ( cc & 0x3f));
    };
    var utob = function (u) {
        return u.replace(/[^\x00-\x7F]/g, cb_utob);
    };
    var cb_encode = function (ccc) {
        var padlen = [0, 2, 1][ccc.length % 3],
            ord = ccc.charCodeAt(0) << 16
                | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
                | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
            chars = [
                b64chars.charAt(ord >>> 18),
                b64chars.charAt((ord >>> 12) & 63),
                padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
                padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
            ];
        return chars.join('');
    };
    var btoa = global.btoa || function (b) {
        return b.replace(/[\s\S]{1,3}/g, cb_encode);
    };
    var _encode = buffer
            ? function (u) {
            return (new buffer(u)).toString('base64')
        }
            : function (u) {
            return btoa(utob(u))
        }
        ;
    var encode = function (u, urisafe) {
        return !urisafe
            ? _encode(u)
            : _encode(u).replace(/[+\/]/g, function (m0) {
            return m0 == '+' ? '-' : '_';
        });
    };
    var encodeURI = function (u) {
        return encode(u, true)
    };
// decoder stuff
    var re_btou = /[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}/g;
    var cb_btou = function (ccc) {
        return fromCharCode(
            ccc.length < 3 ? ((0x1f & ccc.charCodeAt(0)) << 6)
                | (0x3f & ccc.charCodeAt(1))
                : ((0x0f & ccc.charCodeAt(0)) << 12)
                | ((0x3f & ccc.charCodeAt(1)) << 6)
                | (0x3f & ccc.charCodeAt(2))
        );
    };
    var btou = function (b) {
        return b.replace(re_btou, cb_btou);
    };
    var cb_decode = function (cccc) {
        var len = cccc.length,
            padlen = len % 4,
            n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
                | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
                | (len > 2 ? b64tab[cccc.charAt(2)] << 6 : 0)
                | (len > 3 ? b64tab[cccc.charAt(3)] : 0),
            chars = [
                fromCharCode(n >>> 16),
                fromCharCode((n >>> 8) & 0xff),
                fromCharCode(n & 0xff)
            ];
        chars.length -= [0, 0, 2, 1][padlen];
        return chars.join('');
    };
    var atob = global.atob || function (a) {
        return a.replace(/[\s\S]{1,4}/g, cb_decode);
    };
    var _decode = buffer
            ? function (a) {
            return (new buffer(a, 'base64')).toString()
        }
            : function (a) {
            return btou(atob(a))
        }
        ;
    var decode = function (a) {
        return _decode(
            a.replace(/[-_]/g, function (m0) {
                return m0 == '-' ? '+' : '/'
            })
                .replace(/[^A-Za-z0-9\+\/]/g, '')
        );
    };
// export Base64
    global.Base64 = {
        atob: atob,
        btoa: btoa,
        fromBase64: decode,
        toBase64: encode,
        utob: utob,
        encode: encode,
        encodeURI: encodeURI,
        btou: btou,
        decode: decode
    };
// if ES5 is available, make Base64.extendString() available
    if (typeof Object.defineProperty === 'function') {
        var noEnum = function (v) {
            return {value: v, enumerable: false, writable: true, configurable: true};
        };
        global.Base64.extendString = function () {
            Object.defineProperty(
                String.prototype, 'fromBase64', noEnum(function () {
                    return decode(this)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64', noEnum(function (urisafe) {
                    return encode(this, urisafe)
                }));
        };
    }
// that's it!
})(this);


/**
 *
 * @description Base64.js
 *
 * @version v 2.6 2012/08/24 05:23:18
 *
 * @author dankogai Exp
 *
 * @see <a href="http://www.opensource.org/licenses/mit-license.php" > Licensed under the MIT license. </a>
 * @see <a href="http://en.wikipedia.org/wiki/Base64"> References </a>
 */

(function (global) {
    'use strict';
// if node.js, we use Buffer
    var buffer;
    if (typeof module !== 'undefined' && module.exports) {
        buffer = require('buffer').Buffer;
    }
// constants
    var b64chars
        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var b64tab = function (bin) {
        var t = {};
        for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
        return t;
    }(b64chars);
    var fromCharCode = String.fromCharCode;
// encoder stuff
    var cb_utob = function (c) {
        var cc = c.charCodeAt(0);
        return cc < 0x80 ? c
            : cc < 0x800 ? fromCharCode(0xc0 | (cc >>> 6))
            + fromCharCode(0x80 | (cc & 0x3f))
            : fromCharCode(0xe0 | ((cc >>> 12) & 0x0f))
            + fromCharCode(0x80 | ((cc >>> 6) & 0x3f))
            + fromCharCode(0x80 | ( cc & 0x3f));
    };
    var utob = function (u) {
        return u.replace(/[^\x00-\x7F]/g, cb_utob);
    };
    var cb_encode = function (ccc) {
        var padlen = [0, 2, 1][ccc.length % 3],
            ord = ccc.charCodeAt(0) << 16
                | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
                | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
            chars = [
                b64chars.charAt(ord >>> 18),
                b64chars.charAt((ord >>> 12) & 63),
                padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
                padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
            ];
        return chars.join('');
    };
    var btoa = global.btoa || function (b) {
        return b.replace(/[\s\S]{1,3}/g, cb_encode);
    };
    var _encode = buffer
            ? function (u) {
            return (new buffer(u)).toString('base64')
        }
            : function (u) {
            return btoa(utob(u))
        }
        ;
    var encode = function (u, urisafe) {
        return !urisafe
            ? _encode(u)
            : _encode(u).replace(/[+\/]/g, function (m0) {
            return m0 == '+' ? '-' : '_';
        });
    };
    var encodeURI = function (u) {
        return encode(u, true)
    };
// decoder stuff
    var re_btou = /[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}/g;
    var cb_btou = function (ccc) {
        return fromCharCode(
            ccc.length < 3 ? ((0x1f & ccc.charCodeAt(0)) << 6)
                | (0x3f & ccc.charCodeAt(1))
                : ((0x0f & ccc.charCodeAt(0)) << 12)
                | ((0x3f & ccc.charCodeAt(1)) << 6)
                | (0x3f & ccc.charCodeAt(2))
        );
    };
    var btou = function (b) {
        return b.replace(re_btou, cb_btou);
    };
    var cb_decode = function (cccc) {
        var len = cccc.length,
            padlen = len % 4,
            n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
                | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
                | (len > 2 ? b64tab[cccc.charAt(2)] << 6 : 0)
                | (len > 3 ? b64tab[cccc.charAt(3)] : 0),
            chars = [
                fromCharCode(n >>> 16),
                fromCharCode((n >>> 8) & 0xff),
                fromCharCode(n & 0xff)
            ];
        chars.length -= [0, 0, 2, 1][padlen];
        return chars.join('');
    };
    var atob = global.atob || function (a) {
        return a.replace(/[\s\S]{1,4}/g, cb_decode);
    };
    var _decode = buffer
            ? function (a) {
            return (new buffer(a, 'base64')).toString()
        }
            : function (a) {
            return btou(atob(a))
        }
        ;
    var decode = function (a) {
        return _decode(
            a.replace(/[-_]/g, function (m0) {
                return m0 == '-' ? '+' : '/'
            })
                .replace(/[^A-Za-z0-9\+\/]/g, '')
        );
    };
// export Base64
    global.Base64 = {
        atob: atob,
        btoa: btoa,
        fromBase64: decode,
        toBase64: encode,
        utob: utob,
        encode: encode,
        encodeURI: encodeURI,
        btou: btou,
        decode: decode
    };
// if ES5 is available, make Base64.extendString() available
    if (typeof Object.defineProperty === 'function') {
        var noEnum = function (v) {
            return {value: v, enumerable: false, writable: true, configurable: true};
        };
        global.Base64.extendString = function () {
            Object.defineProperty(
                String.prototype, 'fromBase64', noEnum(function () {
                    return decode(this)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64', noEnum(function (urisafe) {
                    return encode(this, urisafe)
                }));
        };
    }
// that's it!
})(this);


/**
 * Date Format 1.2.3
 *
 * @version 1.2.3
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 *
 * MIT license
 *
 * @class DateFormat class. Date converting to formating string date.
 *
 * @author <a href="http://stevenlevithan.com">(c) 2007-2009 Steven Levithan <stevenlevithan.com></a>
 * @author <a href="http://scott.trenda.net"> Scott Trenda <scott.trenda.net> </a>
 * @author <a href="http://cixar.com/~kris.kowal"> Kris Kowal <cixar.com/~kris.kowal/> </a>
 *
 * @example
 * var days = new Date(currentDayInt);
 * console.log( days.format("dd-mm-yyyy") );
 *
 * @constructor
 */

var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
        timezoneClip = /[^-+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len)
                val = "0" + val;
            return val;
        };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date))
            throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
            d = date[_ + "Date"](),
            D = date[_ + "Day"](),
            m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
            H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
            s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
            o = utc ? 0 : date.getTimezoneOffset(),
            flags = {
                d: d,
                dd: pad(d),
                ddd: dF.i18n.dayNames[D],
                dddd: dF.i18n.dayNames[D + 7],
                m: m + 1,
                mm: pad(m + 1),
                mmm: dF.i18n.monthNames[m],
                mmmm: dF.i18n.monthNames[m + 12],
                yy: String(y).slice(2),
                yyyy: y,
                h: H % 12 || 12,
                hh: pad(H % 12 || 12),
                H: H,
                HH: pad(H),
                M: M,
                MM: pad(M),
                s: s,
                ss: pad(s),
                l: pad(L, 3),
                L: pad(L > 99 ? Math.round(L / 10) : L),
                t: H < 12 ? "a" : "p",
                tt: H < 12 ? "am" : "pm",
                T: H < 12 ? "A" : "P",
                TT: H < 12 ? "AM" : "PM",
                Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
}();

// Some common format strings
dateFormat.masks = {
    "default": "ddd mmm dd yyyy HH:MM:ss",
    shortDate: "m/d/yy",
    mediumDate: "mmm d, yyyy",
    longDate: "mmmm d, yyyy",
    fullDate: "dddd, mmmm d, yyyy",
    shortTime: "h:MM TT",
    mediumTime: "h:MM:ss TT",
    longTime: "h:MM:ss TT Z",
    isoDate: "yyyy-mm-dd",
    isoTime: "HH:MM:ss",
    isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
    dayNames: [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ],
    monthNames: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ]
};

// For convenience...
Date.prototype.format = function (mask, utc) {
    return dateFormat(this, mask, utc);
};


/**
 * @class MD5
 *
 * @description A JavaScript implementation of the RSA Data Security, Inc.
 * @description MD5 Message Digest Algorithm, as defined in RFC 1321.
 * @description Convert a 32-bit number to a hex string with ls-byte first
 *
 * @version v 2.6 2012/08/24 05:23:18
 *
 * @author Copyright (C) Paul Johnston 1999 - 2000.
 *
 * @see <a href="http://pajhome.org.uk/site/legal.html" > See for details </a>
 *
 * @param {string} str
 * @returns {string} MD5 data
 *
 * @example calcMD5(data);
 */
function calcMD5(str) {
    x = str2blks_MD5(str);
    a = 1732584193;
    b = -271733879;
    c = -1732584194;
    d = 271733878;

    for (i = 0; i < x.length; i += 16) {
        olda = a;
        oldb = b;
        oldc = c;
        oldd = d;

        a = ff(a, b, c, d, x[i + 0], 7, -680876936);
        d = ff(d, a, b, c, x[i + 1], 12, -389564586);
        c = ff(c, d, a, b, x[i + 2], 17, 606105819);
        b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
        a = ff(a, b, c, d, x[i + 4], 7, -176418897);
        d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
        c = ff(c, d, a, b, x[i + 6], 17, -1473231341);
        b = ff(b, c, d, a, x[i + 7], 22, -45705983);
        a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
        d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
        c = ff(c, d, a, b, x[i + 10], 17, -42063);
        b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
        a = ff(a, b, c, d, x[i + 12], 7, 1804603682);
        d = ff(d, a, b, c, x[i + 13], 12, -40341101);
        c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
        b = ff(b, c, d, a, x[i + 15], 22, 1236535329);

        a = gg(a, b, c, d, x[i + 1], 5, -165796510);
        d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
        c = gg(c, d, a, b, x[i + 11], 14, 643717713);
        b = gg(b, c, d, a, x[i + 0], 20, -373897302);
        a = gg(a, b, c, d, x[i + 5], 5, -701558691);
        d = gg(d, a, b, c, x[i + 10], 9, 38016083);
        c = gg(c, d, a, b, x[i + 15], 14, -660478335);
        b = gg(b, c, d, a, x[i + 4], 20, -405537848);
        a = gg(a, b, c, d, x[i + 9], 5, 568446438);
        d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
        c = gg(c, d, a, b, x[i + 3], 14, -187363961);
        b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
        a = gg(a, b, c, d, x[i + 13], 5, -1444681467);
        d = gg(d, a, b, c, x[i + 2], 9, -51403784);
        c = gg(c, d, a, b, x[i + 7], 14, 1735328473);
        b = gg(b, c, d, a, x[i + 12], 20, -1926607734);

        a = hh(a, b, c, d, x[i + 5], 4, -378558);
        d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
        c = hh(c, d, a, b, x[i + 11], 16, 1839030562);
        b = hh(b, c, d, a, x[i + 14], 23, -35309556);
        a = hh(a, b, c, d, x[i + 1], 4, -1530992060);
        d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
        c = hh(c, d, a, b, x[i + 7], 16, -155497632);
        b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
        a = hh(a, b, c, d, x[i + 13], 4, 681279174);
        d = hh(d, a, b, c, x[i + 0], 11, -358537222);
        c = hh(c, d, a, b, x[i + 3], 16, -722521979);
        b = hh(b, c, d, a, x[i + 6], 23, 76029189);
        a = hh(a, b, c, d, x[i + 9], 4, -640364487);
        d = hh(d, a, b, c, x[i + 12], 11, -421815835);
        c = hh(c, d, a, b, x[i + 15], 16, 530742520);
        b = hh(b, c, d, a, x[i + 2], 23, -995338651);

        a = ii(a, b, c, d, x[i + 0], 6, -198630844);
        d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
        c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
        b = ii(b, c, d, a, x[i + 5], 21, -57434055);
        a = ii(a, b, c, d, x[i + 12], 6, 1700485571);
        d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
        c = ii(c, d, a, b, x[i + 10], 15, -1051523);
        b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
        a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
        d = ii(d, a, b, c, x[i + 15], 10, -30611744);
        c = ii(c, d, a, b, x[i + 6], 15, -1560198380);
        b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
        a = ii(a, b, c, d, x[i + 4], 6, -145523070);
        d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
        c = ii(c, d, a, b, x[i + 2], 15, 718787259);
        b = ii(b, c, d, a, x[i + 9], 21, -343485551);

        a = add(a, olda);
        b = add(b, oldb);
        c = add(c, oldc);
        d = add(d, oldd);
    }
    return rhex(a) + rhex(b) + rhex(c) + rhex(d);
}


var hex_chr = "0123456789abcdef";
function rhex(num) {
    str = "";
    for (j = 0; j <= 3; j++)
        str += hex_chr.charAt((num >> (j * 8 + 4)) & 0x0F) +
            hex_chr.charAt((num >> (j * 8)) & 0x0F);
    return str;
}

/**
 * Convert a string to a sequence of 16-word blocks, stored as an array.
 * Append padding bits and the length, as described in the MD5 standard.
 *
 * @function
 */
function str2blks_MD5(str) {
    nblk = ((str.length + 8) >> 6) + 1;
    blks = new Array(nblk * 16);
    for (i = 0; i < nblk * 16; i++)
        blks[i] = 0;
    for (i = 0; i < str.length; i++)
        blks[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
    blks[i >> 2] |= 0x80 << ((i % 4) * 8);
    blks[nblk * 16 - 2] = str.length * 8;
    return blks;
}

/**
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 *
 * @function
 */
function add(x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
}

/**
 * Bitwise rotate a 32-bit number to the left
 *
 * @function
 */
function rol(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
}

/**
 * These functions implement the basic operation for each round of the
 * algorithm.
 *
 * @function
 */
function cmn(q, a, b, x, s, t) {
    return add(rol(add(add(a, q), add(x, t)), s), b);
}
function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
}
function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | (~d)), a, b, x, s, t);
}




/**
 *
 * Visual Studio JavaScript Intellisense Helper for LINQ to JavaScript
 * Part of the LINQ to JavaScript (JSLINQ) v2.10 Project - http://jslinq.codeplex.com
 * Copyright (C) 2009 Chris Pietschmann (http://pietschsoft.com). All rights reserved.
 * This project is licensed under the Microsoft Reciprocal License (Ms-RL)
 * This license can be found here: http://jslinq.codeplex.com/license
 *
 * @class JSLINQ
 * @param {type} dataItems
 * @returns {JSLINQ}
 */

JSLINQ = function (dataItems) {
    /// <summary>The JSLINQ Object that provides LINQ query syntax to work with JavaScript Arrays.</summary>
    /// <param name="dataArray">The Array that this JSLINQ instance will work with.</param>
    /// <field name="items">The internal Array that contains the actual data items.</field>
};
JSLINQ.prototype = {
    ToArray: function () {
        /// <summary>Gets the underlieing Array object that holds the data.</summary>
        /// <returns type="Array"></returns>
    },
    Where: function (clause) {
        /// <summary>Filters a sequence of values based on a clause predicate.</summary>
        /// <param name="clause">The clause used to determine query matches.</param>
        /// <returns type="JSLINQ"></returns>
    },
    Select: function (clause) {
        /// <summary>Projects each element of a sequence into a new form.</summary>
        /// <param name="clause">The clause used to determine what values to select.</param>
        /// <returns type="JSLINQ"></returns>
    },
    OrderBy: function (clause) {
        /// <summary>Sorts the elements of a sequence in ascending order.</summary>
        /// <param name="clause">The clause used to determine how to order the data.</param>
        /// <returns type="JSLINQ"></returns>
    },
    OrderByDescending: function (clause) {
        /// <summary>Sorts the elements of a sequence in descending order.</summary>
        /// <param name="clause">The clause used to determine how to order the data.</param>
        /// <returns type="JSLINQ"></returns>
    },
    SelectMany: function (clause) {
        /// <summary>Projects each element of a sequence to a JSLINQ and flattens the resulting sequences into one sequence.</summary>
        /// <param name="clause">The clause used to determine what values to select.</param>
        /// <returns type="JSLINQ"></returns>
    },
    Count: function (clause) {
        /// <summary>Returns the number of elements in a sequence.</summary>
        /// <param name="clause">The clause used to determine what values to count.</param>
        /// <returns type="Number"></returns>
    },
    Distinct: function (clause) {
        /// <summary>Returns distinct elements from a sequence.</summary>
        /// <param name="clause">The clause used to determine what values to select.</param>
        /// <returns type="JSLINQ"></returns>
    },
    Any: function (clause) {
        /// <summary>Determines whether any element of a sequence exists or satisfies a condition.</summary>
        /// <param name="clause">The clause used to determine if a match exists.</param>
        /// <returns type="Boolean"></returns>
    },
    All: function (clause) {
        /// <summary>Determines whether all elements of a sequence satisfy a condition.</summary>
        /// <param name="clause">The clause used to determine if a match exists.</param>
        /// <returns type="Boolean">true if every element of the source sequence passes the test in the specified clause predicate, or if the sequence is empty; otherwise, false.</returns>
    },
    Reverse: function () {
        /// <summary>Inverts the order of the elements in a sequence.</summary>
        /// <returns type="JSLINQ"></returns>
    },
    First: function (clause) {
        /// <summary>Returns the first element of a sequence.</summary>
        /// <param name="clause">The clause used to determine which group of elements to return the first element from.</param>
        /// <returns type="Object"></returns>
    },
    Last: function (clause) {
        /// <summary>Returns the last element of a sequence.</summary>
        /// <param name="clause">The clause used to determine which group of elements to return the last element from.</param>
        /// <returns type="Object"></returns>
    },
    ElementAt: function (index) {
        /// <summary>Returns the element at a specified index in a sequence.</summary>
        /// <param name="index">The zero-based index of the element to retrieve.</param>
        /// <returns type="Object"></returns>
    },
    Concat: function (array) {
        /// <summary>Concatenates two sequences. (Is actually Idendical to the Array.concat method.)</summary>
        /// <param name="array">A JSLINQ or Array object that contains the elements to concatenate.</param>
        /// <returns type="JSLINQ"></returns>
    },
    Intersect: function (secondArray, clause) {
        /// <summary>Produces the set intersection of two sequences.</summary>
        /// <param name="secondArray">The second JSLINQ element sequence to perform the Intersect on.</param>
        /// <param name="clause"></param>
        /// <returns type="JSLINQ"></returns>
    },
    DefaultIfEmpty: function (defaultValue) {
        /// <summary>Returns the JSLINQ object, or a default value if the sequence is empty.</summary>
        /// <param name="defaultValue">The default value to return if the sequence is empty.</param>
    },
    ElementAtOrDefault: function (index, defaultValue) {
        /// <summary>Returns the element at a specified index in a sequence or a default value if the index is out of range.</summary>
        /// <param name="index">The zero-based index of the element to retrieve.</param>
        /// <param name="defaultValue">The default value to return if the index is out of range.</param>
        /// <returns type="">defaultValue if the index is outside the bounds of the source sequence; otherwise, the element at the specified position in the source sequense.</returns>
    },
    FirstOrDefault: function (defaultValue) {
        /// <summary>Returns the first element of a sequence, or a default value if no element is found.</summary>
        /// <param name="defaultValue">The default value to return if no element is found.</param>
    },
    LastOrDefault: function (defaultValue) {
        /// <summary>Returns the last element of a sequence, or a default value if no element is found.</summary>
        /// <param name="defaultValue">The default value to return if no element is found.</param>
    }
};


/**
 *
 * Part of the LINQ to JavaScript (JSLINQ) v2.10 Project - http://jslinq.codeplex.com
 * Copyright (C) 2009 Chris Pietschmann (http://pietschsoft.com). All rights reserved.
 * This project is licensed under the Microsoft Reciprocal License (Ms-RL)
 * This license can be found here: http://jslinq.codeplex.com/license
 *
 *
 * @returns {undefined}
 */
(function () {
    JSLINQ = window.JSLINQ = function (dataItems) {
        return new JSLINQ.fn.init(dataItems);
    };
    JSLINQ.fn = JSLINQ.prototype = {
        init: function (dataItems) {
            this.items = dataItems;
        },
        // The current version of JSLINQ being used
        jslinq: "2.10",
        ToArray: function () {
            return this.items;
        },
        Where: function (clause) {
            var item;
            var newArray = new Array();

            // The clause was passed in as a Method that return a Boolean
            for (var index = 0; index < this.items.length; index++) {
                if (clause(this.items[index], index)) {
                    newArray[newArray.length] = this.items[index];
                }
            }
            return new JSLINQ(newArray);
        },
        Select: function (clause) {
            var item;
            var newArray = new Array();

            // The clause was passed in as a Method that returns a Value
            for (var i = 0; i < this.items.length; i++) {
                if (clause(this.items[i])) {
                    newArray[newArray.length] = clause(this.items[i]);
                }
            }
            return new JSLINQ(newArray);
        },
        OrderBy: function (clause) {
            var tempArray = new Array();
            for (var i = 0; i < this.items.length; i++) {
                tempArray[tempArray.length] = this.items[i];
            }
            return new JSLINQ(
                tempArray.sort(function (a, b) {
                    var x = clause(a);
                    var y = clause(b);
                    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                })
            );
        },
        OrderByDescending: function (clause) {
            var tempArray = new Array();
            for (var i = 0; i < this.items.length; i++) {
                tempArray[tempArray.length] = this.items[i];
            }
            return new JSLINQ(
                tempArray.sort(function (a, b) {
                    var x = clause(b);
                    var y = clause(a);
                    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                })
            );
        },
        SelectMany: function (clause) {
            var r = new Array();
            for (var i = 0; i < this.items.length; i++) {
                r = r.concat(clause(this.items[i]));
            }
            return new JSLINQ(r);
        },
        Count: function (clause) {
            if (clause == null)
                return this.items.length;
            else
                return this.Where(clause).items.length;
        },
        Distinct: function (clause) {
            var item;
            var dict = new Object();
            var retVal = new Array();
            for (var i = 0; i < this.items.length; i++) {
                item = clause(this.items[i]);
                // TODO - This doens't correctly compare Objects. Need to fix this
                if (dict[item] == null) {
                    dict[item] = true;
                    retVal[retVal.length] = item;
                }
            }
            dict = null;
            return new JSLINQ(retVal);
        },
        Any: function (clause) {
            for (var index = 0; index < this.items.length; index++) {
                if (clause(this.items[index], index)) {
                    return true;
                }
            }
            return false;
        },
        All: function (clause) {
            for (var index = 0; index < this.items.length; index++) {
                if (!clause(this.items[index], index)) {
                    return false;
                }
            }
            return true;
        },
        Reverse: function () {
            var retVal = new Array();
            for (var index = this.items.length - 1; index > -1; index--)
                retVal[retVal.length] = this.items[index];
            return new JSLINQ(retVal);
        },
        First: function (clause) {
            if (clause != null) {
                return this.Where(clause).First();
            }
            else {
                // If no clause was specified, then return the First element in the Array
                if (this.items.length > 0)
                    return this.items[0];
                else
                    return null;
            }
        },
        Last: function (clause) {
            if (clause != null) {
                return this.Where(clause).Last();
            }
            else {
                // If no clause was specified, then return the First element in the Array
                if (this.items.length > 0)
                    return this.items[this.items.length - 1];
                else
                    return null;
            }
        },
        ElementAt: function (index) {
            return this.items[index];
        },
        Concat: function (array) {
            var arr = array.items || array;
            return new JSLINQ(this.items.concat(arr));
        },
        Intersect: function (secondArray, clause) {
            var clauseMethod;
            if (clause != undefined) {
                clauseMethod = clause;
            } else {
                clauseMethod = function (item, index, item2, index2) {
                    return item == item2;
                };
            }

            var sa = secondArray.items || secondArray;

            var result = new Array();
            for (var a = 0; a < this.items.length; a++) {
                for (var b = 0; b < sa.length; b++) {
                    if (clauseMethod(this.items[a], a, sa[b], b)) {
                        result[result.length] = this.items[a];
                    }
                }
            }
            return new JSLINQ(result);
        },
        DefaultIfEmpty: function (defaultValue) {
            if (this.items.length == 0) {
                return defaultValue;
            }
            return this;
        },
        ElementAtOrDefault: function (index, defaultValue) {
            if (index >= 0 && index < this.items.length) {
                return this.items[index];
            }
            return defaultValue;
        },
        FirstOrDefault: function (defaultValue) {
            return this.First() || defaultValue;
        },
        LastOrDefault: function (defaultValue) {
            return this.Last() || defaultValue;
        }
    };
    JSLINQ.fn.init.prototype = JSLINQ.fn;
})();


String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, "");
};



//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

(function() {
    var _global = this;

    // Unique ID creation requires a high quality random # generator.  We feature
    // detect to determine the best RNG source, normalizing to a function that
    // returns 128-bits of randomness, since that's what's usually required
    var _rng;

    // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
    //
    // Moderately fast, high quality
    if (typeof(_global.require) == 'function') {
        try {
            var _rb = _global.require('crypto').randomBytes;
            _rng = _rb && function() {return _rb(16);};
        } catch(e) {}
    }

    if (!_rng && _global.crypto && crypto.getRandomValues) {
        // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
        //
        // Moderately fast, high quality
        var _rnds8 = new Uint8Array(16);
        _rng = function whatwgRNG() {
            crypto.getRandomValues(_rnds8);
            return _rnds8;
        };
    }

    if (!_rng) {
        // Math.random()-based (RNG)
        //
        // If all else fails, use Math.random().  It's fast, but is of unspecified
        // quality.
        var  _rnds = new Array(16);
        _rng = function() {
            for (var i = 0, r; i < 16; i++) {
                if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
                _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
            }

            return _rnds;
        };
    }

    // Buffer class to use
    var BufferClass = typeof(_global.Buffer) == 'function' ? _global.Buffer : Array;

    // Maps for number <-> hex string conversion
    var _byteToHex = [];
    var _hexToByte = {};
    for (var i = 0; i < 256; i++) {
        _byteToHex[i] = (i + 0x100).toString(16).substr(1);
        _hexToByte[_byteToHex[i]] = i;
    }

    // **`parse()` - Parse a UUID into it's component bytes**
    function parse(s, buf, offset) {
        var i = (buf && offset) || 0, ii = 0;

        buf = buf || [];
        s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
            if (ii < 16) { // Don't overflow!
                buf[i + ii++] = _hexToByte[oct];
            }
        });

        // Zero out remaining bytes if string was short
        while (ii < 16) {
            buf[i + ii++] = 0;
        }

        return buf;
    }

    // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
    function unparse(buf, offset) {
        var i = offset || 0, bth = _byteToHex;
        return  bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
    }

    // **`v1()` - Generate time-based UUID**
    //
    // Inspired by https://github.com/LiosK/UUID.js
    // and http://docs.python.org/library/uuid.html

    // random #'s we need to init node and clockseq
    var _seedBytes = _rng();

    // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
    var _nodeId = [
        _seedBytes[0] | 0x01,
        _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
    ];

    // Per 4.2.2, randomize (14 bit) clockseq
    var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

    // Previous uuid creation time
    var _lastMSecs = 0, _lastNSecs = 0;

    // See https://github.com/broofa/node-uuid for API details
    function v1(options, buf, offset) {
        var i = buf && offset || 0;
        var b = buf || [];

        options = options || {};

        var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

        // UUID timestamps are 100 nano-second units since the Gregorian epoch,
        // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
        // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
        // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
        var msecs = options.msecs != null ? options.msecs : new Date().getTime();

        // Per 4.2.1.2, use count of uuid's generated during the current clock
        // cycle to simulate higher resolution clock
        var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

        // Time since last uuid creation (in msecs)
        var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

        // Per 4.2.1.2, Bump clockseq on clock regression
        if (dt < 0 && options.clockseq == null) {
            clockseq = clockseq + 1 & 0x3fff;
        }

        // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
        // time interval
        if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
            nsecs = 0;
        }

        // Per 4.2.1.2 Throw error if too many uuids are requested
        if (nsecs >= 10000) {
            throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
        }

        _lastMSecs = msecs;
        _lastNSecs = nsecs;
        _clockseq = clockseq;

        // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
        msecs += 12219292800000;

        // `time_low`
        var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
        b[i++] = tl >>> 24 & 0xff;
        b[i++] = tl >>> 16 & 0xff;
        b[i++] = tl >>> 8 & 0xff;
        b[i++] = tl & 0xff;

        // `time_mid`
        var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
        b[i++] = tmh >>> 8 & 0xff;
        b[i++] = tmh & 0xff;

        // `time_high_and_version`
        b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
        b[i++] = tmh >>> 16 & 0xff;

        // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
        b[i++] = clockseq >>> 8 | 0x80;

        // `clock_seq_low`
        b[i++] = clockseq & 0xff;

        // `node`
        var node = options.node || _nodeId;
        for (var n = 0; n < 6; n++) {
            b[i + n] = node[n];
        }

        return buf ? buf : unparse(b);
    }

    // **`v4()` - Generate random UUID**

    // See https://github.com/broofa/node-uuid for API details
    function v4(options, buf, offset) {
        // Deprecated - 'format' argument, as supported in v1.2
        var i = buf && offset || 0;

        if (typeof(options) == 'string') {
            buf = options == 'binary' ? new BufferClass(16) : null;
            options = null;
        }
        options = options || {};

        var rnds = options.random || (options.rng || _rng)();

        // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
        rnds[6] = (rnds[6] & 0x0f) | 0x40;
        rnds[8] = (rnds[8] & 0x3f) | 0x80;

        // Copy bytes to buffer, if provided
        if (buf) {
            for (var ii = 0; ii < 16; ii++) {
                buf[i + ii] = rnds[ii];
            }
        }

        return buf || unparse(rnds);
    }

    // Export public API
    var uuid = v4;
    uuid.v1 = v1;
    uuid.v4 = v4;
    uuid.parse = parse;
    uuid.unparse = unparse;
    uuid.BufferClass = BufferClass;

    if (typeof define === 'function' && define.amd) {
        // Publish as AMD module
        define(function() {return uuid;});
    } else if (typeof(module) != 'undefined' && module.exports) {
        // Publish as node.js module
        module.exports = uuid;
    } else {
        // Publish as global (in browsers)
        var _previousRoot = _global.uuid;

        // **`noConflict()` - (browser only) to reset global 'uuid' var**
        uuid.noConflict = function() {
            _global.uuid = _previousRoot;
            return uuid;
        };

        _global.uuid = uuid;
    }
}).call(this);


