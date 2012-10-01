

    // *** AGENT OBJECT (http://github.com/molamil/agent)

    var Agent = {

        // --- PROPERTIES

        _registry: [],

        // --- METHODS

        /*
         * Usage:
         * - observe(fName, hook)
         * - observe(fName, hook, thisContext)
         * - observe(fName, hook, priority)
         * - observe(fName, hook, thisContext, priority)
         * - observe(o, fName, hook)
         * - observe(o, fName, hook, thisContext)
         * - observe(o, fName, hook, priority)
         * - observe(o, fName, hook, thisContext, priority)
         */
        observe: function() {

            // Map the dynamic usage of the parameters and check for bad calls.
            var request = this._buildRequest.apply(this, arguments);
            if (!request.success)
                return;

            // Map arguments.
            var o =  request.o,
                fName = request.fName,
                hook = request.hook,
                thisContext = request.thisContext,
                priority = request.priority,
                oF,
                proxyExists,
                proxy,
                i,
                p;

            // Check that the original function is either null or of type function
            oF = o[fName];
            if (oF != undefined && (typeof oF != "function")) {
                this._warn("The provided function name \"" + fName + "\" does not reference a function but a " +
                    (typeof o[fName]) + " - this member should be changed at runtime to a function in order " +
                    "to avoid unexpected results");
            }

            proxyExists = false;
            for (i = 0; i < this._registry.length; i++) {
                p = this._registry[i];
                if (p.o === o && p.fName == fName) {
                    proxy = p;
                    proxyExists = true;
                    break;
                }
            }
            if (!proxyExists)
                proxy = this._createProxy(o, fName);
            this._addHook(proxy, hook, thisContext, priority)

        },

        /*
         * Usage:
         * - ignore(fName, hook)
         * - ignore(o, fName, hook)
         */
        ignore: function() {

            // Map the dynamic usage of the parameters and check for bad calls.
            var request = this._buildRequest.apply(this, arguments);
            if (!request.success)
                return;

            // Map arguments.
            var o =  request.o,
                fName = request.fName,
                hook = request.hook,
                exists,
                i,
                p,
                j;

            // Get the position of the proxy to remove.
            for (i = 0; i < this._registry.length; i++) {
                p = this._registry[i];
                if (p.o === o && p.fName == fName) {
                    for (j = 0; j < p.hooks.length; j++) {
                        if (p.hooks[j].f === hook) {
                            exists = true;
                            p.hooks.splice(j, 1);
                            break;
                        }
                    }
                }
            }

            if (!exists)
                this._warn("There is no matching function to remove on " + fName);

        },

        _buildRequest: function() {

            // Check that the first parameter is either an object or a string.
            if (typeof arguments[0] != "object" && typeof arguments[0] != "string") {
                this._warn("The first parameter to observe/ignore should be either an object (that holds the " +
                    "function to be observed/ignored) or a string (the function name to be obeserved/ignored, taking " +
                    "window as the default object), no hook will be processed");
                return;
            }

            // Map arguments.
            var defaultsO = (typeof arguments[0] == "string"),
                request = {
                    o: defaultsO ? window : arguments[0],
                    fName: defaultsO ? arguments[0] : arguments[1],
                    hook: defaultsO ? arguments[1] : arguments[2],
                    thisContext: null,
                    priority: 0,
                    success: true
                },
                arg1,
                arg2;

            if (arguments.length > (defaultsO ? 2 : 3)) {
                arg1 = defaultsO ? (arguments[2]) : (arguments[3]);
                arg2 = defaultsO ? (arguments[3]) : (arguments[4]);
                if (arg1 && typeof arg1 == "object") {
                    request.thisContext = arg1;
                    if (arg2 && typeof arg2 == "number")
                        request.priority = arg2;
                } else if (typeof arg1 == "number") {
                    request.priority = arg1;
                }
            }



            // Check that we have an object.
            if (typeof request.o != "object") {
                this._warn("No object to observe, no hook will be processed");
                request.success = false;

                // Check that we have a function name.
            } else if (typeof request.fName != "string") {
                this._warn("There was no function name string provided to observe, no hook will be processed");
                request.success = false;

                // Check that we have a function.
            } else if (typeof request.hook != "function") {
                this._warn("There was no hook function provided to observe, no hook will be processed");
                request.success = false;
            }

            return request;

        },

        _createProxy: function(o, fName) {
            var original = o[fName],
                proxy = {
                    o: o,
                    fName: fName,
                    hooks: [] // of {f, priority}
                    // Adding original after adding the hook.
                };
            this._addHook(proxy, original, 0);
            proxy.original = original;
            this._registry.push(proxy);
            return proxy;
        },

        _buildProxy: function(proxy) {
            proxy.o[proxy.fName] = function() {
                var hook,
                    i;
                for (i = proxy.hooks.length - 1; i >= 0; i--) {
                    hook = proxy.hooks[i];
                    hook.f.apply(hook.thisContext || this, arguments);
                }
            }
        },

        _addHook: function(proxy, f, thisContext, priority) {

            // Check whether there is a function member defined for the object.
            if (!f)
                return;

            if (proxy.original === f) {
                this._warn("You cannot observe a function to itself: " + f);
                return;
            }

            var n = 0,
                hookExists = false,
                i,
                h,
                hook;

            for (i = 0; i < proxy.hooks.length; i++) {
                h = proxy.hooks[i];
                if (h.f === f) {
                    hookExists = true;
                    break;
                }
                if (h.priority < priority)
                    n = i + 1;
            }
            if (hookExists) {
                this._warn("Hook already exists, will not be added: " + f);
            } else {
                hook = {
                    f: f,
                    thisContext: thisContext,
                    priority: priority
                };
                proxy.hooks.splice(n, 0, hook);
            }
            this._buildProxy(proxy);

        },

        _warn: function(message) {
            if (window.console && typeof window.console.warn == "function")
                window.console.warn(message);
        }


    };
