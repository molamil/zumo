(function(window) {


    // Check for Zumo and pushState
    if (!Zumo || !(typeof history.pushState == "function"))
        return;


    // *** HISTORY - OBJECT

    var History = {

        defaultPage: null,

        init: function() {

            var that = this;

            window.onpopstate = function(event) {
                if (event.state)
                    Zumo.go(event.state.id);
            };

            Zumo.observe("onConfLoaded", function() {

                var path = window.location.pathname.substr(1);

                if (Zumo.props && Zumo.props.defaultPage)
                    that.defaultPage = Zumo.props.defaultPage;

                if (path.length && Zumo.getPageContext(path)) {
                    Zumo.go(path);
                } else if (that.defaultPage) {
                    Zumo.go(that.defaultPage);
                }

            }, -1);

            Zumo.observe("onPageDisplay", function(master) {
                //TODO: Consider adding the title and merging the request
                if (master.context.props._deepLink != "false")
                    history.pushState(master.context, "", master.context.id);
            });

        }

    };


    // *** INIT

    Zumo.History = History;
    History.init();


})(this);