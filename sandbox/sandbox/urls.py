from django.conf.urls.defaults import *
from django.conf import settings

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    
    url(r'^blogues/$', 'django.views.generic.simple.redirect_to', {
        'url': '/ray/editor/'}, name="ray-editor-index"),

    (r'^ray/', include('ray.urls')),

#   url(r'^media/(.*)$', 'django.views.static.serve', {
#       'document_root': settings.MEDIA_ROOT,
#   }),

    # Uncomment the admin/doc line below and add 'django.contrib.admindocs' 
    # to INSTALLED_APPS to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # (r'^admin/', include(admin.site.urls)),
)

if settings.DEV:
    urlpatterns += patterns('',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT, 'show_indexes': True}),
        (r'^admin-media/(.*)$',   'django.views.static.serve', {'document_root': settings.ADMIN_MEDIA_ROOT, 'show_indexes': True}),
    )
