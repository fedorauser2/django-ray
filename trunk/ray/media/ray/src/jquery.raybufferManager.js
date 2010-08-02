var rayBufferManager = function() {
    var bm  = this;
    window._buffers = bm;
    bm._inc = 0;
    bm._buffers = {};

    return {

        // Focus a specified buffer takes a buffer object as argument
        focus: function(buffer) {
            this.invoke(function(i, b){
                b.has_focus = (b.id === buffer.id) && true || false;
            });
            return buffer;
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
                // compare only if necessary or forced
                if (!this.modified) { 
                    this.modified = nc !== this.currentContent;
                }
                this.currentContent = nc;
            };
            var b = { 
                id: i, 
                file: f || false,
                modified: false,
                parser: false,
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
            return this.focus(buffer);
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
            $.each(bm._buffers, function(i, b){
                if (v === b[p]) { 
                    out = b; 
                    return true;
                }
            });
            return out;
        }
    };
};

