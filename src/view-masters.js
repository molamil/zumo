

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
                    fMediator = Utils.find(this.context.mediator);
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
                    containerName = Utils.trim(this.context.container);
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
                        Utils.merge(this.target, this.request.params);

                        this.onCreate(this);

                        if (this.stateManager) {
                            this.stateManager.target = this.target;
                            Agent.observe(this.stateManager, "onStateChange", this.onStateChange, this);
                            //TODO: Merge props into state managers
                            this.stateManager.setState(StateManagers.STATE_IN);
                        }

                    }

                    if (this.fMediator) {
                        this.mediator = new this.fMediator(this.target);
                        PropsManager.apply(this.mediator, this.context.propContexts, this.session);
                        Utils.merge(this.mediator, this.request.params);
                        if (typeof this.mediator.init == "function")
                            this.mediator.init();
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
                onCreate: function(master) {},
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
                    this.fConstructor = Utils.find(this.context.target);
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
                    Utils.merge(this.builder, this.request.params);
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
            parent = parent || this.AbstractMaster;

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
