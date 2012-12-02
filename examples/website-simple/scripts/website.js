(function(window) {


	// *** SESSION OBJECT

	var Session = {
		style: null
	};


	// *** STATE MANAGERS OBJECT

	var StateManagers = {

		init: function() {


			// *** CASCADE CLASS

            Zumo.createStateManager("cascade", {
                inDelay: 200,
                delay: 90,
                timeIn: 200,
                timeOut: 200,
                timeSlide: 300,
                offsetSlide: 150,
                doIn: function() {
                    var that = this,
                        $div = $("div", this.target),
                        i,
                        $thisDiv,
                        callback,
                        $target;
                    for (i = 0; i < $div.length; i++) {
                        $thisDiv = $($div[i]);
                        if (i == $div.length - 1) {
                            callback = function() {
                                that.setState(Zumo.StateManagers.STATE_ON);
                            };
                        }
                        $thisDiv.css("display", "none");
                        $thisDiv.delay(i * that.delay + that.inDelay).fadeIn(that.timeIn, callback);
                    }
                    if (Session.style == "vertical") {
                        $target = $(that.target);
                        $target.css("left", that.offsetSlide);
                        $target.delay(100).animate({left: 0}, that.timeSlide);
                    }
                },
                doOut: function() {
                    var that = this,
                        $target,
                        $div,
                        i,
                        $thisDiv,
                        callback;
                    if (Session.style == "vertical") {
                        $target = $(that.target);
                        $target.css("left", 0);
                        $target.animate({left: -that.offsetSlide, opacity: 0}, that.timeSlide);
                    } else {
                        $div = $("div", this.target);
                        for (i = 0; i < $div.length; i++) {
                            $thisDiv = $($div[i]);
                            if (i == $div.length - 1) {
                                callback = function() {
                                    that.setState(Zumo.StateManagers.STATE_OFF);
                                };
                            }
                            $thisDiv.delay(($div.length - 1 - i) * that.delay).fadeOut(that.timeOut * 2, callback);
                        }
                    }
                }
            });


		}

	};


	// *** WEB SIMPLE OBJECT

	var WebSimple = window.WebSimple = {

		init: function() {

			this.initMenu();

			StateManagers.init();

			$("#header").fadeIn("fast");

			// Check for style

			var styleParams = new RegExp('[\\?&]style=([^&#]*)').exec(window.location.href);
			if (styleParams && styleParams[1])
				Session.style = styleParams[1];
			if (Session.style == "vertical")
				$("head").append('<link rel="stylesheet" href="styles/vertical.css" type="text/css" />');
			
			// Rollovers

			$("#menu li").mouseover(function() {
				$(this).addClass("over");
			});

			$("#menu li").mouseout(function() {
				$(this).removeClass("over");
			});

		},

		initMenu: function() {
			var pageContexts = Zumo.getPageContexts(),
                i;
			for (i = 0; i < pageContexts.length; i++) {
				var pageContext = pageContexts[i];
				var $li = $(document.createElement("li"));
				$li.text(pageContext.title);
				$li.css("display", "none");
				$li.delay((pageContexts.length - i) * 200).fadeIn("slow");
				$li.click({id: pageContext.id}, function(event) {
					Zumo.go(event.data.id);
				});
				$("#menu").append($li);
			}
		}

	};


})(this);


// *** INIT

$(function() {

	Zumo.log.level = 2;

	Zumo.init(window.document, "zumo.xml");

	Zumo.onConfLoaded = function() {
        WebSimple.init();
		Zumo.go("frontpage");
	};

});