/*
 * ZUMO - Unit test suite
 *
 * Author: Jorge Hernandez
 *
 */


// *** UTILS

module("Utils");

test("StringUtils", function() {

    equal(Zumo.StringUtils.trim('   '), '', 'Zumo.StringUtils.trim("   ") = ""');

});