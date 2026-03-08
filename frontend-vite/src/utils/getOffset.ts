export default function getOffset(el: HTMLElement): {
  top: number;
  left: number;
  offsetHeight: number;
  offsetTop: number;
  offsetWidth: number;
} {
  const rect = el.getBoundingClientRect();
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return {
    top: Math.ceil(rect.top + scrollTop),
    left: Math.ceil(rect.left + scrollLeft),
    offsetHeight: Math.ceil(el.offsetHeight),
    offsetTop: Math.ceil(el.offsetTop),
    offsetWidth: Math.ceil(el.offsetWidth),
  };
}
