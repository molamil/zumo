(function() {


	// Check for Zumo
	if (!Zumo || !ZumoExt)
		return;


	// *** HANDLER MANAGER DECORATIONS

	var bindHandler = function(target, type, handler) {
		$(target).live(type, handler);
	};

	var unbindHandler = function(target, type, handler) {
		$(target).unbind(type, handler);
	};

	ZumoExt.addHandlerBinder(bindHandler, unbindHandler, true);
	

})();