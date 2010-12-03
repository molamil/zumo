/*

 DECLARATION OF IMPLICIT OBJECTS ACCROSS THE ZUMO FRAMEWORK

 session:	{id:String, root:Object, defaultPropName:String, viewMasters:Array, defaultMasterClass:Object}
 request:	{id:String, params:Object}
 context:	{id:String, type:String, target:String, container:String}
 prop:		{name:String, value:*, target:String}

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
		level: 3,
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
			if (!("console" in window) || !("firebug" in window.console))
				return;

			// Set level as default if not passed.
			if (level == null)
				level = this.level;

			if (this.level >= level)
				window.console[this.LEVELS[level]](message);

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
        }

	};


	// *** SELECTOR OBJECT

	var Selector = {

		// --- METHODS

		select: function(selector, container) {
			container = container || document;
			return container.getElementById(selector.substr(1));
		}

	};


	// *** LOADER CLASS

	var Loader = function() {};

	Loader.prototype = {

		// --- PROPERTIES

		method: "GET",
		xmlHttp: null,
		callback: null,
		callbackObject: null,

		// --- METHODS

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
					this.xmlHttp.onreadystatechange = xmlhttpChange;
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
					Log.warn("The server returned an error when trying to load: " + xmlHttp.responseXML);
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

		apply: function(target, props, session) {

			//TODO: Add checks
			
			// Merge the props
			for(var i = 0; i < props.length; i++) {
				var prop = props[i];
				if (prop.target)
					target = Selector.select(prop.target);
				var name = prop.name || session.defaultPropName;
				target[name] = prop.value;
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
		// --
		// Implementing:
		// this.master = null;
	};


	// *** PAGE BLOCK BUILDER OBJECT

	var PageBlockBuilder = {

		// --- METHODS

		createPage: function(context, request, session) {

			//TODO: Implement state managers.
			//TODO: Implement property injection.

			var page = new Page(context, request, session);
			page.master = this._buildMaster(context, request, session);

			return page;

		},

		createBlock: function(context, request, session) {

			//TODO: Implement state managers.
			//TODO: Implement property injection.

			var block = new Block(context, request, session);
			block.master = this._buildMaster(context, request, session);

			return block;

		},

		_buildMaster: function(context, request, session) {

			var masterClass, master;
			var type = StringUtils.trim(context.type).toLowerCase();

			if (type != "") {
				masterClass = session.viewMasters[type];
			} else {
				masterClass = session.defaultMasterClass;
			}
			
			if (masterClass) {
				if (typeof masterClass == "function") {
					master = new masterClass(context, request, session);
				} else {
					Log.error("The type " + type + " in " + context.id + " cannot create a new page");
				}
			} else {
				Log.error("The type " + type + " cannot be resolved in page: " + context.id);
			}

			return master;

		}

	};


	// *** VIEW MASTERS OBJECT

	var ViewMasters = {

		// --- METHODS - Using init method to create class functions as PageMasters members

		init: function() {


			// *** ABSTRACT MASTER CLASS

			var AbstractMaster = function(context, request, session) {
				this.context = context;
				this.request = request;
				this.session = session;
				this.isDisplayed = false;
				this.isCleared = false;
			};

			AbstractMaster.prototype = {

				// --- PROPERTIES

				isDisplayed: false,
				isCleared: false,
				target: null,
				container: null,
				// --
				// Implementing:
				// context: context,
				// request: request,
				// session: session,
				// stateManager: null,

				// --- METHODS

				display: function() {
					Log.info("Displaying " + this.context.id + " with target " + this.context.target);
					var containerName = StringUtils.trim(this.context.container);
					if (containerName != "") {
						this.container = Selector.select(this.context.container, this.session.root);
						if (this.container == null)
							Log.error("Invalid container for page " + this.context.id + ": " + this.context.container);
					}
				},

				destroy: function() {
					Log.info("Destroying " + this.context.id);
				},

				clear: function() {
					Log.info("Clearing " + this.context.id);
				},

				init: function() {
					Log.debug("Initting " + this.context.id);
					PropsManager.apply(this.target, this.context.props, this.session);
				}

			};


			// *** DOM CLASS

			var DomMaster = function(context, request, session) {
				AbstractMaster.call(this, context, request, session);
			};

			DomMaster.prototype = {

				// --- PROPERTIES

				//TODO: See how to configure the master properties.
				changeDisplay: true,
				changeVisibility: true,

				// --- METHODS

				display: function() {
					AbstractMaster.prototype.display.apply(this, arguments); // Call super
					Log.debug("DomMaster display");
					this.target = Selector.select(this.context.target);
					if (this.target == null) {
						Log.error("Invalid target for page " + this.context.id + ": " + this.context.target);
						return;
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
				},

				init: function() {
					AbstractMaster.prototype.init.apply(this, arguments); // Call super
				}

			};


			// *** LOADER CLASS

			var LoaderMaster = function(context, request, session) {
				AbstractMaster.call(this, context, request, session);
			};

			LoaderMaster.prototype = {

				// --- PROPERTIES

				useXml: false,
				loader: null,

				// --- METHODS

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


			// *** INIT - Initializing ViewMasters

			this.AbstractMaster = AbstractMaster;
			this.DomMaster = DomMaster;
			this.LoaderMaster = LoaderMaster;

			ObjectUtils.extend(this.DomMaster, this.AbstractMaster);
			ObjectUtils.extend(this.LoaderMaster, this.AbstractMaster);


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
			// TODO: Parse props
			Log.debug("Parsing conf: " + conf);
			var confObject = {};
			confObject.views = this._parseViews(conf, session);
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

			var pageNodes = viewNodes[0].getElementsByTagName("page");
			for (var i = 0; i < pageNodes.length; i++) {
				var pageContext = this._parsePageBlock(pageNodes[i], session);
				if (pageContext)
					views.pages.push(pageContext);
			}

			var blockNodes = viewNodes[0].getElementsByTagName("block");
			for (i = 0; i < blockNodes.length; i++) {
				var blockContext = this._parsePageBlock(blockNodes[i], session);
				if (blockContext)
					views.blocks.push(blockContext);
			}

			return views;
			
		},

		_parsePageBlock: function(conf, session) {
			var pageContext = {};
			this._mergeAttributes(pageContext, conf, ["id", "type", "target", "container"]);
			pageContext.props = this._parseProps(conf, session);
			return pageContext;
		},

		_parseProps: function(conf, session) {

			var propNodes = conf.getElementsByTagName("prop");

			var props = [];
			for (var i = 0; i < propNodes.length; i++) {
				var propContext = this._parseProp(propNodes[i], session);
				if (propContext)
					props.push(propContext);
			}

			return props;

		},

		_parseProp: function(conf, session) {
			var propContext = {};
			//TODO: Add checks
			//TODO: Implement type resolvers
			//TODO: Implement expressions
			this._mergeAttributes(propContext, conf, ["name", "value", "target"]);
			Log.debug(conf);
			if (!propContext.value)
				propContext.value = conf.firstChild.nodeValue;
			return propContext;
		},

		_mergeAttributes: function(o, element, list) {
			for (var i = 0; i < list.length; i++) {
				var name = list[i];
				var value = element.attributes.getNamedItem(name);
				if (value)
					o[name] = value.nodeValue;
			}
		}

	};


	// *** ZUMO OBJECT

	//TODO: Make non-static so we can have several Zumo objects at a time.

	var Zumo = {

		// --- PROPERTIES

		_VIEW_MASTERS: {
			dom: "DomMaster",
			loader: "LoaderMaster"
		},
		_DEFAULT_VIEW_TYPE: "dom",
		_DEFAULT_PROP_NAME: "innerHTML",

		log: Log,
		root: null,
		session: {},

		_conf: null,
		_params: null,
		_currentPage: null,
		_displayedPage: null,

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

			// Create the initial session
			this.session = {
				id: this._params.id || this._createSessionId(),
				root: root,
				defaultMasterClass: null,
				defaultPropName: this._DEFAULT_PROP_NAME,
				viewMasters: {}
			};
			this._initViewMasters();

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

		onConfLoaded: function() {
			// To be overriden, do nothing
			//TODO: use events so several actions can be hooked up when the configuration is loaded
		},

		// Displays a specific page by id, taking out the page currently displayed
		goto: function(id, params) {

			Log.info("Going to page " + id);

			if (!this.isInit()) {
				Log.warn("Cannot goto " + id + " - Zumo is not yet initalized");
				return;
			}

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
			if (typeof pageContext !== "object") {
				Log.error("No page context found with id: " + id);
				return;
			}

			//TODO: Implement aliases
			//TODO: Check wether that page is already being requested
			//TODO: Set referrer

			var request = {
				id: id,
				params: params,
				referrer: null
			};
			var page = PageBlockBuilder.createPage(pageContext, request, this.session);

			// Check we have a proper page
			if (page.master == null)
				return;

			// Clear the currently displayed page
			if (this._currentPage != null)
				this._currentPage.master.destroy(); //TODO: Implement clear

			page.master.display();
			this._currentPage = page;

			//TODO: Implement state managers
			this._displayedPage = page;

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

		getDisplayedPage: function() {
			return this._displayedPage;
		},

		getCurrentPage: function() {
			return this._currentPage;
		},

		// Displays a specific block by id
		displayBlock: function(id, params) {

			//TODO: Implement display block!

			Log.info("Displaying block " + id);

			if (!this.isInit()) {
				Log.warn("Cannot display " + id + " - Zumo is not yet initalized");
				return;
			}

			var block = this.getDisplayedBlock();

			// Check whether the block is already displayed
			if (block) {

				//TODO: Add callers when depends are implemented

				Log.info("No block to display - the block is already displayed: " + id);
				
			} else {

				// Get the block from the conf
				var blockContext = this.getBlockContext(id);
				if (typeof blockContext !== "object") {
					Log.error("No page context found with id: " + id);
					return;
				}

				//TODO: Implement aliases
				//TODO: Check wether that page is already being requested
				//TODO: Set referrer

				var request = {
					id: id,
					params: params,
					referrer: null
				};
				block = PageBlockBuilder.createBlock(blockContext, request, this.session);

				// Check we have a proper block
				if (block.master == null)
					return;

				block.master.display();

				//TODO: Add to the displayed blocks

			}

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

		getDisplayedBlock: function() {
			//TODO: Implement getDisplayedBlock
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

		_initViewMasters: function() {
			ViewMasters.init();
			for (var p in this._VIEW_MASTERS) {
				var masterName = this._VIEW_MASTERS[p];
				this.registerViewMaster(p, ViewMasters[masterName]);
			}
			this.session.defaultMasterClass = this.session.viewMasters[this._DEFAULT_VIEW_TYPE];
		},

		_onConfLoaded: function(xmlHttp) {
			Log.info("Conf was loaded");
			Log.debug(xmlHttp);
			//TODO: Check whether it is XML or JSON, etc.
			this._conf = XmlConfParser.parse(xmlHttp.responseXML, this.session);
			//TODO: Check for error
			this.onConfLoaded();
		},

		_createSessionId: function() {
			if (window._nZumo == null)
				window._nZumo = 0;
			window._nZumo++;
			return _NAME + window._nZumo;
		}

	};


	// ************************************************************************************************************
	// INIT
	// ************************************************************************************************************


	// Expose Zumo to the global object and init
	window.Zumo = Zumo;


})(this);