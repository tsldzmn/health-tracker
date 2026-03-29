const admin = async (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
};

module.exports = admin;
