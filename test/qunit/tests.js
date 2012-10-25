/*
 * ZUMO - Unit test suite
 *
 * Author: Jorge Hernandez
 *
 */


// *** UTILS

module("Utils");

test("Delegate", function() {

    var o = {
            n: 1
        },
        f = function(i, j) {
            i = i || 1;
            j = j || 1;
            return this.n += i * j;
        },
        fd1 = Zumo.Delegate.create(f, o),
        fd2 = Zumo.Delegate.create(f, o, 2, 1);

    ok(isNaN(f()), 'isNaN(f()) = true');
    equal(fd1(), 2, 'fd1() = 2');
    equal(fd2(), 4, 'fd2() = 4');
    equal(fd2(4), 8, 'fd2(4) = 8');
    equal(fd2(), 10, 'fd2() = 10');
    equal(fd1(), 11, 'fd1() = 11');
    equal(fd2(2, 2), 15, 'fd1(2, 2) = 15');

});

test("StringUtils", function() {

    equal(Zumo.StringUtils.trim(), '', 'trim() = ""');
    equal(Zumo.StringUtils.trim('   '), '', 'trim("   ") = ""');
    equal(Zumo.StringUtils.trim('Some text   '), 'Some text', 'trim("Some text   ") = "Some text"');
    equal(Zumo.StringUtils.trim('    Some text   '), 'Some text', 'trim("    Some text   ") = "Some text"');

    equal(Zumo.StringUtils.ltrim(), '', 'ltrim() = ""');
    equal(Zumo.StringUtils.ltrim('   '), '', 'ltrim("   ") = ""');
    equal(Zumo.StringUtils.ltrim('Some text   '), 'Some text   ', 'ltrim("Some text   ") = "Some text   "');
    equal(Zumo.StringUtils.ltrim('    Some text   '), 'Some text   ', 'ltrim("    Some text   ") = "Some text   "');

    equal(Zumo.StringUtils.rtrim(), '', 'rtrim() = ""');
    equal(Zumo.StringUtils.rtrim('   '), '', 'rtrim("   ") = ""');
    equal(Zumo.StringUtils.rtrim('Some text   '), 'Some text', 'rtrim("Some text   ") = "Some text"');
    equal(Zumo.StringUtils.rtrim('    Some text   '), '    Some text', 'rtrim("    Some text   ") = "    Some text"');

});

test("ObjectUtils.mix", function() {

    var location = {
            city: "Copenhagen",
            country: "Denmark"
        },
        me = {
            name: "Jorge",
            age: 32
        },
        somebody = {
            age: 20,
            gender: "male",
            location: location
        },
        somebodyElse = {
            age: 33,
            name: "Pernille",
            gender: "female"
        },
        meAndSomebody = Zumo.ObjectUtils.mix(me, somebody),
        meAndSomebodyAndMe = Zumo.ObjectUtils.mix(meAndSomebody, me),
        meAndSomebodyAndElse = Zumo.ObjectUtils.mix(meAndSomebody, somebodyElse),
        allAtOnce = Zumo.ObjectUtils.mix(me, somebody, somebodyElse);

    equal(me.name, "Jorge", 'me.name = "Jorge"');
    equal(me.age, 32, 'me.age = 32');
    deepEqual(me.gender, undefined, 'me.gender = undefined');

    ok(me !== meAndSomebody, 'me != meAndSomebody');
    equal(meAndSomebody.name, "Jorge", 'meAndSomebody.name = "Jorge"');
    equal(meAndSomebody.age, 20, 'meAndSomebody.age = 20');
    equal(meAndSomebody.gender, "male", 'meAndSomebody.gender = "male"');
    equal(meAndSomebody.location.city, "Copenhagen", 'meAndSomebody.location.city = "Copenhagen"');

    location.country = "Spain";

    equal(meAndSomebody.location.country, "Spain",
          'Checking that it is a shallow copy, meAndSomebody.location.country == "Spain');

    equal(meAndSomebodyAndMe.name, "Jorge", 'meAndSomebodyAndMe.name = "Jorge"');
    equal(meAndSomebodyAndMe.age, 32, 'meAndSomebodyAndMe.age = 32');
    equal(meAndSomebodyAndMe.gender, "male", 'meAndSomebodyAndMe.gender = "male"');

    equal(meAndSomebodyAndElse.name, "Pernille", 'meAndSomebodyAndElse.name = "Pernille"');
    equal(meAndSomebodyAndElse.age, 33, 'meAndSomebodyAndElse.age = 33');
    equal(meAndSomebodyAndElse.gender, "female", 'meAndSomebodyAndElse.gender = "female"');

    ok(me !== allAtOnce, 'me != allAtOnce');
    ok(location === allAtOnce.location, 'Checking that it is a shallow copy, location == allAtOnce.location');
    equal(allAtOnce.name, "Pernille", 'allAtOnce.name = "Pernille"');
    equal(allAtOnce.age, 33, 'allAtOnce.age = 33');
    equal(allAtOnce.gender, "female", 'allAtOnce.gender = "female"');
    equal(allAtOnce.location.city, "Copenhagen", 'allAtOnce.location.city = "Copenhagen"');

    deepEqual(Zumo.ObjectUtils.mix(), {}, 'mix() = {}');
    deepEqual(Zumo.ObjectUtils.mix(null, {i: 5}), {i: 5}, 'mix(null, {i: 5}) = {i: 5}');
    deepEqual(Zumo.ObjectUtils.mix(10, {i: 5}), {i: 5}, 'mix(10, {i: 5}) = {i: 5}');

});

test("ObjectUtils.merge", function() {

    var location = {
            city: "Copenhagen",
            country: "Denmark"
        },
        me = {
            name: "Jorge",
            age: 32
        },
        somebody = {
            age: 20,
            gender: "male",
            location: location
        },
        somebodyElse = {
            age: 33,
            name: "Pernille",
            gender: "female"
        },
        nothing = Zumo.ObjectUtils.merge(me, somebody, somebodyElse);

    ok(nothing == null, 'merge does not return an object, nothing = null');
    ok(location === me.location, 'Checking that it is a shallow copy, location == me.location');
    equal(me.name, "Pernille", 'me.name = "Pernille"');
    equal(me.age, 33, 'me.age = 33');
    equal(me.gender, "female", 'me.gender = "female"');
    equal(me.location.city, "Copenhagen", 'me.location.city = "Copenhagen"');

    location.country = "Spain";

    equal(me.location.country, "Spain",
          'Checking that it is a shallow copy, me.location.country == "Spain');

    deepEqual(Zumo.ObjectUtils.merge(), undefined, 'merge() = undefined');
    deepEqual(Zumo.ObjectUtils.merge(null, {i: 5}), undefined, 'merge(null, {i: 5}) = undefined');
    deepEqual(Zumo.ObjectUtils.merge(10, {i: 5}), undefined, 'merge(10, {i: 5}) = undefined');

});

test("ObjectUtils.find", function() {

    var me = {
            name: "Jorge",
            contact: {
                web: "www.molamil.com",
                location: {
                    city: "Copenhagen",
                    countru: "Denmark"
                }
            },
            friend: {
                name: "Ramiro",
                nice: true
            }
        };

    equal(Zumo.ObjectUtils.find("name", me), "Jorge", 'find("name", me) = "Jorge"');
    equal(Zumo.ObjectUtils.find("contact.web", me), "www.molamil.com", 'find("contact.web", me) = "www.molamil.com"');
    equal(Zumo.ObjectUtils.find("contact.location.city", me), "Copenhagen", 'find("location.city", me) = "Copenhagen"');
    equal(Zumo.ObjectUtils.find("friend.name", me), "Ramiro", 'find("friend.name", me) = "Ramiro"');
    equal(Zumo.ObjectUtils.find("friend.nice", me), true, 'find("friend.nice", me) = true');

    deepEqual(Zumo.ObjectUtils.find("Zumo"), Zumo, 'Using window as default container, find("Zumo") = Zumo');
    deepEqual(Zumo.ObjectUtils.find("Zumo.init"), Zumo.init,
              'Using window as default container, find("Zumo.init") = Zumo.init');

});

test("ObjectUtils.isEmpty", function() {

    ok(Zumo.ObjectUtils.isEmpty(), 'isEmpty() = true');
    ok(Zumo.ObjectUtils.isEmpty(null), 'isEmpty(null) = true');
    ok(Zumo.ObjectUtils.isEmpty(""), 'isEmpty("") = true');
    ok(Zumo.ObjectUtils.isEmpty("   "), 'isEmpty("   ") = true');
    ok(Zumo.ObjectUtils.isEmpty({}), 'isEmpty({}) = true');
    ok(Zumo.ObjectUtils.isEmpty(false), 'isEmpty(false) = true');
    ok(!Zumo.ObjectUtils.isEmpty("s"), 'isEmpty("s") = false');
    ok(!Zumo.ObjectUtils.isEmpty(10), 'isEmpty(10) = false');
    ok(!Zumo.ObjectUtils.isEmpty({s: null}), 'isEmpty(s: null) = false');
    ok(!Zumo.ObjectUtils.isEmpty(true), 'isEmpty(true) = false');

});

new Zumo.Loader().load("test-person.xml", function(xmlHttp) {

    test("DomUtils", function() {

        var xml = $("xml", xmlHttp.responseXML)[0];

        equal(Zumo.DomUtils.getChildren(xml, "person").length, 2, 'getChildren(xml, "person").length = 2');
        equal(Zumo.DomUtils.getChildren(xml, "pizza").length, 0, 'getChildren(xml, "pizza").length = 0');
        deepEqual(Zumo.DomUtils.getChildren(null, "pizza").length, 0, 'getChildren(null, "pizza").length = 0');
        equal(Zumo.DomUtils.getChildren($("person", xml)[0], "friend").length, 3,
            'getChildren($("person", xml)[0], "friend").length = 3');
        equal(Zumo.DomUtils.getChildren($("person", xml)[0], "location").length, 1,
            'getChildren($("person", xml)[0], "location").length = 1');

        });

});

