import { isEmpty } from "lodash";
import rr from "sql-bricks";
import { SelectStatement, UpdateStatement, SqlBricksFn, InsertStatement } from "./sql-bricks";

var Delete = rr.delete;
var Update: UpdateStatement = rr.update as any;
var Insert: InsertStatement = rr.insert as any;
var Select: SelectStatement = rr.select as any;
// Insert & Update OR clauses (SQLite dialect)

Insert.defineClause(
  'or',
  function (this, opts) {
    let _or = this._or;
    if (_or != null)
      return `OR ${this._or}`;
  },
  { after: 'insert' }
);

Update.defineClause(
  'or',
  function (this, opts) {
    if (this._or != null)
      return `OR ${this._or}`;
  },
  { after: 'update' }
);

var or_methods = {
  'orReplace': 'REPLACE', 'orRollback': 'ROLLBACK',
  'orAbort': 'ABORT', 'orFail': 'FAIL'
};

Object.keys(or_methods).forEach(function (method) {
  Insert.prototype[method] = Update.prototype[method] = function () {
    this._or = or_methods[method]; return this;
  };
});

// // TODO: shouldn't LIMIT/OFFSET use handleValue()? Otherwise isn't it vulnerable to SQL Injection?
Select.prototype.limit = function () {
  // this._limit = val;
  return this._addListArgs(arguments, '_limit');
};

Select.prototype.offset = function (val) {
  this._offset = val;
  return this;
};

// If get duplicate on toString disble this
Select.defineClause('limit', function (this, opts) {
  // console.log("this._limit :: ", this._limit)
  // console.log("opts :: ", opts);
  if (this._limit != null) {
    return "LIMIT " + this._limit;
  }
},
  { after: 'orderBy' }
);

// If get duplicate on toString disble this
Select.defineClause('offset', function (this, opts) {
  if (this._offset != null) {
    return "OFFSET " + this._offset;
  }
},
  {
    after: 'limit'
  }
);


const Sqlbricks: SqlBricksFn = rr as any;

export default Sqlbricks;
