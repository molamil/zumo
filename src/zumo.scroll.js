

// *** SCROLL EXTENSION

(function(window) {


	// Check for Zumo
	if (!Zumo)
		return;


	// *** STATE MANAGERS

    (function (window) {

        var Scroll = Zumo.createStateManager("scroll", {

            init: function() {

                var that = this;

                this.scroll = function() {
                    if (that.master && that.master.mediator && typeof that.master.mediator.scroll == "function") {
                        that.master.mediator.scroll();
                    }
                };

                $(window).scroll(this.scroll);

            },

            destroy: function() {}

        });

    })(window);
	

})(this);