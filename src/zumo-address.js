(function(window) {


	// Check for Zumo
	if (!Zumo || !ZumoExt)
		return;


    // *** ADDRESS MANAGER

	var AddressManager = {

		init: function() {

            if (!Zumo || !$ || !$.address)
                return;

            $.address.change(function(event) {
                if (Zumo.isInit())
                    Zumo.goto($.address.value().substr(1));
            });

            // TODO: FIXME: Set observe instead: Zumo.observe(Zumo, "onPageDisplay", function() {});
            Zumo.onPageDisplay = function(master) {
                if (master.context.props._deepLink != "false")
                    $.address.value(master.context.id);
            };

        }

	};


	// *** INIT

    AddressManager.init();
	

})(this);