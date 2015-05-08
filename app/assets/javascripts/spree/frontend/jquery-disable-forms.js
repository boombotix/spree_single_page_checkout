/**
 * Simple jQuery Plugin for disabling form fields.
 * @author Evan Pavlica [evan@altolabs.co]
 */
(function($){
  $.fn.disableForm = function() {
    this.find('input, select').attr('disabled', true);
    return this;
  };

  $.fn.enableForm = function() {
    this.find('input, select').removeAttr('disabled');
    return this;
  };
}(jQuery));
