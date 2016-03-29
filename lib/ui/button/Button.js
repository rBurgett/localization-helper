define([
        'backbone',
        'backbone.marionette',
        'handlebars',
        'text!ui/button/button.hbs'
    ],
    function (Backbone, Marionette, Handlebars, buttonTmp) {
        "use strict";

        var ButtonModel = Backbone.Model.extend({
            defaults: {
                text: '',       //@string - the text rendered inside the button
                fill: false,     //@boolean - true: button's width is 100% of container width
                type: 'button',       //@string - button, submit
                style: 'default',       //@string - default, primary, success, info, warning, danger
                position: 'left'        //@string - left, right, center
            }
        });

        var Button = Marionette.ItemView.extend({
    //        model: new ButtonModel,
            text: '',       //@string - the text rendered inside the button
            fill: false,     //@boolean - true: button's width is 100% of container width
            type: 'button',       //@string - button, submit
            style: 'default',       //@string - default, primary, success, info, warning, danger
            position: 'left',        //@string - left, right, center
    /*        template: function(data) {

                console.log(this);

                var data = {
                    text: this.text,
                    fill: this.fill,
                    type: this.type,
                    style: this.style,
                    position: this.position
                };

                if(data.position === 'center') {
                    data.positionClass = 'center-block';
                } else if (data.position === 'right') {
                    data.positionClass = 'pull-right';
                } else {
                    data.positionClass = 'pull-left';
                }

                return Handlebars.compile(buttonTmp)(data);
            },*/
            template: '',
            modelEvents: {
                'change': 'render'
            },
            events: {},
            btnClick: function(e) {
                e.preventDefault();
                this.trigger('click');
            },
            initialize: function(options) {

                if(!options.text) {
                    console.error('You must pass in a text value as a parameter, e.g. {text: "Ok"}');
                }
                //this.model.set('text', options.text);
                this.text = options.text;

                if(options.size) {
                    this[options.size] = options.size;      //@string - 'large', 'medium', or 'small' (medium is default)
                }

                if(options.fill) {
        //            this.model.set('fill', options.fill);
                    this.fill = options.fill;
                }
                if(options.type) {
        //            this.model.set('type', options.type);
                    this.type = options.type;
                }
                if(options.style) {
        //            this.model.set('style', options.style);
                    this.style = options.style;
                }
                if(options.position) {
        //            this.model.set('position', options.position);
                    this.position = options.position;
                }

        /*        if(this.model.get('type') !== 'submit') {
                    this.events['click button'] = 'btnClick';
                }*/
                if (this.type !== 'submit') {
                    this.events['click button'] = 'btnClick';
                }

                if(this.position === 'center') {
                    this.positionClass = 'center-block';
                } else if (this.position === 'right') {
                    this.positionClass = 'pull-right';
                } else {
                    this.positionClass = 'pull-left';
                }


                this.template = _.bind(function() {
                    return Handlebars.compile(buttonTmp)(this);
                }, this);


            }
        });

        return Button;
    }
);