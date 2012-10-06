/*

 DECLARATION OF IMPLICIT OBJECTS ACCROSS THE ZUMO FRAMEWORK

 session:       {id:String, root:Object, defaultPropName:String, viewMasters:Array, defaultViewMasterClass:Object,
                 commandMasters:Array, defaultCommandMasterClass:Object}

 request:       {id:String, params:Object}

 context:       {id:String, type:String, target:String, container:String, manager:String, title:String, props: Object,
                 propContexts:Array, handlers:Array, node:String, parent:String, level:number}

 propContext:   {name:String, value:*, target:String}

 */
(function(window) {


    var _NAME = "Zumo",
        _VERSION = "0.2";
    

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

        create: function(f, context, args) {
            return function () {
                f.apply(context, args);
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

        extend: function(child, supertype) {
            child.prototype.__proto__ = supertype.prototype;
        },

        mix: function() {
            var arg,
                prop,
                child = {};
            for (arg = 0; arg < arguments.length; arg++) {
                for (prop in arguments[arg]) {
                    if (arguments[arg].hasOwnProperty(prop))
                        child[prop] = arguments[arg][prop];
                }
            }
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
                //TODO: Consider using hasOwnProperty.
                for (p in o)
                    target[p] = o[p];
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

    var DomUtils = {

        getChildren: function(o, name) {
            var children = [],
                i,
                child;
            if (o && o.childNodes.length) {
                for (i = 0; i < o.childNodes.length; i++) {
                    child = o.childNodes[i];
                    if (child.nodeType == 1 && (!name || child.nodeName == name))
                        children.push(child);
                }
            }
            return children;
        }

    };


    // *** SELECTOR - OBJECT

    var Selector = {

        // --- METHODS

        select: function(selector, container) {
            // Setting container to document anyway in the default selector since we use getElementById
            container = document;
            return container.getElementById(selector.substr(1));
        }

    };


    // *** LOADER - CONSTRUCTOR

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

            var onState = this.onState,
                thisObject = this;

            this.callback = onLoaded;
            this.callbackObject = callbackObject;

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


    // *** PROPS MANAGER - OBJECT

    var PropsManager = {

        // --- METHODS

        apply: function(target, propContexts, session) {

            var i,
                propContext,
                nTarget,
                name;

            if (!target || !propContexts)
                return;

            // Merge the props
            for(i = 0; i < propContexts.length; i++) {
                propContext = propContexts[i];
                nTarget = target;
                if (propContext.target)
                    nTarget = session.selector(propContext.target, target);
                if (nTarget) {
                    name = propContext.name || session.defaultPropName;
                    nTarget[name] = propContext.value;
                }
            }

        }

    };


    // *** PARAMS MANAGER - OBJECT

    var ParamsManager = {

        // --- METHODS

        apply: function(target, params, session) {

            var i,
                param;

            //TODO: Add checks

            // Merge the params
            for(i = 0; i < params.length; i++) {
                param = params[i];
                target[param.name] = param.value;
            }

        }

    };


    // *** PAGE - CONSTRUCTOR

    var Page = function (context, request, session) {
        this.id = context.id;
        this.context = context;
        this.request = request;
        this.session = session;
        // --
        // Implementing:
        // this.master = null;
    };


    // *** BLOCK - CONSTRUCTOR

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
            var contains = false,
                i;
            for (i = 0; i < this._callers; i++) {
                if (this._callers[i] == id) {
                    contains = true;
                    break;
                }
            }
            return contains;
        },

        getCallers: function() {
            return this._callers;
        }

    };


    // *** PAGE BLOCK BUILDER - OBJECT

    var PageBlockBuilder = {

        // --- METHODS

        createPage: function(context, request, session) {

            var page = new Page(context, request, session),
                stateManager = this._buildStateManager(context, session);

            page.master = this._buildMaster(context, request, session, stateManager);
            stateManager.master = page.master;

            return page;

        },

        createBlock: function(context, request, session) {

            var block = new Block(context, request, session),
                stateManager = this._buildStateManager(context, session);

            block.master = this._buildMaster(context, request, session, stateManager);
            stateManager.master = block.master;

            return block;

        },

        _buildMaster: function(context, request, session, stateManager) {

            var masterClass,
                master,
                type = StringUtils.trim(context.type).toLowerCase();

            if (type != "") {
                masterClass = session.viewMasters[type];
            } else {
                masterClass = session.defaultViewMasterClass;
            }

            if (masterClass) {
                if (typeof masterClass == "function") {
                    master = new masterClass(context, request, session, stateManager);
                } else {
                    Log.error("The type '" + type + "' in " + context.id + " cannot create a new page");
                }
            } else {
                Log.error("The type '" + type + "' cannot be resolved in page: " + context.id);
            }

            return master;

        },

        _buildStateManager: function(context, session) {

            var stateManagerClass,
                stateManager,
                manager = StringUtils.trim(context.manager).toLowerCase();

            if (manager != "") {
                stateManagerClass = session.stateManagers[manager];
            } else {
                stateManagerClass = session.defaultStateManagerClass;
            }

            if (stateManagerClass) {
                if (typeof stateManagerClass == "function") {
                    stateManager = new stateManagerClass(null, session);
                } else {
                    Log.error("The manager '" + manager + "' in " + context.id + " cannot create a valid state manager");
                }
            } else {
                Log.error("The manager '" + manager + "' cannot be resolved in: " + context.id);
            }

            return stateManager;

        }

    };


    // *** VIEW MASTERS - OBJECT

    var ViewMasters = {

        // --- METHODS - Using init method to create class functions as ViewMasters members

        init: function() {


            // *** ABSTRACT MASTER - CONSTRUCTOR

            var AbstractMaster = this.AbstractMaster = function(context, request, session, stateManager) {

                var fMediator;

                this.context = context;
                this.request = request;
                this.session = session;
                this.stateManager = stateManager;
                this.isCleared = false;

                //TODO: Move this to PageBlockBuilder
                if (this.context.mediator) {
                    fMediator = ObjectUtils.find(this.context.mediator);
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
                    var containerName;
                    Log.info("Displaying " + this.context.id + " with target " + this.context.target);
                    this.onDisplay(this);
                    containerName = StringUtils.trim(this.context.container);
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
                    this.onClear(this);
                    if (this.stateManager)
                        this.stateManager.setState(StateManagers.STATE_OUT);
                },

                init: function() {

                    Log.debug("Initializing " + this.context.id);

                    if (this.target) {

                        PropsManager.apply(this.target, this.context.propContexts, this.session);
                        ObjectUtils.merge(this.target, this.request.params);

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

                    this.onInit(this);

                },

                onStateChange: function(target, state) {
                    if (state == StateManagers.STATE_IN) {
                        this.onIn(this);
                    } else if (state == StateManagers.STATE_ON) {
                        this.onOn(this);
                    } else if (state == StateManagers.STATE_OUT) {
                        this.onOut(this);
                    } else if (state == StateManagers.STATE_OFF) {
                        this.onOff(this);
                        this.destroy();
                    }
                },

                // Default event handlers
                onDisplay: function(master) {},
                onClear: function(master) {},
                onInit: function(master) {},
                onIn: function(master) {},
                onOn: function(master) {},
                onOut: function(master) {},
                onOff: function(master) {}

            };


            // *** DOM MASTER - CONSTRUCTOR

            var DomMaster = this.DomMaster = this.createViewMaster({

                display: function() {

                    Log.debug("DomMaster display: " + this.context.id);

                    this.target = this.session.selector(this.context.target);
                    if (this.target == null) {
                        Log.error("Invalid target for page " + this.context.id + ": " + this.context.target);
                        return;
                    }

                    if (this.cloneDom) {
                        this.target = this.target.cloneNode(true);
                        this.container.appendChild(this.target);
                    }

                    this.originalDisplay = this._getStyle(this.target, "display");
                    this.originalVisibility = this._getStyle(this.target, "visibility");
                    if (this.originalDisplay == "none")
                        this.target.style.display = "inherit";
                    if (this.originalVisibility == "hidden")
                        this.target.style.visibility = "visible";

                    this.init();

                },

                destroy: function() {
                    Log.debug("DomMaster destroy: " + this.context.id);
                    this.target.style.display = this.originalDisplay;
                    this.target.style.visibility = this.originalVisibility;
                    if (this.cloneDom)
                        this.container.removeChild(this.target);
                },

                _getStyle: function(target, style) {
                    var value,
                        computedStyle;
                    if (target.currentStyle) {
                        value = target.currentStyle[style];
                    } else if (window.getComputedStyle) {
                        computedStyle = window.getComputedStyle(target, null);
                        if (computedStyle)
                            value = computedStyle.getPropertyValue(style);
                    }
                    return value;
                }

            }, AbstractMaster);


            // *** DOM CLONE MASTER - CONSTRUCTOR

            var DomCloneMaster = this.DomCloneMaster = this.createViewMaster({

                cloneDom: true

            }, DomMaster);


            // *** LOADER MASTER - CONSTRUCTOR

            var LoaderMaster = this.LoaderMaster = this.createViewMaster({

                display: function() {
                    Log.debug("LoaderMaster display");
                    this.loader = new Loader();
                    this.loader.load(this.context.target, this.onLoaded, this);
                },

                destroy: function() {
                    Log.debug("LoaderMaster destroy");
                    this.container.innerHTML = "";
                },

                onLoaded: function(xmlHttp) {
                    Log.debug("LoaderMaster received content");
                    this.target = xmlHttp.responseText;
                    this.container.innerHTML = this.target;
                    this.init();
                }

            }, AbstractMaster);


            // *** BUILDER MASTER - CONSTRUCTOR

            var BuilderMaster = this.BuilderMaster = this.createViewMaster({

                display: function() {
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
                    Log.debug("BuilderMaster destroy");
                    if (typeof this.builder.destroy == "function")
                        this.builder.destroy();
                    if (this.target)
                        this.container.removeChild(this.target);
                },

                init: function() {
                    PropsManager.apply(this.builder, this.context.propContexts, this.session);
                    ObjectUtils.merge(this.builder, this.request.params);
                }

            }, AbstractMaster);


            // *** VOID MASTER - CONSTRUCTOR

            var VoidMaster = this.VoidMaster = this.createViewMaster({

                display: function () {
                    this.init();
                },

                clear: function () {
                    this.destroy();
                }

            }, AbstractMaster);


        },

        createViewMaster: function(conf, parent) {

            var viewMaster,
                p;

            conf = conf || {};
            parent = parent || this.AbstractMaster;

            // Constructor function, calling parent with arguments.
            viewMaster = function() {
                parent.apply(this, arguments);
            };

            // Extending.
            viewMaster.prototype = new parent(arguments);

            //TODO: Move this to Agent.extend
            // If the function is already on the parent, observe and hook, otherwise merge.
            for (p in conf) {
                if (conf.hasOwnProperty(p)) {
                    if (typeof conf[p] == "function" && typeof viewMaster.prototype[p] == "function") {
                        Agent.observe(viewMaster.prototype, p, conf[p], viewMaster);
                    } else {
                        viewMaster.prototype[p] = conf[p];
                    }
                }
            }

            return viewMaster;

        }

    };


    // *** STATE MANAGERS - OBJECT

    var StateManagers = {

        // --- PROPERTIES

        STATE_IN: "IN",
        STATE_ON: "ON",
        STATE_OUT: "OUT",
        STATE_OFF: "OFF",

        // --- METHODS - Using init method to create class functions as StateManagers members

        init: function() {


            // *** BASE IO3 MANAGER - CONSTRUCTOR

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
                    if (state != StateManagers.STATE_IN && state != StateManagers.STATE_ON &&
                        state != StateManagers.STATE_OUT && state != StateManagers.STATE_OFF) {
                        Log.warn("Unknown state, returning without changing state for target " + this.target);
                        return;
                    }
                    if (state != this._state) {
                        this._state = state;
                        this._changeState();
                    }
                },

                doIn: function() {
                    this.setState(StateManagers.STATE_ON);
                },

                doOn: function() {
                    // Empty
                },

                doOut: function() {
                    this.setState(StateManagers.STATE_OFF);
                },

                doOff: function() {
                    // Empty
                },

                _changeState: function() {

                    this.onStateChange(this.target, this._state);

                    if (this._state == StateManagers.STATE_IN) {
                        this.doIn();
                    } else if (this._state == StateManagers.STATE_ON) {
                        this.doOn();
                    } else if (this._state == StateManagers.STATE_OUT) {
                        if (this.target != null) {
                            this.doOut();
                        } else {
                            Log.info("target is null when trying to set state to OUT, setting state to OFF instead " +
                                     "of calling doOut to avoid errors.");
                            this._state = StateManagers.STATE_OFF;
                        }
                    } else if (this._state == StateManagers.STATE_OFF) {
                        this.doOff();
                    }

                },

                onStateChange: function(target, state) {
                    // Empty
                }

            };


            // *** INIT - Initializing StateManagers

            this.BaseIo3Manager = BaseIo3Manager;


        },

        createStateManager: function() {

            var stateManager,
                useConfArgument = typeof arguments[0] == "object",
                conf = useConfArgument ? arguments[0] : {},
                parent = useConfArgument ? arguments[1] : arguments[2];

            // Set default parent for the manager if not provided.
            parent = parent || this.BaseIo3Manager;

            if (!useConfArgument) {
                if ((typeof arguments[0] == "function") && (typeof arguments[1] == "function")) {
                    conf.doIn = arguments[0];
                    conf.doOut = arguments[1];
                } else {
                    Log.warn("Malformed call to createStateManager - either createStateManager(conf, [parent]) or " +
                             "createStateManager(doIn, doOut, [parent]) are allowed.");
                }
            }

            // Constructor function, calling parent with arguments.
            stateManager = function() {
                parent.apply(this, arguments);
            };

            // Extending.
            stateManager.prototype = new parent();
            ObjectUtils.merge(stateManager.prototype, conf);

            return stateManager;

        }

    };


    // *** COMMAND - CONSTRUCTOR

    var Command = function (context, request, session) {
        this.id = context.id;
        this.context = context;
        this.request = request;
        this.session = session;
        // --
        // Implementing:
        // this.master = null;
    };


    // *** COMMAND BUILDER - OBJECT

    var CommandBuilder = {

        // --- METHODS

        createCommand: function(context, request, session) {
            var command = new Command(context, request, session);
            command.master = this._buildMaster(context, request, session);
            return command;
        },

        _buildMaster: function(context, request, session) {

            var masterClass,
                master,
                type = StringUtils.trim(context.type).toLowerCase();

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


    // *** COMMAND MASTERS - OBJECT

    var CommandMasters = {

        // --- METHODS - Using init method to create class functions as CommandMasters members

        init: function() {


            // *** ABSTRACT MASTER - CONSTRUCTOR

            var AbstractMaster = function(context, request, session) {
                this.context = context;
                this.request = request;
                this.session = session;
                this.isExecuted = false;
            };

            AbstractMaster.prototype = {

                execute: function() {
                    Log.debug("Initializing " + this.context.id);
                }

            };


            // *** FUNCTION MASTER - CONSTRUCTOR

            var FunctionMaster = function(context, request, session) {
                AbstractMaster.call(this, context, request, session);
                //TODO: See how to configure the master properties.
            };

            FunctionMaster.prototype = {

                execute: function() {
                    AbstractMaster.prototype.execute.apply(this, arguments); // Call super
                    var f = ObjectUtils.find(this.context.target),
                        args = [],
                        data = {};
                    ObjectUtils.merge(data, [this.context.props, this.request.params]);
                    if (data._args && data._args.length)
                        args = data._args.slice(0);
                    if (!ObjectUtils.isEmpty(data))
                        args.push(data);
                    if (typeof f == "function") {
                        f.apply(null, args); //TODO: Check the this context.
                    } else {
                        Log.warn("There is no function to execute for command '" + this.context.id + "' and target '" +
                            this.context.target + "'.");
                    }
                    this.isExecuted = true;
                }

            };


            // *** INIT - Initializing CommandMasters

            this.AbstractMaster = AbstractMaster;
            this.FunctionMaster = FunctionMaster;

            //ObjectUtils.extend(this.FunctionMaster, this.AbstractMaster);

        }

    };


    // *** XML CONF PARSER - OBJECT

    var XmlConfParser = {

        // --- METHODS

        parse: function(conf, session) {
            // TODO: Check for XML
            // TODO: Parse top level props
            var confObject = {};
            confObject.views = this._parseViews(conf, session);
            confObject.commands = this._parseCommands(conf, session);
            return confObject;
        },

        _parseViews: function(conf, session) {

            var viewNodes = conf.getElementsByTagName("views"),
                views = {
                    pages: [],
                    blocks: []
                },
                nodeName,
                pageNodes,
                blockNodes,
                pageContext,
                blockContext,
                i;

            if (viewNodes.length > 1) {
                Log.warn("There can only be zero or one views nodes on the XML configuration, there were " +
                         viewNodes.length + " views nodes found");
                return null;
            } else if (viewNodes.length == 0) {
                Log.info("No views to parse");
                return null;
            }

            nodeName = "page";
            pageNodes = viewNodes[0].getElementsByTagName(nodeName);
            for (i = 0; i < pageNodes.length; i++) {
                pageContext = this._parsePageBlock(pageNodes[i], session);
                if (pageContext) {
                    pageContext.node = nodeName;
                    this._mergeAttributes(pageContext, pageNodes[i], ["parent"]);
                    pageContext.parentId = pageContext.parent;
                    pageContext.parent = null;
                    pageContext.children = [];
                    views.pages.push(pageContext);
                }
            }

            nodeName = "block";
            blockNodes = viewNodes[0].getElementsByTagName(nodeName);
            for (i = 0; i < blockNodes.length; i++) {
                blockContext = this._parsePageBlock(blockNodes[i], session);
                if (blockContext) {
                    blockContext.node = nodeName;
                    views.blocks.push(blockContext);
                }
            }

            return views;

        },

        _parsePageBlock: function(conf, session) {
            var pageBlockContext = {},
                dependsValue,
                depends;
            this._mergeAttributes(pageBlockContext, conf, ["id", "type", "mediator", "target", "container", "manager",
                                  "title"]);
            dependsValue = conf.attributes.getNamedItem("depends");
            if (dependsValue) {
                depends = dependsValue.nodeValue.replace(/\s/g, "").split(",");
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

            var commandsNodes = conf.getElementsByTagName("commands"),
                commands = [],
                commandNodes,
                commandContext,
                i;

            if (commandsNodes.length > 1) {
                Log.warn("There can only be zero or one commands nodes on the XML configuration, there were " +
                         commandsNodes.length + " commands nodes found");
            } else if (commandsNodes.length == 0) {
                Log.info("No commands to parse");
            } else {
                commandNodes = commandsNodes[0].getElementsByTagName("command");
                for (i = 0; i < commandNodes.length; i++) {
                    commandContext = {};
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

            var propNodes = DomUtils.getChildren(conf, "prop"),
                propContexts = [],
                propContext,
                i;

            for (i = 0; i < propNodes.length; i++) {
                propContext = this._parsePropContext(propNodes[i], session);
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

            var propContext = {},
                hasChildren,
                itemNodes,
                propNodes,
                propNode,
                nodeValue,
                i;

            this._mergeAttributes(propContext, conf, ["name", "value"]);

            hasChildren = DomUtils.getChildren(conf).length > 0;
            itemNodes = DomUtils.getChildren(conf, "item");
            propNodes = DomUtils.getChildren(conf, "prop");

            if (hasChildren) {

                if (propContext.value) {

                    Log.warn("Both value attribute and children nodes found on prop: '" + propContext.name + "'. " +
                             "Only value attribute will be used.");

                } else {

                    if (propNodes.length > 0) {

                        if (itemNodes.length > 0)
                            Log.warn("Both prop and item nodes found on prop: '" + propContext.name + "'. " +
                                     "Only prop nodes will be used.");

                        propContext.value = {};

                        for (i = 0; i < propNodes.length; i++) {
                            propNode = propNodes[i];
                            nodeValue = propNode.attributes.getNamedItem("name").nodeValue;
                            propContext.value[nodeValue] = this._parsePropValue(propNode);
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
                        Log.warn("Both value attribute and text content found on prop: '" + propContext.name + "'. " +
                                 "Only value attribute will be used.");

                } else {

                    propContext.value = conf.firstChild.nodeValue;

                }

            }

            return propContext.value;

        },

        _getPropsFromPropContexts: function(propContexts) {
            var props = {},
                i;
            for (i = 0; i < propContexts.length; i++)
                props[propContexts[i].name] = propContexts[i].value;
            return props;
        },

        _mergeAttributes: function(o, element, list) {
            var i,
                name,
                value;
            for (i = 0; i < list.length; i++) {
                name = list[i];
                if (name && StringUtils.trim(name) != "") {
                    value = element.attributes.getNamedItem(name);
                    if (value)
                        o[name] = value.nodeValue;
                }
            }
        },

        _parseHandlers: function(conf, session) {

            var handlerNodes = conf.getElementsByTagName("handler"),
                handlers = [],
                handlerContext,
                i;

            for (i = 0; i < handlerNodes.length; i++) {
                handlerContext = this._parseHandler(handlerNodes[i], session);
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
            this._mergeAttributes(handlerContext, conf, ["type", "target", "priority", "class", "at", "action",
                                  "priority"]);
            handlerContext.params = this._parseParams(conf, session);
            return handlerContext;
        },

        _parseParams: function(conf, session) {

            var paramNodes = conf.getElementsByTagName("param"),
                params = [],
                paramContext,
                i;

            for (i = 0; i < paramNodes.length; i++) {
                paramContext = this._parseParam(paramNodes[i], session);
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


    // *** HANDLER MANAGER - CONSTRUCTOR

    var HandlerManager = function(app) {
        this.app = app;
        this._activeHandlers = []; // of {handlerContext:Object, context:Object, contextType:String, f:Function}
        this._bindings = []; // of {type:String, f:Function, target:String}
        this.updateBindings = false;
        this.hasRegistered = false;
    };

    HandlerManager.prototype = {

        registerHandlers: function() {

            //TODO: Consider sorting on priorities

            var pageContexts = this.app.getPageContexts(),
                blockContexts = this.app.getBlockContexts(),
                commandContexts = this.app.getCommandContexts(),
                pageContext,
                blockContext,
                commandContext,
                i;

            if (this.hasRegistered)
                this.unregisterHandlers();

            for (i = 0; i < pageContexts.length; i++) {
                pageContext = pageContexts[i];
                this._registerHandlersFromContext(pageContext, "page");
            }

            for (i = 0; i < blockContexts.length; i++) {
                blockContext = blockContexts[i];
                this._registerHandlersFromContext(blockContext, "block");
            }

            for (i = 0; i < commandContexts.length; i++) {
                commandContext = commandContexts[i];
                this._registerHandlersFromContext(commandContext, "command");
            }

            this.hasRegistered = true;

            this.updateBindings = this._updateBindings();

            Log.debug("Will update bindings? " + this.updateBindings);

            if (this.updateBindings) {
                //TODO: XXX: Check performance of reevaluating the bindings so often.
                //TODO: XXX: Maybe we can use event bubbling, add all listeners to the body/root and check target match.
                Agent.observe(this.app, "onPageInit", this.onViewInit, this);
                Agent.observe(this.app, "onBlockInit", this.onViewInit, this);
            }

        },

        unregisterHandlers: function() {
            //TODO: Test
            var activeHandler;
            while (this._activeHandlers.length > 0) {
                activeHandler = this._activeHandlers.pop();
                this._removePageBlockHandlerAction(activeHandler);
            }
            Agent.ignore(this.app, "onPageInit", this.onViewInit);
            Agent.ignore(this.app, "onBlockInit", this.onViewInit);
        },

        _registerHandlersFromContext: function(context, contextType) {
            var activeHandler,
                i;
            for (i = 0; i < context.handlers.length; i++) {
                activeHandler = {
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

            var app = this.app,
                f,
                fGo = function() {
                    //TODO: Review params logic
                    var params = arguments[1],
                        page = app.getCurrentPage(),
                        ft;
                    if (!handlerContext.at || handlerContext.at == "" || handlerContext.at == page.id) {
                        if (page && pageContext.id == page.id) {
                            Log.debug("Handler " + handlerContext.type + "trigger when already at " + page.id);
                            ParamsManager.apply(page.master.target, handlerContext.params, this.session);
                        } else {
                            ft = Delegate.create(app.go, app, [pageContext.id, params]);
                            setTimeout(ft, 10);
                        }
                    }
                };

            if (handlerContext.action == "go" || handlerContext.action == "go" || handlerContext.action == "call" ||
                handlerContext.action == "" || handlerContext.action == null) {
                f = fGo;
            } else {
                Log.warn("Could not resolve handler action: " + handlerContext.action);
            }

            this._registerBinding(handlerContext.type, f, handlerContext.target);

            return f;

        },

        _createBlockHandlerAction: function(handlerContext, blockContext) {

            var app = this.app,
                f,
                fDisplay = function() {
                    //TODO: Review params logic
                    var params = arguments[1],
                        block;
                    if (!handlerContext.at || handlerContext.at == "" || handlerContext.at == app.getCurrentPage().id) {
                        block = app.getDisplayedBlock(blockContext.id);
                        if (block) {
                            ParamsManager.apply(block.master.target, handlerContext.params, this.session);
                        } else {
                            app.displayBlock(blockContext.id, params);
                        }
                    }
                },
                fClear = function() {
                    if (!handlerContext.at || handlerContext.at == "" || handlerContext.at == app.getCurrentPage().id)
                        app.clearBlock(blockContext.id);
                };

            if (handlerContext.action == "clearBlock") {
                f = fClear;
            } else if (handlerContext.action == "displayBlock" || handlerContext.action == "call" ||
                       handlerContext.action == "" || handlerContext.action == null) {
                f = fDisplay;
            } else {
                Log.warn("Could not resolve handler action: " + handlerContext.action);
            }

            this._registerBinding(handlerContext.type, f, handlerContext.target);

            return f;

        },

        _createCommandHandlerAction: function(handlerContext, commandContext) {

            var app = this.app,
                f,
                fExecute= function() {
                    var page = app.getCurrentPage(),
                        params;
                    if (!handlerContext.at || handlerContext.at == "" || handlerContext.at == page.id) {
                        //TODO: Review params logic
                        params = arguments[1];
                        app.execute(commandContext.id, params);
                    }
                };

            if (handlerContext.action == "execute" || handlerContext.action == "" || handlerContext.action == null) {
                f = fExecute;
            } else {
                Log.warn("Could not resolve handler action: " + handlerContext.action);
            }

            this._registerBinding(handlerContext.type, f, handlerContext.target);

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

        _registerBinding: function(type, handler, target) {
            this._bindings.push({type: type, f: handler, target: target});
        },

        _bindHandler: function(type, handler, target) {
            Log.info("There is no handler binder implemented");
            return true;
        },

        _unbindHandler: function(type, handler, target) {
            Log.info("There is no handler unbinder implemented");
            return true;
        },

        _updateBindings: function(shallow) {

            var binding,
                i,
                needsUpdate = false;

            for (i = 0; i < this._bindings.length; i++) {
                binding = this._bindings[i];
                //TODO: XXX: See whether it is necessary to remove the existing bindings.
                // Only update handlers with target.
                if (!shallow || binding.target) {
                    this._unbindHandler(binding.type, binding.f, binding.target);
                    if (!this._bindHandler(binding.type, binding.f, binding.target))
                        needsUpdate = true;
                }
            }

            return needsUpdate;

        },

        onViewInit: function() {
            //TODO: FIXME: It seems to accumulate bindings when using "dom" as master.
            this._updateBindings(true);
        }

    };


    // *** ZUMO - OBJECT

    //TODO: Make non-static so we can have several Zumo objects at a time.

    var Zumo = {

        // --- PROPERTIES

        ObjectUtils: ObjectUtils,
        ViewMasters: ViewMasters,
        StateManagers: StateManagers,

        _VIEW_MASTERS: {
            dom: "DomMaster",
            domclone: "DomCloneMaster",
            loader: "LoaderMaster",
            builder: "BuilderMaster",
            _void: "VoidMaster" // "void" is aliased to "void".
        },
        _DEFAULT_VIEW_TYPE: "dom",
        _STATE_MANAGERS: {
            base: "BaseIo3Manager"
        },
        _DEFAULT_STATE_MANAGER: "base",
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
            selector: Selector.select,
            confParsers: []
        },

        _conf: null,
        _params: null,
        _currentPage: null,
        _displayedPage: null,
        _displayedBlocks: [],
        _handlerManager: null,

        // --- METHODS

        startup: function() {

            // Add alias for go as goto, for compatibility.
            this["goto"] = this.go;

            // Add alias for go as goto, for compatibility.
            this._VIEW_MASTERS["void"] = this._VIEW_MASTERS._void;

            this._initViewMasters();
            this._initStateManagers();
            this._initCommandMasters();

        },

        // Initializes the zumo object with the passed root parameter as the base DOM element to make selections on
        init: function(root, conf, params) {

            root = root || document;
            conf = conf || root;
            this._params = params || {};
            //TODO: Merge conf with params.
            this.root = root;

            Log.info("Initializing Zumo object with root " + root);

            this._displayedBlocks = [];

            // Create the initial session
            this.session.id = this._params.id || this._createSessionId();
            this.session.root = root;
            this.session.defaultPropName = this._DEFAULT_PROP_NAME;
            this.session.confParsers.push(this._parseConf);

            this._handlerManager = new HandlerManager(this);
            this._initConf(conf);

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
        go: function(id, params) {

            var pageContext,
                request,
                page;

            Log.info("Going to page " + id);

            if (!this.isInit()) {
                Log.warn("Cannot go " + id + " - Zumo is not yet initalized");
                return;
            }

            params = params || {};

            if (this._currentPage != null) {
                Log.debug("currentPage id = " + this._currentPage.id);
                if (id == this._currentPage.context.id) {
                    Log.info("No page to go - we are already in " + id);
                    return;
                }
            } else {
                Log.debug("currentPage is null");
            }

            // Get the page from the conf
            pageContext = this.getPageContext(id);
            if (!pageContext || typeof pageContext !== "object") {
                Log.error("No page context found with id: " + id);
                return;
            }

            //TODO: Implement aliases
            //TODO: Check wether that page is already being requested

            request = {
                id: id,
                params: params,
                referrer: this._currentPage
            };
            page = PageBlockBuilder.createPage(pageContext, request, this.session);

            this.onPageRequest(pageContext, request);

            // Check we have a proper page
            if (page.master == null)
                return;

            // Hook events
            Agent.observe(page.master, "onDisplay", this.onPageDisplay, this);
            Agent.observe(page.master, "onClear", this.onPageClear, this);
            Agent.observe(page.master, "onInit", this.onPageInit, this);
            Agent.observe(page.master, "onIn", this.onPageIn, this);
            Agent.observe(page.master, "onOn", this.onPageOn, this);
            Agent.observe(page.master, "onOut", this.onPageOut, this);
            Agent.observe(page.master, "onOff", this.onPageOff, this);

            // Clear the currently displayed page
            if (this._currentPage != null)
                this._currentPage.master.clear();

            this._currentPage = page;
            page.master.display();
            this._displayedPage = page;
            this._displayDepends(page);

        },

        getPageContext: function(id) {

            var pageContext,
                i,
                iPageContext;

            if (!this.isInit()) {
                Log.warn("Cannot get page context (" + id + ")- Zumo is not yet initalized");
                return null;
            }

            if (this._conf.views == null) {
                Log.info("Cannot get page context since there are no views configured");
                return null;
            }

            for (i = 0; i < this._conf.views.pages.length; i++) {
                iPageContext = this._conf.views.pages[i];
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

        getPageContextsAt: function(level) {
            var a = [],
                i,
                pageContext;
            for (i = 0; i < this._conf.views.pages.length; i++) {
                pageContext = this._conf.views.pages[i];
                if (pageContext.level == level)
                    a.push(pageContext);
            }
            return a;
        },

        getDisplayedPage: function() {
            return this._displayedPage;
        },

        getCurrentPage: function() {
            return this._currentPage;
        },

        getPageLevel: function(id) {
            var level = 0,
                page = this.getPageContext(id);
            if (page.parentId != null)
                level = this.getPageLevel(page.parentId) + 1;
            return level;
        },

        // Displays a specific block by id
        displayBlock: function(id, params) {

            var block,
                request,
                blockContext;

            Log.info("Displaying block " + id);

            if (!this.isInit()) {
                Log.warn("Cannot display " + id + " - Zumo is not yet initalized");
                return;
            }

            params = params || {};

            block = this.getDisplayedBlock(id);

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
                blockContext = this.getBlockContext(id);
                if (!blockContext || typeof blockContext !== "object") {
                    Log.error("No block context found with id: " + id);
                    return;
                }

                //TODO: Implement aliases
                //TODO: Check wether that block is already being requested

                request = {
                    id: id,
                    params: params
                };
                block = PageBlockBuilder.createBlock(blockContext, request, this.session);

                this.onBlockRequest(blockContext, request);

                // Check we have a proper block
                if (block.master == null)
                    return;

                // Hook events
                Agent.observe(block.master, "onDisplay", this.onBlockDisplay, this);
                Agent.observe(block.master, "onClear", this.onBlockClear, this);
                Agent.observe(block.master, "onInit", this.onBlockInit, this);
                Agent.observe(block.master, "onIn", this.onBlockIn, this);
                Agent.observe(block.master, "onOn", this.onBlockOn, this);
                Agent.observe(block.master, "onOut", this.onBlockOut, this);
                Agent.observe(block.master, "onOff", this.onBlockOff, this);

                // Add the caller
                if (params[this._PARAM_NAME_CALLER]) {
                    block.request.caller = params[this._PARAM_NAME_CALLER];
                } else {
                    block.request.caller = block.id;
                }
                block.addCaller(block.request.caller);

                block.master.display();
                this._addDisplayedBlock(block);

                this._displayDepends(block);

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

            block.master.clear(); //TODO: Implement clear.
            this._removeDisplayedBlock(id);

            this._clearDepends(block);

        },

        getBlockContext: function(id) {

            var blockContext,
                i,
                iBlockContext;

            if (!this.isInit()) {
                Log.warn("Cannot get block context (" + id + ")- Zumo is not yet initalized");
                return null;
            }

            if (this._conf.views == null) {
                Log.info("Cannot get block context since there are no views configured");
                return null;
            }

            for (i = 0; i < this._conf.views.blocks.length; i++) {
                iBlockContext = this._conf.views.blocks[i];
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
            var block,
                i;
            for (i = 0; i < this._displayedBlocks.length; i++) {
                if (this._displayedBlocks[i].id == id) {
                    block = this._displayedBlocks[i];
                    break;
                }
            }
            return block;
        },

        getDisplayedBlocks: function(id) {
            return this._displayedBlocks;
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
                Log.warn("Cannot register view master with name " + name + " - there is already registered a master " +
                         "with that name")
            }
        },

        unregisterViewMaster: function(name) {
            this.session.viewMasters[name] = null;
        },

        createViewMaster: function() {

            // Proxy to ViewMasters.createViewMaster with the arguments passed without name, and register.
            var name = arguments[0],
                viewMaster = ViewMasters.createViewMaster.apply(ViewMasters, [].slice.call(arguments, 1));

            this.registerViewMaster(name, viewMaster);

            return viewMaster;

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
                Log.warn("Cannot register state manager with name " + name + " - there is already registered a " +
                         "manager with that name")
            }
        },

        unregisterStateManager: function(name) {
            this.session.stateManagers[name] = null;
        },

        createStateManager: function() {

            // Proxy to StateManagers.createStateManager with the arguments passed without name, and register.
            var name = arguments[0],
                stateManager = StateManagers.createStateManager.apply(StateManagers, [].slice.call(arguments, 1));

            this.registerStateManager(name, stateManager);

            return stateManager;

        },

        execute: function(id, params) {

            var commandContext,
                request,
                command;

            Log.info("Executing command " + id);

            if (!this.isInit()) {
                Log.warn("Cannot execute " + id + " - Zumo is not yet initalized");
                return;
            }

            params = params || {};

            // Get the command from the conf
            commandContext = this.getCommandContext(id);
            if (!commandContext || typeof commandContext !== "object") {
                Log.error("No command context found with id: " + id);
                return;
            }

            request = {
                id: id,
                params: params
            };
            command = CommandBuilder.createCommand(commandContext, request, this.session);

            command.master.execute(request);

        },

        getCommandContexts: function() {
            return this._conf.commands;
        },

        getCommandContext: function(id) {

            var commandContext,
                i,
                iCommandContext;

            if (!this.isInit()) {
                Log.warn("Cannot get command context (" + id + ")- Zumo is not yet initalized");
                return null;
            }

            if (this._conf.commands == null || this._conf.commands.length == 0) {
                Log.info("Cannot get block context since there are no commands configured");
                return null;
            }

            for (i = 0; i < this._conf.commands.length; i++) {
                iCommandContext = this._conf.commands[i];
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
                Log.warn("Cannot register command master with name " + name + " - there is already registered a " +
                         "master with that name")
            }
        },

        unregisterCommandMaster: function(name) {
            this.session.commandMasters[name] = null;
        },

        //TODO: Use mix function instead of the verbose proxy.
        observe: function(fName, hook, priority) {
            Agent.observe(this, fName, hook, priority);
        },

        //TODO: Use mix function instead of the verbose proxy.
        ignore: function(fName, hook) {
            Agent.ignore(this, fName, hook);
        },

        _initConf: function(conf) {
            var confLoader;
            if (typeof conf == "string") {
                Log.info("Initializing with remote configuration: " + conf);
                confLoader = new Loader();
                confLoader.load(conf, this._onConfLoaded, this);
            } else {
                this._processConf(conf)
            }
        },

        _initViewMasters: function() {
            var p,
                masterName;
            ViewMasters.init();
            for (p in this._VIEW_MASTERS) {
                masterName = this._VIEW_MASTERS[p];
                this.registerViewMaster(p, ViewMasters[masterName]);
            }
            this.session.defaultViewMasterClass = this.session.viewMasters[this._DEFAULT_VIEW_TYPE];
        },

        _initStateManagers: function() {
            var p,
                managerName;
            StateManagers.init();
            for (p in this._STATE_MANAGERS) {
                managerName = this._STATE_MANAGERS[p];
                this.registerStateManager(p, StateManagers[managerName]);
            }
            this.session.defaultStateManagerClass = this.session.stateManagers[this._DEFAULT_STATE_MANAGER];
        },

        _initCommandMasters: function() {
            var p,
                masterName;
            CommandMasters.init();
            for (p in this._COMMAND_MASTERS) {
                masterName = this._COMMAND_MASTERS[p];
                this.registerCommandMaster(p, CommandMasters[masterName]);
            }
            this.session.defaultCommandMasterClass = this.session.commandMasters[this._DEFAULT_COMMAND_TYPE];
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

            var a,
                params,
                prevPage,
                i;

            Log.debug("Displaying depends for " + pageBlock.id);

            if (!pageBlock)
                return;

            a = this._getFlattenedDepends(pageBlock);

            for (i = 0; i < a.length; i++) {
                params = {};
                params[this._PARAM_NAME_CALLER] = pageBlock.id;
                this.displayBlock(a[i], params);
            }

            // If the caller is a page, remove the previous page's obsolete depends.
            if (pageBlock.context.node == "page") {
                prevPage = pageBlock.request.referrer;
                if (prevPage != null)
                    this._clearDepends(prevPage);
            }

        },

        _clearDepends: function(pageBlock) {

            var a,
                i,
                block;

            Log.debug("Clearing depends for " + pageBlock.id)

            if (!pageBlock)
                return;

            a = this._getFlattenedDepends(pageBlock);

            for (i = 0; i < a.length; i++) {
                block = this.getDisplayedBlock(a[i]);
                if (!block)
                    continue;
                block.removeCaller(pageBlock.id);
                if (block.getCallers().length == 0)
                    this.clearBlock(block.id);
            }

        },

        _getFlattenedDepends: function(o, aInit) {

            // Create the array containing depends names or set it to an initial one.
            var a = aInit || [],
                depends = o.depends,
                i,
                id,
                blockContext;

            if (!depends && o.context)
                depends = o.context.depends;
            if (!depends)
                return [];

            //TODO: XXX: Move this elsewhere
            if(!Array.indexOf){
                Array.prototype.indexOf = function(obj) {
                    for(var i = 0; i < this.length; i++) {
                        if(this[i] == obj){
                            return i;
                        }
                    }
                    return -1;
                }
            }


            // Iterate through all depends in this context.
            for (i = 0; i < depends.length; i++) {

                // Get the name.
                id = depends[i];

                // If it's already in the array, continue.
                if (a.indexOf(id) != -1)
                    continue;

                // Add the depends and subdepends to the array.
                a.push(id);
                blockContext = this.getBlockContext(id);
                this._getFlattenedDepends(blockContext, a);

            }

            return a;

        },

        _processConf: function(source) {

            var i,
                confParser,
                parsedConf;

            for (i = 0; i < this.session.confParsers.length; i++) {
                confParser = this.session.confParsers[i];
                if ((typeof confParser == "function") && (parsedConf = confParser(source)))
                    break;
            }

            this._conf = parsedConf;

            this._processParenting();
            this._handlerManager.registerHandlers();
            this.onConfLoaded();

        },

        _processParenting: function() {
            var pages = this.getPageContexts(),
                i,
                context,
                parent;
            for (i = 0; i < pages.length; i++) {
                context = pages[i];
                if (context.parentId) {
                    parent = this.getPageContext(context.parentId);
                    if (!parent) {
                        Log.warn("Parent node '" + context.parentId + "' cannot be found for '" + context.id + "'");
                        continue;
                    }
                    if (!context.parent) {
                        context.parent = parent;
                        parent.children.push(context);
                        context.level = this.getPageLevel(context.id);
                    }
                }
            }
        },

        _parseConf: function(source) {
            //TODO: Check whether it is XML or JSON, etc.
            return XmlConfParser.parse(source, this.session);
        },

        // --- EVENTS

        onConfLoaded: function() {},
        onPageRequest: function(context, request) {},
        onPageDisplay: function(master) {},
        onPageClear: function(master) {},
        onPageInit: function(master) {},
        onPageIn: function(master) {},
        onPageOn: function(master) {},
        onPageOut: function(master) {},
        onPageOff: function(master) {},
        onBlockRequest: function(context, request) {},
        onBlockDisplay: function(master) {},
        onBlockClear: function(master) {},
        onBlockInit: function(master) {},
        onBlockIn: function(master) {},
        onBlockOn: function(master) {},
        onBlockOut: function(master) {},
        onBlockOff: function(master) {},

        _onConfLoaded: function(xmlHttp) {
            Log.info("Conf was loaded");
            this._processConf(xmlHttp.responseXML);
        }

    };


    // ************************************************************************************************************
    // EXTENSION POINTS
    // ************************************************************************************************************


    //TODO: XXX: Consider merging ZumoExt into Zumo. Probably no need to have them separately.

    // *** ZUMO EXT - OBJECT

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
        },

        addConfParser: function(confParser) {
            Zumo.session.confParsers.unshift(confParser);
        }

    };


    // ************************************************************************************************************
    // INIT
    // ************************************************************************************************************

    Zumo.startup();
    window.Zumo = Zumo;
    window.ZumoExt = ZumoExt;
    window.ZumoAgent = Agent;


})(this);


// *** JQUERY EXTENSIONS

(function(window) {


	// Check for Zumo
	if (!Zumo || !ZumoExt)
		return;


	// *** HANDLER MANAGER DECORATIONS

	var bindHandler = function(type, handler, target) {
		target = target || $("body");
        var $target = $(target);
        if ($target.length > 0) {
		    $(target).on(type, handler);
            return true;
        } else {
            return false;
        }
	};

	var unbindHandler = function(type, handler, target) {
		target = target || window;
        var $target = $(target);
        if ($target.length > 0) {
            $target.off(type, handler);
            return true;
        } else {
            return false;
        }
	};

	ZumoExt.addHandlerBinder(bindHandler, unbindHandler, true);


	// *** SELECTOR DECORATIONS

	var selector = function(selector, container) {
		return $(selector, container)[0];
	};

	ZumoExt.setSelector(selector);


	// *** VIEW MASTERS

    var $Loader = function(context, request, session, stateManager) {
        Zumo.ViewMasters.AbstractMaster.call(this, context, request, session, stateManager); // Call super
        // --
        // Implementing:
        // this.$container = null;
    };

    $Loader.prototype = {

        display: function() {

            Zumo.ViewMasters.AbstractMaster.prototype.display.apply(this, arguments); // Call super

            var that = this;

            this.$container = $(this.container);
            this.$container.load(this.context.target, function() {
                that.init();
            });

        },

        destroy: function() {
            Zumo.ViewMasters.AbstractMaster.prototype.destroy.apply(this, arguments); // Call super
            this.$container.clear();
        },

        init: function() {
            Zumo.ViewMasters.AbstractMaster.prototype.init.apply(this, arguments); // Call super
        },

        clear: function() {
            Zumo.ViewMasters.AbstractMaster.prototype.clear.apply(this, arguments); // Call super
        },

        onStateChange: function(target, state) {
            Zumo.ViewMasters.AbstractMaster.prototype.onStateChange.apply(this, arguments); // Call super
        },

        // Default event handlers
        onDisplay: function(master) {},
        onClear: function(master) {},
        onInit: function(master) {},
        onIn: function(master) {},
        onOn: function(master) {},
        onOut: function(master) {},
        onOff: function(master) {}

    };

    Zumo.registerViewMaster("_$loader", $Loader);


	// *** STATE MANAGERS

	var StateManagers = {

		init: function() {


			// *** FADE CLASS

			var Fade = function(target, session) {
				Zumo.StateManagers.BaseIo3Manager.call(this, target, session);
			};

			Fade.prototype = {

				doIn: function() {
					var that = this,
                        $target = $(this.target);
					$target.css("display", "none");
					$target.fadeIn("slow", function() {
						that.setState(Zumo.StateManagers.STATE_ON);
					});
				},

				doOut: function() {
					var that = this;
					$(this.target).fadeOut("slow", function() {
						that.setState(Zumo.StateManagers.STATE_OFF);
					});
				}

			};


			// *** INIT

			Zumo.ObjectUtils.extend(Fade, Zumo.StateManagers.BaseIo3Manager);
			//TODO: Check whether it is possible to allow register managers not starting with _
			Zumo.registerStateManager("_$fade", Fade);


		}

	};

	StateManagers.init();


    // *** CONF PARSERS

    var domConfParser = function(source) {

        var conf = {},
            mergeAttributes,
            parsePageBlock;

        if (typeof source != "object" || typeof source.getElementsByTagName != "function" || (source.firstChild && source.firstChild.nodeName == "zumo"))
            return null;

        mergeAttributes = function(o, element, list) {
            var i,
                name,
                value;
            for (i = 0; i < list.length; i++) {
                name = list[i];
                value = $(element).attr("data-" + name);
                if (value)
                    o[name] = value;
            }
        };

        parsePageBlock = function(element) {

            var $element = $(element),
                context = {},
                depends,
                handlers,
                handlerList,
                handlerValues,
                handler,
                i;

            mergeAttributes(context, element, ["type", "mediator", "container", "manager", "title"]);
            context.target = element;

            depends = $element.attr("data-depends");
            if (depends) {
                context.depends = depends.replace(/\s/g, " ").split(" ");
            } else {
                context.depends = [];
            }

            context.handlers = [];
            handlers = $element.attr("data-handlers");
            if (handlers) {
                handlerList = handlers.split(",");
                for (i = 0; i < handlerList.length; i++) {
                    handlerValues = handlerList[i].replace(/\s/g, "").split(":");
                    if (handlerValues.length > 1) {
                        handler = {
                            target: handlerValues[0],
                            type: handlerValues[1]
                        }
                    } else {
                        handler = {
                            type: handlerValues[0]
                        }
                    }
                    context.handlers.push(handler);
                }
            }

            return context;

        };

        conf.views = {
            pages: [],
            blocks: []
        };
        conf.commands = [];

        $("*[data-page]", source).each(function() {
            var context = parsePageBlock(this);
            context.id = $(this).attr("data-page");
            context.node = "page";
            conf.views.pages.push(context);
        });

        $("*[data-block]", source).each(function() {
            var context = parsePageBlock(this);
            context.id = $(this).attr("data-block");
            context.node = "block";
            conf.views.blocks.push(context);
        });

        return conf;

    };

    ZumoExt.addConfParser(domConfParser);
	

})(this);
