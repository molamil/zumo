

    // *** PARAMS MANAGER - OBJECT

    var ParamsManager = {

        // --- METHODS

        apply: function(target, params, session) {

            var i,
                param;

            if (!target || !params)
                return;

            // Merge the params
            for(i = 0; i < params.length; i++) {
                param = params[i];
                target[param.name] = param.value;
            }

        }

    };
