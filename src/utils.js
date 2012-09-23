	// *** DELEGATE OBJECT

	var Delegate = {

		// --- METHODS

		create: function(f, context, args) {
			return function () {
				f.apply(context, args);
			}
		}

	};


	// *** STRING UTILS OBJECT

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


	// *** OBJECT UTILS OBJECT

	var ObjectUtils = {

		// --- METHODS

		extend: function(child, supertype) {
			child.prototype.__proto__ = supertype.prototype;
		},

		merge: function(target, origin) {

            var i,
                l = 1,
                p,
                o;

            if (!target || !origin)
                return;

            if (origin.length)
                l = origin.length;

            for (i = 0; i < l; i++) {
                o = (origin.length) ? origin[i] : origin;
                for (p in o)
                    target[p] = o[p];
            }

        },

		find: function(target, container) {
			var parts = target.split(".");
			var o = container || window;
			for (var i = 0; i < parts.length; i++) {
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
                    for (p in o)
                        return false;
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

	// *** SELECTOR OBJECT


    var DomUtils = {

        getChildren: function(o, name) {
            var children = [];
            if (o && o.childNodes.length) {
                for (var i = 0; i < o.childNodes.length; i++) {
                    var child = o.childNodes[i];
                    if (child.nodeType == 1 && (!name || child.nodeName == name))
                        children.push(child);
                }
            }
            return children;
        }

    };