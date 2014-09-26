var PropEditor = function(conf) {
    this.conf = conf.Utils.clone(conf._conf);
    console.debug(conf);
};

PropEditor.prototype.validate = function() {
    //TODO: Implement validator
    return true;
};

PropEditor.prototype.createMarkup = function() {

    var c = this.conf,
        lp = c.views.pages.length,
        views = c.views.pages.concat(c.views.blocks),
        $dom = $("<div class='editor'></div>"),
        $pages = $("<ul class='pages'></ul>"),
        $blocks = $("<ul class='blocks'></ul>"),
        $container,
        $v,
        v,
        p,
        i;

    for (i = 0; i < views.length; i++) {
        v = views[i];
        $v = $("<li>" + v.id + "</li>");
        $v.data("conf", v);
        $v.click(function() {
            var $this = $(this);
            console.debug($this.data("conf"));
        });
        $container = (i < lp) ? $pages : $blocks;
        $container.append($v);
    }

    return $dom.append($pages).append($blocks);

};

// *** INIT

$(function() {

    var editor;

	Zumo.log.level = 2;
	Zumo.init("conf.xml");

	Zumo.onConfLoaded = function() {
        editor = new PropEditor(Zumo);
        $("body").append(editor.createMarkup());
	};

});