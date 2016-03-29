require.config({

    // baseUrl: "js",

    paths: {
        text: 'lib/text',
        jquery: 'lib/jquery',
        underscore: 'lib/underscore',
        lodash: 'lib/lodash.min',
        backbone: 'lib/backbone',
        /* alias all marionette libs */
        'backbone.marionette': 'lib/backbone.marionette.min',
        'backbone.wreqr': 'lib/backbone.wreqr.min',
        'backbone.babysitter': 'lib/backbone.babysitter.min',
        handlebars: 'lib/handlebars.min',

        bootstrap: 'lib/bootstrap.min',
        fileSaver: 'lib/FileSaver',

        ui: 'lib/ui/',

        clipboard: 'lib/clipboard',
        uuid: 'lib/uuid'
    },

    shim: {
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ]
        },
        'backbone.marionette': {
            deps: [
                'backbone'
            ]
        },
        bootstrap: {
            deps: [
                'jquery'
            ]
        },
        HandlebarsIntl: {
            exports: 'HandlebarsIntl'
        },
        fileSaver: {
            exports: 'saveAs'
        }
    }
});

define([
        'backbone.marionette',
        'backbone',
        'jquery',
        'bootstrap',
        'lodash',
        'handlebars',
        'ui/button/Button',
        'fileSaver',
        'uuid',
        'clipboard'
    ],
    function (Marionette, Backbone, $, Bootstrap, _, Handlebars, Button, saveAs, uuid, Clipboard) {
        'use strict';

        var contextCollections = {};

        var KeyListItemView = Marionette.ItemView.extend({
            template: function(data) {
                return Handlebars.compile($('#js-keyListItemTemplate').html())(data);
            },
            events: {
                'click .js-deleteKeyBtn': 'deleteKeyBtnClicked',
                'keyup .js-keyInput': 'updateKey',
                'keyup .js-valueInput': 'updateValue'
            },
            updateKey: function(e) {
                e.preventDefault();
                var key = e.target.value;
                var context = this.model.get('context');
                var hString = '{{formatMessage (intlGet "' + key + '.' + context + '.val")}}';
                var jString = "Localize.text('" + key + "', '" + context + "')";
                this.$('.js-hCode').val(hString);
                this.$('.js-jCode').val(jString);
                this.model.set('key', e.target.value);
            },
            updateValue: function(e) {
                e.preventDefault();
                this.model.set('value', e.target.value);
            },
            deleteKeyBtnClicked: function(e) {
                e.preventDefault();
                this.trigger('deleteKey');
            },
            onRender: function() {

                var copyId = 'a' + uuid.v4();
                var hbsId = copyId + 'hbs';
                var jsId = copyId + 'js';

                this.$('.js-hCode').attr('id', hbsId);
                this.$('.js-jCode').attr('id', jsId);

                this.$('.js-copyHbsBtn').attr('data-clipboard-target', '#' + hbsId);
                this.$('.js-copyJsBtn').attr('data-clipboard-target', '#' + jsId);

                this.hbsClipboard = new Clipboard(this.$('.js-copyHbsBtn')[0]);
                this.jsClipboard = new Clipboard(this.$('.js-copyJsBtn')[0]);

            },
            onBeforeDestroy: function() {
                this.hbsClipboard.destroy();
                this.jsClipboard.destroy();
            }
        });

        var KeyListView = Marionette.CompositeView.extend({
            childView: KeyListItemView,
            childViewContainer: 'form',
            events: {
                'click .js-addNewKeyBtn': 'addNewKey',
                'click .js-deleteContextConfirmed': 'deleteContextConfirmed'
            },
            deleteContextConfirmed: function(e) {
                e.preventDefault();
                this.trigger('deleteContext', this.context);
            },
            addNewKey: function(e) {
                e.preventDefault();
                console.log(this.context);
                this.collection.add({
                    key: '',
                    context: this.context,
                    value: ''
                });
                this.render();
                //console.log(this.$('input').length);
                var length = this.$('input').length;
                //console.log(this.$('input')[length - 3]);
                $('html, body').animate({ scrollTop: $(document).height() }, 200);
                this.$('input')[length - 5].focus();
            },
            initialize: function() {

                var parent = this;

                this.template = _.bind(function(data) {
                    data.ctxName = this.context;
                    return Handlebars.compile($('#js-keyListTemplate').html())(data);
                }, this);

                this.on({
                    'childview:deleteKey': function(itemView) {
                        var selectedModel = itemView.model;
                        parent.collection.remove(selectedModel);
                        parent.render();
                    }
                });

            }
        });

        var contextListItemModel = Backbone.Model.extend({
            defaults: {
                name: ''
            }
        });

        var ContextListCollection = Backbone.Collection.extend({
            model: contextListItemModel
        });

        var ContextListItemView = Marionette.ItemView.extend({
            tagName: 'tr',
            template: function(data) {
                var fullName = data.name;
                var splitName = fullName.split('-');
                if(splitName.length > 1) {
                    data.shortName = ' > ' + splitName[1];
                } else {
                    data.shortName = splitName[0];
                }
                return Handlebars.compile($('#js-contextListItemTemplate').html())(data);
            },
            events: {
                'click': 'clicked'
            },
            clicked: function(e) {
                e.preventDefault();
                this.trigger('contextClicked');
            }
        });

        var ContextListView = Marionette.CompositeView.extend({
            template: function(data) {
                return Handlebars.compile($('#js-contextListTemplate').html())(data);
            },
            childViewContainer: 'tbody',
            childView: ContextListItemView,
            collectionEvents: {
                change: 'render'
            },
            initialize: function() {

                var parent = this;

                this.on({
                    'childview:contextClicked': function(itemView) {
                        parent.trigger('loadContext', itemView.model.get('name'));
                        //console.log(parent.collection);
                    }
                });
            }
        });

        var HeaderView = Marionette.ItemView.extend({
            template: function(data) {
                return Handlebars.compile($('#js-headerTemplate').html())(data);
            }
        });

        var SidebarView = Marionette.LayoutView.extend({
            template: function(data) {
                return Handlebars.compile($('#js-sidebarTemplate').html())(data);
            },
            regions: {
                'loadBtnRegion': '.js-loadBtnRegion',
                'contextListRegion': '.js-contextListRegion'
            },
            initialize: function() {

            },
            events: {
                'click .js-saveNewContext': 'saveNewContext',
                'click .js-saveLocaleFileBtn': 'saveLocaleFile'
            },
            saveLocaleFile: function(e) {
                e.preventDefault();

                var localeObj = {
                    locale: this.locale
                };

                var contexts = Object.keys(contextCollections);

                _.each(contexts, function(context) {
                    if(contextCollections[context]) {
                        var contextCollection = contextCollections[context];
                        var keyModels = contextCollection.models;
                        _.each(keyModels, function(keyModel) {
                            var key = keyModel.attributes.key;
                            var value = keyModel.attributes.value;

                            if(localeObj[key]) {
                                localeObj[key][context] = {
                                    val: value
                                };
                            } else {
                                localeObj[key] = {};
                                localeObj[key][context] = {
                                    val: value
                                };
                            }

                        });
                    }
                });
                console.log(localeObj);

                var fileName = localeObj.locale;
                var localeJSON = JSON.stringify(localeObj, null, '\t');
                var blob = new Blob([localeJSON], {type: 'data:text/json;charset=utf-8'});
                saveAs(blob, fileName + '.json');

            },
            saveNewContext: function(e) {
                e.preventDefault();
                var newCtxName = this.$('.js-newContextName').val();
                if(contextCollections[newCtxName]) {
                    alert('That context already exists!');
                    return;
                }
                contextCollections[newCtxName] = new Backbone.Collection();
                contextCollections[newCtxName].name = newCtxName;
                this.contextListRegion.currentView.collection.add({
                    name: newCtxName
                });
                this.contextListRegion.currentView.collection.sort();
            },
            onRender: function() {

                var parent = this;

                //console.log(contextListView.collection);

                //var contextCollections = {};

                var processLocaleData = function(data) {
                    var keys = Object.keys(data);
                    //console.log(keys);
                    var contexts = [];
                    _.each(data, function(item) {
                        var ctx = Object.keys(item);
                        for(var i = 0;i < ctx.length; i++) {
                            contexts.push(ctx[i]);
                        }
                    });
                    var uniqueContexts = _.uniq(contexts);

                    _.each(uniqueContexts, function(ctx) {
                        contextCollections[ctx] = new Backbone.Collection();/*{
                            model: CtxCollectionModel
                        });*/
                        contextCollections[ctx].name = ctx;
                    });

                    for(var i = 0; i < keys.length; i++) {
                        var newObj;
                        var key = keys[i];
                        var ctxKeys = Object.keys(data[key]);
                        var len = ctxKeys.length;
                        for(var j = 0; j < len; j++) {
                            var ctxKey = ctxKeys[j];

                            newObj = {
                                key: key,
                                context: ctxKey,
                                value: data[key][ctxKey].val,
                                description: data[key][ctxKey].description
                            };

        //                    console.log(newObj);

                            contextCollections[ctxKey].add(newObj);
                        }
                    }
                    //console.log(contextCollections);

                    var ctxNames = Object.keys(contextCollections);
                    //console.log(ctxNames);
                    for(var k = 0; k < ctxNames.length; k++) {
                        //console.log(ctxNames[i]);
                        contextListView.collection.add({
                            name:ctxNames[k]
                        });
                    }
                    contextListView.collection.sort();

                    parent.$('.js-loadBtnRegion').hide();
                    parent.$('.js-saveBtnContainer').show();
                    parent.$('.js-contextControls').show();

                    /*_.each(contextCollections, function(collection) {
                        _.each(collection.models, function(model) {

                            contextListView.

                            //console.log(contextCollections);
            //                console.log(model.attributes);
                        })
                    });*/
                };

                var contextListCollection = new ContextListCollection();

                contextListCollection.comparator = 'name';

                var contextListView = new ContextListView({
                    collection: contextListCollection
                });
                this.contextListRegion.show(contextListView);
                contextListView.on({
                    loadContext: function(ctxName) {
                        //                    console.log(ctxName);

                //        keyListView.collection = contextCollections[ctxName];
                //        keyListView.render();
                        parent.trigger('loadContext', ctxName);
                    }
                });

                var loadBtn = new Button({text:'Load Locale File', fill: true});
                this.loadBtnRegion.show(loadBtn);
                loadBtn.on({
                    click: function() {
                        parent.$('.js-loadFile').unbind().on({
                            change: function(e) {
                                e.preventDefault();
                                var readFile = new FileReader();
                                readFile.onloadend = function(file) {
                                    var data = file.target.result;
                                    var parsedFullData = JSON.parse(data);
                                    parent.locale = parsedFullData.locale;
                                    var parsedData = _.omit(parsedFullData, 'locale');
                                    processLocaleData(parsedData);
                                };
                                readFile.readAsText(e.target.files[0]);
                            }
                        });
                        parent.$('.js-loadFile').click();
                    }
                });
            }
        });

        var AppView = Marionette.LayoutView.extend({
            template: function(data) {
                return Handlebars.compile($('#js-appViewTemplate').html())(data);
            },
            regions: {
                headerRegion: '.js-headerRegion',
                sidebarRegion: '.js-sidebarRegion',
                keyListRegion: '.js-keyListRegion'
            },
            onRender: function() {
                var headerView = new HeaderView();
                this.headerRegion.show(headerView);

                var keyListView = new KeyListView();
                this.keyListRegion.show(keyListView);

                var sidebarView = new SidebarView();
                this.sidebarRegion.show(sidebarView);
                sidebarView.on({
                    loadContext: function(ctxName) {
                //        console.log(ctxName);
                        keyListView.context = ctxName;
                        keyListView.collection = contextCollections[ctxName];
                        keyListView.render();
                    }
                });

                keyListView.on({
                    deleteContext: function(contextName) {
                        //console.log(contextName);
                        //console.log(sidebarView.contextListRegion.currentView.collection);
                        var model = sidebarView.contextListRegion.currentView.collection.where({name: contextName})[0];
                        sidebarView.contextListRegion.currentView.collection.remove(model);
                        contextCollections[contextName] = null;
                        keyListView.collection = '';
                        keyListView.context = '';
                        keyListView.render();
                    }
                });
            }
        });

        var App = new Marionette.Application();
        App.addRegions({
            appRegion:  '#js-appRegion'
        });

        App.addInitializer(function() {
            var appView = new AppView();
            App.appRegion.show(appView);
        });

        App.start();

        return App;

    }
);
