const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'bcar-development-secret-change-me', {
    expiresIn: '8h',
  });
};

module.exports = generateToken;
