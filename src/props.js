

    // *** PROPS MANAGER - OBJECT

    var PropsManager = {

        // --- METHODS

        apply: function(target, propContexts, session) {

            var i,
                propContext,
                nTarget,
                name;

            if (!target || !propContexts)
                return;

            // Merge the props
            for(i = 0; i < propContexts.length; i++) {
                propContext = propContexts[i];
                nTarget = target;
                if (propContext.target)
                    nTarget = session.selector(propContext.target, target);
                if (nTarget) {
                    name = propContext.name || session.defaultPropName;
                    nTarget[name] = propContext.value;
                }
            }

        }

    };
