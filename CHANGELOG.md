Zumo Framework Changelog
========================

---

ZUMO 0.5 (2014...)
------------------

[Bricks and JSON, in progress...]

*  Support for includes in DOM configuration.
*  Support for JSON configuration.
*  Handlers listen on document instead of body.
*  Fixed issue with handlers not being triggered some times when the target was contained on a newly created view.
*  Bricks implemented.

---

ZUMO 0.4 (2013-04-04)
------------------

[Small fixes]

*  Fix for empty prop values as XML attributes.
*  Initial decorator implementation for props.
*  Expressions can resolve to a single object (non-string).
*  Fix for evaluating expressions on an empty input.
*  Added prefix "z-" support for "name" and "for" attributes.

---

ZUMO 0.3 (2013-01-17)
---------------------

[Expressions, top level props, includes...]

*  Expressions implemented in view and command props.
*  Included jQuery $fade state managers.
*  Command masters, view masters and view managers are case insensitive.
*  Void view masters (with no target) can execute mediators.
*  Support for new handler action (aliases): clear and display.
*  Implemented props on Zumo object, parsed from conf.
*  Added onPageCreate and onBlockCreate, which are triggered after the dom is created, just before init.
*  Prefix "z-" in DOM element ID's gets removed on view init.
*  Support for Zumo.init(confString), obviating the document container.
*  Improvements on DOM configuration; handlers can be set as e.g. data-handler=".selector:click@somePage"
*  Implemented includes for distributing the conf in several files.
*  Added parameter support to Loader.
*  Optimized util methods: mix, merge, etc.
*  Added createCommandMaster method for easy command creation and built-in inheritance.

---

ZUMO 0.2 (2012-10-07)
---------------------

[Improvements on state managers and view masters]

*  Added VoidMaster ("void") for views without target.
*  Fixed Builder view master.
*  Added createStateManager and createViewMaster methods for easy creation and built-in inheritance.
*  Removed awkward initial underscore in names when creating state managers and view masters.
*  Re-organized source files.

---

ZUMO 0.1 (2012-09-23)
---------------------

[Initial release]

*  Initial release, already used on several production-ready projects.