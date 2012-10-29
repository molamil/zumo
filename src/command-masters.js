

    // *** COMMAND MASTERS - OBJECT

    var CommandMasters = {

        // --- METHODS - Using init method to create class functions as CommandMasters members

        init: function() {


            // *** ABSTRACT MASTER - CONSTRUCTOR

            var AbstractMaster = this.AbstractMaster = function(context, request, session) {
                this.context = context;
                this.request = request;
                this.session = session;
                this.isExecuted = false;
                //TODO: See how to configure the master properties.
            };

            AbstractMaster.prototype = {

                execute: function() {
                    Log.debug("Initializing " + this.context.id);
                }

            };


            // *** FUNCTION MASTER - CONSTRUCTOR

            var FunctionMaster = this.FunctionMaster = this.createCommandMaster(function() {

                var f = Utils.find(this.context.target),
                    args = [],
                    data = Utils.mix(this.context.props, this.request.params);

                if (data._args && data._args.length)
                    args = data._args.slice(0);

                if (!Utils.isEmpty(data))
                    args.push(data);

                if (typeof f == "function") {
                    f.apply(null, args); //TODO: Check the this context.
                } else {
                    Log.warn("There is no function to execute for command '" + this.context.id + "' and target '" +
                        this.context.target + "'.");
                }

                this.isExecuted = true;

            }, AbstractMaster);


        },

        createCommandMaster: function(fOrConf, parent) {

            var commandMaster,
                useConfArgument = typeof fOrConf == "object",
                conf = useConfArgument ? fOrConf : {};

            // Set default parent for the manager if not provided.
            parent = parent || this.AbstractMaster;

            if (!useConfArgument) {
                if (typeof arguments[0] == "function") {
                    conf.execute = fOrConf;
                } else {
                    Log.warn("Malformed call to createCommandMaster - either createCommandMaster(conf, [parent]) or " +
                        "createCommandMaster(fExecute, [parent]) are allowed.");
                }
            }

            // Constructor function, calling parent with arguments.
            commandMaster = function() {
                parent.apply(this, arguments);
            };

            // Extending.
            commandMaster.prototype = new parent();
            Utils.merge(commandMaster.prototype, conf);

            return commandMaster;

        }

    };
