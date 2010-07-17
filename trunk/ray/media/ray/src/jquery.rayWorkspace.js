$.widget('ui.rayWorkspace', $.extend($.ui.rayBase, {
    options: {
        defaultWorkspace: {
            toolbar: [
                {toggleButton: 'File Browser', id: "ray-filebrowser", callback: 'rayFilebrowser::browse', options: {
                    icons: { primary: 'ui-icon-locked' }
                }},
                {spacer: true}
            ],
            workspace: [
                {plugin: 'rayMirrorEditor::inLineEditor'},
                {plugin: 'rayFileBrowser::fileManager', options: { position: 'left'}}
            ]
        }
    },

    /* Create a workspace widget
     * */
    _workspace: function () {
        return $('<div class="ray-workspace" />');
     },

    /* Create a toolbar widget
     * */
    _toolbar: function () {
        return $('<span class="ui-widget-header ui-corner-all" style="padding:5px 4px;display:block;" />');
     },

    _createComponent: function(component) {
        var ui  = this;
        var map = {
            button: '_button',
            toggleButton: '_toggleButton',
        }
        for (var cpn in map) {
            if (cpn.hasOwnProperty && component[cpn] && ui[map[cpn]]) {
                var btn  = ui[map[cpn]].apply(this, [component]);
                var clss = component.callback.split('::')[0];
                var mthd = component.callback.split('::')[1];
                console.log('<<<<<<<<<', btn);
                return btn.find('span')
                        .bind('click.rayWorkspace', function(){
                              return $('body')[clss](mthd);
                        }).end();
            }
        }
    },

    _createWorkspace: function(ns, components) {
        var ui = this;
        var ws = ui['_'+ns].call();

        for (var x in components) {
            if (x.hasOwnProperty) {
                var cpn = ui._createComponent(components[x]);
                if (cpn && cpn.appendTo) {
                    cpn.appendTo(ws);
                }
            }
        }

        return ws;
    },

    _create: function() {
        var ui = this;
        ui.dom = {};
        console.log('test...')

        for (var ws in ui.options.defaultWorkspace) {
            if (ws.hasOwnProperty) {
                ui.dom[ws] = ui._createWorkspace(ws, ui.options.defaultWorkspace[ws])
                                .appendTo('body');
            }
        }

        var h = window.innerHeight;
        var w = window.innerWidth;
    },
/*
    load: function (ws, content) {
        var ui = this;
        if ($.isArray(content)) {
            $.each(content, function (){
                ui.dom[ws].append(this);
            });
        }
        else {
            ui.dom[ws].html(content);
        }
    },
*/
    get: function(ws) {
        var ui = this;
        try {
            return ui.dom[ws];
        }
        catch (e) {
            return false
        }
    }
}));
