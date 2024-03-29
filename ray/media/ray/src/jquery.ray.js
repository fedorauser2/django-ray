/* Django Ray Editor
 * */

/* Creates a plugins, which is basically a widget
 * loosely binded to a parent widget
 */

$.plugin = function(namespace, instance) {
    var s  = namespace.split('.');
    var ns = s[0];
    var widget = s[1];
    var plugin = s[2];

    // Create the child widget
    if (ns && widget && plugin) {
        jQuery[ns][widget].plugins.push(plugin);
        $.widget(ns +'.'+ widget +'_'+ plugin, instance);
    }
}

$.ui.rayBase = {
    
    /* Initialiaze all plugins. This can be confusing at first
     * since it's almost recursive .. ray has plugins like rayFilebrowser,
     * rayWorkspace and such .. but plugins themselves can have plugins
     * that also need initialization. Get it ? :)
     * */
    plugin_init: function (widgetName) {
        var ui = this;
        var widget, plugin, wn, wdg, opt;
        wn = widgetName || ui.widgetName;
        widget = jQuery[ui.namespace][wn];
        for (var x in widget.plugins) {
            plugin = widget.plugins[x];
            opt = $.extend((this.options[plugin] || {}), {
                        widget: this,
                        media_path: '/media/',
                    });
            wdg = (wn != 'ray') && this.widgetName +'_'+ plugin || plugin.split(':')[0];
            try {
                $('body')[wdg](opt);
                $('body')[wdg]('plugin_init');
            }
            catch (e) {
                throw('Failed to initialize '+ wdg + '" - '+ e.name +': '+ e.message +' - File: '+ e.fileName +':'+ e.lineNumber);
            }
        }
    },
    
    /* Works like $.each but apply the callback method
     * to for each plugins. The callback method will
     * be called with the plugin name as first argument
     * and true or false as second argument to indicate
     * if the plugin is "lazy" or not.
     * */
    _plugins_call: function (method) {
        var ui = this;
        var widget, p;
        widget = jQuery[ui.namespace][ui.widgetName];
        for (var x in widget.plugins) {
            p = widget.plugins[x].split(':');
            method(p[0], p[1] && true || false);
        }
    },

    _attach_state_events: function(el) {
        var ui = this;
        return $(el).hover(function(){
            $(this).removeClass('ui-state-default').addClass('ui-state-hover');
        }, function(){
            $(this).removeClass('ui-state-hover').addClass('ui-state-default');
        });
    },

    /* Create a button widget
     * */
    _button: function (b) {
        var ui = this;
        var type = b.type && b.type || 'button';
        var btn = $('<'+ type +' />');
        var build_menu = function(b) {
            var menu = $('<ul class="ui-toolbar-menu">');
            for (var x = 0; x < b.dropmenu.length; x++) {
                if (b.dropmenu[x]) {
                    var li = $('<li />');
                    var a  = $('<a />').text(b.dropmenu[x].label);
                    var dm = b.dropmenu[x];
                    if (dm.callback) {
                        a.bind('click.rayToolbarMenu', function(e){
                            dm.callback.apply(ui, [e]); 
                        });
                    }
                    menu.append(li.append(a));
                }
            }
            ui._attach_state_events(menu.find('a'));
            return menu.hide();
        };
        if (b.id) {
            btn.attr('id', b.id);
        }
        if (b.label) {
            btn.text(b.label);
        }
        if (b.dropmenu) {
            var m = build_menu(b);
            m.appendTo('body');
            btn.bind('click', function(){
                if (m.is(':visible')) {
                    m.hide();
                }
                else {
                    m.position({
                        my: 'left top',
                        at: 'left bottom',
                        of: $(this).prev(),
                        offset: '1 -18',
                    }).show();
                    setTimeout(function(){
                        ui.element
                            .one('click.menuBlur', function() {
                                m.hide();
                                $(this).unbind('.menuBlur');
                            })
                            .one('editorFocus.menuBlur', function() {
                                m.hide();
                                $(this).unbind('.menuBlur');
                            });
                    }, 300);
                }

            });
        }
        return btn.button(b);
     },

    /* Create a button widget
     * */
    _toggleButton: function (btn) {
        return $('<input type="checkbox" id="'+ btn.id +'" /><label for="'+ btn.id +'">'+ btn.toggleButton +'</label>').button(btn.options || {});
     },
    
    /* Create a button set
     * */
    _buttonSet: function (id, buttons) {
        var bs = $('<span id="'+ id +'" class="ui-button-set" />');
        if (buttons) {
            $.each(buttons, function (i, btn) {
                btn.appendTo(bs);
            });
        }
        return bs.buttonset();
    },

    /* Automatically build buttons according
     * the the widget's option specifications
     * */
    _build_buttons: function (appendTo) {
        var ui = this;

        var button = function(options) {
            var btn = ui._button(options);
            if (options.callback && ui[options.callback]) {
                btn.bind('click.rayEditor', function(e) {
                    ui[options.callback].apply(ui, [e]); 
                });
            }
            return btn; 
        };

        $.each(ui.options.buttons, function(){
            // button set
            if ($.isArray(this) && typeof(this[0]) == 'string') {
                var set   = [];
                $.each(this, function (i, b){
                    if (i > 0) {
                        set.push(button(b));
                    }
                });
                ui._buttonSet(this[0], set).appendTo(appendTo);
            }
            // single button
            else {
                if (this.callback) {
                    button(this.label, this.icon, 'none', this.callback).appendTo(appendTo);
                }
            }
        });
    },

    // Return a file extension (ex: "js")
    _get_file_extension: function (s) {
        var tokens = s.split('.');
        return tokens[tokens.length-1] || false;
    },

    /* This is a trigger mechanism to allow plugins to
     * dispatch events
     *
     * For example;
     *
     * $.widget('ui.rayMyPlugin', {
     *  _create: function(){
     *      ui._trigger('redraw');
     *  },
     * });
     *
     * $.widget('ui.rayMyOtherPlugin', {
     *  _create: function(){
     *      ui.element.bind('redraw', function(){
     *          alert('I will get called..');
     *      });
     *  }
     * });
     *
     *
     * */

    _trigger: function(eventName, data) {      
        var ui = this;
        var cb = ui['_'+eventName];
        
        //if (ui.element.ray('option', 'debug')) {
            //ui._log(eventName, data || false);
        //}

        //console.log(eventName, data || false);
        // Tighly coupled
        if (cb && $.isFunction(cb)) {
            cb.apply(ui, data || []);
        }

        // Loosely coupled
        ui.element.trigger(data && $.Event({type: eventName, data: data}) || eventName);
    },

    _log: function() {}
                    
};

if ( typeof console !== 'undefined' && typeof console.log !== 'undefined') {
    $.ui.rayBase._log = function () {
        try { console.log.apply(window, arguments); }
        // Chrome will shit its pants ..
        catch (e) {
            var out = [];
            for (var x in arguments) { out.push(arguments[x]); }
        }
    };
}

$.widget('ui.ray', $.extend($.ui.rayBase, {
    options: {
        base_url: '/ray/',
        debug: true
    },
    
    // Allow each plugins to specify which file type they support
    // and how to handle them
    _file_types: {},

    _create: function () {
        var ui = this;
        
        ui.options = $.extend($.ui.ray.defaults, ui.options);

        // Bind core events
        ui.element
            .bind('fileOpen.ray', function(e){ ui.file_open(e.originalEvent.data);  })
            .bind('fileSave.ray', function(e){ ui.file_save(e.originalEvent.data);  })
            .bind('dirOpen.ray',  function(e){ ui.dir_list(e.originalEvent.data); })
            .bind('redraw.ray',   function(e){ ui.redraw(); });

        // Initialte all plugins
        ui.plugin_init();

        $(window).resize(function(e){
            ui._trigger('redraw');
        });
    },


    /* Request a directory listing to the backend and
     * trigger 'dirOpened' event with result as event.data
     * */

    dir_list: function(dir) {
        var ui   = this;
        var base = '/ray/browse/';
        var url  = base + dir.path;

        if (!ui._loading_dir_list) { // prevent double clicks front fucking up things
            ui._loading_dir_list = true;
            $.getJSON(url, function(rs, status){
                ui._loading_dir_list = false;
                if (status == 'success') {
                    ui._trigger('dirOpened', { content: rs, path: dir.path, url: url });
                }
            });
        }
    },

    /* Request a file content to the backend and trigger a 
     * 'contentLoaded' event with result as event.data
     * */
    file_open: function(file) {
        var ui   = this;
        $.getJSON(ui.url('open/?path=', file.path), function(rs, status){
            if (status == 'success') {
                ui._trigger('contentLoaded', { path: file.path, content: rs.content });
                  if (file.element) {
                      file.element.addClass('opened'); 
                  }
            }
        });
    },

    url: function() {
        var ui = this;
        return ui.options.base_url + $.makeArray(arguments).join('');
    },

    file_save: function(buffer) {
        var ui = this;

        if (!buffer.file.path) {
            $('<div />').load('/ray/forms/file-path/', function(){
                $(this).appendTo('body').dialog({
                    width: 450,
                    height: 200,                    
                    resizable: false,
                    modal: true,
                    title: "Specify a file path/name"
                });
            });
            alert('no path !')
            return false;
        
        }

        $.post(ui.url('save/?path=', buffer.file.path), {
            content: buffer.currentContent
        }, function(rs, status){
            if (status == 'success') {
                if (rs.status == 'success') {
                    ui._trigger('fileSaved', buffer);
                }
                else {
                    console.log('Server error.. ', rs.message)
                }
            }
            else {
                console.log('Request error.. ', status)
            }
        });
    },

    /* Associate a file type with its handler. The method
     * accept an object of the following format:
     * {extension: 'js',            // File extension
     *  type: 'rayWidgetName',      // Widget handler (ex: rayFilebrowser)
     *  label: "JavaScript",        // File type label
     *  callback: 'method_name'}    // Callback method (within the widget)
     * */
    set_mime_type: function (i) {
        this._file_types[i.extension] = i;
    },

    redraw: function() {
        var ui = this;
        var h = this.notfirstdraw && 58 || 30;
        $('.CodeMirror-wrapping').height(document.documentElement.clientHeight - $('#ray-filebrowser').height() - h);
        this.notfirstdraw = true;
    },

    destroy: function () {
        ui._plugins_call(function(plugin){
            ui.element[plugin]('destroy');
        });
        $.widget.prototype.destroy.apply(this, arguments);
    }
    
//  _bind_events: function(events){
//      var ui = this;
//      for (var ev in events) {
//          if (ev.hasOwnProperty) {
//              ui.element.bind(ev, events[ev]);
//          }
//      }
//  },
}));


$.extend($.ui.ray, {
    // List of plugins (ex: "ns:rayPluginName<:lazy>", where ns refers to the namespace)
    // Lazy means that the plugin is not initialized upon initial load.
    // ORDER DOES MATTER
    plugins: ['rayFilebrowser', 'rayMirrorEditor'],//],//, 'rayPixlr'], 
});

