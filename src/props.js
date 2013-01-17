

    // *** PROPS MANAGER - OBJECT

    var PropsManager = {

        // --- METHODS

        apply: function(target, propContexts, session) {

            var resolver = session.resolver || new ExpressionResolver(),
                propContext,
                nTarget,
                name,
                value;

            if (!target || !propContexts)
                return;

            // Merge the props
            for (i = 0; i < propContexts.length; i++) {
                propContext = propContexts[i];
                nTarget = target;
                if (propContext.target) {
                    nTarget = session.selector(propContext.target, target);
                }
                if (nTarget) {
                    name = propContext.name || session.defaultPropName;
                    value = propContext.value;
                    if (typeof propContext.value == "string") {
                        //TODO: See whether we get the props from the session and not Zumo.
                        value = resolver.resolve(propContext.value, Zumo.props);
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
