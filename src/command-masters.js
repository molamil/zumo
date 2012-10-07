

    // *** COMMAND MASTERS - OBJECT

    var CommandMasters = {

        // --- METHODS - Using init method to create class functions as CommandMasters members

        init: function() {


            // *** ABSTRACT MASTER - CONSTRUCTOR

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


            // *** FUNCTION MASTER - CONSTRUCTOR

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
                        Log.warn("There is no function to execute for command '" + this.context.id + "' and target '" +
                            this.context.target + "'.");
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
