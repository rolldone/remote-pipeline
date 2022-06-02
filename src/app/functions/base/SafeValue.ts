const SafeValue = (val, alternateVal) => {
  if (val == null || val == undefined) {
    return alternateVal;
  }
  return val;
}

export default SafeValue;