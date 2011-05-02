(function() {


	// Check for Zumo
	if (!Zumo || !ZumoExt)
		return;


	// *** HANDLER MANAGER DECORATIONS

	var bindHandler = function(type, handler, target) {
		target = target || window;
		$(target).live(type, handler);
	};

	var unbindHandler = function(type, handler, target) {
		target = target || window;
		$(target).die(type, handler);
	};

	ZumoExt.addHandlerBinder(bindHandler, unbindHandler, true);
	

})();