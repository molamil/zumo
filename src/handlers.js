

    // *** HANDLER MANAGER - CONSTRUCTOR

    var HandlerManager = function(app) {
        this.app = app;
        this._activeHandlers = []; // of {handlerContext:Object, context:Object, contextType:String, f:Function}
        this._bindings = []; // of {type:String, f:Function, target:String}
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
            this._updateBindings();

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
            if (context.handlers) {
                for (i = 0; i < context.handlers.length; i++) {
                    activeHandler = {
                        handlerContext: context.handlers[i],
                        context: context,
                        contextType: contextType,
                        f: this._createHandlerAction(context.handlers[i], context, contextType)
                    };
                    this._activeHandlers.push(activeHandler);
                }
            }
        },

        _createHandlerAction: function(handlerContext, mainContext, contextType) {
            if (contextType == "page") {
                return this._createPageHandlerAction(handlerContext, mainContext);
            } else if (contextType == "block") {
                return this._createBlockHandlerAction(handlerContext, mainContext);
            } else if (contextType == "command") {
                return this._createCommandHandlerAction(handlerContext, mainContext);
            } else {
                Log.warn("Could not create handler action - the context type is neither a page or a block");
                return null;
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
                            ft = Utils.delegate(app.go, app, pageContext.id, params);
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

            if (handlerContext.action == "clear" || handlerContext.action == "clearBlock") {
                f = fClear;
            } else if (handlerContext.action == "displayBlock" || handlerContext.action == "display" ||
                       handlerContext.action == "call" || handlerContext.action == "" ||
                       handlerContext.action == null) {
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

        _updateBindings: function() {

            var binding,
                i;

            for (i = 0; i < this._bindings.length; i++) {
                binding = this._bindings[i];
                // Only update handlers with target.
                this._unbindHandler(binding.type, binding.f, binding.target);
                !this._bindHandler(binding.type, binding.f, binding.target);
            }

        }

    };
