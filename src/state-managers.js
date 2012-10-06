

    // *** STATE MANAGERS - OBJECT

    var StateManagers = {

        // --- PROPERTIES

        STATE_IN: "IN",
        STATE_ON: "ON",
        STATE_OUT: "OUT",
        STATE_OFF: "OFF",

        // --- METHODS - Using init method to create class functions as StateManagers members

        init: function() {


            // *** BASE IO3 MANAGER - CONSTRUCTOR

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
                    if (state != StateManagers.STATE_IN && state != StateManagers.STATE_ON &&
                        state != StateManagers.STATE_OUT && state != StateManagers.STATE_OFF) {
                        Log.warn("Unknown state, returning without changing state for target " + this.target);
                        return;
                    }
                    if (state != this._state) {
                        this._state = state;
                        this._changeState();
                    }
                },

                doIn: function() {
                    this.setState(StateManagers.STATE_ON);
                },

                doOn: function() {
                    // Empty
                },

                doOut: function() {
                    this.setState(StateManagers.STATE_OFF);
                },

                doOff: function() {
                    // Empty
                },

                _changeState: function() {

                    this.onStateChange(this.target, this._state);

                    if (this._state == StateManagers.STATE_IN) {
                        this.doIn();
                    } else if (this._state == StateManagers.STATE_ON) {
                        this.doOn();
                    } else if (this._state == StateManagers.STATE_OUT) {
                        if (this.target != null) {
                            this.doOut();
                        } else {
                            Log.info("target is null when trying to set state to OUT, setting state to OFF instead " +
                                     "of calling doOut to avoid errors.");
                            this._state = StateManagers.STATE_OFF;
                        }
                    } else if (this._state == StateManagers.STATE_OFF) {
                        this.doOff();
                    }

                },

                onStateChange: function(target, state) {
                    // Empty
                }

            };


            // *** INIT - Initializing StateManagers

            this.BaseIo3Manager = BaseIo3Manager;


        },

        createStateManager: function() {

            var stateManager,
                useConfArgument = typeof arguments[0] == "object",
                conf = useConfArgument ? arguments[0] : {},
                parent = useConfArgument ? arguments[1] : arguments[2];

            // Set default parent for the manager if not provided.
            parent = parent || this.BaseIo3Manager;

            if (!useConfArgument) {
                if ((typeof arguments[0] == "function") && (typeof arguments[1] == "function")) {
                    conf.doIn = arguments[0];
                    conf.doOut = arguments[1];
                } else {
                    Log.warn("Malformed call to createStateManager - either createStateManager(conf, [parent]) or " +
                             "createStateManager(doIn, doOut, [parent]) are allowed.");
                }
            }

            // Constructor function, calling parent with arguments.
            stateManager = function() {
                parent.apply(this, arguments);
            };

            // Extending.
            stateManager.prototype = new parent();
            ObjectUtils.merge(stateManager.prototype, conf);

            return stateManager;

        }

    };
