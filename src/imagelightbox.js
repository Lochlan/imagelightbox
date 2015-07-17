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
        var options = $.extend({
            selector: 'id="imagelightbox"',
            allowedTypes: 'png|jpg|jpeg|gif',
            animationSpeed: 250,
            preloadNext: true,
            enableKeyboard: true,
            quitOnEnd: false,
            quitOnImgClick: false,
            quitOnDocClick: true,
            quitOnEscKey: true, // quit when Esc key is pressed
            onStart: false,
            onEnd: false,
            onLoadStart: false,
            onLoadEnd: false,

            previousTarget: function () {
                return this.previousTargetDefault();
            },

            previousTargetDefault: function () {
                var targetIndex = GlobalTargetsArray.index(GlobalTarget) - 1;
                if (targetIndex < 0) {
                    if (options.quitOnEnd === true) {
                        quitLightbox();
                        return false;
                    }
                    targetIndex = GlobalTargetsArray.length - 1;
                }
                GlobalTarget = GlobalTargetsArray.eq(targetIndex);
            },

            nextTarget: function () {
                return this.nextTargetDefault();
            },

            nextTargetDefault: function () {
                var targetIndex = GlobalTargetsArray.index(GlobalTarget) + 1;
                if (targetIndex >= GlobalTargetsArray.length) {
                    if (options.quitOnEnd === true) {
                        quitLightbox();
                        return false;
                    }
                    targetIndex = 0;
                }
                GlobalTarget = GlobalTargetsArray.eq(targetIndex);
            },
        }, opts);

        var GlobalTargetsArray = $([]);
        var GlobalTarget = $();
        var GlobalImg = $();
        var GlobalImageWidth = 0;
        var GlobalImageHeight = 0;
        var GlobalSwipeDiff = 0;
        var GlobalInProgress = false;

        var isTargetValid = function (element) {
            var classic = $(element).prop('tagName').toLowerCase() === 'a' && (new RegExp('.(' + options.allowedTypes + ')$', 'i')).test($(element).attr('href'));
            var html5 = $(element).attr('data-lightbox') !== undefined;
            return classic || html5;
        };

        var setImage = function () {
            if (!GlobalImg.length) {
                return true;
            }

            var screenWidth = $(window).width() * 0.8;
            var screenHeight = $(window).height() * 0.9;
            var tmpImage = new Image();

            tmpImage.src = GlobalImg.attr('src');
            tmpImage.onload = function () {
                GlobalImageWidth = tmpImage.width;
                GlobalImageHeight = tmpImage.height;

                if (GlobalImageWidth > screenWidth || GlobalImageHeight > screenHeight) {
                    var ratio = GlobalImageWidth / GlobalImageHeight > screenWidth / screenHeight ? GlobalImageWidth / screenWidth: GlobalImageHeight / screenHeight;
                    GlobalImageWidth /= ratio;
                    GlobalImageHeight /= ratio;
                }

                GlobalImg.css({
                    'width': GlobalImageWidth + 'px',
                    'height': GlobalImageHeight + 'px',
                    'top': ($(window).height() - GlobalImageHeight) / 2 + 'px',
                    'left': ($(window).width() - GlobalImageWidth) / 2 + 'px',
                });
            };
        };

        var loadImage = function (direction) {
            if (GlobalInProgress) {
                return false;
            }

            direction = typeof direction === 'undefined' ? false: direction === 'left' ? 1: -1;

            if (GlobalImg.length) {
                var params = {
                    'opacity': 0,
                };
                if (isCssTransitionSupport) {
                    cssTransitionTranslateX(GlobalImg, (100 * direction) - GlobalSwipeDiff + 'px', options.animationSpeed / 1000);
                } else {
                    params.left = parseInt(GlobalImg.css('left')) + 100 * direction + 'px';
                }
                GlobalImg.animate(params, options.animationSpeed, function () {
                    removeImage();
                });
                GlobalSwipeDiff = 0;
            }

            GlobalInProgress = true;
            if (options.onLoadStart !== false) {
                options.onLoadStart();
            }

            setTimeout(function () {
                var imgPath = GlobalTarget.attr('href');
                if (imgPath === undefined) {
                    imgPath = GlobalTarget.attr('data-lightbox');
                }
                GlobalImg = $('<img ' + options.selector + ' />')
                    .attr('src', imgPath)
                    .load(function () {
                        GlobalImg.appendTo('body');
                        setImage();

                        var params = {
                            'opacity': 1,
                        };

                        GlobalImg.css('opacity', 0);
                        if (isCssTransitionSupport) {
                            cssTransitionTranslateX(GlobalImg, -100 * direction + 'px', 0);
                            setTimeout(function () {
                                cssTransitionTranslateX(GlobalImg, 0 + 'px', options.animationSpeed / 1000);
                            }, 50);
                        } else {
                            var imagePosLeft = parseInt(GlobalImg.css('left'));
                            params.left = imagePosLeft + 'px';
                            GlobalImg.css('left', imagePosLeft - 100 * direction + 'px');
                        }

                        GlobalImg.animate(params, options.animationSpeed, function () {
                            GlobalInProgress = false;
                            if (options.onLoadEnd !== false) {
                                options.onLoadEnd();
                            }
                        });
                        if (options.preloadNext) {
                            var nextTarget = GlobalTargetsArray.eq(GlobalTargetsArray.index(GlobalTarget) + 1);
                            if (!nextTarget.length) {
                                nextTarget = GlobalTargetsArray.eq(0);
                            }
                            $('<img />').attr('src', nextTarget.attr('href')).load();
                        }
                    })
                    .error(function () {
                        if (options.onLoadEnd !== false) {
                            options.onLoadEnd();
                        }
                    });

                var swipeStart = 0;
                var swipeEnd = 0;
                var imagePosLeft = 0;

                GlobalImg.on(CONST_HASPOINTERS ? 'pointerup MSPointerUp': 'click', function (e) {
                    e.preventDefault();
                    if (options.quitOnImgClick) {
                        quitLightbox();
                        return false;
                    }
                    if (wasTouched(e.originalEvent)) {
                        return true;
                    }
                    var posX = (e.pageX || e.originalEvent.pageX) - e.target.offsetLeft;
                    if (GlobalImageWidth / 2 > posX) {
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
                            imagePosLeft = parseInt(GlobalImg.css('left'));
                        }
                        swipeStart = e.originalEvent.pageX || e.originalEvent.touches[0].pageX;
                    })
                    .on('touchmove pointermove MSPointerMove', function (e) {
                        if (!wasTouched(e.originalEvent) || options.quitOnImgClick) {
                            return true;
                        }
                        e.preventDefault();
                        swipeEnd = e.originalEvent.pageX || e.originalEvent.touches[0].pageX;
                        GlobalSwipeDiff = swipeStart - swipeEnd;
                        if (isCssTransitionSupport) {
                            cssTransitionTranslateX(GlobalImg, -GlobalSwipeDiff + 'px', 0);
                        } else {
                            GlobalImg.css('left', imagePosLeft - GlobalSwipeDiff + 'px');
                        }
                    })
                    .on('touchend touchcancel pointerup pointercancel MSPointerUp MSPointerCancel', function (e) {
                        if (!wasTouched(e.originalEvent) || options.quitOnImgClick) {
                            return true;
                        }
                        if (Math.abs(GlobalSwipeDiff) > 50) {
                            if (GlobalSwipeDiff < 0) {
                                loadPreviousImage();
                            } else {
                                loadNextImage();
                            }
                        } else {
                            if (isCssTransitionSupport) {
                                cssTransitionTranslateX(GlobalImg, 0 + 'px', options.animationSpeed / 1000);
                            } else {
                                GlobalImg.animate({ 'left': imagePosLeft + 'px' }, options.animationSpeed / 2);
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
            if (!GlobalImg.length) {
                return false;
            }
            GlobalImg.remove();
            GlobalImg = $();
        };

        var quitLightbox = function () {
            if (!GlobalImg.length) {
                return false;
            }
            GlobalImg.animate({ 'opacity': 0 }, options.animationSpeed, function () {
                removeImage();
                GlobalInProgress = false;
                if (options.onEnd !== false) {
                    options.onEnd();
                }
            });
        };


        $(window).on('resize', setImage);

        if (options.quitOnDocClick) {
            $(document).on(CONST_HASTOUCH ? 'touchend': 'click', function (e) {
                if (GlobalImg.length && !$(e.target).is(GlobalImg)) {
                    quitLightbox();
                }
            });
        }

        if (options.enableKeyboard) {
            $(document).on('keyup', function (e) {
                if (!GlobalImg.length) {
                    return true;
                }
                e.preventDefault();
                if (e.keyCode === 27 && options.quitOnEscKey === true) {
                    quitLightbox();
                }
                if (e.keyCode === 37) {
                    loadPreviousImage();
                } else if (e.keyCode === 39) {
                    loadNextImage();
                }
            });
        }

        this.startImageLightbox = function (e) {
            if (!isTargetValid(this)) {
                return true;
            }
            if (e !== undefined) {
                e.preventDefault();
            }
            if (GlobalInProgress) {
                return false;
            }
            GlobalInProgress = false;
            if (options.onStart !== false) {
                options.onStart();
            }
            GlobalTarget = $(this);
            loadImage();
        };

        $(document).off('click', this.selector);
        $(document).on('click', this.selector, this.startImageLightbox);

        this.each(function () {
            if (!isTargetValid(this)) {
                return true;
            }
            GlobalTargetsArray = GlobalTargetsArray.add($(this));
        });

        this.switchImageLightbox = function (index) {
            var tmpTarget = GlobalTargetsArray.eq(index);
            if (tmpTarget.length) {
                var currentIndex = GlobalTargetsArray.index(GlobalTarget);
                GlobalTarget = tmpTarget;
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

        return this;
    };
})(jQuery, window, document);
