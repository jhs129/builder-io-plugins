## Plugin Architecture

- builder.io plugins should only contain the code to configure the plugin and render the top level component.  All sub components, types, hooks, etc should be stored in the builder-plugins package so they are re-usable