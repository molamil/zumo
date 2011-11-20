(function(window) {


	// *** STATE MANAGERS

	var StateManagers = {

		init: function() {


			// *** CASCADE CLASS

			var Cascade = function(target, session) {
				Zumo.StateManagers.BaseIo3Manager.call(this, target, session);
				this.inDelay = 300;
				this.delay = 90;
				this.timeIn = 200;
				this.timeOut = 200;
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
				},

				_doOut: function() {
					var that = this;
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
					Zumo.goto(event.data.id);
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
		Zumo.goto("frontpage");
	}

});