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
        },

        humanize: function(s) {
            s = s.replace(/([A-Z])/g, " $1").toLowerCase();
            s = s.replace(/_/g, " ");
            s = s.charAt(0).toUpperCase() + s.substr(1);
            return s;
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


    // *** SIMPLE MEDIATOR CONSTRUCTOR


    var SimpleMediator = Views.SimpleMediator = function(dom) {
        this.dom = dom;
        // -- Implementing:
        // this.data = null;
        // this.decorations = null;
    };

    SimpleMediator.prototype = {

        init: function() {

            var $dom = $(this.dom),
                $table,
                i,
                p,
                decoration,
                decoratedLabel,
                label;

            if (this.data) {
                $dom.append("<table class='data'></table>");
                $table = $("table", $dom);
                for (p in this.data) {
                    decoratedLabel = null;
                    if (this.decorations) {
                        for (i = 0; i < this.decorations.length; i++) {
                            decoration = this.decorations[i];
                            if (decoration.name == p)
                                decoratedLabel = decoration.label;
                        }
                    }
                    if (decoratedLabel) {
                        label = decoratedLabel;
                    } else {
                        label = Utils.humanize(p);
                    }
                    $table.append("<tr><td class='caption'>" + label + ":</td><td class='value'>" + this.data[p] + "</td></tr>");
                }
            }

        }

    };


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


    // *** ENVIRONMENT CONSTRUCTOR

    var Environment = Views.Environment = function(dom) {
        this.dom = dom;
        this.logoPath = null;
    };

    Environment.prototype = {

        init: function() {
            var $logo = $(".logo", this.dom);
            if (this.logoPath) {
                $logo.css("display", "block");
                $logo.attr("src", this.logoPath);
            }
        },

        destroy: function() {}

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

        login: function(url, data, dataType) {

            data = data || {};

            data = {
                username: $("#loginUsername").val(),
                password: $("#loginPassword").val()
            };

            dataType = dataType || "json";

            $.ajax({
                url: url,
                data: data,
                dataType: dataType,
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

        ajax: function(conf) {

            var url = conf.url,
                data = conf.data || null,
                dataType = conf.dataType || "json",
                dataWrapper = conf.dataWrapper || null,
                successEvent = conf.successEvent || "success",
                errorEvent = conf.errorEvent || "error";

            $.ajax({
                url: url,
                data: data,
                dataType: dataType,
                success: function(data) {
                    var eventData;
                    if (dataWrapper) {
                        eventData = {};
                        eventData[dataWrapper] = data;
                    } else {
                        eventData = data;
                    }
                    $("body").trigger(successEvent, eventData);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    $("body").trigger(errorEvent);
                }
            });

        },

        getSettings: function(url){

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