

    // *** PROPS MANAGER - OBJECT

    var PropsManager = {

        // --- METHODS

        apply: function(target, propContexts, session) {

            var i,
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
                        //TODO: Do not create new ExpressionResolver object but reuse instead.
                        //TODO: See whether we get the props from the session and not Zumo.
                        value = new ExpressionResolver().resolve(propContext.value, Zumo.props);
                    }
                    nTarget[name] = value;
                }
            }

        }

    };
