
	// ************************************************************************************************************
	// PROPS
	// ************************************************************************************************************


	// *** PROPS MANAGER OBJECT

    var PropsManager = {

        // --- METHODS

        apply: function(target, propContexts, session) {

            if (!target || !propContexts)
                return;

            // Merge the props
            for(var i = 0; i < propContexts.length; i++) {
                var propContext = propContexts[i];
                var nTarget = target;
                if (propContext.target)
                    nTarget = session.selector(propContext.target, target);
                if (nTarget) {
                    var name = propContext.name || session.defaultPropName;
                    nTarget[name] = propContext.value;
                }
            }

        }

    };