import SafeValue from "./SafeValue";

const StoreValue = {
  get: (req, key: string, alternateVal?: string) => {
    if (req.headers.authorization) {
      // Use redis maybe
      return;
    }
    return SafeValue(req.session[key], alternateVal);
  },
  set: (req: any, key: string, val: any) => {
    if (req.headers.authorization) {
      // Use redis maybe
      return;
    }
    if (req.session[key] == null) {
      req.session[key] = val;
    }
  }
}

export default StoreValue;