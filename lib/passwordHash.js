const bcrypt = require('bcrypt');

module.exports = {
 passwordHash(password){
    return bcrypt.hash(password, 10); 
  },
 passwordVerify(password1,password2){
    return bcrypt.compare(password1,password2); 
  }
}
