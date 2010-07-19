# TODO: Fix the hardcoded EDITABLE_TEMPLATE_DIR path
from django.conf import settings
RAY_EDITABLE_DIRS = getattr(settings, 'RAY_EDITABLE_DIRS', [])
EDITOR_IGNORE    = ['.svn',]
