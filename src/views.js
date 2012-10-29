

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
                type = Utils.trim(context.type).toLowerCase();

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
                manager = Utils.trim(context.manager).toLowerCase();

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
