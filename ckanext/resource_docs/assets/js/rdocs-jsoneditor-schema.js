ckan.module("rdocs-jsoneditor-schema", function ($, _) {
    "use strict";

    return {
        options: {
            resourceId: null
        },
        initialize: function () {
            $.proxyAll(this, /_/);

            if (!this.options.resourceId) {
                return console.error("Resource ID is required to load resource docs schema.");
            }

            this._loadResourceDocs();
        },

        _loadResourceDocs: function () {
            $.ajax({
                url: `/api/3/action/resource_docs_show?resource_id=${this.options.resourceId}`,
                dataType: 'json',
                success: (data) => {
                    if (data.success && data.result) {
                        this._renderJsonEditor(data.result);
                    }
                },
                error: (xhr, status, error) => {
                    console.error("Error loading resource docs:", error);
                }
            });
        },

        _renderJsonEditor: function (resDocs) {
            const options = {
                mode: 'code',
                modes: ['code', 'view'],
                onChange: function () {
                    try {
                        window.JSONEditorDOCS.setSchema(editor.get());
                        window.JSONEditorDOCS.repair();
                        window.JSONEditorDOCS.format();
                    } catch (err) {
                        console.log("Invalid JSON, do not use this schema");
                    }
                }
            }

            const editor = new JSONEditor(this.el[0], options)

            if (resDocs.schema) {
                editor.set(resDocs.schema);
            }
        }
    }
});
