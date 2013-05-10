

    // *** PARSE XML CONF - FUNCTION

    var parseXmlConf = function(conf, session) {

        // TODO: Check for XML
        // TODO: Parse top level props

        var confObject = {},

            // Function variables below:

            parseIncludes = function(conf, session) {

                var includeNodes = conf.getElementsByTagName("include"),
                    includeNode,
                    includes = [],
                    target,
                    i;

                for (i = 0; i < includeNodes.length; i++) {

                    includeNode = includeNodes[i];
                    target = includeNode.attributes.getNamedItem("target").nodeValue;

                    if (!Utils.isEmpty(target))
                        includes.push(target);

                }

                return includes;

            },

            parseViews = function(conf, session) {

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
                    pageContext = parsePageBlock(pageNodes[i], session);
                    if (pageContext) {
                        pageContext.node = nodeName;
                        mergeAttributes(pageContext, pageNodes[i], ["parent"]);
                        pageContext.parentId = pageContext.parent;
                        pageContext.parent = null;
                        pageContext.children = [];
                        views.pages.push(pageContext);
                    }
                }

                nodeName = "block";
                blockNodes = viewNodes[0].getElementsByTagName(nodeName);
                for (i = 0; i < blockNodes.length; i++) {
                    blockContext = parsePageBlock(blockNodes[i], session);
                    if (blockContext) {
                        blockContext.node = nodeName;
                        views.blocks.push(blockContext);
                    }
                }

                return views;

            },

            parsePageBlock = function(conf, session) {
                var pageBlockContext = {},
                    dependsValue,
                    depends;
                mergeAttributes(pageBlockContext, conf, ["id", "type", "mediator", "target", "container", "manager",
                                      "title"]);
                dependsValue = conf.attributes.getNamedItem("depends");
                if (dependsValue) {
                    depends = dependsValue.nodeValue.replace(/\s/g, "").split(",");
                    if (!(depends.length == 1 && depends[0] == ""))
                        pageBlockContext.depends = depends;
                }
                pageBlockContext.propContexts = parsePropContexts(conf, session);
                pageBlockContext.props = getPropsFromPropContexts(pageBlockContext.propContexts);
                //TODO: Set props (no prop contexts)
                pageBlockContext.handlers = parseHandlers(conf, session);
                return pageBlockContext;
            },

            parseCommands = function(conf, session) {

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
                        mergeAttributes(commandContext, commandNodes[i], ["id", "type", "target"]);
                        commandContext.propContexts = parsePropContexts(commandNodes[i], session);
                        commandContext.props = getPropsFromPropContexts(commandContext.propContexts);
                        commandContext.handlers = parseHandlers(commandNodes[i], session);
                        commands.push(commandContext);
                    }
                }

                return commands;

            },

            parsePropContexts = function(conf, session) {

                var propNodes = Utils.getChildren(conf, "prop"),
                    propContexts = [],
                    propContext,
                    i;

                for (i = 0; i < propNodes.length; i++) {
                    propContext = parsePropContext(propNodes[i], session);
                    if (propContext)
                        propContexts.push(propContext);
                }

                return propContexts;

            },

            parsePropContext = function(conf, session) {

                var propContext = {},
                    decoratorsValue,
                    decorators;

                //TODO: Add checks
                //TODO: Implement type resolvers
                //TODO: Implement expressions

                mergeAttributes(propContext, conf, ["name", "target"]);
                decoratorsValue = conf.attributes.getNamedItem("decorators");
                if (decoratorsValue) {
                    decorators = decoratorsValue.nodeValue.replace(/\s/g, "").split(",");
                    if (!(decorators.length == 1 && decorators[0] == ""))
                        propContext.decorators = decorators;
                }
                propContext.value = parsePropValue(conf, session);

                return propContext;

            },

            parsePropValue = function(conf, session) {

                var propContext = {},
                    hasChildren,
                    itemNodes,
                    propNodes,
                    propNode,
                    nodeValue,
                    i;

                mergeAttributes(propContext, conf, ["name", "value"]);

                hasChildren = Utils.getChildren(conf).length > 0;
                itemNodes = Utils.getChildren(conf, "item");
                propNodes = Utils.getChildren(conf, "prop");

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
                                propContext.value[nodeValue] = parsePropValue(propNode);
                            }

                        } else if (itemNodes.length > 0) {

                            propContext.value = [];

                            for (i = 0; i < itemNodes.length; i++)
                                propContext.value.push(parsePropValue(itemNodes[i]));

                        }

                    }

                } else {

                    if (propContext.value) {

                        if (conf.firstChild && Utils.trim(conf.firstChild.nodeValue) != "")
                            Log.warn("Both value attribute and text content found on prop: '" + propContext.name + "'. " +
                                     "Only value attribute will be used.");

                    } else if (conf.firstChild) {

                        propContext.value = conf.firstChild.nodeValue;

                    } else {

                        propContext.value = "";

                    }

                }

                return propContext.value;

            },

            getPropsFromPropContexts = function(propContexts) {
                var props = {},
                    i;
                for (i = 0; i < propContexts.length; i++)
                    props[propContexts[i].name] = propContexts[i].value;
                return props;
            },

            mergeAttributes = function(o, element, list) {
                var i,
                    name,
                    value;
                for (i = 0; i < list.length; i++) {
                    name = list[i];
                    if (name && Utils.trim(name) != "") {
                        value = element.attributes.getNamedItem(name);
                        if (value)
                            o[name] = value.nodeValue;
                    }
                }
            },

            parseHandlers = function(conf, session) {

                var handlerNodes = conf.getElementsByTagName("handler"),
                    handlers = [],
                    handlerContext,
                    i;

                for (i = 0; i < handlerNodes.length; i++) {
                    handlerContext = parseHandler(handlerNodes[i], session);
                    if (handlerContext)
                        handlers.push(handlerContext);
                }

                return handlers;

            },

            parseHandler = function(conf, session) {
                var handlerContext = {};
                //TODO: Implement expressions
                //TODO: Implement params
                mergeAttributes(handlerContext, conf, ["type", "target", "priority", "class", "at", "action",
                                      "priority"]);
                handlerContext.params = parseParams(conf, session);
                return handlerContext;
            },

            parseParams = function(conf, session) {

                var paramNodes = conf.getElementsByTagName("param"),
                    params = [],
                    paramContext,
                    i;

                for (i = 0; i < paramNodes.length; i++) {
                    paramContext = parseParam(paramNodes[i], session);
                    if (paramContext)
                        params.push(paramContext);
                }

                return params;

            },

            parseParam = function(conf, session) {
                var paramContext = {};
                //TODO: Add checks
                //TODO: Implement type resolvers
                //TODO: Implement required
                //TODO: Implement validators
                //TODO: Implement expressions
                //TODO: Implement props
                mergeAttributes(paramContext, conf, ["name", "value"]);
                if (!paramContext.value)
                    paramContext.value = conf.firstChild.nodeValue;
                return paramContext;
            };

        // Main function statements:
        confObject.propContexts = parsePropContexts(conf.getElementsByTagName("zumo")[0], session);
        confObject.props = getPropsFromPropContexts(confObject.propContexts);
        confObject.includes = parseIncludes(conf, session);
        confObject.views = parseViews(conf, session);
        confObject.commands = parseCommands(conf, session);

        return confObject;

    };
