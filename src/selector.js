

    // *** SELECTOR - OBJECT

    var Selector = {

        // --- METHODS

        select: function(selector, container) {
            // Setting container to document anyway in the default selector since we use getElementById
            container = document;
            return container.getElementById(selector.substr(1));
        }

    };
