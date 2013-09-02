

// *** SCROLL EXTENSION

(function(window) {


	// Check for Zumo
	if (!Zumo)
		return;


	// *** STATE MANAGERS

    (function (window) {

        var Scroll = Zumo.createStateManager("scroll", {

            init: function() {

                Zumo.log.info("Scroll.init");

                var that = this;

                this.scroll = function() {
                    var $target = $(that.target);
                    Zumo.log.info("this.target = " + $target);
//                    if (typeof $target.scroll == "function")
//                        $target.scroll();
                };

                $(window).scroll(this.scroll);

            },

            doIn: function() {
                var something;
            },

            destroy: function() {}

        });

    })(window);
	

})(this);
