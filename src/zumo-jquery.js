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

	}


	// *** INIT

	StateManagers.init();
	

})(this);