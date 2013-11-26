/* ==== Empty Function ==== */
$.emptyFunc = function () { };

/* ==== Bind Function ==== */
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
            // closest thing possible to the ECMAScript 5 internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function () { },
            fBound = function () {
                return fToBind.apply(this instanceof fNOP && oThis
                                       ? this
                                       : oThis,
                                     aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}

/* ==== Array ForEach ==== */
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (fn, scope) {
        'use strict';
        var i, len;
        for (i = 0, len = this.length; i < len; ++i) {
            if (i in this) {
                fn.call(scope, this[i], i, this);
            }
        }
    };
}

/* ==== Array Insert ==== */
Array.insert = function (array, position, value) {
    array.splice(position, 0, value);
};

/* ==== String Format ==== */
String.format = function () {
    var s = arguments[0];
    for (var i = 0; i < arguments.length - 1; i++) {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        s = s.replace(reg, arguments[i + 1]);
    }

    return s;
};

/* ==== String EndsWith ==== */
String.prototype.endsWith = function (suffix) {
    return (this.substr(this.length - suffix.length) === suffix);
};

/* ==== String StartsWith ==== */
String.prototype.startsWith = function (prefix) {
    return (this.substr(0, prefix.length) === prefix);
};

/* ==== Array indexOf ==== */
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */) {
        'use strict';
        if (this == null) {
            throw new TypeError();
        }
        var n, k, t = Object(this),
            len = t.length >>> 0;

        if (len === 0) {
            return -1;
        }
        n = 0;
        if (arguments.length > 1) {
            n = Number(arguments[1]);
            if (n != n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n != 0 && n != Infinity && n != -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        for (k = n >= 0 ? n : Math.max(len - Math.abs(n), 0) ; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    };
}

Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            size++;
        }
    }
    return size;
};

Function.defer = function(time, func) {
    return window.setTimeout(func, time);
};

Function.buffer = function(delay, func) {
    var timer = -1;
    return function() {
        var context = this, args = arguments;
        window.clearTimeout(timer);
        
        timer = window.setTimeout(function () {
          func.apply(context, args);
        }, delay);
    };
};