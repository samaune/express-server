import bcrypt from 'bcryptjs';

export default {
  insert: async (req, res) => {
    var user = req.body;
    user.hashedPassword = bcrypt.hashSync(payload.password, 10);
    delete user.password;
    res.json(user);
  },
  register: async (req, res, next) => {
    let user = req.body;
    user.hashedPassword = bcrypt.hashSync(payload.password, 10);
    delete user.password;
    req.user = user;
    next();
  },
} 
