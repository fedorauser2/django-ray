
$.ui.rayEditorCommands = {
    // Opens existing buffer
    b: function(bufferID) {
        var ui  = this;
        var nbf = ui.buffers.get(bufferID)
        var obf = ui.buffers.getFocused();
        
        // Replacing an open buffer, save its state first
        if (obf) {
            ui._save_state();
        }
        
        ui.buffers.focus(nbf);
        ui.exec('setCode', nbf.currentContent || '');

        /*
        if (nbf.currentLine) {
            ui.exec('jumpToLine', nbf.currentLine);
        }
        if (nbf.cursorPos) {
            ui.exec('selectLines', nbf.cursorPos);
        }

        if (nbf.file.path) {
            ui._guess_parser(ui._get_file_extension(nbf.file.path));
        }
        */
        ui._trigger('bufferOpened', {buffer: nbf});
    },

    // New buffer from file
    e: function(file) {
        var ui = this;
        var obf = ui.buffers.getFocused();
        var nbf = ui.buffers.getOrCreate(file);

        // Replacing an open buffer, save its state first
        if (obf) {
            ui._save_state();
        }
        
        ui.buffers.focus(nbf);

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
            ui._trigger('bufferOpened', {buffer: nbf});
        }
        // New buffer has been loaded from
        // server
        else {
            ui.exec('setCode', file.content);
            ui._trigger('bufferCreated', {buffer: nbf});
        }
        if (file.path) {
            ui._guess_parser(ui._get_file_extension(file.path));
        }
    },

    // Create a new untitled/unsaved file
    enew: function() {
        var ui = this;
        var obf = ui.buffers.getFocused();
        var nbf = ui.buffers.create();
        // Replacing an open buffer, save its state first
        if (obf) {
            ui._save_state();
        }
        ui.exec('setCode', '');
        nbf.file = {path: false};
        ui.buffers.focus(nbf);
        //console.log('focus: ', nbf);
        ui._trigger('bufferCreated', {buffer: nbf});
    },

    // Delete focused buffer
    bd: function() {
        var ui = this;
        var buff = ui.buffers.getFocused();
        if (buff) {
            if (buff.modified) {
                if (confirm('The buffer has changed since it was opened, click "OK" to close without saving.')) {
                    buff.destroy();
                    ui.exec('setCode', '');
                    ui._trigger('bufferDeleted')
                }
                else {
                    console.log('cancelled');
                }
            }
            else {
                buff.destroy();
                ui.exec('setCode', '');
                ui._trigger('bufferDeleted')
            }
        }
    },

    // Write buffer
    w: function() {
        var ui   = this;
        var buff = ui.buffers.getFocused();
        if (buff) {
            ui._trigger('fileSave', buff);
        }
    },

    ls: function() {
        //this._buffers_apply(console.log);
    },

    // Execute a CodeMirror command on the active editor
    exec: function(method, args) {
        var ui = this;
        if (ui.dom.editor) {
            var ed = ui.dom.editor.data('mirror');
            try {
                if ($.isArray(args)) {
                    return ed[method].apply(this, args);
                }
                else {
                    return ed[method](args);
                }
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
            var bf = ui.buffer.getFocused();
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
            this.exec('setLineNumbers', false);
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
        var bf = ui.buffers.getFocused();
        if (bf) {
            ui.toolbar.setParser(parser);
            ui.exec('setParser', parser);
            bf.parser = parser;
            ui._save_state();
        }
    },
};

// Editor Options

$.ui.rayEditorOptions = { 

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
                {label: 'Save',     id: 'save',     icons: {primary: 'ui-icon-disk'}, callback: 'w', disabled: true},
                {text:  false,      id: 'save-menu', icons: {primary: 'ui-icon-triangle-1-s'}, disabled: true, menu: [
                    {label: 'Save and commit (SVN)', callback: function(){ console.log('save / commit '); }},  
                    {label: 'Save as', callback: function(){ console.log('save as'); }},  
                    {label: 'Save a copy', callback: function(){ console.log('save / copy'); }},  
                ]}, 
            ],
            ['close-buffer', 
                {label: 'Close', id: 'close', icons: {primary: 'ui-icon-disk'}, callback: 'bd', disabled: false},
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
    }
};

$.widget('ui.rayMirrorEditor', $.extend($.ui.rayBase, 
                                        $.ui.rayEditorOptions, 
                                        $.ui.rayEditorCommands, {


    _create: function() {
        var ui = this;
        ui.dom = {
            wrapper: $('<div id="ui-rayMirrorEditor-wrapper" />').appendTo('body'),
            toolbar: $('<div id="ui-rayMirrorEditor-tollbar-wrapper" />'),
            editor:  $('<div id="ui-rayMirrorEditor-editor-wrapper" />'),
        };

        ui.buffers          = new rayBufferManager();
        ui.options.path     = ui.options.media_path + ui.options.editor_path;

        // Setup toolbar 
        ui.toolbar = new rayToolbarManager(ui.dom.toolbar.appendTo(ui.dom.wrapper));
        ui._build_buttons(ui.toolbar.get('toolbar'));
        ui.toolbar.setParsers(ui.options.magic);

        ui.toolbar.get('parserswitcher').find('select').bind('change', function(){ 
            ui.setparser($(':selected', this).data('magic').parser);
        });

        // Setup known file types that should be handled with  rayMirrorEditor
        $.each(ui.options.magic, function (i, m){
            ui.element.ray('set_mime_type', {extension: i, type: this.widgetName, label: m.label, callback: 'file_open'});
        });


        ui.element
            .bind('editorFocus',   function(){ ui.dom.wrapper.addClass('focus'); })
            .bind('editorBlur',    function(){ ui.dom.wrapper.removeClass('focus');})
            .bind('editorChanged', function(){ 
                ui._save_state();
                // need to be called to add the " [+]" if the buffer is modified
                ui._set_toolbar_title();
            })
            .bind('editorInitialized',  function() {
                ui._guess_parser();
                ui.enew();
                
                $(ui.dom.editor.find('iframe').get(0).contentDocument)
                    .bind('keyup', function(e){ 
                          console.log('keyup', this, arguments); 
                    });
            })
            .bind('bufferOpened',  function(e) {
                var d = e.originalEvent.data
                ui._save_state();
                ui.updateBufferList();
                ui._set_toolbar_title(d.buffer);
                ui._enable_buttons(['re-indent', 'go-to-line']);
            })
            .bind('bufferCreated', function(e) {
                var d = e.originalEvent.data
                ui._save_state();
                ui.updateBufferList();
                ui._set_toolbar_title(d.buffer);
                ui._enable_buttons(['re-indent', 'go-to-line']);
            })
            .bind('bufferDeleted',  function(e) {
                ui.updateBufferList();
            })
            .bind('cursorActivity', function(e) {
                var d = e.originalEvent.data
                ui.toolbar.cursorinfo([d.currentLine, d.cursorPosition.character].join(','));
                // All the rest below is a kind of hack to workaround the 
                // editor's change delay which makes it hard to fire an event
                // at a precise moment without an annoying lag. 
                var bf = ui.buffers.getFocused();
                if (bf && !bf.modified) {
                    bf.updateContent(ui.exec('getCode'));
                    if (bf.modified) {
                        ui._enable_buttons(['undo', 'redo', 'save']);
                        ui._save_state();
                    }
                }
            })
            // File content has been loaded, process it
            .bind('contentLoaded', function (e){
                ui.e(e.originalEvent.data);
            });

        ui.options = $.extend(ui.options, {
            cursorActivity: function() {
                ui._trigger('cursorActivity', {
                    currentLine: ui.exec('currentLine'), 
                    cursorPosition: ui.exec('cursorPosition')
                });
            },
            onChange: function() { 
                ui._trigger('editorChanged'); 
            },
            initCallback: function(editor) { ui._trigger('editorInitialized'); }
        });
        
        ui.dom.wrapper.css('left', ($('body').rayFilebrowser('isVisible') ? 338: 0));
        
        $(window).resize(function(){ ui._repaint.call(ui); });

        ui.dom.editor.appendTo(ui.dom.wrapper);
        ui._setup_editor(ui.dom.editor);


        ui._repaint(true);
    },

    _disable_buttons: function(buttons) {
        this.toolbar.get_button(buttons).button('option', 'disabled', false);
    },

    _enable_buttons: function(buttons) {
        this.toolbar.get_button(buttons).button('option', 'disabled', false);
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
        ui.dom.wrapper.find('.CodeMirror-wrapping').height(window.innerHeight - 67);
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

    /* Saves the state of a buffer.
     * 
     * The first step is to get the current code in the editor with getCode
     * and feed it to buffer.updateContent()
     * 
     * if the buffer is not marked as modified updateContent will
     * compare buffer.currentContent with the feeded content and 
     * set the modified property accordingly.
     *
     * */

    _save_state: function(force) {
        var ui = this;
        var bf = ui.buffers.getFocused();
        if (bf) {
            var nc = ui.exec('getCode');
            bf.updateContent(nc);
            // TODO: Does not work :| + should remember text selection
            //bf.currentLine = ui.exec('currentLine');
            //bf.cursorPos = ui.exec('cursorPosition').character;
        }
    },

    _set_toolbar_title: function(buffer) {
        var ui = this;
        var bf = buffer || ui.buffers.getFocused();
        var title = bf.file && bf.file.path || false;
        if (title) {
            title = title.split(':')[1];
        }
        else {
            title = 'Untitled';
        }
        if (bf.modified) {
            title = title + ' [+]';
        }
        ui.toolbar.title(title);
        return title;
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
