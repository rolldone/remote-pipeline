import BaseProto from './BaseProto';
const { serializeError, deserializeError } = require('serialize-error');

const BaseController = BaseProto.extend<BaseControllerInterface>({
  binding(...props: any) {
    let self: any = this;
    try {
      self = BaseProto.create.call(self, ...props);
      for (var key in self) {
        switch (Object.prototype.toString.call(self[key])) {
          case '[object String]':
          case '[object Number]':
          case '[object Object]':
          case '[object Boolean]':
          case '[object Null]':
            break;
          default:
            self[key] = self[key].bind(self);
            break;
        }
      }
      return self;
    } catch (ex) {
      console.error('----------------------------------------------------------------------------------------------------------');
      console.error('Donny! You get error.binding_controller', '=>', 'Maybe you want binding, but this method "' + key + '" is not a function!');
      console.error('----------------------------------------------------------------------------------------------------------');
      console.error(ex);
    }
  },
  getBaseQuery(req) {
    let test = req.query;
    test.filter = JSON.parse(req.query.filter || 'false');
    test.group_by = req.query.group_by || null;
    test.search = req.query.search || '';
    test.take = req.query.take || 100;
    test.page = req.query.page || 1;
    return test
  }
});

export default BaseController;