
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


	// *** PAGE BLOCK BUILDER OBJECT

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
					this.onDisplay(this);
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


			// *** DOM MASTER CLASS

			var DomMaster = function(context, request, session, stateManager) {
				AbstractMaster.call(this, context, request, session, stateManager);
				//TODO: See how to configure the master properties.
				this.cloneDom = false;
                // --
                // Implementing:
                // this.originalDisplay = null;
                // this.originalVisibility = null;
			};

			DomMaster.prototype = {
				
				display: function() {

					AbstractMaster.prototype.display.apply(this, arguments); // Call super

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
					AbstractMaster.prototype.destroy.apply(this, arguments); // Call super
					Log.debug("DomMaster destroy: " + this.context.id);
					this.target.style.display = this.originalDisplay;
					this.target.style.visibility = this.originalVisibility;
					if (this.cloneDom)
						this.container.removeChild(this.target);
				},

				init: function() {
					AbstractMaster.prototype.init.apply(this, arguments); // Call super
				},

				clear: function() {
					AbstractMaster.prototype.clear.apply(this, arguments); // Call super
				},

				onStateChange: function(target, state) {
					AbstractMaster.prototype.onStateChange.apply(this, arguments); // Call super
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


			// *** DOM CLONE MASTER CLASS

			var DomCloneMaster = function(context, request, session, stateManager) {
				DomMaster.call(this, context, request, session, stateManager);
				this.cloneDom = true;
			};

			DomCloneMaster.prototype = {

				display: function() {
					DomMaster.prototype.display.apply(this, arguments); // Call super
				},

				destroy: function() {
					DomMaster.prototype.destroy.apply(this, arguments); // Call super
				},

				init: function() {
					DomMaster.prototype.init.apply(this, arguments); // Call super
				},

				clear: function() {
					DomMaster.prototype.clear.apply(this, arguments); // Call super
				},

				onStateChange: function(target, state) {
					DomMaster.prototype.onStateChange.apply(this, arguments); // Call super
				},

                _getStyle: function(target, style) {
					return DomMaster.prototype._getStyle.apply(this, arguments); // Call super
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
				},

                clear: function() {
                    DomMaster.prototype.clear.apply(this, arguments); // Call super
                },

                onStateChange: function(target, state) {
                    DomMaster.prototype.onStateChange.apply(this, arguments); // Call super
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

			//ObjectUtils.extend(this.DomMaster, this.AbstractMaster);
			//ObjectUtils.extend(this.DomCloneMaster, this.DomMaster);
			//ObjectUtils.extend(this.LoaderMaster, this.AbstractMaster);
			//ObjectUtils.extend(this.BuilderMaster, this.AbstractMaster);


		}

	};