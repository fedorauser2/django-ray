var rayBufferManager = function() {
    var bm  = this;
    bm._inc = 0;
    bm._buffers = {};

    return {

        // Focus a specified buffer takes a buffer object as argument
        focus: function(buffer) {
            this.invoke(function(i, b){
                b.has_focus = (b.id === buffer.id) && true || false;
            });
        },

        // Invoke a callback method on all buffers
        invoke: function (method) {
            return $.each(bm._buffers, method);
        },

        // Returns all buffers
        all: function () {
            return bm._buffers;
        },

        // Creates a new buffer, takes file argument
        // if no file is provided a blank/untitled 
        // buffer will be created
        create: function (f) {
            var i = bm._inc = bm._inc + 1;
            var update_buffer = function(nc) {
                // compare only if necessary
                if (!this.modified) { 
                    this.modified = (nc !== this.currentContent);
                    this.currentContent = nc;
                }
            };
            var b = { 
                id: i, 
                file: f || false,
                modified: false,
                currentContent: f && f.content || false,
                updateContent: update_buffer
            };
            bm._buffers[i] = b;
            return b;
        },

        // Takes a files argument and return its associated buffer, if none exist
        // it creates it and returns the created buffer
        getOrCreate: function (f) {
            var buffer = this.getByPath(f.path);
            if (!buffer) {
                buffer = this.create(f);
                buffer.created = true;
            }
            else {
                buffer.created = false;
            }
            this.focus(buffer);
            return buffer;
        },

        // Sets a property for a specified buffer
        set: function(b, k, v) {
            var bf = this.get(b);
            if (bf) {
                bf[k] = v;
                return v;
            }
            else {
                return false;
            }
        },

        // Takes either a file or a id and returns the buffer associated with it
        get: function(b) {
            return b.path && this.getByPath(b.file.path) || this.getById(b);
        },

        // Returns a buffer that matches a given id
        getById: function(id) {
            try {
                return bm._buffers[id];
            }
            catch (e) {
                return false;
            }
        },

        // Returns a buffer that matches a given path 
        getByPath: function (p) {
            var out = false;
            $.each(bm._buffers, function(i, v){
                if (v.file.path == p) { out = v; }
            });
            return out;
        },

        // Returns the buffer that is currently focused.
        getFocused: function() {
            return this.getByProperty('has_focus', true);
        },

        // Find a buffer that has a given property that matches a given value
        getByProperty: function (p, v) {
            var out = false;
            $.each(bm._buffers, function(i, v){
                if (p === v) { 
                    out = v; 
                    return true;
                }
            });
            return out;
        }
    };
};


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
                sel = lis.join(', ');
            }
            else {
                sel = '#'+ id +'.ui-button';
            }
            return tb.dom.toolbar.find(sel);
        }

    };
};

$.ui.rayEditorCommands = {
    // Open existing buffer
    b: function(bufferID) {
        var ui  = this;
        var nbf = ui.buffers.get(bufferID)
        var obf = ui._active_editor.data('buffer');
        
        // Replacing an open buffer, save its state first
        if (obf) {
            ui._save_state();
        }
        
        ui._active_editor.data('buffer', nbf);
        ui.exec('setCode', nbf.currentContent);
        if (nbf.currentLine) {
            ui.exec('jumpToLine', nbf.currentLine);
        }
        
        if (nbf.cursorPos) {
            ui.exec('selectLines', nbf.cursorPos);
        }

        if (nbf.file.path) {
            ui._guess_parser(ui._get_file_extension(nbf.file.path));
        }
        ui._save_state();
    },

    // New buffer from file
    e: function(file) {
        var ui = this;
        var obf = ui._active_editor.data('buffer');
        var nbf = ui.buffers.getOrCreate(file);

        // Replacing an open buffer, save its state first
        if (obf) {
            ui._save_state();
        }
        
        ui._active_editor.data('buffer', nbf);

        // Buffer has been loaded from cache
        // check if it has changed since last open
        if (!nbf.created) {
            if (nbf.modified) {
                if (confirm('Warning: Local copy of "'+ file.path +'" has changed. Click "Ok" to keep local modification or click "Cancel" to reload the file and lose the modifications.')) {
                    ui.exec('setCode', nbf.currentContent);
                    ui._save_state();
                }
                else {
                    nbf.modified = false;
                    nbf.currentContent = file.content;
                    ui.exec('setCode', file.content);
                    ui._save_state();
                }
            }
            else {
                ui.exec('setCode', file.content);
            }
        }
        // New buffer has been loaded from
        // server
        else {
            ui.exec('setCode', file.content);
            ui._save_state();
        }
        if (file.path) {
            ui._guess_parser(ui._get_file_extension(file.path));
        }
        ui.updateBufferList();


    },

    // Create a new untitled/unsaved file
    enew: function() {
        var ui = this;
        var obf = ui._active_editor.data('buffer');
        var nbf = ui.buffers.create();

        // Replacing an open buffer, save its state first
        if (obf) {
            ui._save_state();
        }
        
        nbf.file = {path: 'Untitled'};
        ui._active_editor.data('buffer', nbf);
        ui._save_state();
        ui.exec('setCode', '');
        ui.updateBufferList();
    },

    // Delete buffer
    bd: function(b) {
    },
    // Next buffer
    bn: function() {},
    // Previous buffer
    bp: function() {},
    // Write buffer
    w: function(ws) {},
    ls: function() {
        //this._buffers_apply(console.log);
    },

    // Execute a CodeMirror command on the active editor
    exec: function(method, args) {
        var ui = this;
        if (ui._active_editor) {
            var ed = ui._active_editor.data('mirror');
            try {
                return ed[method](args);
            }
            catch(e) {
                console.log('Editor error: Could not execute editor command "'+ method +'" (Exception: '+ e.message +') '+ e.fileName +':'+ e.lineNumber);
            }
        }
    },

    togglespellcheck: function() {
        this.spellchecking = !this.spellchecking;
        return this.exec('setSpellcheck', this.spellchecking);
    },
    
    reindent: function(e) { 
        return this.exec('reindent'); 
    },

    undo: function(e) { 
        var ui = this;
        if (ui.exec('historySize').undo === 0) {
            var bf = ui._active_editor.data('buffer');
            ui.buffers.set(bf, 'modified', false);
            ui._save_state();
        }
        else {
            return this.exec('undo'); 
        }
    },

    redo: function(e) { 
        return this.exec('redo'); 
    },

    gotoline: function(e) { 
        return this.exec('jumpToLine', prompt('Enter a line number'));
    },

    togglelinewrap: function() { 
        var ui = this;
        ui.options.textWrapping = !ui.options.textWrapping;
        return this.exec('setTextWrapping', ui.options.textWrapping);
    },

    togglelinenumbers: function() { 
        var ui = this;

        if (typeof(ui._lineNumbers) == 'undefined') {
            ui._lineNumbers = !ui.options.lineNumbers;
        }

        ui._lineNumbers = !ui._lineNumbers;
        if (!ui._lineNumbers) {
            this.exec('setLineNumbers', true);
        }
        else {
          //this.mirror.wrapping.removeChild(this.mirror.lineNumbers);
          //this.mirror.wrapping.style.marginLeft = '';
          //this.mirror.lineNumbers = null;
        }
    },

    togglesettings: function() {
        this.dom.settings.toggle();
    },
    
    setparser: function(parser){
        var ui = this;
        ui.toolbar.setParser(parser);
        ui.exec('setParser', parser);
    },
};

$.widget('ui.rayMirrorEditor', $.extend($.ui.rayBase, $.ui.rayEditorCommands, {
    options: {
        editor_path: "codemirror/js/",
        indentUnit: 4,
        undoDepth: 50,
        undoDelay: 600,
        lineNumbers: true,
        textWrapping: false, // bugs line numbers
        autoMatchParens: true,
        disableSpellcheck: true,
        parserfile: [
            "parsedummy.js",
            "parsexml.js",
            "parsecss.js", 
            "tokenizejavascript.js", 
            "parsejavascript.js", 
            "parsehtmlmixed.js",
            "../contrib/sql/js/parsesql.js", 
            "../contrib/php/js/tokenizephp.js",
            "../contrib/php/js/parsephp.js",
            "../contrib/php/js/parsephphtmlmixed.js",
            "../contrib/python/js/parsepython.js",
//            "../contrib/django/js/tokenizedjango.js",
//            "../contrib/django/js/parsedjango.js",
//            "../contrib/django/js/parsedjangohtmlmixed.js",
            "../contrib/diff/js/parsediff.js"
        ],
        stylesheet: [
            /*
            "../ray/color-schemes/evening/scheme.css",
            */
            // TODO: fix hardcoded paths ..
            "../../media/codemirror/css/xmlcolors.css", 
            "../../media/codemirror/css/csscolors.css", 
            "../../media/codemirror/css/jscolors.css", 
            "../../media/codemirror/contrib/sql/css/sqlcolors.css", 
            "../../media/codemirror/contrib/php/css/phpcolors.css",
            "../../media/codemirror/contrib/python/css/pythoncolors.css", 
            "../../media/codemirror/contrib/diff/css/diffcolors.css", 
            "../../media/codemirror/contrib/django/css/djangocolors.css" 
        ],
        buttons: [
            ['file-browser',
                {label: 'Browse',   id: 'browse',   icons: {primary:'ui-icon-folder-open'}, callback: 'toggleFilebrowser'},
            ],
            ['new-file', 
                {label: 'New file', id: 'new-file', icons: {primary: 'ui-icon-document'}, callback: 'enew'}, 
                {text:  false,      id: 'new-file-menu', icons: {primary: 'ui-icon-triangle-1-s'}, dropmenu: [
                    {label: 'New from copy of this buffer', callback: function(){}},  
                    {label: 'New from template awfeaw ef ', callback: function(){}},  
                    {label: 'New template', callback: function(){}},  
                ]}, 
            ],
            ['save-buffer', 
                {label: 'Save',     id: 'save',     icons: {primary: 'ui-icon-disk'}, callback: 'save', disabled: true},
                {text:  false,      id: 'save-menu', icons: {primary: 'ui-icon-triangle-1-s'}, disabled: true, menu: [
                    {label: 'Save and commit (SVN)', callback: function(){ console.log('save / commit '); }},  
                    {label: 'Save as', callback: function(){ console.log('save as'); }},  
                    {label: 'Save a copy', callback: function(){ console.log('save / copy'); }},  
                ]}, 
            ],
            ['editing-options', 
                {label: 'Undo', id: 'undo', icons: {primary: 'ui-icon-arrowreturn-1-w'}, callback: 'undo', disabled: true}, 
                {label: 'Redo', id: 'redo', icons: {primary: 'ui-icon-arrowreturn-1-e'}, callback: 'redo', disabled: true}
            ],
            ['buffer-actions',  
                {label: 'Re-indent',  id: 're-indent',  icons: {primary: 'ui-icon-signal'},   callback: 'reindent', disabled: true},
                {label: 'Go to line', id: 'go-to-line', icons: {primary: 'ui-icon-seek-end'}, callback: 'gotoline', disabled: true}, 
                {label: 'Settings',   id: 'settings',   icons: {primary: 'ui-icon-gear'},     callback: 'togglesettings'}
            ]
        ],
        magic: {
            'dummy': { label: 'No Syntax', parser: 'DummyParser' },
            'html':  { label: 'HTML/CSS/JS', parser: 'HTMLMixedParser' },
//          'html':  { label: 'Django template', parser: 'DjangoHTMLMixedParser' },
            'xhtml': { label: 'HTML/CSS/JS', parser: 'HTMLMixedParser' },
            'php':   { label: 'HTML/CSS/JS/PHP', parser: 'PHPHTMLMixedParser' },
            'js':    { label: 'JavaScript', parser: 'JSParser' },
            'py':    { label: 'Python', parser: 'PythonParser' },
            'css':   { label: 'CSS', parser: 'CSSParser' },
            'sql':   { label: 'SQL', parser: 'SqlParser' },
            'patch': { label: 'Diff', parser: 'DiffParser' },
            'diff':  { label: 'Diff', parser: 'DiffParser' }
//          'html':  { label: 'HTML+Django', parserfile: ["parsexml.js", "parsecss.js", "tokenizejavascript.js", "parsejavascript.js", "parsedjango.js", "parsehtmldjango.js"], 
//                stylesheet: ["css/xmlcolors.css", "css/jscolors.css", "css/csscolors.css", "css/djangocolors.css"] },
        }
    },

    _create: function() {
        var ui = this;
        ui.dom = {
            wrapper: $('<div id="ui-rayMirrorEditor-wrapper" />').appendTo('body'),
            toolbar: $('<div id="ui-rayMirrorEditor-tollbar-wrapper" />'),
            editor:  $('<div id="ui-rayMirrorEditor-editor-wrapper" />'),
        };

        ui.options.path = ui.options.media_path + ui.options.editor_path;

        //ui.options = $.extend($.ui.rayMirrorEditor.defaults, ui.options); // What the ?!
        ui.buffers = new rayBufferManager();
        
        //ui._setup_layout();
        
        ui._active_editor = ui.dom.editor;

        // Setup toolbar 
        ui.toolbar = new rayToolbarManager(ui.dom.toolbar.appendTo(ui.dom.wrapper));
        ui._build_buttons(ui.toolbar.get('toolbar'));
        ui.toolbar.setParsers(ui.options.magic);

        ui.toolbar.get('parserswitcher').find('select').bind('change', function(){ 
            ui.setparser($(':selected', this).data('magic').parser);
        });

        // Setup known file types that should be handled
        // with  rayMirrorEditor
        $.each(ui.options.magic, function (i, m){
            ui.element.ray('set_mime_type', {extension: i, type: this.widgetName, label: m.label, callback: 'file_open'});
        });

        // File content has been loaded, process it
        ui.element.bind('contentLoaded', function (e){
            ui.e(e.originalEvent.data);
            ui.toolbar.get_button(['undo', 'redo','save','save-menu']).button('option', 'disabled', false);
        });

        ui.element.bind('editorFocus', function(){
            ui.dom.wrapper.addClass('focus');
        }).bind('editorBlur', function(){
            ui.dom.wrapper.removeClass('focus');
        });

        ui.options = $.extend(ui.options, {
            cursorActivity: function() {
                ui.toolbar.cursorinfo([ui.exec('currentLine'), ui.exec('cursorPosition').character].join(','));
                ui._trigger('cursorActivity');
                // All the rest below is a kind of hack to workaround the 
                // editor's change delay which makes it hard to fire an event
                // at a precise moment without an annoying lag. 
                var bf = ui._active_editor.data('buffer');
                if (!bf.modified) {
                    bf.updateContent(ui.exec('getCode'));
                    if (bf.modified) {
                        ui._save_state();
                    }
                }
            },

            onChange: function() {
                ui._save_state();
                ui._trigger('editorChanged');
            },

            initCallback: function(editor) {
                ui._guess_parser();
                var new_buffer = ui.buffers.create();
                ui.buffers.focus(new_buffer);
                ui.toolbar.title("Untitled");
                ui.updateBufferList();
                ui._trigger('editorInitialized');
            }
        });
        
        ui.dom.wrapper.css('left', ($('body').rayFilebrowser('isVisible') ? 338: 0));
        
        $(window).resize(function(){ ui._repaint.call(ui); });

        ui.dom.editor.appendTo(ui.dom.wrapper);
        ui._setup_editor(ui.dom.editor);
        ui._repaint(true);
    },

    _guess_parser: function(ext) {
        var ui  = this;
        ext = ext || 'html';
        if (ext && ui.options.magic[ext.toLowerCase()]) {
            return ui.setparser(ui.options.magic[ext].parser);
        }
        return ui.setparser('DummyParser');
    },
    
    _repaint: function(firstRepaint) {
        var ui = this; 
        var heightGap = firstRepaint && 66 || 58;
        var widthGap  = firstRepaint && 2 || 0;
        ui.dom.wrapper.find('.CodeMirror-wrapping').height(window.innerHeight - 67);
        //ui.dom.wrapper.find('.CodeMirror-wrapping')
        //    .height(window.innerHeight - heightGap);
    },
    
    // Setup an editor inside a given HTML node
    _setup_editor: function(parent) {
        var ui  = this;
        var tpl = '<textarea style="width:100%;" class="ui-ray-editor-buffer" />';
        var el  = $(tpl).appendTo(parent).get(0);
        var ed  = CodeMirror.replace(el);
        var mi  = new CodeMirror(ed, ui.options);

        $(mi.win).bind('focus', function(){ ui._trigger('editorFocus'); });
        $(mi.win).bind('blur',  function(){ ui._trigger('editorBlur'); });

        return parent.data({editor: ed, mirror: mi });
    },

    _save_state: function() {
        var ui = this;
        var bf = ui._active_editor.data('buffer');
        var nc = ui.exec('getCode');
        if (bf) {
            bf.updateContent(nc);

            // TODO: Does not work :| + should remember text selection
            //bf.currentLine = ui.exec('currentLine');
            //bf.cursorPos = ui.exec('cursorPosition').character;

            var title = bf.file.path;
            if (bf.modified) {
                title = title + ' [+]';
            }
            ui.toolbar.title(title.split(':')[1]);
        }
    },


    /* Updates the buffer select input with the current
     * buffer list (can accept an alternate buffer list)
     * */
    updateBufferList: function() {
        var ui = this;
        ui._trigger('bufferlistUpdated', {buffers: ui.buffers.all()});
    },

    toggleFilebrowser: function(e) {
        var ui = this;
        var button = $(e.currentTarget);
        if ($('body').rayFilebrowser('isVisible')) {
            $('body').rayFilebrowser('hide');
            button.button('option', 'icons', {primary: 'ui-icon-folder-collapsed'});
        }
        else {
            $('body').rayFilebrowser('show');
            button.button('option', 'icons', {primary: 'ui-icon-folder-open'});
        }
        ui.dom.wrapper.css('left', ($('body').rayFilebrowser('isVisible') ? 338: 0));
    }
}));

/*

MirrorFrame.prototype = {
  search: function() {
    var text = prompt("Enter search term:", "");
    if (!text) return;

    var first = true;
    do {
      var cursor = this.mirror.getSearchCursor(text, first, true);
      first = false;
      while (cursor.findNext()) {
        cursor.select();
        if (!confirm("Search again?"))
          return;
      }
    } while (confirm("End of document reached. Start over?"));
  },

  replace: function() {
    // This is a replace-all, but it is possible to implement a
    // prompting replace.
    var from = prompt("Enter search string:", ""), to;
    if (from) to = prompt("What should it be replaced with?", "");
    if (to == null) return;

    var cursor = this.mirror.getSearchCursor(from, false);
    while (cursor.findNext())
      cursor.replace(to);
  },



  macro: function() {
    var name = prompt("Name your constructor:", "");
    if (name)
      this.mirror.replaceSelection("function " + name + "() {\n  \n}\n\n" + name + ".prototype = {\n  \n};\n");
  },

  reindent: function() {
    this.mirror.();
  }
};
*/
