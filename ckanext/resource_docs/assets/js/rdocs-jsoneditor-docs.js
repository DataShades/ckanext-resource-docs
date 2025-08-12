ckan.module("rdocs-jsoneditor-docs", function ($, _) {
    "use strict";

    return {
        options: {
            resourceId: null,
            submitBtnSelector: "#save-docs",
            schemaContainerSelector: "#jsoneditor-schema",
            docsContainerSelector: "#jsoneditor-docs"
        },
        initialize: function () {
            $.proxyAll(this, /_/);

            if (!this.options.resourceId) {
                return console.error("Resource ID is required to load resource docs.");
            }

            this.changed = false;

            // event bindings
            document.querySelector(this.options.submitBtnSelector).addEventListener("click", this._onDocumentationSave)

            // init JSONEditor
            this._loadResourceDocs();
            this._toggleSubmitButton(false);
        },

        _loadResourceDocs: function () {
            $.ajax({
                url: `/api/3/action/resource_docs_show?resource_id=${this.options.resourceId}`,
                dataType: 'json',
                success: (data) => {
                    if (data.success && data.result) {
                        this._renderDocsJsonEditor(data.result);
                        this._renderSchemaJsonEditor(data.result);
                    }
                },
                error: (xhr, status, error) => {
                    console.error("Error loading resource docs:", error);
                }
            });
        },

        _renderDocsJsonEditor: function (resDocs) {
            var self = this;

            const options = {
                mode: 'code',
                modes: ['code', 'view'],
                schema: resDocs.schema || {},
                allowSchemaSuggestions: true,
                navigationBar: true,
                onChange: () => {
                    self._toggleSubmitButton(true);
                }
            }

            window.JSONEditorDOCS = new JSONEditor(document.querySelector(this.options.docsContainerSelector), options)

            if (resDocs.docs) {
                window.JSONEditorDOCS.set(resDocs.docs);
            }
        },

        _renderSchemaJsonEditor: function (resDocs) {
            const options = {
                mode: 'code',
                modes: ['code', 'view'],
                onChange: function () {
                    try {
                        window.JSONEditorDOCS.setSchema(editor.get());
                        window.JSONEditorDOCS.repair();
                        window.JSONEditorDOCS.format();
                        self._toggleSubmitButton(true);
                    } catch (err) {
                        console.debug("Invalid JSON, do not use this schema");
                    }
                }
            }

            const editor = new JSONEditor(document.querySelector(this.options.schemaContainerSelector), options)

            if (resDocs.validation_schema) {
                editor.set(resDocs.validation_schema);
            }
        },

        _onDocumentationSave: function () {
            window.JSONEditorDOCS.validate().then(errors => {
                if (errors.length > 0) {
                    return console.warn("Schema validation errors:", errors);
                } else {
                    console.debug("The DOCS JSON is valid ✅");
                    this._overrideResourceDocs();
                }
            });
        },

        _overrideResourceDocs: function () {
            const docs = window.JSONEditorDOCS.get();
            const schema = window.JSONEditorDOCS.options.schema;

            const payload = {
                resource_id: this.options.resourceId,
                docs: JSON.stringify(docs),
                validation_schema: JSON.stringify(schema)
            };
            var self = this;

            this.sandbox.client.call(
                "POST",
                "resource_docs_override",
                payload,
                function (response) {
                    window.JSONEditorDOCS.set(response.result.docs);
                    ckan.notify('Success', ckan.i18n._("Resource documentation saved successfully"), 'success');
                    self._toggleSubmitButton(false);
                },
                function (error) {
                    console.error("Error overriding resource docs:", error);
                    ckan.notify('Error', ckan.i18n._("An error occurred while saving the documentation"), 'error');
                }
            );
        },

        _toggleSubmitButton: function (state) {
            const submitBtn = document.querySelector(this.options.submitBtnSelector);

            this.changed = state;

            if (state) {
                submitBtn.disabled = false;
            } else {
                submitBtn.disabled = true;
            }
        }
    }
});
