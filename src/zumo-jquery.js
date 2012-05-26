(function(window) {


	// Check for Zumo
	if (!Zumo || !ZumoExt)
		return;


	// *** HANDLER MANAGER DECORATIONS

	var bindHandler = function(type, handler, target) {
		target = target || $("body");
        var $target = $(target);
		$(target).on(type, handler);
	};

	var unbindHandler = function(type, handler, target) {
		target = target || window;
		$(target).off(type, handler);
	};

	ZumoExt.addHandlerBinder(bindHandler, unbindHandler, true);


	// *** SELECTOR DECORATIONS

	var selector = function(selector, container) {
		return $(selector, container)[0];
	};

	ZumoExt.setSelector(selector);


	// *** STATE MANAGERS

	var StateManagers = {

		init: function() {


			// *** FADE CLASS

			var Fade = function(target, session) {
				Zumo.StateManagers.BaseIo3Manager.call(this, target, session);
			};

			Fade.prototype = {

				_doIn: function() {
					var that = this;
					var $target = $(this.target);
					$target.css("display", "none");
					$target.fadeIn("slow", function() {
						that.setState(Zumo.StateManagers.STATE_ON);
					});
				},

				_doOut: function() {
					var that = this;
					$(this.target).fadeOut("slow", function() {
						that.setState(Zumo.StateManagers.STATE_OFF);
					});
				}

			};


			// *** INIT

			Zumo.ObjectUtils.extend(Fade, Zumo.StateManagers.BaseIo3Manager);
			//TODO: Check whether it is possible to allow register managers not starting with _
			Zumo.registerStateManager("_$fade", Fade);


		}

	};

	StateManagers.init();


    // *** CONF PARSERS

    var domConfParser = function(source) {

        var conf = {},
            mergeAttributes,
            parsePageBlock;

        if (typeof source != "object" || typeof source.getElementsByTagName != "function" || (source.firstChild && source.firstChild.nodeName == "zumo"))
            return null;

        mergeAttributes = function(o, element, list) {
            for (var i = 0; i < list.length; i++) {
                var name = list[i];
                var value = $(element).attr("data-" + name);
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
                handlerValues,
                handler,
                i;

            mergeAttributes(context, element, ["type", "mediator", "container", "manager", "title"]);
            context.target = element;

            depends = $element.attr("data-depends");
            if (depends) {
                context.depends = depends.replace(/\s/g, " ").split(" ");
            } else {
                context.depends = [];
            }

            context.handlers = [];
            handlers = $element.attr("data-handlers");
            if (handlers) {
                handlerList = handlers.split(",");
                for (i = 0; i < handlerList.length; i++) {
                    handlerValues = handlerList[i].replace(/\s/g, "").split(":");
                    if (handlerValues.length > 1) {
                        handler = {
                            target: handlerValues[0],
                            type: handlerValues[1]
                        }
                    } else {
                        handler = {
                            type: handlerValues[0]
                        }
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