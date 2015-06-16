(function(window) {


    // Check for Zumo and jquery
    if (!Zumo || !ZumoExt || !$ || !$.address)
        return;


    // *** ADDRESS MANAGER - OBJECT

    var AddressManager = {

        defaultPage: null,

        init: function() {

            var that = this;

            $.address.change(function(event) {
                that.go();
            });

            ZumoAgent.observe(Zumo, "onConfLoaded", function() {

                if (Zumo.props && Zumo.props.defaultPage)
                    that.defaultPage = Zumo.props.defaultPage;

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

                if (id == "" || !Zumo.getPageContext(id))
                    id = this.defaultPage;

                if (typeof id == "string")
                    Zumo.go(id);

            }

        }

    };


    // *** INIT

    window.ZumoAddress = AddressManager;
    AddressManager.init();


})(this);