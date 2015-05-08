/**
 * Ripple animation buttons
 * based on
 * http://thecodeplayer.com/walkthrough/ripple-click-effect-google-material-design
 *
 * for `spree_single_page_checkout` v.2
 * @author Alto Labs [hi@altolabs.co]
 */

$(function() {
  $('.spc-ripple-btn').click(function(e) {
    e.preventDefault();

    var buttonEl = $(this);
    // Break code execution if it has the 'disabled' class.
    if (buttonEl.hasClass('spc-disabled')) {
      return false;
    }

    // Get the ink element
    var ink = buttonEl.find('.spc-ink');
    
    // if the ink elements isn;t there, create it.
    if (ink.length === 0) {
      var inkEl = document.createElement('span');
      inkEl.setAttribute('class', 'spc-ink');

      buttonEl.prepend(inkEl);
      ink = $(inkEl);
    }

    // in case of quick double clicks stop the previous animation
    ink.removeClass('ripple');
    
    // set size of .ink
    if(!ink.height() && !ink.width()) {
      // use parent's width or height whichever is larger for the diameter to
      // make a circle which can cover the entire element.
      d = Math.max(buttonEl.outerWidth(), buttonEl.outerHeight());
      ink.css({height: d, width: d});
    }
    
    // get click coordinates
    // logic = click coordinates relative to page - parent's position relative to page - half of self height/width to make it controllable from the center;
    x = e.pageX - buttonEl.offset().left - ink.width()/2;
    y = e.pageY - buttonEl.offset().top - ink.height()/2;
    
    //set the position and add class .animate
    ink.css({top: y+'px', left: x+'px'}).addClass("ripple");
  });
});
