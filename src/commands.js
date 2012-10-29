

    // *** COMMAND - CONSTRUCTOR

    var Command = function (context, request, session) {
        this.id = context.id;
        this.context = context;
        this.request = request;
        this.session = session;
        // --
        // Implementing:
        // this.master = null;
    };


    // *** COMMAND BUILDER - OBJECT

    var CommandBuilder = {

        // --- METHODS

        createCommand: function(context, request, session) {
            var command = new Command(context, request, session);
            command.master = this._buildMaster(context, request, session);
            return command;
        },

        _buildMaster: function(context, request, session) {

            var masterClass,
                master,
                type = Utils.trim(context.type).toLowerCase();

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
