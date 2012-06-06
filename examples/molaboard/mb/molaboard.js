(function(window) {


    // *****************************************************************************************************************
    // MOLABOARD
    // *****************************************************************************************************************


    // *** MOLABOARD OBJECT

    var Molaboard = window.Molaboard = {

        init: function() {
            Utils.trigger(events.STARTUP);
        }

    };


    // *** UTILS OBJECT

    var Utils = Molaboard.Utils = {

        log: function(message) {
            if (window.console && typeof window.console.log == "function")
                window.console.log(message);
        },

        trigger: function(event) {
            $("body").trigger(event);
        }

    };


    // *** SESSION MAP

    var session = Molaboard.session = {
        userLoggedIn: false,
        settings: null
    };


    // *** EVENTS MAP

    var events = Molaboard.events = {
        STARTUP: "startup",
        LOGGED_IN: "loggedIn",
        ERROR: "error"
    };


    // *****************************************************************************************************************
    // VIEWS
    // *****************************************************************************************************************


    var Views = Molaboard.Views = {};


    // *** SETTINGS MEDIATOR CONSTRUCTOR


    var SettingsMediator = Views.SettingsMediator = function(dom) {
        this.dom = dom;
    };

    SettingsMediator.prototype = {

        init: function() {

            var settings = session.settings;

            $("#rateMonth", this.dom).val(settings.rateMonth);
            $("#rateTotal", this.dom).val(settings.rateTotal);
            $("#legalPc", this.dom).val(settings.legalTextPc);
            $("#legalMobile", this.dom).val(settings.legalTextMobile);

            $("#save-settings").click(function() {
                $("body").trigger("saveSettingsClicked");
            });

        }

    };


    // *** MENU CONSTRUCTOR

    var Menu = Views.Menu = function() {
        this.items = [];
        this.dom = null;
    };

    Menu.prototype = {

        build: function() {
            this.dom = $("<div id='menu'></div>")[0];
            return this.dom;
        },

        init: function() {

            var oDom = $(this.dom),
                i,
                item,
                linkDom;

            for (i = 0; i < this.items.length; i++) {
                item = this.items[i];
                linkDom = $("<a href='javascript: void(0);' class='" + item.clazz + "'>" + item.label + "</a>");
                linkDom.click(item, function(event) {
                    $(this).trigger({type: event.data.event});
                });
                oDom.append(linkDom);
            }

        },

        destroy: function() {}

    };



    // *****************************************************************************************************************
    // COMMANDS
    // *****************************************************************************************************************


    var Commands = Molaboard.Commands = {

        login: function(url) {

            var data = {
                username: $("#loginUsername").val(),
                password: $("#loginPassword").val()
            };

            $.ajax({
                url: url,
                data: data,
                dataType: "json",
                success: function(data) {
                    session.userLoggedIn = data;
					if (!data.success) {
						alert("ERROR: Incorrect username or password");
					} else {
                    	$("body").trigger(events.LOGGED_IN, data);
					}
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    Utils.log("Error when loading login command at '" + url + "': " + textStatus);
                    $("body").trigger(events.ERROR);
                }
            });

        },

        logout: function() {
            window.location = ".";
        },

        getSettings : function(url){

            var data = {
                service: "getconf"
            };

            $.ajax({
                url: url,
                data: data,
                dataType: "jsonp",
                success: function(data) {
                    Zumo.log.debug(data);
                    session.settings = data.data;
                    $("body").trigger("settingsLoaded");
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    Zumo.log.warn(textStatus);
                    $("body").trigger("error");
                }
            });

        },

        saveSettings : function(url){

            var data = {
                service: "setconf",
                legalTextPc: $("#legalPc").val(),
                legalTextMobile: $("#legalMobile").val(),
                rateMonth: $("#rateMonth").val(),
                rateTotal: $("#rateTotal").val()
            };

            $.ajax({
                url: url,
                data: data,
                dataType: "jsonp",
                success: function(data) {
                    Zumo.log.debug(data);
					alert("The settings have been successfully saved");
                    //$("body").trigger("settingsSet");
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    Zumo.log.warn(textStatus);
                    $("body").trigger("error");
                }
            });

        }

    };


})(this);


// *********************************************************************************************************************
// INIT
// *********************************************************************************************************************

$(function() {

    Zumo.log.level = 2;

    Zumo.onConfLoaded = function() {
        Molaboard.init();
    };

    Zumo.init(window.document, "molaboard.xml");

});