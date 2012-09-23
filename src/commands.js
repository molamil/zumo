
	// ************************************************************************************************************
	// COMMANDS
	// ************************************************************************************************************


	// *** COMMAND CLASS

	var Command = function (context, request, session) {
		this.id = context.id;
		this.context = context;
		this.request = request;
		this.session = session;
		// --
		// Implementing:
		// this.master = null;
	};


	// *** COMMAND BUILDER OBJECT

	var CommandBuilder = {

		// --- METHODS

		createCommand: function(context, request, session) {
			var command = new Command(context, request, session);
			command.master = this._buildMaster(context, request, session);
			return command;
		},

		_buildMaster: function(context, request, session) {

			var masterClass, master;
			var type = StringUtils.trim(context.type).toLowerCase();

			if (type != "") {
				masterClass = session.commandMasters["_" + type];
			} else {
				masterClass = session.defaultCommandMasterClass;
			}

			if (masterClass) {
				if (typeof masterClass == "function") {
					master = new masterClass(context, request, session);
				} else {
					Log.error("The type " + type + " in " + context.id + " cannot create a new command");
				}
			} else {
				Log.error("The type " + type + " cannot be resolved in command: " + context.id);
			}

			return master;

		}

	};

	
	// *** COMMAND MASTERS OBJECT

	var CommandMasters = {

		// --- METHODS - Using init method to create class functions as CommandMasters members

		init: function() {


			// *** ABSTRACT MASTER CLASS

			var AbstractMaster = function(context, request, session) {
				this.context = context;
				this.request = request;
				this.session = session;
				this.isExecuted = false;
			};

			AbstractMaster.prototype = {

				execute: function() {
					Log.debug("Initializing " + this.context.id);
				}

			};


			// *** FUNCTION MASTER CLASS

			var FunctionMaster = function(context, request, session) {
				AbstractMaster.call(this, context, request, session);
				//TODO: See how to configure the master properties.
			};

			FunctionMaster.prototype = {

				execute: function() {
					AbstractMaster.prototype.execute.apply(this, arguments); // Call super
					var f = ObjectUtils.find(this.context.target),
					    args = [],
                        data = {};
                    ObjectUtils.merge(data, [this.context.props, this.request.params]);
					if (data._args && data._args.length)
						args = data._args.slice(0);
					if (!ObjectUtils.isEmpty(data))
						args.push(data);
					if (typeof f == "function") {
						f.apply(null, args); //TODO: Check the this context.
                    } else {
                        Log.warn("There is no function to execute for command '" + this.context.id + "' and target '" + this.context.target + "'.");
                    }
					this.isExecuted = true;
				}

			};


			// *** INIT - Initializing CommandMasters

			this.AbstractMaster = AbstractMaster;
			this.FunctionMaster = FunctionMaster;

			//ObjectUtils.extend(this.FunctionMaster, this.AbstractMaster);


		}

	};