    // ************************************************************************************************************
    // ZUMO
    // ************************************************************************************************************


    // *** XML CONF PARSER OBJECT

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
                    this._mergeAttributes(pageContext, pageNodes[i], ["parent"]);
                    pageContext.parentId = pageContext.parent;
                    pageContext.parent = null;
                    pageContext.children = [];
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
            this._mergeAttributes(pageBlockContext, conf, ["id", "type", "mediator", "target", "container", "manager", "title"]);
            var dependsValue = conf.attributes.getNamedItem("depends");
            if (dependsValue) {
                var depends = dependsValue.nodeValue.replace(/\s/g, "").split(",");
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
                if (name && StringUtils.trim(name) != "") {
                    var value = element.attributes.getNamedItem(name);
                    if (value)
                        o[name] = value.nodeValue;
                }
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
        this._bindings = []; // of {type:String, f:Function, target:String}
        this.updateBindings = false;
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

            this.updateBindings = this._updateBindings();

            Log.debug("Will update bindings? " + this.updateBindings);

            if (this.updateBindings) {
                //TODO: XXX: Check performance of reevaluating the bindings so often.
                //TODO: XXX: Maybe we can use event bubbling, add all listeners to the body/root and check for target match.
                Agent.observe(this.app, "onPageInit", this.onViewInit, this);
                Agent.observe(this.app, "onBlockInit", this.onViewInit, this);
            }

        },

        unregisterHandlers: function() {
            //TODO: Test
            while (this._activeHandlers.length > 0) {
                var activeHandler = this._activeHandlers.pop();
                this._removePageBlockHandlerAction(activeHandler);
            }
            Agent.ignore(this.app, "onPageInit", this.onViewInit);
            Agent.ignore(this.app, "onBlockInit", this.onViewInit);
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

            var fGo = function() {
                //TODO: Review params logic
                var params = arguments[1];
                var page = app.getCurrentPage();
                if (!handlerContext.at || handlerContext.at == "" || handlerContext.at == page.id) {
                    if (page && pageContext.id == page.id) {
                        Log.debug("Handler " + handlerContext.type + "trigger when already at " + page.id);
                        ParamsManager.apply(page.master.target, handlerContext.params, this.session);
                    } else {
                        var ft = Delegate.create(app.go, app, [pageContext.id, params]);
                        setTimeout(ft, 10);
                    }
                }
            };

            if (handlerContext.action == "go" || handlerContext.action == "go" || handlerContext.action == "call" || handlerContext.action == "" || handlerContext.action == null) {
                f = fGo;
            } else {
                Log.warn("Could not resolve handler action: " + handlerContext.action);
            }

            this._registerBinding(handlerContext.type, f, handlerContext.target);

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

            this._registerBinding(handlerContext.type, f, handlerContext.target);

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


    // *** ZUMO OBJECT

    //TODO: Make non-static so we can have several Zumo objects at a time.

    var Zumo = {

        // --- PROPERTIES

        ObjectUtils: ObjectUtils,
        ViewMasters: ViewMasters,
        StateManagers: StateManagers,

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

        getPageContextsAt: function(level) {
            var a = [],
                i;
            for (i = 0; i < this._conf.views.pages.length; i++) {
                var pageContext = this._conf.views.pages[i];
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

        _initConf: function(conf) {
            if (typeof conf == "string") {
                Log.info("Initializing with remote configuration: " + conf);
                var confLoader = new Loader();
                confLoader.load(conf, this._onConfLoaded, this);
            } else {
                this._processConf(conf)
            }
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

            //TODO: XXX: Move this elsewhere
            if(!Array.indexOf){
                Array.prototype.indexOf = function(obj){
                    for(var i=0; i<this.length; i++){
                        if(this[i]==obj){
                            return i;
                        }
                    }
                    return -1;
                }
            }


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
                context;
            for (i = 0; i < pages.length; i++) {
                context = pages[i];
                if (context.parentId) {
                    var parent = this.getPageContext(context.parentId);
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