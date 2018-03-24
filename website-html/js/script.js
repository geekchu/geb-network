icoConfig = icoConfig || {
        dueDate: Date.UTC(2018, 1, 5, 8, 0)
    };

$(document).ready(function () {

    var showWhenOffset;
    setShowWhenOffset();
    $(window).resize(setShowWhenOffset);

    var navBar = new NavBar();
    var timer = new Timer($('.counter'), icoConfig.dueDate);

    initLightbox();
    initSlickSchemas();
    initParallax();
    initSmoothScroll();
    initRoadmap();
    initSlickVideos();

    initCalendarEvents();

    initWhitepaperEvents();

    /* animation activator and navbar fixer */
    var scrollAnimatedElements = $('.scroll-animate'); // define scroll animated selectors
    updateScrollAnimatedElements();
    $(window).scroll(updateScrollAnimatedElements).resize(updateScrollAnimatedElements);

    $('[data-toggle="tooltip"]').tooltip();

    function isSafari() {
        return navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
    }

    function Timer($counter, toDate) {
        var end = new Date(toDate);
        var _second = 1000;
        var _minute = _second * 60;
        var _hour = _minute * 60;
        var _day = _hour * 24;
        var timer;

        var isRunning = false;

        this.setDate = setDate;
        this.start = start;
        this.stop = stop;

        var box = $counter,
            $dd = box.find('.days .counter-digit span'),
            $hh = box.find('.hours .counter-digit span'),
            $mm = box.find('.mins .counter-digit span'),
            $ss = box.find('.sec .counter-digit span');

        start();

        function start() {
            timer = setInterval(showRemaining, 1000);
            showRemaining();
            isRunning = true;
        }

        function stop() {
            clearInterval(timer);
            setText('--', '--', '--', '--');
            isRunning = false;
        }

        function showRemaining() {
            var now = new Date();
            var distance = end - now;
            if (distance <= 0) {
                stop();
                return;
            }
            var days = Math.floor(distance / _day);
            var hours = Math.floor((distance % _day) / _hour);
            var minutes = Math.floor((distance % _hour) / _minute);
            var seconds = Math.floor((distance % _minute) / _second);

            setText(twoDigit(days), twoDigit(hours), twoDigit(minutes), twoDigit(seconds));
        }

        function setText(dd, hh, mm, ss) {
            $dd.text(dd);
            $hh.text(hh);
            $mm.text(mm);
            $ss.text(ss);
        }

        function twoDigit(i) {
            return i < 10 ? '0' + i : i
        }

        function setDate(newDate) {
            end = new Date(newDate);
            if (!isRunning) start();
        }
    }

    function updateScrollAnimatedElements() {
        navBar.fix();
        nowondisplay(scrollAnimatedElements);
    }

    function setShowWhenOffset() {
        showWhenOffset = window.innerWidth > 768 ? 40 : 100;
    }

    function nowondisplay(elements) {
        $(elements).each(function (index) {
            if ($(window).height() - ($(this).offset().top - $(window).scrollTop()) > showWhenOffset) {
                $(this).addClass('onscreen');
            }
        });
    }

    function smoothScrollToAnchor() {
        elementClick = $(this).attr("href");
        destination = Math.max(0, $(elementClick).offset().top - $('.navbar').innerHeight() - $(window).innerHeight() / 8);

        navBar.hide();

        if (isSafari()) {
            $('body').animate({scrollTop: destination}, 1100);
        } else {
            $('html').animate({scrollTop: destination}, 1100);
        }
        return false;
    }

    function NavBar() {
        var nb = this;

        nb.$ = $('.navbar');
        nb.show = show;
        nb.hide = hide;
        nb.toggle = toggle;
        nb.fix = fixnav;

        $(window).resize(function () {
            if (window.innerWidth > 576) hide();
        });

        $('.menu-toggle').on('click', function() { toggle() });

        function show() { toggle(true); }
        function hide() { toggle(false); }
        function toggle(state) {
            if (typeof state === "undefined") {
                nb.$.toggleClass('navbar-expanded');
                $('body').toggleClass('modal-open', nb.$.hasClass('navbar-expanded'));
            } else {
                nb.$.toggleClass('navbar-expanded', !!state);
                $('body').toggleClass('modal-open', !!state);
            }
        }
        function fixnav() {
            var fixNavOffset = 150;
            nb.$.toggleClass('navbar-fixed-top', $(window).scrollTop() >= fixNavOffset);
        }
    }

    function initLightbox() {
        // lightbox for bootstrap
        $(document).on('click', '[data-toggle="lightbox"]', function(event) {
            event.preventDefault();
            $(this).ekkoLightbox();
        });
    }

    function initSlickSchemas() {
        $('.slick-schemas').slick({
            dots: true,
            infinite: true,
            speed: 300,
            slidesToShow: 1,
            arrows: false,
            adaptiveHeight: true
        });
    }

    function initParallax() {
        $('.scene').each(function(i, el) {
            var parallaxInstance = new Parallax(el);
        });
    }

    function initSmoothScroll() {
        /* smooth scrolling to anchor */
        $('a[href^="#"]').not('.card-header').not('.dropdown-item').click(smoothScrollToAnchor);
    }

    function initRoadmap() {
        var $li = $('#roadmap .carousel-indicators li');
        var $slick = $('.roadmap-slick');

        $slick.slick({
            dots: false,
            infinite: true,
            speed: 450,
            slidesToShow: 1,
            arrows: false,
            adaptiveHeight: true,
            initialSlide: $li.filter('.active').data('slide-to') //get number of starter slide
        });

        $li.click(function(e) {
            var slideno = $(this).data('slide-to');
            $slick.slick('slickGoTo', slideno);
        });
        $slick.on('beforeChange', function(event, slick, currentSlide, nextSlide){
            $li.eq(currentSlide).removeClass('active');
            $li.eq(nextSlide).addClass('active');
        });
    }

    function initSlickVideos() {
        var videosCount = $('.slick-videos .video-slide').length;
        $('.slick-videos').slick({
            dots: videosCount > 2,
            infinite: true,
            speed: 300,
            slidesToShow: 2,
            slidesToScroll: 2,
            arrows: false,
            adaptiveHeight: true,
            responsive: [{
                breakpoint: 992,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                    dots: videosCount > 2
                }},
                {
                    breakpoint: 600,
                    settings: {
                        slidesToShow: 1,
                        slidesToScroll: 1,
                        dots: videosCount > 1
                    }
                }]
        });
        $('.lazyYT').lazyYT();
    }

    function initCalendarEvents() {
        var $cal = $('.addeventatc');
        $cal.on('click', function() {
            dataLayer.push({'event': 'add_to_calendar'});
            yaCounter46295010.reachGoal('ya_add_to_calendar');
            fbq('track', 'fb_add_to_calendar');
        });

        $cal.on('click', '[role=menuitem]', function() {
            dataLayer.push({'event': 'select_calendar'});
            yaCounter46295010.reachGoal('ya_select_calendar');
            fbq('track', 'fb_select_calendar');
        });
    }

    function initWhitepaperEvents() {
        var $wp = $('#whitepaper').find('.wp-lang');
        $wp.on('click', function() {
            dataLayer.push({'event': 'download_whitepaper'});
            yaCounter46295010.reachGoal('ya_download_whitepaper');
            fbq('track', 'fb_download_whitepaper');
        });
    }
});
