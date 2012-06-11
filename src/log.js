	// *** LOG OBJECT

	var Log = {

		// --- PROPERTIES

		LEVELS: ["error", "warn", "info", "debug"],
		level: 2,
		prefix: _NAME.toUpperCase() + " - ",

		// --- METHODS

		debug: function(message) {
			if (typeof message == "string")
				message = this.prefix + message;
			this._log(message, 3);
		},

		info: function(message) {
			this._log(this.prefix + message, 2);
		},

		warn: function(message) {
			this._log(this.prefix + message, 1);
		},

		error: function(message) {
			this._log(this.prefix + message, 0);
		},

		// Default Firebug console logging implemented.
		_log: function(message, level) {

			// Check that Firebug is enabled.
			if (!window.console)
				return;

			// Set level as default if not passed.
			if (level == null)
				level = this.level;

			if (this.level >= level) {
				var fLevel = window.console[this.LEVELS[level]];
				if (typeof fLevel == "function")
					fLevel.call(window.console, message);
			}

		}

	};