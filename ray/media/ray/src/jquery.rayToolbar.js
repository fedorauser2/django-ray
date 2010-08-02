var rayToolbarManager = function(el) {
    var tb = this;
    tb.dom = {
        titlebar:   $('<div class="ui-ray-titlebar ui-widget-header" />'),
        toolbar:    $('<div class="ui-widget-header ui-helper-reset ui-helper-clearfix ui-ray-toolbar" />'),
        cursorinfo: $('<span class="ui-ray-cursorinfo" />'),
        parserswitcher: $('<label class="ui-ray-syntax-selector">Syntax: <select /></label>'),
        rightset:   $('<div style="float:right;margin-top:2px;" />')
    };

    tb.dom.rightset.append(tb.dom.parserswitcher).appendTo(tb.dom.toolbar);
    tb.el = el.append(tb.dom.cursorinfo, tb.dom.titlebar, tb.dom.toolbar);

    return {
        // Add Syntax items to syntax selector
        setParsers: function(parsers) {
            var s = tb.dom.parserswitcher.find('select');
            for (var x in parsers) {
                if (x.hasOwnProperty) {
                    $('<option>').data('magic', parsers[x])
                        .val(x).text(parsers[x].label)
                        .appendTo(s);
                }
            }
                    
        },

        setParser: function(parser) {
            $.each(tb.dom.parserswitcher.find('option'), function() {
                var magic = $(this).data('magic');
                if (magic.parser == parser) {
                    $(this).attr('selected', true).siblings().attr('selected', false);
                } 
            });
        },

        get: function(el) {
            try {
                return tb.dom[el];
            }
            catch (e) {
                return false;
            };
        },
        cursorinfo: function(i) {
            if (i) {
                tb.dom.cursorinfo.text(i);
            }            
            else {
                return tb.dom.cursorinfo.text();
            }
        },
        title: function(i) {
            if (i) {
                tb.dom.titlebar.text(i);
            }
            else {
                return tb.dom.titlebar.text();
            }
        },

        get_button: function(id) {
            var ui, x, sel, list;
            ui = this;
            if ($.isArray(id)) {
                list = [];
                for (x=0;x<=id.length;x++) {
                    list.push('#'+ id[x] +'.ui-button');
                }
                sel = list.join(', ');
            }
            else {
                sel = '#'+ id +'.ui-button';
            }
            return tb.dom.toolbar.find(sel);
        }

    };
};

