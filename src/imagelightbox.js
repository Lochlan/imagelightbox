(function ($, window, document) {
    'use strict';

    var cssTransitionSupport = function () {
        var s = document.body || document.documentElement;
        s = s.style;
        if (s.WebkitTransition === '') {
            return '-webkit-';
        }
        if (s.MozTransition === '') {
            return '-moz-';
        }
        if (s.OTransition === '') {
            return '-o-';
        }
        if (s.transition === '') {
            return '';
        }
        return false;
    };

    var isCssTransitionSupport = cssTransitionSupport() !== false;

    var cssTransitionTranslateX = function (element, positionX, speed) {
        var options = {}, prefix = cssTransitionSupport();
        options[prefix + 'transform']  = 'translateX(' + positionX + ')';
        options[prefix + 'transition'] = prefix + 'transform ' + speed + 's linear';
        element.css(options);
    };

    var CONST_HASTOUCH = ('ontouchstart' in window);
    var CONST_HASPOINTERS = window.navigator.pointerEnabled || window.navigator.msPointerEnabled;
    var wasTouched = function (event) {
        if (CONST_HASTOUCH) {
            return true;
        }

        if (!CONST_HASPOINTERS || typeof event === 'undefined' || typeof event.pointerType === 'undefined') {
            return false;
        }

        if (typeof event.MSPOINTER_TYPE_MOUSE !== 'undefined') {
            if (event.MSPOINTER_TYPE_MOUSE !== event.pointerType) {
                return true;
            }
        } else if (event.pointerType !== 'mouse') {
            return true;
        }

        return false;
    };



    $.fn.imageLightbox = function (opts) {

        // private data members

        var options = $.extend({
            selector: 'id="imagelightbox"',
            animationSpeed: 250,
            preloadNext: true,
            enableKeyboard: true,
            quitOnEnd: false,
            quitOnImgClick: false,
            quitOnDocClick: true,
            quitOnEscKey: true, // quit when Esc key is pressed
            // custom callbacks
            onStart: undefined, // fired when lightbox opens
            onLoadStart: undefined, // fired a new image starts to load (after onStart)
            onLoadEnd: undefined, // fired after a new image has loaded
            onEnd: undefined, // fired when lightbox closes

            previousTarget: function () {
                var targetIndex = ILBState.targetsArray.index(ILBState.target) - 1;
                if (targetIndex < 0) {
                    if (options.quitOnEnd) {
                        quitLightbox();
                        return false;
                    }
                    targetIndex = ILBState.targetsArray.length - 1;
                }
                ILBState.target = ILBState.targetsArray.eq(targetIndex);
            },

            nextTarget: function () {
                var targetIndex = ILBState.targetsArray.index(ILBState.target) + 1;
                if (targetIndex >= ILBState.targetsArray.length) {
                    if (options.quitOnEnd) {
                        quitLightbox();
                        return false;
                    }
                    targetIndex = 0;
                }
                ILBState.target = ILBState.targetsArray.eq(targetIndex);
            },
        }, opts);

        var ILBState = {
            targetsArray: $([]),
            target: $(),
            img: $(),
            imageWidth: 0,
            imageHeight: 0,
            swipeDiff: 0,
            currentlyLoadingAnImage: false,
        };


        // private methods

        var setImage = function () {
            if (!ILBState.img.length) {
                return true;
            }

            var screenWidth = $(window).width() * 0.8;
            var screenHeight = $(window).height() * 0.9;
            var tmpImage = new Image();

            tmpImage.src = ILBState.img.attr('src');
            tmpImage.onload = function () {
                ILBState.imageWidth = tmpImage.width;
                ILBState.imageHeight = tmpImage.height;

                if (ILBState.imageWidth > screenWidth || ILBState.imageHeight > screenHeight) {
                    var ratio = ILBState.imageWidth / ILBState.imageHeight > screenWidth / screenHeight ? ILBState.imageWidth / screenWidth: ILBState.imageHeight / screenHeight;
                    ILBState.imageWidth /= ratio;
                    ILBState.imageHeight /= ratio;
                }

                ILBState.img.css({
                    'width': ILBState.imageWidth + 'px',
                    'height': ILBState.imageHeight + 'px',
                    'top': ($(window).height() - ILBState.imageHeight) / 2 + 'px',
                    'left': ($(window).width() - ILBState.imageWidth) / 2 + 'px',
                });
            };
        };

        var loadImage = function (direction) {
            if (ILBState.currentlyLoadingAnImage) {
                return false;
            }

            direction = typeof direction === 'undefined' ? false: direction === 'left' ? 1: -1;

            if (ILBState.img.length) {
                var params = {
                    'opacity': 0,
                };
                if (isCssTransitionSupport) {
                    cssTransitionTranslateX(ILBState.img, (100 * direction) - ILBState.swipeDiff + 'px', options.animationSpeed / 1000);
                } else {
                    params.left = parseInt(ILBState.img.css('left')) + 100 * direction + 'px';
                }
                ILBState.img.animate(params, options.animationSpeed, function () {
                    removeImage();
                });
                ILBState.swipeDiff = 0;
            }

            ILBState.currentlyLoadingAnImage = true;
            if (typeof options.onLoadStart === 'function') {
                options.onLoadStart();
            }

            setTimeout(function () {
                var imgPath = ILBState.target.attr('href');
                if (imgPath === undefined) {
                    imgPath = ILBState.target.attr('data-lightbox');
                }
                ILBState.img = $('<img ' + options.selector + ' />')
                    .attr('src', imgPath)
                    .load(function () {
                        ILBState.img.appendTo('body');
                        setImage();

                        var params = {
                            'opacity': 1,
                        };

                        ILBState.img.css('opacity', 0);
                        if (isCssTransitionSupport) {
                            cssTransitionTranslateX(ILBState.img, -100 * direction + 'px', 0);
                            setTimeout(function () {
                                cssTransitionTranslateX(ILBState.img, 0 + 'px', options.animationSpeed / 1000);
                            }, 50);
                        } else {
                            var imagePosLeft = parseInt(ILBState.img.css('left'));
                            params.left = imagePosLeft + 'px';
                            ILBState.img.css('left', imagePosLeft - 100 * direction + 'px');
                        }

                        ILBState.img.animate(params, options.animationSpeed, function () {
                            ILBState.currentlyLoadingAnImage = false;
                            if (typeof options.onLoadEnd === 'function') {
                                options.onLoadEnd();
                            }
                        });
                        if (options.preloadNext) {
                            var nextTarget = ILBState.targetsArray.eq(ILBState.targetsArray.index(ILBState.target) + 1);
                            if (!nextTarget.length) {
                                nextTarget = ILBState.targetsArray.eq(0);
                            }
                            $('<img />').attr('src', nextTarget.attr('href')).load();
                        }
                    })
                    .error(function () {
                        if (typeof options.onLoadEnd === 'function') {
                            options.onLoadEnd();
                        }
                    });

                var swipeStart = 0;
                var swipeEnd = 0;
                var imagePosLeft = 0;

                ILBState.img.on(CONST_HASPOINTERS ? 'pointerup MSPointerUp': 'click', function (e) {
                    e.preventDefault();
                    if (options.quitOnImgClick) {
                        quitLightbox();
                        return false;
                    }
                    if (wasTouched(e.originalEvent)) {
                        return true;
                    }
                    var posX = (e.pageX || e.originalEvent.pageX) - e.target.offsetLeft;
                    if (ILBState.imageWidth / 2 > posX) {
                        loadPreviousImage();
                    } else {
                        loadNextImage();
                    }
                })
                    .on('touchstart pointerdown MSPointerDown', function (e) {
                        if (!wasTouched(e.originalEvent) || options.quitOnImgClick) {
                            return true;
                        }
                        if (isCssTransitionSupport) {
                            imagePosLeft = parseInt(ILBState.img.css('left'));
                        }
                        swipeStart = e.originalEvent.pageX || e.originalEvent.touches[0].pageX;
                    })
                    .on('touchmove pointermove MSPointerMove', function (e) {
                        if (!wasTouched(e.originalEvent) || options.quitOnImgClick) {
                            return true;
                        }
                        e.preventDefault();
                        swipeEnd = e.originalEvent.pageX || e.originalEvent.touches[0].pageX;
                        ILBState.swipeDiff = swipeStart - swipeEnd;
                        if (isCssTransitionSupport) {
                            cssTransitionTranslateX(ILBState.img, -ILBState.swipeDiff + 'px', 0);
                        } else {
                            ILBState.img.css('left', imagePosLeft - ILBState.swipeDiff + 'px');
                        }
                    })
                    .on('touchend touchcancel pointerup pointercancel MSPointerUp MSPointerCancel', function (e) {
                        if (!wasTouched(e.originalEvent) || options.quitOnImgClick) {
                            return true;
                        }
                        if (Math.abs(ILBState.swipeDiff) > 50) {
                            if (ILBState.swipeDiff < 0) {
                                loadPreviousImage();
                            } else {
                                loadNextImage();
                            }
                        } else {
                            if (isCssTransitionSupport) {
                                cssTransitionTranslateX(ILBState.img, 0 + 'px', options.animationSpeed / 1000);
                            } else {
                                ILBState.img.animate({ 'left': imagePosLeft + 'px' }, options.animationSpeed / 2);
                            }
                        }
                    });

            }, options.animationSpeed + 100);
        };

        var loadPreviousImage = function () {
            if (options.previousTarget() !== false) {
                loadImage('left');
            }
        };

        var loadNextImage = function () {
            if (options.nextTarget() !== false) {
                loadImage('right');
            }
        };

        var removeImage = function () {
            if (!ILBState.img.length) {
                return false;
            }
            ILBState.img.remove();
            ILBState.img = $();
        };

        var quitLightbox = function () {
            if (!ILBState.img.length) {
                return false;
            }
            ILBState.img.animate({ 'opacity': 0 }, options.animationSpeed, function () {
                removeImage();
                ILBState.currentlyLoadingAnImage = false;
                if (typeof options.onEnd === 'function') {
                    options.onEnd();
                }
            });
        };


        // public methods

        this.startImageLightbox = function (e) {
            if (e !== undefined) {
                e.preventDefault();
            }
            if (ILBState.currentlyLoadingAnImage) {
                return false;
            }

            if (typeof options.onStart === 'function') {
                options.onStart();
            }
            ILBState.target = $(this);
            loadImage();
        };

        this.switchImageLightbox = function (index) {
            var tmpTarget = ILBState.targetsArray.eq(index);
            if (tmpTarget.length) {
                var currentIndex = ILBState.targetsArray.index(ILBState.target);
                ILBState.target = tmpTarget;
                loadImage(index < currentIndex ? 'left': 'right');
            }
            return this;
        };

        this.loadPreviousImage = function () {
            loadPreviousImage();
        };

        this.loadNextImage = function () {
            loadNextImage();
        };

        this.quitImageLightbox = function () {
            quitLightbox();
            return this;
        };


        // events

        $(document).off('click', this.selector);
        $(document).on('click', this.selector, this.startImageLightbox);
        $(window).on('resize', setImage);


        // "constructor"

        if (options.quitOnDocClick) {
            $(document).on(CONST_HASTOUCH ? 'touchend': 'click', function (e) {
                if (ILBState.img.length && !$(e.target).is(ILBState.img)) {
                    quitLightbox();
                }
            });
        }

        if (options.enableKeyboard) {
            $(document).on('keyup', function (e) {
                if (!ILBState.img.length) {
                    return true;
                }
                e.preventDefault();
                if (e.keyCode === 27 && options.quitOnEscKey) {
                    quitLightbox();
                }
                if (e.keyCode === 37) {
                    loadPreviousImage();
                } else if (e.keyCode === 39) {
                    loadNextImage();
                }
            });
        }

        this.each(function () {
            ILBState.targetsArray = ILBState.targetsArray.add($(this));
        });

        return this;
    };
})(jQuery, window, document);
