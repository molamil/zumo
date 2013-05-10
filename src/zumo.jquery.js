

// *** JQUERY EXTENSIONS

(function(window) {


	// Check for Zumo
	if (!Zumo || !ZumoExt)
		return;


	// *** HANDLERS

    //TODO: Move this to the core package, no need to use jQuery
    var fViewCreate = function(master) {
        //TODO: Check whether this algorithm can be optimized without using 3 iterations
        var $elsWithId = $("*[id]", master.target),
            $elsWithFor = $("*[for]", master.target),
            $elsWithName = $("*[name]", master.target),
            prefix = "z-"; //TODO: Make the prefix configurable
        $elsWithId.each(function() {
            var $this = $(this),
                zAttr = "id",
                thisAttr = $this.attr(zAttr),
                indexOfPrefix = thisAttr.indexOf(prefix);
            if (indexOfPrefix == 0)
                $this.attr(zAttr, thisAttr.substr(prefix.length));
        });
        $elsWithFor.each(function() {
            var $this = $(this),
                zAttr = "for",
                thisAttr = $this.attr(zAttr),
                indexOfPrefix = thisAttr.indexOf(prefix);
            if (indexOfPrefix == 0)
                $this.attr(zAttr, thisAttr.substr(prefix.length));
        });
        $elsWithName.each(function() {
            var $this = $(this),
                zAttr = "name",
                thisAttr = $this.attr(zAttr),
                indexOfPrefix = thisAttr.indexOf(prefix);
            if (indexOfPrefix == 0)
                $this.attr(zAttr, thisAttr.substr(prefix.length));
        });
    };

    Zumo.observe("onPageCreate", fViewCreate);
    Zumo.observe("onBlockCreate", fViewCreate);


	// *** HANDLER MANAGER DECORATIONS

	var bindHandler = function(type, handler, target) {
        var $body = $(document);
        if (target) {
            $body.on(type, target, handler);
        } else {
            $body.on(type, handler);
        }
	};

	var unbindHandler = function(type, handler, target) {
        var $body = $(document);
        if (target) {
            $body.off(type, target, handler);
        } else {
            $body.off(type, handler);
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

    (function (window) {

        var $Fade = Zumo.createStateManager("$fade", {

            duration: "slow",

            doIn: function() {
                var that = this,
                    $target = $(this.target);
                $target.hide();
                $target.fadeIn(this.duration, function() {
                    that.setState(Zumo.StateManagers.STATE_ON);
                });
            },

            doOut: function() {
                var that = this;
                $(this.target).fadeOut(this.duration, function() {
                    that.setState(Zumo.StateManagers.STATE_OFF);
                });
            }

        });

        Zumo.createStateManager("$fadeSlow", {duration: "slow"}, $Fade);

        Zumo.createStateManager("$fadeFast", {duration: "fast"}, $Fade);

    })(window);


    // *** CONF PARSERS

    var domConfParser = function(source) {

        var conf = {},
            mergeAttributes,
            parsePageBlock;

        if (!source || typeof source != "object" || typeof source.getElementsByTagName != "function" ||
            (source.firstChild && source.firstChild.nodeName == "zumo")) {
            return null;
        }

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
                handlerValue,
                handlerValues,
                handler,
                i;

            mergeAttributes(context, element, ["type", "mediator", "container", "manager", "title"]);
            context.target = element;

            depends = $element.attr("data-depends");
            if (depends) {
                context.depends = depends.replace(/\s*,\s*|\s+/g, ",").split(",");
            } else {
                context.depends = [];
            }

            context.handlers = [];
            handlers = $element.attr("data-handlers");
            if (handlers) {
                handlerList = handlers.split(",");
                for (i = 0; i < handlerList.length; i++) {
                    handler = {};
                    handlerValue = handlerList[i];
                    handlerValues = handlerValue.split("@");
                    if (handlerValues.length == 2) {
                        handler.at = Zumo.Utils.trim(handlerValues[1]);
                        handlerValue = handlerValues[0];
                    } else if (handlerValues.length > 2) {
                        //TODO: Show warning: Too many @.
                    }
                    handlerValues = handlerValue.split(":");
                    if (handlerValues.length == 1) {
                        handler.type = handlerValues[0];
                    } else if (handlerValues.length == 2) {
                        handler.target = handlerValues[0];
                        handler.type = handlerValues[1];
                    } else {
                        //TODO: Show warning: Too many :.
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
