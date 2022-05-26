import { decode } from 'html-entities';
import mustache from 'mustache';

const MustacheRender = (contentString, propsData) => {
  if (contentString == null) return null;
  // let resultHtml = mustache.render(contentString + "\r", propsData);
  let resultHtml = mustache.render(contentString, propsData);
  return decode(resultHtml);
}

export default MustacheRender; 