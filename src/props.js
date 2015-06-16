

    // *** PROPS MANAGER - OBJECT

    var PropsManager = {

        // --- METHODS

        apply: function(target, props, session) {

            var resolver = session.resolver || new ExpressionResolver(),
                propContext,
                nTarget,
                name,
                value,
                decorator,
                f,
                i,
                j;

            if (!target || !props)
                return;

            if (typeof props == "object" && typeof props.length == "undefined") {
                Utils.merge(target, props);
                return;
            }

            // Merge the props
            for (i = 0; i < props.length; i++) {
                propContext = props[i];
                nTarget = target;
                if (propContext.target) {
                    nTarget = session.selector(propContext.target, target);
                }
                if (nTarget) {
                    name = propContext.name || session.defaultPropName;
                    value = propContext.value;
                    //TODO: See whether we get the props from the session and not Zumo.
                    value = resolver.resolve(propContext.value, Zumo.props);
                    if (propContext.decorators && propContext.decorators.length) {
                        //TODO: Move this logic to its own component.
                        for (j = 0; j < propContext.decorators.length; j++) {
                            decorator = propContext.decorators[j];
                            f = Utils.find(decorator);
                            if (typeof f == "function") {
                                value = f.apply(null, [value]); //TODO: Check the this context.
                            } else {
                                Log.warn("There is no function for decorator '" + decorator + "'.");
                            }
                        }
                    }
                    nTarget[name] = value;
                }
            }

        },

        resolve: function(props, session) {
            var resolver = session.resolver || new ExpressionResolver(),
                prop;
            for (prop in props) {
                //TODO: See whether we get the props from the session and not Zumo.
                props[prop]= new ExpressionResolver().resolve(props[prop], Zumo.props);
            }
        }

    };
