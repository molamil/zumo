/*

 DECLARATION OF IMPLICIT OBJECTS ACCROSS THE ZUMO FRAMEWORK

 session:		{id:String, root:Object, defaultPropName:String, viewMasters:Array, defaultViewMasterClass:Object, commandMasters:Array, defaultCommandMasterClass:Object}
 request:		{id:String, params:Object}
 context:		{id:String, type:String, target:String, container:String, props: Object, propContexts:Array, handlers:Array, node:String, title:String}
 propContext:	{name:String, value:*, target:String}

 */
(function(window) {


	// ************************************************************************************************************
	// COMMONS
	// ************************************************************************************************************


	var _NAME = 'Zumo';
	var _VERSION = '0.1';


	// *** LOG OBJECT

	var Log = {

		// --- PROPERTIES

		LEVELS: ["error", "warn", "info", "debug"],
		level: 2,
		prefix: _NAME.toUpperCase() + " - ",

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

			// Check that Firebug is enabled.
			if (!window.console)
				return;

			// Set level as default if not passed.
			if (level == null)
				level = this.level;

			if (this.level >= level) {
				var fLevel = window.console[this.LEVELS[level]];
				if (typeof fLevel == "function")
					fLevel.call(window.console, message);
			}

		}

	};


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
			for (var prop in origin)
				target[prop] = origin[prop];
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
		}

	};


	// *** DOM UTILS OBJECT

	var DomUtils = {

		getChildren: function(o, name) {
			var children;
			if (o && typeof o.childNodes == "object") {
				children = [];
				for (var i = 0; i < o.childNodes.length; i++) {
					var child = o.childNodes[i];
					if (child.nodeType == 1 && (!name || child.nodeName == name))
						children.push(child);
				}
			}
			return children;
		}

	}


	// *** SELECTOR OBJECT

	var Selector = {

		// --- METHODS

		select: function(selector, container) {
			container = container || document;
			return container.getElementById(selector.substr(1));
		}

	};


	// *** LOADER CLASS

	var Loader = function() {
		this.method = "GET";
		// --
		// Implementing:
		// this.xmlHttp = null;
		// this.callback= null;
		// this.callbackObject = null;
	};

	Loader.prototype = {

		load: function(url, onLoaded, callbackObject) {

			this.callback = onLoaded;
			this.callbackObject = callbackObject;
			var onState = this.onState;
			var thisObject = this;

			if (window.XMLHttpRequest) {
				this.xmlHttp = new XMLHttpRequest();
				this.xmlHttp.onreadystatechange = function() {
					thisObject.onState.call(thisObject);
				};
				this.xmlHttp.open(this.method, url, true);
				this.xmlHttp.send(null);
			} else if (window.ActiveXObject) {
				Log.info("Loader using ActiveX");
				this.xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
				if (this.xmlHttp) {
					this.xmlHttp.onreadystatechange = function() {
						thisObject.onState.call(thisObject);
					};
					this.xmlHttp.open(this.method, url, true);
					this.xmlHttp.send();
				}
			}

			if (!this.xmlHttp)
				Log.error("Loader could not create an XML HTTP object");

		},

		onState: function() {
			if (this.xmlHttp.readyState == 4) {
				if (this.xmlHttp.status == 200 || this.xmlHttp.status == 0) {
					this.onLoaded(this.xmlHttp);
				} else {
					Log.warn("The server returned an error when trying to load: " + this.xmlHttp.responseXML);
				}
			}
		},

		onLoaded: function(xmlHttp) {
			Log.debug("The server returned content from Loader");
			if (typeof this.callback == "function")
				this.callback.call(this.callbackObject, xmlHttp);
		}

	};


	// ************************************************************************************************************
	// PROPS
	// ************************************************************************************************************


	// *** PROPS MANAGER OBJECT

	var PropsManager = {

		// --- METHODS

		apply: function(target, propContexts, session) {

			//TODO: Add checks

			// Merge the props
			for(var i = 0; i < propContexts.length; i++) {
				var propContext = propContexts[i];
				if (propContext.target)
					target = session.selector(propContext.target, target);
				var name = propContext.name || session.defaultPropName;
				target[name] = propContext.value;
			}

		}

	};


	// ************************************************************************************************************
	// PARAMS
	// ************************************************************************************************************


	// *** PARAMS MANAGER OBJECT

	var ParamsManager = {

		// --- METHODS

		apply: function(target, params, session) {

			//TODO: Add checks

			// Merge the params
			for(var i = 0; i < params.length; i++) {
				var param = params[i];
				target[param.name] = param.value;
			}

		}

	};


	// ************************************************************************************************************
	// VIEWS
	// ************************************************************************************************************


	// *** PAGE CLASS

	var Page = function (context, request, session) {
		this.id = context.id;
		this.context = context;
		this.request = request;
		this.session = session;
		// --
		// Implementing:
		// this.master = null;
	};


	// *** BLOCK CLASS

	var Block = function (context, request, session) {
		this.id = context.id;
		this.context = context;
		this.request = request;
		this.session = session;
		this._callers = [];
		// --
		// Implementing:
		// this.master = null;
	};

	Block.prototype = {

		addCaller: function(id) {
			if (!this.existsCaller(id))
				this._callers.push(id);
		},

		removeCaller: function(id) {
			var i = this._callers.indexOf(id);
			if (i != -1)
				this._callers.splice(i, 1);
		},

		existsCaller: function(id) {
			return this._callers.indexOf(id) != -1;
		},

		getCallers: function() {
			return this._callers;
		}

	};


	// *** PAGE BLOCK BUILDER OBJECT

	var PageBlockBuilder = {

		// --- METHODS

		createPage: function(context, request, session) {

			//TODO: Implement state managers.

			var page = new Page(context, request, session);
			page.master = this._buildMaster(context, request, session, this._buildStateManager(context, session));

			return page;

		},

		createBlock: function(context, request, session) {

			//TODO: Implement state managers.

			var block = new Block(context, request, session);
			block.master = this._buildMaster(context, request, session, this._buildStateManager(context, session));

			return block;

		},

		_buildMaster: function(context, request, session, stateManager) {

			var masterClass, master;
			var type = StringUtils.trim(context.type).toLowerCase();

			if (type != "") {
				masterClass = session.viewMasters["_" + type];
			} else {
				masterClass = session.defaultViewMasterClass;
			}

			if (masterClass) {
				if (typeof masterClass == "function") {
					master = new masterClass(context, request, session, stateManager);
				} else {
					Log.error("The type " + type + " in " + context.id + " cannot create a new page");
				}
			} else {
				Log.error("The type " + type + " cannot be resolved in page: " + context.id);
			}

			return master;

		},

		_buildStateManager: function(context, session) {

			var stateManagerClass, stateManager;
			var manager = StringUtils.trim(context.manager).toLowerCase();

			if (manager != "") {
				stateManagerClass = session.stateManagers["_" + manager];
			} else {
				stateManagerClass = session.defaultStateManagerClass;
			}

			if (stateManagerClass) {
				if (typeof stateManagerClass == "function") {
					stateManager = new stateManagerClass(null, session);
				} else {
					Log.error("The manager " + manager + " in " + context.id + " cannot create a valid state manager");
				}
			} else {
				Log.error("The manager " + manager + " cannot be resolved in: " + context.id);
			}

			return stateManager;

		}

	};


	// *** VIEW MASTERS OBJECT

	var ViewMasters = {

		// --- METHODS - Using init method to create class functions as ViewMasters members

		init: function() {


			// *** ABSTRACT MASTER CLASS

			var AbstractMaster = function(context, request, session, stateManager) {

				this.context = context;
				this.request = request;
				this.session = session;
				this.stateManager = stateManager;
				this.isDisplayed = false;
				this.isCleared = false;

				//TODO: Move this to PageBlockBuilder
				if (this.context.mediator) {
					var fMediator = ObjectUtils.find(this.context.mediator);
					if (typeof fMediator == "function") {
						this.fMediator = fMediator;
					}
				}

				// --
				// Implementing:
				// this.target = null;
				// this.container = null;
				// this.mediator = null;

			};

			AbstractMaster.prototype = {

				display: function() {
					Log.info("Displaying " + this.context.id + " with target " + this.context.target);
					var containerName = StringUtils.trim(this.context.container);
					if (containerName != "") {
						this.container = this.session.selector(this.context.container, this.session.root);
						if (this.container == null)
							Log.error("Invalid container for page " + this.context.id + ": " + this.context.container);
					}
				},

				destroy: function() {
					Log.info("Destroying " + this.context.id);
					if (this.mediator && typeof this.mediator.destroy == "function")
						this.mediator.destroy();
					if (this.stateManager)
						this.stateManager.destroy();
				},

				clear: function() {
					Log.info("Clearing " + this.context.id);
					if (this.stateManager)
						this.stateManager.setState(StateManagers.STATE_OUT);
				},

				init: function() {

					Log.debug("Initializing " + this.context.id);

					PropsManager.apply(this.target, this.context.propContexts, this.session);
					ObjectUtils.merge(this.target, this.request.params);

					if (this.target) {

						if (this.fMediator) {
							this.mediator = new this.fMediator(this.target);
							PropsManager.apply(this.mediator, this.context.propContexts, this.session);
							ObjectUtils.merge(this.mediator, this.request.params);
							if (typeof this.mediator.init == "function")
								this.mediator.init();
						}

						if (this.stateManager) {
							this.stateManager.target = this.target;
							Agent.observe(this.stateManager, "onStateChange", this.onStateChange, this);
							//TODO: Merge props into state managers
							this.stateManager.setState(StateManagers.STATE_IN);
						}
						
					}

				},

				onStateChange: function(target, state) {
					if (state == StateManagers.STATE_IN) {
						//type = isPage() ? PagesEvent.PAGE_IN : PagesEvent.BLOCK_IN;
					} else if (state == StateManagers.STATE_ON) {
						//type = isPage() ? PagesEvent.PAGE_ON : PagesEvent.BLOCK_ON;
					} else if (state == StateManagers.STATE_OUT) {
						//type = isPage() ? PagesEvent.PAGE_OUT : PagesEvent.BLOCK_OUT;
					} else if (state == StateManagers.STATE_OFF) {
						//type = isPage() ? PagesEvent.PAGE_OFF : PagesEvent.BLOCK_OFF;
						this.destroy();
					}
				}

			};


			// *** DOM MASTER CLASS

			var DomMaster = function(context, request, session, stateManager) {
				AbstractMaster.call(this, context, request, session, stateManager);
				//TODO: See how to configure the master properties.
				this.changeDisplay = true;
				this.changeVisibility = true;
				this.cloneDom = false;
			};

			DomMaster.prototype = {
				
				display: function() {
					AbstractMaster.prototype.display.apply(this, arguments); // Call super
					Log.debug("DomMaster display");
					this.target = this.session.selector(this.context.target);
					if (this.target == null) {
						Log.error("Invalid target for page " + this.context.id + ": " + this.context.target);
						return;
					}
					if (this.cloneDom) {
						this.target = this.target.cloneNode(true);
						this.container.appendChild(this.target);
					}
					if (this.changeDisplay)
						this.target.style.display = "block";
					if (this.changeVisibility)
						this.target.style.visibility = "visible";
					this.init();
				},

				destroy: function() {
					AbstractMaster.prototype.destroy.apply(this, arguments); // Call super
					Log.debug("DomMaster destroy");
					if (this.changeDisplay)
						this.target.style.display = "none";
					if (this.changeVisibility)
						this.target.style.visibility = "hidden";
					if (this.cloneDom)
						this.container.removeChild(this.target);
				},

				init: function() {
					AbstractMaster.prototype.init.apply(this, arguments); // Call super
				}

			};


			// *** DOM CLONE MASTER CLASS

			var DomCloneMaster = function(context, request, session, stateManager) {
				DomMaster.call(this, context, request, session, stateManager);
				this.cloneDom = true;
			};


			// *** LOADER CLASS

			var LoaderMaster = function(context, request, session, stateManager) {
				AbstractMaster.call(this, context, request, session, stateManager);
				this.useXml = false;
				this.loader = null;
			};

			LoaderMaster.prototype = {

				display: function() {
					AbstractMaster.prototype.display.apply(this, arguments); // Call super
					Log.debug("LoaderMaster display");
					this.loader = new Loader();
					this.loader.load(this.context.target, this.onLoaded, this);
				},

				destroy: function() {
					AbstractMaster.prototype.destroy.apply(this, arguments); // Call super
					Log.debug("LoaderMaster destroy");
					this.container.innerHTML = "";
				},

				onLoaded: function(xmlHttp) {
					Log.debug("LoaderMaster received content");
					this.target = xmlHttp.responseText;
					this.container.innerHTML = this.target;
					this.init();
				},

				init: function() {
					AbstractMaster.prototype.init.apply(this, arguments); // Call super
				}

			};

			
			// *** BUILDER MASTER CLASS

			var BuilderMaster = function(context, request, session, stateManager) {
				AbstractMaster.call(this, context, request, session, stateManager);
				this.fConstructor = null;
				this.builder = null;
				this.domContent = null;
			};

			BuilderMaster.prototype = {

				display: function() {
					AbstractMaster.prototype.display.apply(this, arguments); // Call super
					Log.debug("BuilderMaster display");
					this.fConstructor = ObjectUtils.find(this.context.target);
					if (typeof this.fConstructor != "function") {
						Log.error("Invalid target for page " + this.context.id + ": " + this.context.target);
						return;
					}
					this.builder = new this.fConstructor();
					//TODO: Implement checks on build to make sure it is a function and it returns dom
					this.target = this.builder.build();
					this.container.appendChild(this.target);
					this.init();
					if (typeof this.builder.init == "function")
						this.builder.init();
				},

				destroy: function() {
					AbstractMaster.prototype.destroy.apply(this, arguments); // Call super
					Log.debug("BuilderMaster destroy");
					if (typeof this.builder.destroy == "function")
						this.builder.destroy();
					if (this.target)
						this.container.removeChild(this.target);
				},

				init: function() {
					AbstractMaster.prototype.init.apply(this, arguments); // Call super
					PropsManager.apply(this.builder, this.context.propContexts, this.session);
					ObjectUtils.merge(this.builder, this.request.params);
				}

			};


			// *** INIT - Initializing ViewMasters

			this.AbstractMaster = AbstractMaster;
			this.DomMaster = DomMaster;
			this.DomCloneMaster = DomCloneMaster;
			this.LoaderMaster = LoaderMaster;
			this.BuilderMaster = BuilderMaster;

			ObjectUtils.extend(this.DomMaster, this.AbstractMaster);
			ObjectUtils.extend(this.DomCloneMaster, this.DomMaster);
			ObjectUtils.extend(this.LoaderMaster, this.AbstractMaster);
			ObjectUtils.extend(this.BuilderMaster, this.AbstractMaster);


		}

	};


	// *** STATE MANAGERS OBJECT

	var StateManagers = {

		// --- PROPERTIES

		STATE_IN: "IN",
		STATE_ON: "ON",
		STATE_OUT: "OUT",
		STATE_OFF: "OFF",

		// --- METHODS - Using init method to create class functions as StateManagers members

		init: function() {


			// *** ABSTRACT MASTER CLASS

			var BaseIo3Manager = function(target, session) {
				this.target = target;
				this.session = session;
				this._state = null;
			};

			BaseIo3Manager.prototype = {

				destroy: function() {
					// Empty
				},

				getState: function() {
					return this._state;
				},

				setState: function(state) {
					state = state.toUpperCase();
					if (state != StateManagers.STATE_IN && state != StateManagers.STATE_ON && state != StateManagers.STATE_OUT && state != StateManagers.STATE_OFF) {
						Log.warn("Unknown state, returning without changing state for target " + this.target);
						return;
					}
					if (state != this._state) {
						this._state = state;
						this._changeState();
					}
				},

				_changeState: function() {

					this.onStateChange(this.target, this._state);

					if (this._state == StateManagers.STATE_IN) {
						this._doIn();
					} else if (this._state == StateManagers.STATE_ON) {
						this._doOn();
					} else if (this._state == StateManagers.STATE_OUT) {
						if (this.target != null) {
							this._doOut();
						} else {
							Log.info("target is null when trying to set state to OUT, setting state to OFF instead of " +
										"calling doOut to avoid errors.");
							this._state = StateManagers.STATE_OFF;
						}
					} else if (this._state == StateManagers.STATE_OFF) {
						this._doOff();
					}

				},

				_doIn: function() {
					this.setState(StateManagers.STATE_ON);
				},

				_doOn: function() {
					// Empty
				},

				_doOut: function() {
					this.setState(StateManagers.STATE_OFF);
				},

				_doOff: function() {
					// Empty
				},

				onStateChange: function(target, state) {
					// Empty
				}

			};


			// *** INIT - Initializing StateManagers

			this.BaseIo3Manager = BaseIo3Manager;

		}

	};


	// ************************************************************************************************************
	// COMMANDS
	// ************************************************************************************************************


	// *** COMMAND CLASS

	var Command = function (context, request, session) {
		this.id = context.id;
		this.context = context;
		this.request = request;
		this.session = session;
		// --
		// Implementing:
		// this.master = null;
	};


	// *** COMMAND BUILDER OBJECT

	var CommandBuilder = {

		// --- METHODS

		createCommand: function(context, request, session) {
			var command = new Command(context, request, session);
			command.master = this._buildMaster(context, request, session);
			return command;
		},

		_buildMaster: function(context, request, session) {

			var masterClass, master;
			var type = StringUtils.trim(context.type).toLowerCase();

			if (type != "") {
				masterClass = session.commandMasters["_" + type];
			} else {
				masterClass = session.defaultCommandMasterClass;
			}

			if (masterClass) {
				if (typeof masterClass == "function") {
					master = new masterClass(context, request, session);
				} else {
					Log.error("The type " + type + " in " + context.id + " cannot create a new command");
				}
			} else {
				Log.error("The type " + type + " cannot be resolved in command: " + context.id);
			}

			return master;

		}

	};

	
	// *** COMMAND MASTERS OBJECT

	var CommandMasters = {

		// --- METHODS - Using init method to create class functions as CommandMasters members

		init: function() {


			// *** ABSTRACT MASTER CLASS

			var AbstractMaster = function(context, request, session) {
				this.context = context;
				this.request = request;
				this.session = session;
				this.isExecuted = false;
			};

			AbstractMaster.prototype = {

				execute: function() {
					Log.debug("Initializing " + this.context.id);
					//TODO: Decide wheteher we should merge props.
//					PropsManager.apply(this.target, this.context.propContexts, this.session);
				}

			};


			// *** FUNCTION MASTER CLASS

			var FunctionMaster = function(context, request, session) {
				AbstractMaster.call(this, context, request, session);
				//TODO: See how to configure the master properties.
			};

			FunctionMaster.prototype = {

				execute: function() {
					AbstractMaster.prototype.execute.apply(this, arguments); // Call super
					var f = ObjectUtils.find(this.context.target);
					var args = [];
					if (this.context.props._args && typeof this.context.props._args == "object" && this.context.props._args.length > 0)
						args = this.context.props._args.slice(0);
					for (var param in this.request.params)
						args.push(this.request.params[param]);
					if (typeof f == "function")
						f.apply(null, args); //TODO: Check the this context.
					this.isExecuted = true;
				}

			};


			// *** INIT - Initializing CommandMasters

			this.AbstractMaster = AbstractMaster;
			this.FunctionMaster = FunctionMaster;

			ObjectUtils.extend(this.FunctionMaster, this.AbstractMaster);


		}

	};


	// ************************************************************************************************************
	// ZUMO
	// ************************************************************************************************************


	// *** XML CONF PARSER OBJECT

	var XmlConfParser = {

		// --- METHODS

		parse: function(conf, session) {
			// TODO: Check for XML
			// TODO: Parse top level props
			Log.debug("Parsing conf: " + conf);
			var confObject = {};
			confObject.views = this._parseViews(conf, session);
			confObject.commands = this._parseCommands(conf, session);
			return confObject;
		},

		_parseViews: function(conf, session) {

			var viewNodes = conf.getElementsByTagName("views");

			if (viewNodes.length > 1) {
				Log.warn("There can only be zero or one views nodes on the XML configuration, there were "
						+ viewNodes.length + " views nodes found");
				return;
			} else if (viewNodes.length == 0) {
				Log.info("No views to parse");
				return;
			}

			var views = {
				pages: [],
				blocks: []
			};

			var nodeName = "page";
			var pageNodes = viewNodes[0].getElementsByTagName(nodeName);
			for (var i = 0; i < pageNodes.length; i++) {
				var pageContext = this._parsePageBlock(pageNodes[i], session);
				if (pageContext) {
					pageContext.node = nodeName;
					views.pages.push(pageContext);
				}
			}

			nodeName = "block";
			var blockNodes = viewNodes[0].getElementsByTagName(nodeName);
			for (i = 0; i < blockNodes.length; i++) {
				var blockContext = this._parsePageBlock(blockNodes[i], session);
				if (blockContext) {
					blockContext.node = nodeName;
					views.blocks.push(blockContext);
				}
			}

			return views;

		},

		_parsePageBlock: function(conf, session) {
			var pageBlockContext = {};
			this._mergeAttributes(pageBlockContext, conf, ["id", "type", "mediator", "target", "container", "title"]);
			var dependsValue = conf.attributes.getNamedItem("depends");
			if (dependsValue) {
				var depends = dependsValue.nodeValue.replace(" ", "").split(",");
				if (!(depends.length == 1 && depends[0] == ""))
					pageBlockContext.depends = depends;
			}
			pageBlockContext.propContexts = this._parsePropContexts(conf, session);
			pageBlockContext.props = this._getPropsFromPropContexts(pageBlockContext.propContexts);
			//TODO: Set props (no prop contexts)
			pageBlockContext.handlers = this._parseHandlers(conf, session);
			return pageBlockContext;
		},

		_parseCommands: function(conf, session) {

			var commandsNodes = conf.getElementsByTagName("commands");
			var commands = [];

			if (commandsNodes.length > 1) {
				Log.warn("There can only be zero or one commands nodes on the XML configuration, there were "
						+ commandsNodes.length + " commands nodes found");
			} else if (commandsNodes.length == 0) {
				Log.info("No commands to parse");
			} else {
				var commandNodes = commandsNodes[0].getElementsByTagName("command");
				for (var i = 0; i < commandNodes.length; i++) {
					var commandContext = {};
					this._mergeAttributes(commandContext, commandNodes[i], ["id", "type", "target"]);
					commandContext.propContexts = this._parsePropContexts(commandNodes[i], session);
					commandContext.props = this._getPropsFromPropContexts(commandContext.propContexts);
					commandContext.handlers = this._parseHandlers(commandNodes[i], session);
					commands.push(commandContext);
				}
			}

			return commands;

		},

		_parsePropContexts: function(conf, session) {

			var propNodes = DomUtils.getChildren(conf, "prop");

			var propContexts = [];
			for (var i = 0; i < propNodes.length; i++) {
				var propContext = this._parsePropContext(propNodes[i], session);
				if (propContext)
					propContexts.push(propContext);
			}

			return propContexts;

		},

		_parsePropContext: function(conf, session) {

			var propContext = {};

			//TODO: Add checks
			//TODO: Implement type resolvers
			//TODO: Implement expressions

			this._mergeAttributes(propContext, conf, ["name", "target"]);
			propContext.value = this._parsePropValue(conf, session);

			return propContext;

		},

		_parsePropValue: function(conf, session) {

			var propContext = {};
			this._mergeAttributes(propContext, conf, ["name", "value"]);

			var hasChildren = DomUtils.getChildren(conf).length > 0;
			var itemNodes = DomUtils.getChildren(conf, "item");
			var propNodes = DomUtils.getChildren(conf, "prop");

			if (hasChildren) {

				if (propContext.value) {

					Log.warn("Both value attribute and children nodes found on prop: '" + propContext.name + "'. Only value attribute will be used.");

				} else {

					var i;

					if (propNodes.length > 0) {

						if (itemNodes.length > 0)
							Log.warn("Both prop and item nodes found on prop: '" + propContext.name + "'. Only prop nodes will be used.");

						propContext.value = {};

						for (i = 0; i < propNodes.length; i++) {
							var propNode = propNodes[i];
							propContext.value[propNode.attributes.getNamedItem("name").nodeValue] = this._parsePropValue(propNode);
						}

					} else if (itemNodes.length > 0) {

						propContext.value = [];

						for (i = 0; i < itemNodes.length; i++)
							propContext.value.push(this._parsePropValue(itemNodes[i]));

					}

				}

			} else {

				if (propContext.value) {

					if (conf.firstChild && StringUtils.trim(conf.firstChild.nodeValue) != "")
						Log.warn("Both value attribute and text content found on prop: '" + propContext.name + "'. Only value attribute will be used.");

				} else {

					propContext.value = conf.firstChild.nodeValue;

				}

			}

			return propContext.value;

		},

		_getPropsFromPropContexts: function(propContexts) {
			var props = {};
			for (var i = 0; i < propContexts.length; i++)
				props[propContexts[i].name] = propContexts[i].value;
			return props;
		},

		_mergeAttributes: function(o, element, list) {
			for (var i = 0; i < list.length; i++) {
				var name = list[i];
				var value = element.attributes.getNamedItem(name);
				if (value)
					o[name] = value.nodeValue;
			}
		},

		_parseHandlers: function(conf, session) {

			var handlerNodes = conf.getElementsByTagName("handler");

			var handlers = [];
			for (var i = 0; i < handlerNodes.length; i++) {
				var handlerContext = this._parseHandler(handlerNodes[i], session);
				if (handlerContext)
					handlers.push(handlerContext);
			}

			return handlers;

		},

		_parseHandler: function(conf, session) {
			var handlerContext = {};
			//TODO: Implement expressions
			//TODO: Implement params
			Log.debug(conf);
			this._mergeAttributes(handlerContext, conf, ["type", "target", "priority", "class", "at", "action", "priority"]);
			handlerContext.params = this._parseParams(conf, session);
			return handlerContext;
		},

		_parseParams: function(conf, session) {

			var paramNodes = conf.getElementsByTagName("param");

			var params = [];
			for (var i = 0; i < paramNodes.length; i++) {
				var paramContext = this._parseParam(paramNodes[i], session);
				if (paramContext)
					params.push(paramContext);
			}

			return params;

		},

		_parseParam: function(conf, session) {
			var paramContext = {};
			//TODO: Add checks
			//TODO: Implement type resolvers
			//TODO: Implement required
			//TODO: Implement validators
			//TODO: Implement expressions
			//TODO: Implement props
			this._mergeAttributes(paramContext, conf, ["name", "value"]);
			Log.debug(conf);
			if (!paramContext.value)
				paramContext.value = conf.firstChild.nodeValue;
			return paramContext;
		}

	};


	// *** HANDLER MANAGER CLASS

	var HandlerManager = function(app) {
		this.app = app;
		this._activeHandlers = []; // of {handlerContext:Object, context:Object, contextType:String, f:Function}
	};

	HandlerManager.prototype = {

		registerHandlers: function() {

			//TODO: Consider sorting on priorities

			this.unregisterHandlers();

			var pageContexts = this.app.getPageContexts();
			for (var i = 0; i < pageContexts.length; i++) {
				var pageContext = pageContexts[i];
				this._registerHandlersFromContext(pageContext, "page");
			}

			var blockContexts = this.app.getBlockContexts();
			for (i = 0; i < blockContexts.length; i++) {
				var blockContext = blockContexts[i];
				this._registerHandlersFromContext(blockContext, "block");
			}

			var commandContexts = this.app.getCommandContexts();
			for (i = 0; i < commandContexts.length; i++) {
				var commandContext = commandContexts[i];
				this._registerHandlersFromContext(commandContext, "command");
			}

		},

		unregisterHandlers: function() {
			//TODO: Test
			while (this._activeHandlers.length > 0) {
				var activeHandler = this._activeHandlers.pop();
				this._removePageBlockHandlerAction(activeHandler);
			}
		},

		_registerHandlersFromContext: function(context, contextType) {
			for (var i = 0; i < context.handlers.length; i++) {
				var activeHandler = {
					handlerContext: context.handlers[i],
					context: context,
					contextType: contextType,
					f: this._createHandlerAction(context.handlers[i], context, contextType)
				};
				this._activeHandlers.push(activeHandler);
			}
		},

		_createHandlerAction: function(handlerContext, mainContext, contextType) {
			if (contextType == "page") {
				this._createPageHandlerAction(handlerContext, mainContext);
			} else if (contextType == "block") {
				this._createBlockHandlerAction(handlerContext, mainContext);
			} else if (contextType == "command") {
				this._createCommandHandlerAction(handlerContext, mainContext);
			} else {
				Log.warn("Could not create handler action - the context type is neither a page or a block");
			}
		},

		_createPageHandlerAction: function(handlerContext, pageContext) {

			var app = this.app;
			var f;

			var fGoto = function() {
				//TODO: Review params logic
				var params = arguments[1];
				var page = app.getCurrentPage();
				if (!handlerContext.at || handlerContext.at == "" || handlerContext.at == page.id) {
					if (page && pageContext.id == page.id) {
						Log.debug("Handler " + handlerContext.type + "trigger when already at " + page.id);
						ParamsManager.apply(page.master.target, handlerContext.params, this.session);
					} else {
						var ft = Delegate.create(app.goto, app, [pageContext.id, params]);
						setTimeout(ft, 10);
					}
				}
			};

			if (handlerContext.action == "goto" || handlerContext.action == "call" || handlerContext.action == "" || handlerContext.action == null) {
				f = fGoto;
			} else {
				Log.warn("Could not resolve handler action: " + handlerContext.action);
			}

			this._bindHandler(handlerContext.type, f, handlerContext.target);

			return f;

		},

		_createBlockHandlerAction: function(handlerContext, blockContext) {

			var app = this.app;
			var f;

			var fDisplay = function() {
				//TODO: Review params logic
				var params = arguments[1];
				if (!handlerContext.at || handlerContext.at == "" || handlerContext.at == app.getCurrentPage().id) {
					var block = app.getDisplayedBlock(blockContext.id);
					if (block) {
						ParamsManager.apply(block.master.target, handlerContext.params, this.session);
					} else {
						app.displayBlock(blockContext.id, params);
					}
				}
			};

			var fClear = function() {
				if (!handlerContext.at || handlerContext.at == "" || handlerContext.at == app.getCurrentPage().id)
					app.clearBlock(blockContext.id);
			};

			if (handlerContext.action == "clearBlock") {
				f = fClear;
			} else if (handlerContext.action == "displayBlock" || handlerContext.action == "call" || handlerContext.action == "" || handlerContext.action == null) {
				f = fDisplay;
			} else {
				Log.warn("Could not resolve handler action: " + handlerContext.action);
			}

			this._bindHandler(handlerContext.type, f, handlerContext.target);

			return f;

		},

		_createCommandHandlerAction: function(handlerContext, commandContext) {

			var app = this.app;
			var f;

			var fExecute= function() {
				var page = app.getCurrentPage();
				if (!handlerContext.at || handlerContext.at == "" || handlerContext.at == page.id) {
					//TODO: Review params logic
					var params = arguments[1];
					app.execute(commandContext.id, params);
				}
			};

			if (handlerContext.action == "execute" || handlerContext.action == "" || handlerContext.action == null) {
				f = fExecute;
			} else {
				Log.warn("Could not resolve handler action: " + handlerContext.action);
			}

			this._bindHandler(handlerContext.type, f, handlerContext.target);

			return f;

		},

		_removePageBlockHandlerAction: function(activeHandler) {
			if (activeHandler.contextType == "page") {
				this._removePageHandlerAction(activeHandler);
			} else if (activeHandler.contextType == "block") {
				this._removeBlockHandlerAction(activeHandler);
			} else {
				Log.warn("Could not remove handler action - the context type is neither a page or a block");
			}
		},

		_removePageHandlerAction: function(activeHandler) {
			//TODO: Implement _removePageHandlerAction
		},

		_removeBlockHandlerAction: function(activeHandler) {
			//TODO: Implement _removeBlockHandlerAction
		},

		_bindHandler: function(type, handler, target) {
			Log.info("There is no handler binder implemented");
			//TODO: Implement _bindHandler
		},

		_unbindHandler: function(type, handler, target) {
			Log.info("There is no handler unbinder implemented");
			//TODO: Implement _unbindHandler
		}

	};


	// *** ZUMO OBJECT

	//TODO: Make non-static so we can have several Zumo objects at a time.

	var Zumo = {

		// --- PROPERTIES

		_VIEW_MASTERS: {
				_dom: "DomMaster",
				_domclone: "DomCloneMaster",
				_loader: "LoaderMaster",
				_builder: "BuilderMaster"
		},
		_DEFAULT_VIEW_TYPE: "_dom",
		_STATE_MANAGERS: {
				_base: "BaseIo3Manager"
		},
		_DEFAULT_STATE_MANAGER: "_base",
		_COMMAND_MASTERS: {
				_function: "FunctionMaster"
		},
		_DEFAULT_COMMAND_TYPE: "_function",
		_DEFAULT_PROP_NAME: "innerHTML",
		_PARAM_NAME_CALLER: "_caller",

		log: Log,
		root: null,
		session: {
			viewMasters: {},
			defaultViewMasterClass: null,
			stateManagers: {},
			defaultStateManagerClass: null,
			commandMasters: {},
			defaultCommandMasterClass: null,
			selector: Selector.select
		},

		_conf: null,
		_params: null,
		_currentPage: null,
		_displayedPage: null,
		_displayedBlocks: [],
		_handlerManager: null,

		// --- METHODS

		// Initializes the zumo object with the passed root parameter as the base DOM element to make selections on
		init: function(root, conf, params) {

			Log.info("Initializing Zumo object with root " + root);

			// Checking for root
			if (typeof root !== "object") {
				Log.error("No root passed when initializing Zumo");
				return;
			}
			this.root = root;

			this._displayedBlocks = [];

			// Checking for conf
			if (typeof conf == "string") {
				Log.info("Initializing with remote configuration: " + conf);
				var confLoader = new Loader();
				//TODO: Check that conf looks like a URL
				confLoader.load(conf, this._onConfLoaded, this);
			} else if (typeof conf == "object") {
				Log.info("Initializing with object configuration");
				this._conf = conf;
			} else {
				Log.error("No conf passed when initializing Zumo");
				return;
			}

			// Setting the params
			this._params = params || {};
			//TODO: Merge conf with params.

			this._handlerManager = new HandlerManager(this);

			// Create the initial session
			this.session.id = this._params.id || this._createSessionId();
			this.session.root = root;
			this.session.defaultPropName = this._DEFAULT_PROP_NAME;
			
			this._initViewMasters();
			this._initStateManagers();
			this._initCommandMasters();

			Log.info("New Zumo session created with id: " + this.session.id);

		},

		// Unsets the zumo object cleaning up configuration and references
		destroy: function() {
			Log.debug("Destroying Zumo object");
			this.session = {};
			this.root = this._conf = this._params = this._currentPage = this._displayedPage = null;
		},

		// Returns whether the Zumo object is initialized
		isInit: function() {
			return this.root != null && this._conf != null;
		},

		// Displays a specific page by id, taking out the page currently displayed
		goto: function(id, params) {

			Log.info("Going to page " + id);

			if (!this.isInit()) {
				Log.warn("Cannot goto " + id + " - Zumo is not yet initalized");
				return;
			}

			params = params || {};

			if (this._currentPage != null) {
				Log.debug("currentPage id = " + this._currentPage.id);
				if (id == this._currentPage.context.id) {
					Log.info("No page to goto - we are already in " + id);
					return;
				}
			} else {
				Log.debug("currentPage is null");
			}

			// Get the page from the conf
			var pageContext = this.getPageContext(id);
			if (!pageContext || typeof pageContext !== "object") {
				Log.error("No page context found with id: " + id);
				return;
			}

			//TODO: Implement aliases
			//TODO: Check wether that page is already being requested

			var request = {
				id: id,
				params: params,
				referrer: this._currentPage
			};
			var page = PageBlockBuilder.createPage(pageContext, request, this.session);

			this.onPageRequest(pageContext, request);

			// Check we have a proper page
			if (page.master == null)
				return;

			// Clear the currently displayed page
			if (this._currentPage != null)
				this._currentPage.master.clear();

			page.master.display();
			this._currentPage = page;

			this._displayedPage = page;

			this._displayDepends(page);

		},

		getPageContext: function(id) {

			if (!this.isInit()) {
				Log.warn("Cannot get page context (" + id + ")- Zumo is not yet initalized");
				return;
			}

			if (this._conf.views == null) {
				Log.info("Cannot get page context since there are no views configured");
				return;
			}

			var pageContext;
			for (var i = 0; i < this._conf.views.pages.length; i++) {
				var iPageContext = this._conf.views.pages[i];
				if (iPageContext.id == id) {
					pageContext = iPageContext;
					break;
				}
			}

			return pageContext;

		},

		getPageContexts: function() {
			return this._conf.views.pages;
		},

		getDisplayedPage: function() {
			return this._displayedPage;
		},

		getCurrentPage: function() {
			return this._currentPage;
		},

		// Displays a specific block by id
		displayBlock: function(id, params) {

			Log.info("Displaying block " + id);

			if (!this.isInit()) {
				Log.warn("Cannot display " + id + " - Zumo is not yet initalized");
				return;
			}

			params = params || {};

			var block = this.getDisplayedBlock(id);

			// Check whether the block is already displayed
			if (block) {

				// If it's a depends block, add the caller.
				if (params[this._PARAM_NAME_CALLER]) {
					block.addCaller(params[this._PARAM_NAME_CALLER]);
				} else {
					block.addCaller(block.id);
				}

				Log.info("No block to display - the block is already displayed: " + id);

			} else {

				// Get the block from the conf
				var blockContext = this.getBlockContext(id);
				if (!blockContext || typeof blockContext !== "object") {
					Log.error("No block context found with id: " + id);
					return;
				}

				//TODO: Implement aliases
				//TODO: Check wether that block is already being requested

				var request = {
					id: id,
					params: params
				};
				block = PageBlockBuilder.createBlock(blockContext, request, this.session);

				// Check we have a proper block
				if (block.master == null)
					return;

				// Add the caller
				if (params[this._PARAM_NAME_CALLER]) {
					block.request.caller = params[this._PARAM_NAME_CALLER];
				} else {
					block.request.caller = block.id;
				}
				block.addCaller(block.request.caller);

				block.master.display();
				this._addDisplayedBlock(block);

			}

		},

		clearBlock: function(id) {

			Log.info("Clearing block " + id);

			var block = this.getDisplayedBlock(id);

			if (!block) {
				Log.info("There is no block to clear with id " + id);
				return;
			}

			if (block.master.isCleared) {
				Log.info("The block is already being cleared: " + id);
				return;
			}

			block.master.destroy(); //TODO: Implement clear.
			this._removeDisplayedBlock(id);

			this._clearDepends(block);

		},

		getBlockContext: function(id) {

			if (!this.isInit()) {
				Log.warn("Cannot get block context (" + id + ")- Zumo is not yet initalized");
				return;
			}

			if (this._conf.views == null) {
				Log.info("Cannot get block context since there are no views configured");
				return;
			}

			var blockContext;
			for (var i = 0; i < this._conf.views.blocks.length; i++) {
				var iBlockContext = this._conf.views.blocks[i];
				if (iBlockContext.id == id) {
					blockContext = iBlockContext;
					break;
				}
			}

			return blockContext;

		},

		getBlockContexts: function() {
			return this._conf.views.blocks;
		},

		getDisplayedBlock: function(id) {
			var block;
			for (var i = 0; i < this._displayedBlocks.length; i++) {
				if (this._displayedBlocks[i].id == id) {
					block = this._displayedBlocks[i];
					break;
				}
			}
			return block;
		},

		registerViewMaster: function(name, master) {
			if (StringUtils.trim(name) == "") {
				Log.warn("Cannot register a view master with an empty name");
				return;
			}
			if (typeof master != "function") {
				Log.warn("Cannot register view master with name " + name + " - master is not a function");
				return;
			}
			if (this.session.viewMasters[name] == null) {
				this.session.viewMasters[name] = master;
			} else {
				Log.warn("Cannot register view master with name " + name + " - there is already registered a master" +
						"with that name")
			}
		},

		unregisterViewMaster: function(name) {
			this.session.viewMasters[name] = null;
		},

		registerStateManager: function(name, manager) {
			if (StringUtils.trim(name) == "") {
				Log.warn("Cannot register a state manager with an empty name");
				return;
			}
			if (typeof manager != "function") {
				Log.warn("Cannot register state manager with name " + name + " - manager is not a function");
				return;
			}
			if (this.session.stateManagers[name] == null) {
				this.session.stateManagers[name] = manager;
			} else {
				Log.warn("Cannot register state manager with name " + name + " - there is already registered a manager" +
						"with that name")
			}
		},

		unregisterStateManager: function(name) {
			this.session.stateManagers[name] = null;
		},

		execute: function(id, params) {

			Log.info("Executing command " + id);

			if (!this.isInit()) {
				Log.warn("Cannot execute " + id + " - Zumo is not yet initalized");
				return;
			}

			params = params || {};

			// Get the command from the conf
			var commandContext = this.getCommandContext(id);
			if (!commandContext || typeof commandContext !== "object") {
				Log.error("No command context found with id: " + id);
				return;
			}

			var request = {
				id: id,
				params: params
			};
			var command = CommandBuilder.createCommand(commandContext, request, this.session);

			command.master.execute(request);

		},

		getCommandContexts: function() {
			return this._conf.commands;
		},

		getCommandContext: function(id) {

			if (!this.isInit()) {
				Log.warn("Cannot get command context (" + id + ")- Zumo is not yet initalized");
				return;
			}

			if (this._conf.commands == null || this._conf.commands.length == 0) {
				Log.info("Cannot get block context since there are no commands configured");
				return;
			}

			var commandContext;
			for (var i = 0; i < this._conf.commands.length; i++) {
				var iCommandContext = this._conf.commands[i];
				if (iCommandContext.id == id) {
					commandContext = iCommandContext;
					break;
				}
			}

			return commandContext;

		},

		registerCommandMaster: function(name, master) {
			if (StringUtils.trim(name) == "") {
				Log.warn("Cannot register a command master with an empty name");
				return;
			}
			if (typeof master != "function") {
				Log.warn("Cannot register command master with name " + name + " - command is not a function");
				return;
			}
			if (this.session.commandMasters[name] == null) {
				this.session.commandMasters[name] = master;
			} else {
				Log.warn("Cannot register command master with name " + name + " - there is already registered a master" +
						"with that name")
			}
		},

		unregisterCommandMaster: function(name) {
			this.session.commandMasters[name] = null;
		},

		observe: function(fName, hook, priority) {
			Agent.observe(this, fName, hook, priority);
		},

		ignore: function(fName, hook) {
			Agent.ignore(this, fName, hook);
		},

		_initViewMasters: function() {
			ViewMasters.init();
			for (var p in this._VIEW_MASTERS) {
				var masterName = this._VIEW_MASTERS[p];
				this.registerViewMaster(p, ViewMasters[masterName]);
			}
			this.session.defaultViewMasterClass = this.session.viewMasters[this._DEFAULT_VIEW_TYPE];
		},

		_initStateManagers: function() {
			StateManagers.init();
			for (var p in this._STATE_MANAGERS) {
				var managerName = this._STATE_MANAGERS[p];
				this.registerStateManager(p, StateManagers[managerName]);
			}
			this.session.defaultStateManagerClass = this.session.stateManagers[this._DEFAULT_STATE_MANAGER];
		},

		_initCommandMasters: function() {
			CommandMasters.init();
			for (var p in this._COMMAND_MASTERS) {
				var masterName = this._COMMAND_MASTERS[p];
				this.registerCommandMaster(p, CommandMasters[masterName]);
			}
			this.session.defaultCommandMasterClass = this.session.commandMasters[this._DEFAULT_COMMAND_TYPE];
		},

		_onConfLoaded: function(xmlHttp) {
			Log.info("Conf was loaded");
			Log.debug(xmlHttp);
			//TODO: Check whether it is XML or JSON, etc.
			this._conf = XmlConfParser.parse(xmlHttp.responseXML, this.session);
			//TODO: Check for error
			this._handlerManager.registerHandlers();
			this.onConfLoaded();
		},

		_createSessionId: function() {
			if (window._nZumo == null)
				window._nZumo = 0;
			window._nZumo++;
			return _NAME + window._nZumo;
		},

		_addDisplayedBlock: function(block) {
			if (!this.getDisplayedBlock(block.id))
				this._displayedBlocks.push(block);
		},

		_removeDisplayedBlock: function(id) {
			var i;
			for (i = 0; i < this._displayedBlocks.length; i++) {
				if (this._displayedBlocks[i].id == id)
					break;
			}
			this._displayedBlocks.splice(i, 1);
		},

		_displayDepends: function(pageBlock) {
			
			Log.debug("Displaying depends for " + pageBlock.id)

			if (!pageBlock)
				return;

			var a = this._getFlattenedDepends(pageBlock);

			for (var i = 0; i < a.length; i++) {
				var params = {};
				params[this._PARAM_NAME_CALLER] = pageBlock.id;
				this.displayBlock(a[i], params);
			}

			// If the caller is a page, remove the previous page's obsolete depends.
			if (pageBlock.context.node == "page") {
				var prevPage = pageBlock.request.referrer;
				if (prevPage != null)
					this._clearDepends(prevPage);
			}

		},

		_clearDepends: function(pageBlock) {

			Log.debug("Clearing depends for " + pageBlock.id)

			if (!pageBlock)
				return;

			var a = this._getFlattenedDepends(pageBlock);

			for (var i = 0; i < a.length; i++) {
				var block = this.getDisplayedBlock(a[i]);
				if (!block)
					continue;
				block.removeCaller(pageBlock.id);
				if (block.getCallers().length == 0)
					this.clearBlock(block.id);
			}

		},

		_getFlattenedDepends: function(o, aInit) {

			// Create the array containing depends names or set it to an initial one.
			var a = aInit || [];
			var depends = o.depends;
			if (!depends && o.context)
				depends = o.context.depends;
			if (!depends)
				return [];


			// Iterate through all depends in this context.
			for (var i = 0; i < depends.length; i++) {

				// Get the name.
				var id = depends[i];

				// If it's already in the array, continue.
				if (a.indexOf(id) != -1)
					continue;

				// Add the depends and subdepends to the array.
				a.push(id);
				var blockContext = this.getBlockContext(id);
				this._getFlattenedDepends(blockContext, a);

			}

			return a;

		},

		// --- EVENTS

		onConfLoaded: function() {},
		onPageRequest: function(context, request) {}

	};


	// ************************************************************************************************************
	// EXTENSION POINTS
	// ************************************************************************************************************


	// *** ZUMO EXT OBJECT

	var ZumoExt = {

		// -- METHODS

		addHandlerBinder: function(bindFunction, unbindFunction, setAsDefault) {
			//TODO: Implement setAsDefault
			HandlerManager.prototype._bindHandler = bindFunction;
			HandlerManager.prototype._unbindHandler = unbindFunction;
		},

		setSelector: function(selector) {
			if (selector && typeof selector == "function") {
				Zumo.session.selector = selector;
			} else {
				Log.warn("Could not create a selector function from " + selector);
			}
		}
		
	};


	// ************************************************************************************************************
	// INIT
	// ************************************************************************************************************


	// Expose the global Zumo objects
	window.Zumo = Zumo;
	window.ZumoExt = ZumoExt;
	window.ZumoAgent = Agent;


})(this);