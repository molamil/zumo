

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