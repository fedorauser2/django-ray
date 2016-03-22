# Introduction #

This will serve as a general plan for developers wishing to join in or already working on the project.

Learning from the past: http://faassen.n--tree.net/blog/view/weblog/2008/09/19/0

# Overview #

| **Milestone** | **Description** |
|:--------------|:----------------|
| **0.1** (Mess Around) | First working state (now) |
| **0.2**       | File Browser    |
| **0.3**       | Code editor, Image editor |
| **0.4**       | Workspace       |
| **0.5**       | Configuration panel |
| **0.6**       | Search & replace & other pluggable features |
| **0.7**       | Subversion integration |
| **0.8**       | Integrated diff support |
| **0.9**       | Django Syntax highlight |
| **1.0** (Sun Shine) | First stable release |


## Feature ideas (brainstorm) ##

  * **console**: Command line console
  * **image editor**: http://www.pixlr.com/editor/
  * **object explorer**: Explore template objects (how??)
  * **auto links**: Clickable path links (ex: clicking on base.html in  "{% extends "base.html" %}" would try to open it in editor.
  * **concurrent editing**: Like Google does with Wave and Docs (improbable)
  * **on site block editing**: When a administrator would navigate the website, some template magic would allow him to click on template blocks and edit them live on the site (most likely in a windowed editor).
  * **commit notification**: Setup and manage notification by email of commits
  * **multiple editors**: Support for multiple editors (like Bespin)
  * Django documentation integration (I've tried to generate it with epydoc and it generates 107mb of HTMl .. yikes).


# Detailed road map #

## 0.2 ##

In this version the focus will be to make the file browser secure and usable. It must also provide a clear and stable API and events to other plugins (ex; file open, rename, move, etc..).

# 0.3 #

At this point the code editor should be stable. All features that does not feel rock solid will be removed until they do.

# 0.4 #

The workspace should be fully functional and stable with standards features like split buffers, buffer resize, etc..

# 0.5 #

A configuration panel will be introduced to hold editor's fine grained options .. I'm thinking about something like Firefox's _about:config_ .. sounds good ?

# 0.6 #

At this point some more "sugar" feature can be added to the editor.

# 0.7 #

SVN integration .. or Ronny Pfannschmidt suggested using **anyvc** to abstract multiple VCS .. it almost seems to good to be true so we'll have to take a look at it: http://bitbucket.org/RonnyPfannschmidt/anyvc/

# 0.8 #

Support for diff (using split buffers)

# 0.9 #

By this point I hopefully will have enough time to code a syntax parser/tokenizer for Django's template syntax or will have found find someone smart enough to do it.

# 1.0 #

Finally we have a full fledged & integrated Django editor :) Next version until 2.0 are only bug fixing, code refactoring/cleanup and minor feature additions.

# 2.0 #

Who knows..