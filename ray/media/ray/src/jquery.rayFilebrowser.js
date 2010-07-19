var RayFileBrowser = $.extend($.ui.rayBase, {
    cwd: false,
    dom: {},

    options: {
        hasFocus: false,
        hidden: false,
        change: function(e, data) {
            console.log('test3', e, data);
        },
    },
    
    isVisible: function() { return !this.options.hidden; },

    hide: function() {
        var ui = this;
        ui.options.hidden = true;
        ui.dom.wrapper.hide();
    },

    show: function() {
        var ui = this;
        ui.options.hidden = false;
        ui.dom.wrapper.show();
    },

    focus: function() {
        var ui = this;
        ui.options.hasFocus = true;      
        ui.dom.wrapper.addClass('focus');
        $(window).unbind('keydown.rayFilebrowser')
            .bind('keydown.rayFilebrowser', function(e){ 
                ui._keyboardNav.apply(ui, [e]);
            });
    },

    blur: function() {
        var ui = this;
        ui.options.hasFocus = false;      
        ui.dom.wrapper.removeClass('focus');
        $('body').unbind('keydown.rayFilebrowser');
    },

    browse: function() {},

    destroy: function() {
        $.Widget.prototype.destroy.apply(this, arguments);
    },
    
    fileopen: function(p, link) {
        var ui = this;
        ui._trigger('fileOpen', { path: p, element: link || false });
    },

    diropen: function(p, link) {
        var ui = this;
        ui._trigger('dirOpen', { path: '?path='+ p, element: link || false });
        ui.cwd = p;
    },

    bufferopen: function(bufferID) {
        $('body').rayMirrorEditor('b', bufferID);
    },

    _get_display_filename: function(buffer) {
        var ui, label;
        ui = this;
        label = buffer.file && buffer.file.path || '[No Name]';
        return buffer.modified && label + ' [+]' || label;
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

        ui.dom.wrapper = $([
            '<div class="ui-ray-filebrowser-wrapper">',
                '<ul>',
                    '<li><a href="#browser">Browser</a></li>',
                    '<li><a href="#buffers">Opened Files</a></li>',
                '</ul>',
                '<div id="browser"></div>',
                '<div id="buffers"><ul class="ui-ray-buffer-list"></ul></div>',
            '</div>'].join(''))
            .bind('click.rayFilebrowser', function(){ ui.focus(); })
            .appendTo(ui.element)
            .tabs();

        ui.dom.tab = [];
        ui.dom.tab[1] = ui.dom.wrapper.find('#browser');
        ui.dom.tab[2] = ui.dom.wrapper.find('#buffers');
        
        ui.element.bind('dirOpened.rayFilebrowser', function(e){
            var rs, li, pane, list, path;
            rs   = e.originalEvent.data.content;
            if (rs) {
                ui._datasource = rs;
                ui._callback('redraw');
            }
        });
        ui._trigger('dirOpen', { path: '?path=/' });

        $('body')
          //.bind('dirOpened', function(e) {
          //      console.log(e);
          //      console.log(e.originalEvent.data);
          //    if (e.originalEvent.data.element) {
          //        e.originalEvent.data.element.addClass('opened'); 
          //    }
          //})
            .bind('bufferlistUpdated', function(e){
                ui._repaint_buffers_list(e.originalEvent.data.buffers);
            })
            .bind('editorFocus', function() { ui.blur(); });

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
                var ext = ui._get_file_extension(f) || 'txt';
                o.push('<li class="ui-ray-filebrowser-file"><a href="#fileopen::'+ ds.base_path + f +'" class="file '+ ext +'">'+ f +'</a></li>');
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
                o.push('<li class="ui-ray-filebrowser-dir"><a href="#diropen::'+ ds.base_path + d +'/" class="dir">'+ lbl +'</a></li>');
            }
        }
        return o;
    },

    /*  Builds the file/dir list from ui._datasource 
     *  and binds the necessary events.
     * */
    _build_list: function() {
        var ui, d, f, o, data;
        ui = this;
        data = ui._datasource;

        // Nothing to list .. RAY_EDITABLE_DIRS is most likely not set
        if (data.path == '' && !data.dirs.length && !data.files.length) {
            return $(['<div class="error ui-state-error ui-corner-all"><p>',
                        '<span style="float: left; margin-right: 0.3em;" class="ui-icon ui-icon-alert"></span>',
                        '<strong>Error: </strong>',
                        'No folders or files to list .. did you set the \"<b>RAY_EDITABLE_DIRS</b>\" in your settings.py file ?',
                    '</p></div>'].join(''));
        }
        // we have something to list
        else {
            d = ui._build_dir_list(data);
            f = ui._build_file_list(data);
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
        }
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

    _repaint_buffers_list: function(buffers) {
        var ui = this;
        var out = [''];
        var ext = '';
        var list = ui.dom.tab[2].find('.ui-ray-buffer-list');

        for (var x in buffers) {
            if (x.hasOwnProperty) {
                var buffer = buffers[x];
                var label = ui._get_display_filename(buffer);
                var ext = buffer.file && ui._get_file_extension(buffer.file.path) || 'txt';
                out.push('<li><a href="#bufferopen::'+ buffer.id +'" class="file '+ ext +'">'+ label +'</a></li>')
            }
        }

        var items = $(out.join(''))
            
        list.html(items).find('a')
            .bind('click', function(e){
                $(this).parent().addClass('selected')
                    .siblings().removeClass('selected');
                e.preventDefault();
                return false;
            })
            .bind('dblclick', function(e){ 
                ui._command_callback.apply(this, [e, ui]); 
            });
    },

    // data updated
    _redraw: function() {
        var ui = this;
        ui.dom.tab[1].html(ui._build_breadcrumb()).append(ui._build_list());
        ui.dom.wrapper.trigger('click');
        ui._repaint();
    },

    // data not updated
    _repaint: function() {
        var ui = this;
        ui.dom.wrapper.height(window.innerHeight - 2); 
        ui.dom.wrapper.find('.ui-ray-filebrowser-list').height(window.innerHeight - 33);
        ui.dom.tab[2].find('.ui-ray-buffer-list').height(window.innerHeight - 33);
    },

});

$.widget('ui.rayFilebrowser', RayFileBrowser);
