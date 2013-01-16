/*
 * ZUMO - Unit test suite
 *
 * Author: Jorge Hernandez
 *
 */


// *** EXPRESSIONS

module("Expressions");

test("resolve", function() {

    var resolver = new Zumo.ExpressionResolver(),
        data = {name: "Jorge", v: 10, nested: {prop: {erty: "nested property"}}},
        s = "This is a sample text with name {name} and another var {v}, including escaped \\{brackets} " +
            "and a {nested.prop.erty}",
        r = "This is a sample text with name Jorge and another var 10, including escaped {brackets} " +
            "and a nested property";

    equal(resolver.resolve(s, data), r, 'resolver parses the expressions');

});
