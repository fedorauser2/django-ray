# -*- coding: utf-8 -*-

import os, re, time, json

from django.http import HttpResponse
from django.shortcuts import render_to_response

from ray import settings

def prettySize(size):
    '''
    Returns a string formatted human-readable size from an initial size in bits.
    '''
    suffixes = [("B",2**10), ("K",2**20), ("M",2**30), ("G",2**40), ("T",2**50)]
    for suf, lim in suffixes:
        if size > lim:
            continue
        else:
            return round(size/float(lim/2**10),2).__str__()+suf

def json_serve(i):
    '''
    Returns a json formatted dictionary as an HttpResponse
    '''
    return HttpResponse(json.dumps(i))

def walk(top_dir, ignore=[]):
    '''
    TODO: document
    '''
    for dirpath, dirnames, filenames in os.walk(top_dir):
        dirnames[:] = [dn for dn in dirnames if dn not in ignore]
        yield dirpath, dirnames, filenames

def ray_svn_log(request):
    '''
    TODO: document
    '''
    return render_to_response('ray/context/svn-log.html')

def ray_context(request):
    '''
    TODO: document
    '''
    if 'path' in request.GET:
        path = os.path.join(settings.RAY_EDITABLE_DIRS[0], get_secure_path(request.GET['path']))
        info = os.stat(path)
        out = {
            'path': path,
            'file': {
                'filename': os.path.basename(path) or os.path.dirname(path),
                'size':  prettySize(info.st_size),
                'mtime': time.ctime(info.st_mtime),
                'ctime': time.ctime(info.st_ctime),
                'atime': time.ctime(info.st_atime),
            }
        }
    return render_to_response('ray/context/fileinfos.html', out)

def ray_open(request):
    '''
    Open a document on the server and returns its content JSON encoded
    '''
    if 'path' in request.GET:
        path = get_secure_path(request.GET['path'])
        fd   = open(path, 'r')
        buf  = fd.read()
        out  = {
            'path': path,
            'content': buf,
        }
        fd.close()
    return json_serve(out)

def ray_save(request):
    '''
    Open a document on the server, update its content and save it.
    '''
    if 'path' in request.GET and request.POST:
        path = get_secure_path(request.GET['path'])
        try:
            fd   = open(path, 'w')
            fd.write(request.POST['content'])
            fd.close()
            out = {'status': 'success'}
        except IOError:
            out = {'status': 'error', 'message': 'Failed to open file for writing.'}
    return json_serve(out)

def get_secure_path(p):
    '''
    This method maps the resource index in the paths with their actual path
    in settings.RAY_EDITABLE_DIRS.
    
    For example, if you have this setting:

    RAY_EDITABLE_DIRS = (
        "/some/path/to/templates/"
        "/some/path/to/media/"
    )
    
    The secured path to access the template folder would look like this:

    /0:/templates/

    And if we wanted to access the "js" folder in media it would look like this:

    /1:/media/js/

    As you can see, the number in the path simply represent the index of the 
    editable dir in RAY_EDITABLE_DIRS.

    The only other security applied is to nuke all instance of "../" in the path.
    '''

    n = re.compile(r'^/(\d+):', re.IGNORECASE)
    rs = n.search(p)
    print 
    if rs:
        if p[-1:] == '/':
            p = settings.RAY_EDITABLE_DIRS[int(rs.groups()[0])] + "/".join(p.split('/')[2:-1])
        else:
            p = settings.RAY_EDITABLE_DIRS[int(rs.groups()[0])] + "/".join(p.split('/')[2:])
        return p.replace('../', '')
    else:
        return ''


def ray_browse(request):
    '''
    TODO: document, return also node permissions (to know if it's read/write)
    '''
    dirs = []
    files =  []
    if 'path' in request.GET and request.GET['path'] not in ['','/']:
        base_path = request.GET['path']

        full_path = get_secure_path(request.GET['path'])
        path = request.GET['path']
        dirs = [f for f in os.listdir(full_path) if os.path.isdir(os.path.join(full_path, f))  and f not in settings.EDITOR_IGNORE]
        files = [f for f in os.listdir(full_path) if os.path.isfile(os.path.join(full_path, f)) and f not in settings.EDITOR_IGNORE]
    else:
        base_path = ''
        path = ''
        dirs = []
        files = []
        x = 0
        for d in settings.RAY_EDITABLE_DIRS:
            l = d[1:].split('/')
            d = d.replace("%s/" % "/".join(l[:-2]), "%d:" % x)
            x = x + 1
            dirs.append(d[:-1])


    out = {
        'path':  path,
        'base_path':  base_path,
        'dirs':  dirs,
        'files': files,
    }

    
    return json_serve(out)

#   for p, d, f in walk(path, settings.EDITOR_IGNORE):
#       print "-------------------------"
#       print "%s" % p
#       print "%s" % d
#       print "%s" % f
#       print "-------------------------"

#       if p == settings.EDITABLE_TEMPLATE_DIR:
#           for file in f:
#               out.append({'path': os.path.join(p, file).replace(settings.EDITABLE_TEMPLATE_DIR, ''), 'basename': file, 'type': 'file'})
#       else:
#           out.append({'path': p.replace(settings.EDITABLE_TEMPLATE_DIR, ''), 'basename': os.path.basename(p), 'subdirs': d, 'files': f, 'type': (os.path.isdir(p) and 'dir' or 'file')})



#       if os.path.isdir(p) and os.path.basename(p) not in settings.EDITOR_IGNORE:
#           dirs = []
#           for x in d:
#               if x not in settings.EDITOR_IGNORE:
#                   dirs.append(x)
#           out.append({'path': p, 'subdirs': dirs, 'files': f, 'type': 'dir'})
#       elif os.path.isfile(p) and os.path.basename(p) not in settings.EDITOR_IGNORE_FILES:
#           out.append({'path': p, 'subdirs': d, 'files': f, 'type': 'file'})



#   for dirname, dirnames, filenames in os.walk(path):
#       for subdirname in dirnames:
#           if subdirname not in settings.EDITOR_IGNORE_DIRS:
#               out.append({'node': subdirname, 'dir': dirname, 'path': os.path.join(dirname, subdirname)})
#       for filename in filenames:
#           print " - %s" % filename
#           if filename not in settings.EDITOR_IGNORE_FILES:
#               out.append({'node': filename, 'dir': dirname})

def ray_editor(request):
    '''
    TODO: document
    '''
    print "+++++++=test"
    return render_to_response('ray/editor.html')

def ray_layout(request):
    '''
    TODO: document
    '''
    return render_to_response('ray/layout.html')
