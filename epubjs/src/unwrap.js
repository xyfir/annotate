/**
 * Unwrap elements with the provided class name.
 * @param {Document} doc
 * @param {string} className
 */
export default function(doc, className) {

  doc.querySelectorAll('.' + className).forEach(el => {
    const parent = el.parentElement;

    parent.insertBefore(el.firstChild, el);
    el.remove();
  });

}