(function(window) {


    // Check for Zumo and jquery
    if (!Zumo || !ZumoExt || !$ || !$.address)
        return;


    // *** ADDRESS MANAGER

    var AddressManager = {

        defaultPage: null,

        init: function() {

            var that = this;

            $.address.change(function(event) {
                that.go();
            });

            ZumoAgent.observe(Zumo, "onConfLoaded", function() {
                that.go();
            }, -1);

            ZumoAgent.observe(Zumo, "onPageDisplay", function(master) {
                if (master.context.props._deepLink != "false")
                    $.address.value(master.context.id);
            });

        },

        go: function() {

            var id = $.address.value().substr(1);

            if (Zumo.isInit()) {
                if (id == "" || !Zumo.getPageContext(id))
                    id = this.defaultPage;
                Zumo.go(id);
            }

        }

    };


    // *** INIT

    window.ZumoAddress = AddressManager;
    AddressManager.init();


})(this);