var RayFileBrowser = $.extend($.ui.rayBase, {
    cwd: false,
    dom: {},

    options: {
        hasFocus: false,
        change: function(e, data) {
            console.log('test3', e, data);
        },
    },

    focus: function() {
        var ui = this;
        ui.options.hasFocus = true;      
        $(window).unbind('keydown.rayFilebrowser')
            .bind('keydown.rayFilebrowser', function(e){ 
                ui._keyboardNav.apply(ui, [e]);
            });
    },

    blur: function() {
        var ui = this;
        ui.options.hasFocus = false;      
        $('body').unbind('keydown.rayFilebrowser');
    },

    browse: function() {},

    destroy: function() {
        $.Widget.prototype.destroy.apply(this, arguments);
    },
    
    fileopen: function(p, link) {
        var ui = this;
        ui._trigger('fileOpen', { path: p });
        link.addClass('opened');
    },

    diropen: function(p, link) {
        var ui = this;
        ui._trigger('dirOpen', { path: '?path='+ p });
        ui.cwd = p;
        if (link) {
            link.addClass('opened');
        }
    },


    _keyboardNav: function(e) {
        var ui = this;
        var selected = function() {
            return ui.dom.wrapper.find('.ui-ray-filebrowser-list li.selected');
        };
        if (ui.options.hasFocus) {
            //console.log(e.keyCode);
            switch(e.keyCode) {
                
                // Backspace
                case 8: 
                    if (ui.cwd) {
                        var p = ui.cwd.split('/');
                        if (p.length < 4) {
                            var path = '';
                        }
                        else {
                            var path = '/'+ p.slice(1, -2).join('/') + '/';
                        }
                        ui.diropen(path)
                    }
                break;

                // Enter
                case 13: 
                    ui._command_callback.apply(selected().find('a'), [e, ui]); 
                break;

                // Up
                case 38: 
                    if (selected().is(':first-child')) {
                        selected().removeClass('selected').parent().find('li:last-child').addClass('selected');
                    }
                    else {
                        selected().removeClass('selected').prev().addClass('selected');
                    }
                break;

                // Down
                case 40: 
                    if (selected().is(':last-child')) {
                        selected().removeClass('selected').parent().find('li:first-child').addClass('selected');
                    }
                    else {
                        selected().removeClass('selected').next().addClass('selected');
                    }
                break;
            }
        }
    },

    _create: function() {

        var ui = this;

        ui.dom.wrapper = $('<div class="ui-ray-filebrowser-wrapper" />')
                            .bind('click.rayFilebrowser', function(){ ui.focus(); })
                            .appendTo(ui.element);
        
      //$('body').bind('click.rayFilebrowser', function(e){
      //    console.log(e, this);
      //});

        ui.element.bind('dirOpened.rayFilebrowser', function(e){
            var rs, li, pane, list, path;
            rs   = e.originalEvent.data.content;
            if (rs) {
                ui._datasource = rs;
                ui._callback('redraw');
            }
        });
        ui._trigger('dirOpen', { path: '?path=/' });
        //ui.element.bind('rayfilebrowserchange', function() { console.log('test2'); });'body'

        //ui._callback('change');
        //ui.element.trigger('rayfilebrowserchange');
        $(window).resize(function(){
            ui._repaint.call(ui);
        });

    },
    
    _datasource: {
        dirs: [], files: []
    },

    _build_file_list: function() {
        var o  = [];
        var ui = this;
        var ds = ui._datasource;
        for (x in ds.files) {
            if (x.hasOwnProperty) {
                var f = ds.files[x];
                o.push('<li class="ui-ray-filebrowser-file"><a href="#fileopen::'+ ds.base_path + f +'">'+ f +'</a></li>');
            }
        }
        return o;
    },

    _build_dir_list: function(ds) {
        var o  = [];
        var ui = this;
        var ds = ui._datasource;
        for (x in ds.dirs) {
            if (x.hasOwnProperty) {
                var d = ds.dirs[x];
                var lbl = d.replace(/^\/\d+:/, '');
                o.push('<li class="ui-ray-filebrowser-dir"><a href="#diropen::'+ ds.base_path + d +'/">'+ lbl +'</a></li>');
            }
        }
        return o;
    },

    /*  Builds the file/dir list from ui._datasource 
     *  and binds the necessary events.
     * */
    _build_list: function() {
        var ui, d, f, o;
        ui = this;
        d = ui._build_dir_list(ui._datasource);
        f = ui._build_file_list(ui._datasource);
        o = $('<ul class="ui-ray-filebrowser-list">'+ d.join('') + f.join('') +'</ul>');

        return o.find('a')
                .bind('click', function(e){
                    $(this).parent().addClass('selected')
                        .siblings().removeClass('selected');
                    e.preventDefault();
                    return false;
                })
                .bind('dblclick', function(e){ 
                    ui._command_callback.apply(this, [e, ui]); 
                })
                .first().click().end()
            .end();
    },

    /*  This methods interprets the commands specified in the
     *  file list. Those commands use anchors with a specific
     *  syntax, for example:
     *
     *  http://mysite.com/ray/editor/#diropen::/0:templates/
     *  |                           | |     |   | |        |
     *  +--+------------------------+ +--+--+   +-+---+----+
     *     |                             |      |     |
     *     Editor's URL               Command   | Arguments
     *                                          |
     *                                          + 
     *   Note: the "0" in this example is represents the index 
     *   of the target root directory in the settings.py file.
     * */
    _command_callback: function(e, ui){
        var link, cmd, arg;
        link = $(this);
        cmd  = link.attr('href').split('::')[0].replace('#', '');
        arg  = link.attr('href').split('::')[1];
        if ($.isFunction(ui[cmd])) {
            return ui[cmd].apply(ui, [arg, link]);
        }
        else {
            return false;
        }
    },

    /* Builds the "breadcrumb" menu from ui._datasource.base_path
     * */
    _build_breadcrumb: function() {
        var ui = this;
        var crumb = false;
        var o  = ['<ul class="ui-ray-filebrowser-breadcrumbs ui-widget-header">'];
        var crumbs = ui._datasource.base_path.split('/');
        var path   = [];
        o.push('<li><a href="#diropen::/" class="ui-button"><span class="ui-icon ui-icon-folder-collapsed">/</span></a></li>');

        for (var x = 0; x < crumbs.length;x++) {
            crumb = crumbs[x].replace(/^\d+:/,'');
            if (crumb.length) {
                path.push(crumb)
                var id = crumbs[x].match(/^(\d+):/,'');
                if (id && id.length > 1) {
                    var base_path = '/'+ id[1] +':';
                }
                else {
                    var base_path = '';
                }
                o.push('<li><a href="#diropen::'+ base_path + path.join('/') +'/">'+ crumb +'</a></li>');
            }
        }
        o.push('</ul>');

        return $(o.join('')).find('a')
                    .button() 
                    .bind('click', function(e){ 
                        ui._command_callback.apply(this, [e, ui]); 
                    }).end();
    },

    // data updated
    _redraw: function() {
        var ui = this;
        ui.dom.wrapper.html(ui._build_breadcrumb()).append(ui._build_list()).click();
        ui._repaint();
    },

    // data not updated
    _repaint: function() {
        var ui = this;
        ui.dom.wrapper.height(window.innerHeight - 2); 
    },

});

$.widget('ui.rayFilebrowser', RayFileBrowser);
