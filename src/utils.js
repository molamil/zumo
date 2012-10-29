

    // *** UTILS - OBJECT

    var Utils = {

        // --- METHODS

        delegate: function(f, context) {
            var args = [].slice.call(arguments, 2);
            return function () {
                return f.apply(context, (arguments.length == 0) ? args : arguments);
            };
        },

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
        },

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

                for (i = 1; i < arguments.length; i++) {
                    for (prop in arguments[i]) {
                        if (arguments[i].hasOwnProperty(prop))
                            child[prop] = arguments[i][prop];
                    }
                }

            }

        },

        mergeDeep: function(o1, o2) {

            var i,
                prop;

            if (o1 && typeof o1 == "object" && o2 && typeof o2 == "object") {
                for (prop in o2) {
                    if (o2[prop] !== null && o2.hasOwnProperty(prop)) {
                        if (typeof o2[prop] == "object" && typeof o1[prop] == "object") {
                            if (o2[prop].hasOwnProperty("length") && o1[prop].hasOwnProperty("length") &&
                                typeof o1[prop].concat == "function") {
                                o1[prop] = o1[prop].concat(o2[prop]);
                            } else {
                                this.mergeDeep(o1[prop], o2[prop]);
                            }
                        } else {
                            o1[prop] = o2[prop];
                        }
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
                    return Utils.trim(o) == "";
                } else {
                    return false;
                }
            } else {
                return true;
            }
        },

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
