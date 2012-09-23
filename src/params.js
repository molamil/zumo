
	// ************************************************************************************************************
	// PARAMS
	// ************************************************************************************************************


	// *** PARAMS MANAGER OBJECT

	var ParamsManager = {

		// --- METHODS

		apply: function(target, params, session) {

			//TODO: Add checks

			// Merge the params
			for(var i = 0; i < params.length; i++) {
				var param = params[i];
				target[param.name] = param.value;
			}

		}

	};