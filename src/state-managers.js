
	// *** STATE MANAGERS OBJECT

	var StateManagers = {

		// --- PROPERTIES

		STATE_IN: "IN",
		STATE_ON: "ON",
		STATE_OUT: "OUT",
		STATE_OFF: "OFF",

		// --- METHODS - Using init method to create class functions as StateManagers members

		init: function() {


			// *** BASE IO3 MANAGER CLASS

			var BaseIo3Manager = function(target, session) {
				this.target = target;
				this.session = session;
				this._state = null;
			};

			BaseIo3Manager.prototype = {

				destroy: function() {
					// Empty
				},

				getState: function() {
					return this._state;
				},

				setState: function(state) {
					state = state.toUpperCase();
					if (state != StateManagers.STATE_IN && state != StateManagers.STATE_ON && state != StateManagers.STATE_OUT && state != StateManagers.STATE_OFF) {
						Log.warn("Unknown state, returning without changing state for target " + this.target);
						return;
					}
					if (state != this._state) {
						this._state = state;
						this._changeState();
					}
				},

				_changeState: function() {

					this.onStateChange(this.target, this._state);

					if (this._state == StateManagers.STATE_IN) {
						this._doIn();
					} else if (this._state == StateManagers.STATE_ON) {
						this._doOn();
					} else if (this._state == StateManagers.STATE_OUT) {
						if (this.target != null) {
							this._doOut();
						} else {
							Log.info("target is null when trying to set state to OUT, setting state to OFF instead of " +
										"calling doOut to avoid errors.");
							this._state = StateManagers.STATE_OFF;
						}
					} else if (this._state == StateManagers.STATE_OFF) {
						this._doOff();
					}

				},

				_doIn: function() {
					this.setState(StateManagers.STATE_ON);
				},

				_doOn: function() {
					// Empty
				},

				_doOut: function() {
					this.setState(StateManagers.STATE_OFF);
				},

				_doOff: function() {
					// Empty
				},

				onStateChange: function(target, state) {
					// Empty
				}

			};


			// *** INIT - Initializing StateManagers

			this.BaseIo3Manager = BaseIo3Manager;


		}

	};