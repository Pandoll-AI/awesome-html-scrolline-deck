/** Internal DOM helpers shared by C4 beat renderers. */
export function node(rc, tag, cls, parent, text) {
  if (rc.el) return rc.el(tag, cls, parent, text);
  const value = document.createElement(tag);
  if (cls) value.className = cls;
  if (text != null) value.textContent = text;
  parent?.append(value);
  return value;
}

export function root(type, rc) {
  return node(rc, 'section', `sl-beat sl-beat--${type}`);
}

export function add(parts, name, element) {
  (parts[name] ??= []).push(element);
  element.dataset.part = name;
  return element;
}

export function asset(rc, path) {
  return rc.asset ? rc.asset(path) : path;
}

export function textWords(rc, parent, text, parts) {
  const values = rc.words
    ? rc.words(parent, text)
    : String(text)
        .split(/(\s+)/)
        .filter(Boolean)
        .filter((v) => !/^\s+$/.test(v))
        .map((word) => node(rc, 'span', 'sl-word', parent, word));
  values.forEach((value) => add(parts, 'word', value));
  return values;
}

export function textChars(rc, parent, text, parts) {
  const values = rc.chars
    ? rc.chars(parent, text)
    : Array.from(String(text)).map((char) => node(rc, 'span', 'sl-char', parent, char));
  values.forEach((value) => add(parts, 'char', value));
  return values;
}
