(function(window) {


	// *** Mola OBJECT

	var Mola = {

		init: function() {

			this.initMenu();

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
				var li = $(document.createElement("li"));
				li.text(pageContext.title);
				li.click({id: pageContext.id}, function(event) {
					window.console.info("*** ID: " + event.data.id);
					Zumo.goto(event.data.id);
				});
				var menuItem = $("#menu").append(li);
			}
		}

	};


	// *** SETUP

	// Expose global MaerskTabs object
	window.Mola = Mola;


})(this);


// *** INIT

$(function() {

	Zumo.log.level = 3;

	Zumo.init(window.document, "zumo.xml");

	Zumo.onConfLoaded = function() {
		Mola.init();
		Zumo.goto("frontpage");
	}

});