import { decode } from 'html-entities';
import mustache from 'mustache';

const MustacheRender = (contentString, propsData) => {
  let resultHtml = mustache.render(contentString + "\r", propsData);
  return decode(resultHtml);
}

export default MustacheRender; 