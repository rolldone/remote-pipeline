export default function (req) {
  if (req.session.user) {
    return req.session.user;
  }
  // if token jwt more condition at below
}