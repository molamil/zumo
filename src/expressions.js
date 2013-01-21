

    // *** EXPRESSION RESOLVER - CONSTRUCTOR

    var ExpressionResolver = function() {

        this.evaluators = [];

        // Adding a default evaluator.
        this.add(function(expression, data) {
            if (typeof expression != "string") {
                return null;
            }
            return Utils.getNestedProperty(data, expression);
        });

    };

    ExpressionResolver.prototype = {

        // --- PROPERTIES

        opening: "{",
        closing: "}",

        // --- METHODS

        add: function(evaluator, priority) {
            var i,
                e;
            if (evaluator && !this.contains(evaluator)) {
                if (typeof priority == "number") {
                    for (i = 0; i < this.evaluators.length; i++) {
                        e = this.evaluators[i];
                        if (e.priority <= priority) {
                            this.evaluators.splice(i, 0, {f: evaluator, priority: priority});
                        }
                    }
                } else {
                    this.evaluators.push({f: evaluator, priority: 0});
                }
            }
        },

        remove: function(evaluator) {
            var i = this.indexOf(evaluator);
            if (i != -1)
                this.evaluators.splice(i, 1);
        },

        contains: function(evaluator) {
            return this.indexOf(evaluator) != -1;
        },

        indexOf: function(evaluator) {
            var i;
            for (i = 0; i < this.evaluators.length; i++) {
                if (this.evaluators[i].f === evaluator) {
                    return i;
                }
            }
            return -1;
        },

        clear: function() {
            this.evaluators = [];
        },

        resolve: function(input, data) {

            if (!input)
                return null;

            var values = [],
                value,
                a,
                outputText,
                output,
                i,
                j,
                prevToken,
                token,
                endIndex,
                expression,
                evaluator,
                startText,
                endText;

            if (typeof data == "object") {

                a = input.split(this.opening);
                startText = outputText = a[0];

                for (i = 1; i < a.length; i++) {

                    prevToken = a[i - 1];
                    token = a[i];

                    if (prevToken.charAt(prevToken.length - 1) == "\\") {
                        outputText += this.opening + token;
                        continue;
                    }

                    endIndex = token.indexOf(this.closing);

                    if (endIndex == -1) {
                        Log.error("ERROR: Missing closing tag in expression: '" + token + "'");
                    }

                    expression = Utils.trim(token.substring(0, endIndex));

                    for (j = 0; j < this.evaluators.length; j++) {
                        evaluator = this.evaluators[j].f;
                        value = evaluator(expression, data);
                        if (value) {
                            values.push(value);
                            break;
                        }
                    }

                    endText = token.substring(endIndex + 1);
                    outputText += value + endText;

                }

                if (values.length == 1 && startText == "" && endText == "") {
                    output = value;
                } else {
                    outputText = outputText.replace("\\" + this.opening, this.opening);
                    outputText = outputText.replace("\\" + this.closing, this.closing);
                    output = outputText;
                }

            } else {
                output = input;
            }

            return output;

        }

    };
