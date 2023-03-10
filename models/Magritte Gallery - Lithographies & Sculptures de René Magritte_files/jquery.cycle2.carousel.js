/*! carousel transition plugin for Cycle2;  version: 20130528 */
(function($) {
"use strict";

$( document ).on('cycle-bootstrap', function( e, opts, API ) {
    if ( opts.fx !== 'carousel' )
        return;

    API.getSlideIndex = function( el ) {
        var slides = this.opts()._carouselWrap.children();
        var i = slides.index( el );
        return i % slides.length;
    };

    // override default 'next' function
    API.next = function() {
        var count = opts.reverse ? -1 : 1;
        if ( opts.allowWrap === false && ( opts.currSlide + count ) > opts.slideCount - opts.carouselVisible )
            return;
        opts.API.advanceSlide( count );
        opts.API.trigger('cycle-next', [ opts ]).log('cycle-next');
    };

	var origJump = API.jump;
		API.jump = function(index, hops){
			var opts = this.opts();
			opts.hardHops = hops || 0;
			origJump.call(this, index);
		}
});


$.fn.cycle.transitions.carousel = {
    // transition API impl
    preInit: function( opts ) {
        opts.hideNonActive = false;

        opts.container.on('cycle-destroyed', $.proxy(this.onDestroy, opts.API));
        // override default API implementation
        opts.API.stopTransition = this.stopTransition;

        // issue #10
        for (var i=0; i < opts.startingSlide; i++) {
            opts.container.append( opts.slides[0] );
        }
    },

    // transition API impl
    postInit: function( opts ) {
        var i, j, slide, pagerCutoffIndex, wrap;
        var vert = opts.carouselVertical;
        if (opts.carouselVisible && opts.carouselVisible > opts.slideCount)
            opts.carouselVisible = opts.slideCount - 1;
        var visCount = opts.carouselVisible || opts.slides.length;
        var slideCSS = { display: vert ? 'block' : 'inline-block', position: 'relative' };

        // required styles
        opts.container.css({ position: 'relative', overflow: 'hidden' });
        opts.slides.css( slideCSS );

        opts._currSlide = opts.currSlide;

        // wrap slides in a div; this div is what is animated
        wrap = $('<div class="cycle-carousel-wrap"></div>')
            .prependTo( opts.container )
            .css({ margin: 0, padding: 0, top: 0, left: 0, position: 'absolute' })
            .append( opts.slides );

        opts._carouselWrap = wrap;

        if ( !vert )
            wrap.css('white-space', 'nowrap');

        if ( opts.allowWrap !== false ) {
            // prepend and append extra slides so we don't see any empty space when we
            // near the end of the carousel.  for fluid containers, add even more clones
            // so there is plenty to fill the screen
            // @todo: optimzie this based on slide sizes

            for ( j=0; j < (opts.carouselVisible === undefined ? 2 : 1); j++ ) {
                for ( i=0; i < opts.slideCount; i++ ) {
                    wrap.append( opts.slides[i].cloneNode(true) );
                }
                i = opts.slideCount;
                while ( i-- ) { // #160, #209
                    wrap.prepend( opts.slides[i].cloneNode(true) );
                }
            }

            wrap.find('.cycle-slide-active').removeClass('cycle-slide-active');
            opts.slides.eq(opts.startingSlide).addClass('cycle-slide-active');
        }

        if ( opts.pager && opts.allowWrap === false ) {
            // hide "extra" pagers
            /*pagerCutoffIndex = opts.slideCount - visCount;
            $( opts.pager ).children().filter( ':gt('+pagerCutoffIndex+')' ).hide();*/
        }

        opts._nextBoundry = opts.slideCount - opts.carouselVisible;

        this.prepareDimensions( opts );
    },

    prepareDimensions: function( opts ) {
        var dim, offset, pagerCutoffIndex, children;
        var vert = opts.carouselVertical;
        var visCount = opts.carouselVisible || opts.slides.length;

        if ( opts.carouselFluid && opts.carouselVisible ) {
            if ( ! opts._carouselResizeThrottle ) {
            // fluid container AND fluid slides; slides need to be resized to fit container
                this.fluidSlides( opts );
            }
        }
        else if ( opts.carouselVisible && opts.carouselSlideDimension ) {
            dim = visCount * opts.carouselSlideDimension;
            opts.container[ vert ? 'height' : 'width' ]( dim );
        }
        else if ( opts.carouselVisible ) {
            dim = visCount * $(opts.slides[0])[vert ? 'outerHeight' : 'outerWidth'](true);
            opts.container[ vert ? 'height' : 'width' ]( dim );
        }
        // else {
        //     // fluid; don't size the container
        // }

        offset = ( opts.carouselOffset || 0 );
        if ( opts.allowWrap !== false ) {
            if ( opts.carouselSlideDimension ) {
                offset -= ( (opts.slideCount + opts.currSlide) * opts.carouselSlideDimension );
            } else {
                // calculate offset based on actual slide dimensions
                offset = 0;
                children = opts._carouselWrap.children();

                for (var j=0; j < (opts.slideCount*(opts.carouselVisible === undefined ? 2 : 1) + opts.currSlide); j++) {
                    offset -= $(children[j])[vert?'outerHeight':'outerWidth'](true);
                }

                offset += opts.container[vert ? 'height' : 'width']() / 2;
                offset -= opts.slides.eq(opts.startingSlide)[vert ? 'outerHeight' : 'outerWidth'](true) / 2;
            }
        }

        opts._carouselWrap.css( vert ? 'top' : 'left', offset );
    },

    fluidSlides: function( opts ) {
        var timeout;
        var slide = opts.slides.eq(0);
        var adjustment = slide.outerWidth() - slide.width();
        var prepareDimensions = this.prepareDimensions;

        // throttle resize event
        $(window).on( 'resize', resizeThrottle);

        opts._carouselResizeThrottle = resizeThrottle;
        onResize();

        function resizeThrottle() {
            clearTimeout( timeout );
            timeout = setTimeout( onResize, 20 );
        }

        function onResize() {
            opts._carouselWrap.stop( false, true );
            var slideWidth = opts.container.width() / opts.carouselVisible;
            slideWidth = Math.ceil( slideWidth - adjustment );
            opts._carouselWrap.children().width( slideWidth );
            if ( opts._sentinel )
                opts._sentinel.width( slideWidth );
            prepareDimensions( opts );
        }
    },

    // transition API impl
    transition: function( opts, curr, next, fwd, callback ) {
	    var moveBy, props = {};
        var hops = opts.nextSlide - opts.currSlide;
        var vert = opts.carouselVertical;
        var speed = opts.speed;

        // handle all the edge cases for wrapping & non-wrapping
        if ( opts.allowWrap === false ) {
            fwd = hops > 0;
            var currSlide = opts._currSlide;
            var maxCurr = opts.slideCount - opts.carouselVisible;
            if ( hops > 0 && opts.nextSlide > maxCurr && currSlide == maxCurr ) {
                hops = 0;
            }
            else if ( hops > 0 && opts.nextSlide > maxCurr ) {
                hops = opts.nextSlide - currSlide - (opts.nextSlide - maxCurr);
            }
            else if ( hops < 0 && opts.currSlide > maxCurr && opts.nextSlide > maxCurr ) {
                hops = 0;
            }
            else if ( hops < 0 && opts.currSlide > maxCurr ) {
                hops += opts.currSlide - maxCurr;
            }
            else
                currSlide = opts.currSlide;

            moveBy = this.getScroll( opts, vert, currSlide, hops );
            opts.API.opts()._currSlide = opts.nextSlide > maxCurr ? maxCurr : opts.nextSlide;
        }
        else {
	        var forwardTravelDistance = opts.nextSlide - opts.currSlide;
	        if (forwardTravelDistance < 0){
		        forwardTravelDistance = opts.slideCount + forwardTravelDistance;
	        }
	        var backTravelDistance = opts.slideCount - forwardTravelDistance;

	        fwd = forwardTravelDistance < backTravelDistance;
	        if (fwd) {
		        hops = forwardTravelDistance;
	        } else {
		        hops = -backTravelDistance;
	        }

	        if (opts.hardHops){
		        hops = opts.hardHops;
		        opts.API.opts().hardHops = 0;
		        fwd = hops > 0
	        }
	        var dest = opts.currSlide + hops;
	        if ( dest >= opts.slideCount || dest < 0) {
		        callback = this.genCallback( opts, fwd, vert, callback );
	        }
	        moveBy = this.getScroll( opts, vert, opts.currSlide, hops );
        }

//	      console.log(moveBy, 'move', fwd?'forward':'back', hops, opts.currSlide, opts.nextSlide);

        props[ vert ? 'top' : 'left' ] = fwd ? ( "-=" + moveBy ) : ( "+=" + moveBy );

        // throttleSpeed means to scroll slides at a constant rate, rather than
        // a constant speed
        if ( opts.throttleSpeed )
            speed = (moveBy / $(opts.slides[0])[vert ? 'height' : 'width']() ) * opts.speed;

        opts._carouselWrap.animate( props, speed, opts.easing, callback );
    },

    getDim: function( opts, index, vert ) {
//	      console.log('intro', index);
		    if (index < 0){
			    index = opts.slideCount - Math.abs(index % opts.slideCount);
		    } else if (index >= opts.slideCount){
			    index = (index % opts.slideCount);
		    }
	      var slide = $( opts.slides[index] );
//	      console.log(index, slide[ vert ? 'outerHeight' : 'outerWidth'](true));
        return slide[ vert ? 'outerHeight' : 'outerWidth'](true);
    },

    moveByReminder: 0,
    getScroll: function( opts, vert, currSlide, hops ) {
        var i, moveBy = 0;

        if (hops > 0) {
            for (i=currSlide; i < currSlide+hops; i++) {
                moveBy += this.getDim( opts, i, vert)/2+this.getDim( opts, i+1, vert)/2;
            }
        }
        else {
            for (i=currSlide; i > currSlide+hops; i--){
                moveBy += this.getDim( opts, i, vert)/2+this.getDim( opts, i-1, vert)/2;
            }
        }

        moveBy += this.moveByReminder;
        this.moveByReminder = moveBy % 1;
        moveBy = Math.floor(moveBy);

        return moveBy;
    },

    genCallback: function( opts, fwd, vert, callback ) {
        // returns callback fn that resets the left/top wrap position to the "real" slides
        return function() {

	        var initialOffset = opts._carouselWrap.position().left;
            var offset = 0;

	        var tmp = opts._carouselWrap.children();
	        for (var j=0; j < opts.slideCount; j++) {
		        offset += $(tmp[j])[vert?'outerHeight':'outerWidth'](true);
	        }

            if(fwd)
            {
                offset = initialOffset + offset;
            }
            else
            {
                offset = initialOffset - offset;
            }

            opts._carouselWrap.css( opts.carouselVertical ? 'top' : 'left', offset );
            callback();
        };
    },

    // core API override
    stopTransition: function() {
        var opts = this.opts();
        opts.slides.stop( false, true );
        opts._carouselWrap.stop( false, true );
    },

    // core API supplement
    onDestroy: function( e ) {
        var opts = this.opts();
        if ( opts._carouselResizeThrottle )
            $( window ).off( 'resize', opts._carouselResizeThrottle );
        opts.slides.prependTo( opts.container );
        opts._carouselWrap.remove();
    }
};

})(jQuery);
