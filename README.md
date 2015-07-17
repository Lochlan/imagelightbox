# Responsive and Touch‑Friendly

This is a fork of [the lightbox plugin created by Osvaldas Valutis](http://osvaldas.info/image-lightbox-responsive-touch-friendly).  The goal is to refactor it into something more modular and readable with improved code quality.

It requires [jQuery](http://jquery.com/) 1.11 or newer (earlier versions might work too).

## Usage

````HTML
<a href="http://lochlan.github.io/imagelightbox/demo/images/1.jpg" data-imagelightbox="b">
    <img src="http://lochlan.github.io/imagelightbox/demo/images/thumbnails/1.jpg" alt="Klaipeda in the night">
</a>

<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script>
<script src="imagelightbox.js"></script>
<script>
    $(function () {
        // initialize gallery
        var gallery = $('a[data-imagelightbox="mygallery"]').imageLightbox();
    });
</script>
````

You can also trigger the lightbox manually wit the `startImageLightbox` method.  Take a look at [the demo page](https://lochlan.github.io/imagelightbox/demo/demo.html) for examples, or view [the source code](https://github.com/Lochlan/imagelightbox/blob/master/src/imagelightbox.js) to see all publicly-accessible methods.

## Options

Options can be configured at initialization.  Options available and their default values are:

````JavaScript
$('a[data-imagelightbox="mygallery"]').imageLightbox({
    selector: 'id="imagelightbox"', // id of the lightbox itself
    allowedTypes: 'png|jpg|jpeg|gif',
    animationSpeed: 250, // in milliseconds
    preloadNext: true, // silently preload the next image
    enableKeyboard: true, // enable keyboard shortcuts (arrows Left/Right and Esc)
    quitOnEnd: false, // quit after viewing the last image
    quitOnImgClick: false, //quit when the viewed image is clicked
    quitOnDocClick: true, // quit when anything but the viewed image is clicked
    quitOnEscKey: true, // quit when Esc key is pressed
    // custom callbacks
    onStart: undefined, // fired when lightbox opens
    onLoadStart: undefined, // fired a new image starts to load (after onStart)
    onLoadEnd: undefined, // fired after a new image has loaded
    onEnd: undefined, // fired when lightbox closes
});
````
