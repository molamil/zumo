

    // *** LOG - OBJECT

    var Log = {

        // --- PROPERTIES

        LEVELS: ["error", "warn", "info", "debug"],
        level: 1,
        prefix: _NAME ? _NAME.toUpperCase() + " - " : "", //TODO: Set prefix elsewhere.

        // --- METHODS

        debug: function(message) {
            if (typeof message == "string")
                message = this.prefix + message;
            this._log(message, 3);
        },

        info: function(message) {
            this._log(this.prefix + message, 2);
        },

        warn: function(message) {
            this._log(this.prefix + message, 1);
        },

        error: function(message) {
            this._log(this.prefix + message, 0);
        },

        // Default Firebug console logging implemented.
        _log: function(message, level) {

            var fLevel;

            // Check that Firebug is enabled.
            if (!window.console)
                return;

            // Set level as default if not passed.
            if (level == null)
                level = this.level;

            if (this.level >= level) {
                fLevel = window.console[this.LEVELS[level]];
                if (typeof fLevel == "function")
                    fLevel.call(window.console, message);
            }

        }

    };


    // *** DELEGATE - OBJECT

    var Delegate = {

        // --- METHODS

        create: function(f, context) {
            var args = [].slice.call(arguments, 2);
            return function () {
                return f.apply(context, (arguments.length == 0) ? args : arguments);
            }
        }

    };


    // *** STRING UTILS - OBJECT

    var StringUtils = {

        // --- METHODS

        trim: function(s) {
            s = s || "";
            return s.replace(/^\s+|\s+$/g, "");
        },

        ltrim: function(s) {
            s = s || "";
            return s.replace(/^\s+/, "");
        },

        rtrim: function(s) {
            s = s || "";
            return s.replace(/\s+$/, "");
        }

    };


    // *** OBJECT UTILS - OBJECT

    var ObjectUtils = {

        // --- METHODS

        mix: function() {

            var i,
                prop,
                child = {};

            for (i = 0; i < arguments.length; i++) {
                for (prop in arguments[i]) {
                    if (arguments[i].hasOwnProperty(prop))
                        child[prop] = arguments[i][prop];
                }
            }

            return child;

        },

        merge: function() {

            var i,
                prop,
                child = arguments[0];

            if (child && typeof child == "object") {

                for (i = 0; i < arguments.length; i++) {
                    for (prop in arguments[i]) {
                        if (arguments[i].hasOwnProperty(prop))
                            child[prop] = arguments[i][prop];
                    }
                }

            }

        },

        find: function(target, container) {
            var parts = target.split("."),
                o = container || window,
                i;
            for (i = 0; i < parts.length; i++) {
                o = o[parts[i]];
                if (!o)
                    break;
            }
            return o;
        },

        isEmpty: function(o) {
            var p;
            if (o) {
                if (typeof o == "object") {
                    for (p in o) {
                        if (o.hasOwnProperty(p))
                            return false;
                    }
                    return true;
                } else if (typeof o == "string") {
                    return StringUtils.trim(o) == "";
                } else {
                    return false;
                }
            } else {
                return true;
            }
        }

    };


    // *** DOM UTILS OBJECT

    var DomUtils = {

        getChildren: function(o, name) {
            var children = [],
                i,
                child;
            if (o && o.childNodes.length) {
                for (i = 0; i < o.childNodes.length; i++) {
                    child = o.childNodes[i];
                    if (child.nodeType == 1 && (!name || child.nodeName == name))
                        children.push(child);
                }
            }
            return children;
        }

    };
