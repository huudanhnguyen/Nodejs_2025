const jwt = require('jsonwebtoken');
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '3d',
    }
  );
};
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id }, 
        process.env.JWT_REFRESH_SECRET, 
        { expiresIn: '7d' }
    );
};

module.exports = { generateToken, generateRefreshToken };