const BoolearParse = (val) => {
  try {
    return JSON.parse(val);
  } catch (ex) {
    throw new Error("This variable not contain boolean text or real value");
  }
}

export default BoolearParse;