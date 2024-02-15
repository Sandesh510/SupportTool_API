const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(403).send("Token is missing");
  }

  jwt.verify(token, process.env.SECRET, (err, user) => {
    if (err) {
      return res.status(401).send("Invalid token");
    }

    req.user = user;
    next();
  });
};
module.exports = verifyToken;
