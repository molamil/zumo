(function(window) {


	// *** SESSION OBJECT

	var Session = {
		style: null
	};


	// *** STATE MANAGERS OBJECT

	var StateManagers = {

		init: function() {


			// *** CASCADE CLASS

			var Cascade = function(target, session) {
				Zumo.StateManagers.BaseIo3Manager.call(this, target, session);
				this.inDelay = 200;
				this.delay = 90;
				this.timeIn = 200;
				this.timeOut = 200;
				this.timeSlide = 300;
				this.offsetSlide = 150;
			};

			Cascade.prototype = {

				_doIn: function() {
					var that = this;
					var $div = $("div", this.target);
					for (var i = 0; i < $div.length; i++) {
						var $thisDiv = $($div[i]);
						var callback;
						if (i == $div.length - 1) {
							callback = function() {
								that.setState(Zumo.StateManagers.STATE_ON);
							}
						}
						$thisDiv.css("display", "none");
						$thisDiv.delay(i * that.delay + that.inDelay).fadeIn(that.timeIn, callback);
					}
					if (Session.style == "vertical") {
						var $target = $(that.target);
						$target.css("left", that.offsetSlide);
						$target.delay(100).animate({left: 0}, that.timeSlide);
					}
				},

				_doOut: function() {
					var that = this;
					if (Session.style == "vertical") {
						var $target = $(that.target);
						$target.css("left", 0);
						$target.animate({left: -that.offsetSlide, opacity: 0}, that.timeSlide);
					} else {
						var $div = $("div", this.target);
						for (var i = 0; i < $div.length; i++) {
							var $thisDiv = $($div[i]);
							var callback;
							if (i == $div.length - 1) {
								callback = function() {
									that.setState(Zumo.StateManagers.STATE_OFF);
								}
							}
							$thisDiv.delay(($div.length - 1 - i) * that.delay).fadeOut(that.timeOut * 2, callback);
						}
					}
				}

			};


			// *** INIT

			Zumo.ObjectUtils.extend(Cascade, Zumo.StateManagers.BaseIo3Manager);
			Zumo.registerStateManager("_cascade", Cascade);


		}

	}


	// *** MOLA OBJECT

	var Mola = {

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
			var pageContexts = Zumo.getPageContexts();
			for (var i = 0; i < pageContexts.length; i++) {
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


	// *** SETUP

	// Expose global MaerskTabs object
	window.Mola = Mola;


})(this);


// *** INIT

$(function() {

	Zumo.log.level = 2;

	Zumo.init(window.document, "zumo.xml");

	Zumo.onConfLoaded = function() {
		Mola.init();
		Zumo.go("frontpage");
	}

});