/*global window,$ */
var Validation = {

    config: {
        offset: {
            x: 20,
            y: 0
        },
        onValid: function(){
            this.closest('.control-group').removeClass('error').addClass('success');
            //this.removeClass('invalid');
        },
        onInvalid: function(){
            this.closest('.control-group').addClass('error').removeClass('success');
            //this.addClass('invalid');
        },
        validationData: function(){
            var controlGroup = this.closest('.control-group');
            if(controlGroup.length){
                return controlGroup.data('validation');
            }
            return this.data('validation');
        },
        onResetForm: function(Validation){
            this.find('input, textarea, select').each(function(){
                var elem = $(this);
                Validation.removeMessage(elem);
                $(this).closest('.control-group').removeClass('error').removeClass('success');
            });
        },
        onFocus: function(){
            this.closest('.control-group').removeClass('error').removeClass('success');
        },
        fadeTime: 400
    },

    validate: function(elem){
        var self = this;
        var firstInvalidElem = '';

        elem.find('input, textarea, select').each(function(index2, value2){
            var res = self.validateElement($(this));

            if(!res){
                if(firstInvalidElem === ''){
                    firstInvalidElem = elem;
                }
            }
        });

        if(firstInvalidElem === ''){
            return true;
        }

        //TODO: scroll to first invalid element

        return false;
    },
    
    setupValidationOnForm: function(form){
        var self = this;
        if(!form.is('form')){
            return;
        }
        form.on('change focusout', 'input, select, textarea, option', function(event){
            var elem = $(this);
            self.validateElement(elem, event);
        });

        form.on('focusin', '[data-validation]', function(event){
            var elem = $(this);
            self.config.onFocus.apply(elem);
            self.removeMessage(elem);
        });

        form.on('submit', function(event){
            var isFormValid = form.validate();

            if(!isFormValid){
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        });
        
        form.on('reset', function(){
            self.config.onResetForm.apply(form, [self]);
        });
        
        form.data('validated', true);
    },
    
    init: function(){
        var self = this;
        //initialize validation on forms
        $(window).bind('resize scroll', function(event){
            self.positionAllMessages();
        });

        var forms = $('form');
        
        $.fn.validate = function(){
            return Validation.validate($(this));
        };
        
        $.fn.setupValidation = function(){
            return Validation.setupValidationOnForm($(this));
        };

        forms.each(function(index){
            var form = $(this);
            form.setupValidation();
        });
        
        $('body').on('click', '.validation-message', function(event){
            var msgElem = $(this);
            var targetElem = msgElem.data('target');
            self.removeMessage(targetElem, msgElem);
        });
    },

    body_elm: $('body'),

    displayMessage: function(msg, targetElem){
        var self = this;

        if(typeof msg !== 'string'){
            throw new Error('The message must be passed as a string');
        }

        //test if the element already has a message
        var previousMsgElem = targetElem.data('validation-message');
        if(previousMsgElem){
            self.removeMessage(targetElem, previousMsgElem);
        }

        var elemHtml = '<div class="validation-message tooltip right">';
            elemHtml += '<div class="tooltip-arrow"/>';
            elemHtml += '<div class="tooltip-inner">' + msg + '</div>';
            elemHtml += '</div>';
        var elem = $(elemHtml);

        elem.css({
            position: 'absolute',            
        });
        elem.fadeTo(0,0);

        elem.data('target', targetElem);
        targetElem.data('validation-message', elem);

        elem.appendTo(self.body_elm);
        self.positionMessage(elem, targetElem);
        elem.fadeTo(self.config.fadeTime, 1);
    },

    formatMessage: function(msg){
        var isArray = (!!msg.join);

        if(!isArray){
            return msg;
        }

        return ' * ' + msg.join('<br> * ');
    },

    positionAllMessages: function(){
        var self = this;
        $('.validation-message').each(function(index){
            var elem = $(this);
            var targetElem = elem.data('target');

            if(targetElem.length){
                self.positionMessage(elem, targetElem);
            }
        });
    },

    removeMessage: function(targetElem, msgElem){
        if(!msgElem){
            msgElem = targetElem.data('validation-message');
        }

        if(!msgElem){
            //console.warn('At this time, there is no message element for the element: ', targetElem);
            return;
        }

        msgElem.remove();
        targetElem.removeData('validation-message');
    },

    positionMessage: function(msgElem, targetElem){
        var offset = targetElem.offset();
        var position = {
            left: offset.left + this.config.offset.x + targetElem.width(),
            top: offset.top + this.config.offset.y + (targetElem.outerHeight() - msgElem.outerHeight())/2
        };
        msgElem.css({
            top: position.top,
            left: position.left
        });
    },

    evaluate: function(arg){
        if(typeof arg === 'function'){
            return arg();
        }

        return arg;
    },

    patterns: {
        required: {
            pattern: /(\S)+/,
            message: 'This field is required. Please enter a value.'            
        },
        email: {
            pattern: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/i,
            message: 'Please enter a valid email address.'
        }
    },

    handleMessages: function(element, messages){
        var self = this;
        if(messages.length){
            return self.displayMessage(self.formatMessage(messages), element);
        } else {
            return self.removeMessage(element);
        }
    },

    validateElement: function(element, event){

        var self = this;

        var validationData = self.config.validationData.apply(element);

        //first check if the element can have a text value (text input, number, textarea, etc.)
        var isElementText = (element.is('[type="text"]') || element.is('textarea'));

        var messages = [];

        if(isElementText){

            if(validationData){
                var conditions = validationData.split(',');

                var inputValue = element.val();

                $.each(conditions, function(index, value){
                    value = $.trim(value);
                    if(value === ''){
                        return true;
                    }

                    if(/^custom/.test(value)){

                        //TODO: implement custom patterns
                        var patternObj = {

                        }
                    } else {
                        var patternObj = self.patterns[value];

                        if(!patternObj){
                            throw new Error('The pattern "' + value + '" is not defined.');
                        }
                    }

                    if(patternObj.pattern.test(inputValue)){
                        return true;
                    }

                    messages.push(patternObj.message);
                });

            }
        }

        var isElementSelect = element.is('select');

        if(isElementSelect){

            if(validationData){
                var conditions = validationData.split(',');

                //TODO: move from here and refactor
                var values = {
                    max: {
                        test: function(elem, num){
                            return (elem.find(':selected').length <= parseInt(num, 10));
                        },
                        message: function(num){
                            return 'Please choose at most ' + num + ' options.';
                        }
                    },
                    min: {
                        test: function(elem, num){
                            return (elem.find(':selected').length >= parseInt(num, 10));
                        },
                        message: function(num){
                            return 'Please choose at least ' + num + ' options.';
                        }
                    },
                    required: {
                        test: function(elem){
                            return (!!elem.find(':selected').val());
                        },
                        message: function(){
                            return 'This field is required. Please choose an option.';
                        }
                    }
                };

                var messages = [];

                $.each(conditions, function(index, value){
                    value = $.trim(value);
                    if(value === ''){
                        return true;
                    }

                    //test if no arguments
                    var noArguments = /^[a-z]+$/i.test(value);

                    if(noArguments){
                        var res = values[value].test(element);

                        if(!res){
                            var msg = values[value].message();
                        }
                    } else {
                        var match = value.match(/^([a-zA-Z]+)\((.+)\)$/);
                        var func = match[1];
                        var arg = match[2];

                        var res = values[func].test(element, arg);

                        if(!res){
                            var msg = values[func].message(arg);
                        }
                    }

                    if(msg){
                        messages.push(msg);
                    }              

                });  
            }
        }

        self.handleMessages(element, messages);

        var isElemValid = (messages.length === 0);
        
        (isElemValid ? self.config.onValid : self.config.onInvalid).apply(element);

        return isElemValid;
    }

};

Validation.init();