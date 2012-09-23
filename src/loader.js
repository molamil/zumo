
	// *** LOADER CLASS

	var Loader = function() {
		this.method = "GET";
		// --
		// Implementing:
		// this.xmlHttp = null;
		// this.callback= null;
		// this.callbackObject = null;
	};

	Loader.prototype = {

		load: function(url, onLoaded, callbackObject) {

			this.callback = onLoaded;
			this.callbackObject = callbackObject;
			var onState = this.onState;
			var thisObject = this;

			if (window.XMLHttpRequest) {
				this.xmlHttp = new XMLHttpRequest();
				this.xmlHttp.onreadystatechange = function() {
					thisObject.onState.call(thisObject);
				};
				this.xmlHttp.open(this.method, url, true);
				this.xmlHttp.send(null);
			} else if (window.ActiveXObject) {
				Log.info("Loader using ActiveX");
				this.xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
				if (this.xmlHttp) {
					this.xmlHttp.onreadystatechange = function() {
						thisObject.onState.call(thisObject);
					};
					this.xmlHttp.open(this.method, url, true);
					this.xmlHttp.send();
				}
			}

			if (!this.xmlHttp)
				Log.error("Loader could not create an XML HTTP object");

		},

		onState: function() {
			if (this.xmlHttp.readyState == 4) {
				if (this.xmlHttp.status == 200 || this.xmlHttp.status == 0) {
					this.onLoaded(this.xmlHttp);
				} else {
					Log.warn("The server returned an error when trying to load: " + this.xmlHttp.responseXML);
				}
			}
		},

		onLoaded: function(xmlHttp) {
			Log.debug("The server returned content from Loader");
			if (typeof this.callback == "function")
				this.callback.call(this.callbackObject, xmlHttp);
		}

	};