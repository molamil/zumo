

    // *** ZUMO - OBJECT

    //TODO: Make non-static so we can have several Zumo objects at a time.

    var Zumo = {

        // --- PROPERTIES

        //TODO: Use mix method instead.
        Utils: Utils,
        Loader: Loader,
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
        props: null,
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
        _confTargets: [],
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

            Log.prefix = _NAME ? _NAME.toUpperCase() + " - " : "";

            this._initViewMasters();
            this._initStateManagers();
            this._initCommandMasters();

        },

        // Initializes the zumo object with the passed root parameter as the base DOM element to make selections on
        init: function() {

            var root,
                conf,
                params;

            if (typeof arguments[0] == "string") {
                conf =  arguments[0];
                params =  arguments[1];
            } else if(arguments.length > 1) {
                root =  arguments[0];
                conf =  arguments[1];
                params =  arguments[2];
            }

            root = root || document;
            conf = conf || root;
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
            Agent.observe(page.master, "onCreate", this.onPageCreate, this);
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
                Agent.observe(block.master, "onCreate", this.onBlockCreate, this);
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
            if (Utils.trim(name) == "") {
                Log.warn("Cannot register a view master with an empty name");
                return;
            }
            name = name.toLowerCase();
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
            if (Utils.trim(name) == "") {
                Log.warn("Cannot register a state manager with an empty name");
                return;
            }
            name = name.toLowerCase();
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
            this.session.stateManagers[name.toLowerCase()] = null;
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
            if (Utils.trim(name) == "") {
                Log.warn("Cannot register a command master with an empty name");
                return;
            }
            name = name.toLowerCase();
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

        createCommandMaster: function() {

            // Proxy to CommandMasters.createCommandMaster with the arguments passed without name, and register.
            var name = arguments[0],
                commandMaster = CommandMasters.createCommandMaster.apply(CommandMasters, [].slice.call(arguments, 1));

            this.registerCommandMaster(name, commandMaster);

            return commandMaster;

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
                if (this._confTargets.length == 0) {
                    this._confTargets.push({
                        target: conf,
                        isParsed: false
                    });
                }
                confLoader = new Loader();
                confLoader.load(conf, this._onConfLoaded, this, [conf]);
            } else {
                this._processConf(conf);
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

            if (parsedConf.includes && parsedConf.includes.length > 0) {
                for (i = 0; i < parsedConf.includes.length; i++)
                    this._addConfTarget(parsedConf.includes[i]);
            }

            if (this._conf) {
                Utils.mergeDeep(this._conf, parsedConf);
            } else {
                this._conf = parsedConf;
            }

            this.props = this._conf.props;

            if (this._getPendingConfTargets().length == 0) {
                this._processParenting();
                this._handlerManager.registerHandlers();
                this.onConfLoaded();
            }

        },

        _addConfTarget: function(target) {

            var i,
                exists;

            for (i = 0; i < this._confTargets.length; i++) {
                if (target == this._confTargets[i].target) {
                    Log.warn("Duplicated conf target '" + target + "', ignoring...");
                    exists = true;
                    break;
                }
            }

            if (!exists) {
                this._confTargets.push({
                    target: target,
                    isParsed: false
                });
                this._initConf(target);
            }

        },

        _markConfTarget: function(target) {
            var i;
            for (i = 0; i < this._confTargets.length; i++) {
                if (target == this._confTargets[i].target) {
                    this._confTargets[i].isParsed = true;
                    break;
                }
            }
        },

        _getPendingConfTargets: function() {

            var i,
                pendingConfTargets = [];

            for (i = 0; i < this._confTargets.length; i++) {
                if (!this._confTargets[i].isParsed)
                    pendingConfTargets.push(this._confTargets[i].target);
            }

            return pendingConfTargets;

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

        //TODO: Use mix function instead of the verbose empty callbacks.
        onConfLoaded: function() {},
        onPageRequest: function(context, request) {},
        onPageDisplay: function(master) {},
        onPageClear: function(master) {},
        onPageCreate: function(master) {},
        onPageInit: function(master) {},
        onPageIn: function(master) {},
        onPageOn: function(master) {},
        onPageOut: function(master) {},
        onPageOff: function(master) {},
        onBlockRequest: function(context, request) {},
        onBlockDisplay: function(master) {},
        onBlockClear: function(master) {},
        onBlockCreate: function(master) {},
        onBlockInit: function(master) {},
        onBlockIn: function(master) {},
        onBlockOn: function(master) {},
        onBlockOut: function(master) {},
        onBlockOff: function(master) {},

        _onConfLoaded: function(xmlHttp, target) {
            Log.info("Conf was loaded, target = " + target);
            this._markConfTarget(target);
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
