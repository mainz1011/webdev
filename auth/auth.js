const http = require('http');

/**
 * Get current user based on the request headers
 *
 * @param {http.IncomingMessage} request incomming request message
 * @returns {object|null} current authenticated user or null if not yet authenticated
 */
const { getCredentials } = require('../utils/requestUtils');
const {getUser} = require('../utils/users');
const User = require('../models/user');
const getCurrentUser = async request => {
  // TODO: 8.5 Implement getting current user based on the "Authorization" request header

  // NOTE: You can import two methods which can be useful here: //
  // - getCredentials(request) function from utils/requestUtils.js
  // - getUser(email, password) function from utils/users.js 
  // to get the currently logged in user
  const credentials = getCredentials(request);
   if(!credentials){
     return null;
   }

  try{
    const currentUser = await User.findOne({ email: credentials[0] }).exec();
    const passwordCheck = await currentUser.checkPassword(credentials[1]);
    return passwordCheck ? currentUser : null;
  }
  catch(error){
      return null;
  }
  // throw new Error('Not Implemented');
};

module.exports = { getCurrentUser };