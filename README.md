# ParaViewWeb Components with AngularJS and WebPack
=====================

## Introduction
===============

This project serves as an example of how to create custom ParaViewWeb directives using
AngularJS and WebPack.  Illustrated are how to create a full, custom ParaViewWeb
application as a directive, as well as how to wrap the ParaViewWeb Web Visualizer in
a directive.

## Setup
================

First edit the following project npm configuration variables:

    $ npm config set pvw-angular-components:pvpython ${PATH_TO_PVPYTHON}
    $ npm config set pvw-angular-components:launcher ${PATH_TO_VTK_WEB_LAUNCHER_PY}
    $ npm config set pvw-angular-components:datadir  ${PATH_TO_DATA_DIRECTORY}

Now run:

    $ npm install
    $ npm run build
    $ npm start

This will set everything up and start the launcher.  Then point your browser at
`localhost:9500` and should see the demo application.  In order to connect to the
meshtagger, you will need to use the input field provided to type in the name of
an exodus file that lives in the data directory you configured above.

## Issue with ng-material ~0.11.0

When attempting to use `"angular-material": "~0.11.0"`, I ran into the following issue:

    Unable to find node 'md_dialog' in element

So for this reason, I rolled back to a previous version (`"~0.10.0"`) and the issue was
resolved.
