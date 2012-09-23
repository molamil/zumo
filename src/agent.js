
	// *** AGENT OBJECT

	var Agent = {

		// --- PROPERTIES

		_registry: [],

		// --- METHODS

		/*
		 * Usage:
		 * - observe(fName, hook)
		 * - observe(fName, hook, thisArg)
		 * - observe(fName, hook, priority)
		 * - observe(fName, hook, thisArg, priority)
		 * - observe(o, fName, hook);
		 * - observe(o, fName, hook, thisArg);
		 * - observe(o, fName, hook, priority);
		 * - observe(o, fName, hook, thisArg, priority);
		 */
		observe: function() {

			// Map the dynamic usage of the parameters and check for bad calls.
			var request = this._buildRequest.apply(this, arguments);
			if (!request.success)
				return;

			// Map arguments.
			var o =  request.o;
			var fName = request.fName;
			var hook = request.hook;
			var thisArg = request.thisArg;
			var priority = request.priority;

			// Check that the original function is either null or of type function
			var oF = o[fName];
			if (oF != undefined && (typeof oF != "function")) {
				Zumo.log.warn("The provided function name \"" + fName + "\" does not reference a function but a " +
						(typeof o[fName]) + " - this member should be changed at runtime to a function in order " +
						"to avoid unexpected results");
			}

			var proxyExists = false;
			var proxy;
			for (var i = 0; i < this._registry.length; i++) {
				var p = this._registry[i];
				if (p.o === o && p.fName == fName) {
					proxy = p;
					proxyExists = true;
					break;
				}
			}
			if (!proxyExists)
				proxy = this._createProxy(o, fName);
			this._addHook(proxy, hook, thisArg, priority)

		},

		/*
		 * Usage:
		 * - ignore(fName, hook)
		 * - ignore(fName, hook, thisArg)
		 * - ignore(o, fName, hook);
		 * - ignore(o, fName, hook, thisArg);
		 */
		ignore: function() {

			// Map the dynamic usage of the parameters and check for bad calls.
			var request = this._buildRequest.apply(this, arguments);
			if (!request.success)
				return;

			// Map arguments.
			var o =  request.o;
			var fName = request.fName;
			var hook = request.hook;

			// Get the position of the proxy to remove.
			var proxyPos = -1;
			for (var i = 0; i < this._registry.length; i++) {
				var p = this._registry[i];
				if (p.o === o && p.fName == fName && p.hook === hook) {
					proxyPos = i;
					break;
				}
			}

			if (proxyPos > -1) {
				this._registry.splice(proxyPos, 1);
			} else {
				Zumo.log.info("There is no matching function to remove on " + fName);
			}

		},

		_buildRequest: function() {

			// Check that the first parameter is either an object or a string.
			if (typeof arguments[0] != "object" && typeof arguments[0] != "string") {
				Zumo.log.warn("The first parameter to observe/ignore should be either an object (that holds the function " +
						"to be observed/ignored) or a string (the function name to be obeserved/ignored, taking window as the " +
						"default object), no hook will be processed");
				return;
			}

			// Map arguments.
			var defaultsO = (typeof arguments[0] == "string");
			var request = {
				o: defaultsO ? window : arguments[0],
				fName: defaultsO ? arguments[0] : arguments[1],
				hook: defaultsO ? arguments[1] : arguments[2],
				thisArg: null,
				priority: 0,
				success: true
			};

			if (arguments.length > (defaultsO ? 2 : 3)) {
				var arg1 = defaultsO ? (arguments[2]) : (arguments[3]);
				var arg2 = defaultsO ? (arguments[3]) : (arguments[4]);
				if (arg1 && typeof arg1 == "object") {
					request.thisArg = arg1;
					if (arg2 && typeof arg2 == "number")
						request.priority = arg2;
				} else if (typeof arg1 == "number") {
					request.priority = arg1;
				}
			}



			// Check that we have an object.
			if (typeof request.o != "object") {
				Zumo.log.warn("No object to observe, no hook will be processed");
				request.success = false;

			// Check that we have a function name.
			} else if (typeof request.fName != "string") {
				Zumo.log.warn("There was no function name string provided to observe, no hook will be processed");
				request.success = false;

			// Check that we have a function name.
			} else if (typeof request.hook != "function") {
				Zumo.log.warn("There was no hook function provided to observe, no hook will be processed");
				request.success = false;
			}

			return request;

		},

		_createProxy: function(o, fName) {
			var proxy = {
				o: o,
				fName: fName,
				hooks: [] // of {f, priority}
				// Adding original after adding the hook.
			};
			var original = o[fName];
			this._addHook(proxy, original, 0);
			proxy.original = original;
			this._registry.push(proxy);
			return proxy;
		},

		_buildProxy: function(proxy) {
			proxy.o[proxy.fName] = function() {
				//TODO: Review the this context of the called function.
				for (var i = proxy.hooks.length - 1; i >= 0; i--) {
					var hook = proxy.hooks[i];
					hook.f.apply(hook.thisArg || this, arguments);
				}
			}
		},

		_addHook: function(proxy, f, thisArg, priority) {

			// Check whether there is a function member defined for the object.
			if (!f)
				return;

			if (proxy.original === f) {
				Zumo.log.warn("You cannot observe a function to itself: " + f);
				return;
			}

			var n = 0;
			var hookExists = false;
			for (var i = 0; i < proxy.hooks.length; i++) {
				var h = proxy.hooks[i];
				if (h.f === f) {
					hookExists = true;
					break;
				}
				if (h.priority < priority)
					n = i + 1;
			}
			if (hookExists) {
				Zumo.log.info("Hook already exists, will not be added: " + f);
			} else {
				var hook = {
					f: f,
					thisArg: thisArg,
					priority: priority
				};
				proxy.hooks.splice(n, 0, hook);
			}
			this._buildProxy(proxy);

		}


	};