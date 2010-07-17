var RayFileBrowser = $.extend($.ui.rayBase, {
    
    _datasource: {
        dirs: [], files: []
    },

    dom: {},



    options: {
        change: function(e, data) {
            console.log('test3', e, data);
        },
    },

    diropen: function(p, link) {
        var ui = this;
        ui._trigger('dirOpen', { path: '?path='+ p });
        link.addClass('opened');
    },

    fileopen: function(p, link) {
        var ui = this;
        ui._trigger('fileOpen', { path: p });
        link.addClass('opened');
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

    _build_list: function(rs) {
        var ui, d, f, o;
        ui = this;
        d = ui._build_dir_list(ui._datasource);
        f = ui._build_file_list(ui._datasource);
        o = $('<ul class="ui-ray-filebrowser-list">'+ d.join('') + f.join('') +'</ul>');

        o.find('a').bind('click', function(e){ 
            ui._command_callback.apply(this, [e, ui]); 
        });

        return o;
    },

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

        return $(o.join('')).find('a').button().bind('click', function(e){ 
            ui._command_callback.apply(this, [e, ui]); 
        }).end();
    },

    // data updated
    _redraw: function() {
        var ui = this;
        ui.dom.wrapper.html(ui._build_breadcrumb()).append(ui._build_list());
        ui._repaint();
    },

    // data not updated
    _repaint: function() {
        var ui = this;
        ui.dom.wrapper.height(window.innerHeight - 2); 
    },

    _create: function() {
        var ui = this;

        ui.dom.wrapper = $('<div class="ui-ray-filebrowser-wrapper" />')
                            .appendTo(ui.element);


        ui.element.bind('dirOpened.rayFilebrowser', function(e){
            var rs, li, pane, list, path;
            rs   = e.originalEvent.data.content;
            if (rs) {
                ui._datasource = rs;
                ui._callback('redraw');
            }
        });
        ui._trigger('dirOpen', { path: '?path=/' });
        //ui.element.bind('rayfilebrowserchange', function() { console.log('test2'); });

        //ui._callback('change');
        //ui.element.trigger('rayfilebrowserchange');
        $(window).resize(function(){
            ui._repaint.call(ui);
        });

    },
    browse: function() {},

    destroy: function() {
        $.Widget.prototype.destroy.apply(this, arguments);
    }
});

$.widget('ui.rayFilebrowser', RayFileBrowser);
