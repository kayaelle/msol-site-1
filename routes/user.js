const _ = require('underscore');
const Issuer = require('../models/issuer');
const User = require('../models/user');
const BadgeInstance = require('../models/badge-instance');
const env = require('../lib/environment');
const persona = require('../lib/persona');
const util = require('../lib/util');
const async = require('async');
const logger = require('../lib/logger');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const FORBIDDEN_MSG = 'You must be an admin to access this page';

function getAccessLevel(email, callback) {
  if (env.isAdmin(email))
    return process.nextTick(callback.bind({}, null, [email, 'super']));
  return Issuer.findByAccess(email, function (err, issuers) {
    if (err) return callback(err);
    if (!issuers.length) return callback(null, [email, null]);
    return callback(null, [email, 'issuer']);
  });
}

exports.login = function login(req, res, next) {
  const paths = {
    super: '/admin',
    issuer: '/issuer',
  };
  const assertion = req.body.assertion;
  async.waterfall([
    persona.verify.bind({}, assertion),
    getAccessLevel,
  ], function (err, result) {
    if (err) return next(err);
    // my kingdom for destructuring!
    const email = result[0];
    const access = result[1];
    if (!access)
      return res.send(403, FORBIDDEN_MSG);
    req.session.user = email;
    req.session.access = access;
    return res.redirect(paths[access]);
  });
};

exports.logout = function logout(req, res) {
  req.session.destroy(function () {
    return res.redirect('/');
  });
};

exports.signup = function signup(req,res,next) {
  var email = req.body.email;
  var password = req.body.password;
  var name = req.body.name;
  var createHash = function(password){
   return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
  }  
  User.findOne({ 'user' :  email }, function(err, user) {
    if (err) {
      logger.warn("User.findOne "+err);
      return next(err);
    }
    if (user)
    return res.redirect('/'); 
    
    var newUser = new User();
    newUser.user = email;
    newUser.password = createHash(password);
    newUser.name = req.body.name;
    newUser.save(function(err) {
      if (err)
        return done(err);  
      req.session.user = newUser;
      getAccessLevel
      return res.redirect('/my-badges');
    });
  });
}

exports.deleteInstancesByEmail = function deleteInstancesByEmail(req, res, next) {
  var form = req.body;
  var email = form.email;
  BadgeInstance.deleteAllByUser(email, function (err, instances) {
    if (err) return next(err);
    return res.redirect('back');
  });
};

exports.requireAuth = function requireAuth(options) {
  const whitelist = util.whitelist(options.whitelist);
  const authLevel = options.level || 'super';
  return function (req, res, next) {
    const path = req.path;
    const user = req.session.user;
    const userLevel = req.session.access;
    if (whitelist.exempt(path) || userLevel == 'super')
      return next();
    if (!user)
      return res.redirect(options.redirectTo + '?path=' + path);
    if (userLevel != authLevel)
      return res.send(403, FORBIDDEN_MSG);
    return next();
  };
};

function getElem(key) {
  return function (obj) { return obj[key] };
}

exports.findAll = function findAll(options) {
  return function (req, res, next) {
    BadgeInstance.find(function (err, instances) {
      if (err) return next(err);
      var users = instances.reduce(function (users, instance) {
        var user = users[instance.user];
        if (user)
          user.push(instance);
        else
          users[instance.user] = [instance];
        return users;
      }, {});
      req.users = Object.keys(users).map(function (email) {
        var instances = users[email];
        return {
          email: email,
          badges: instances.map(getElem('badge'))
        };
      });
      return next();
    });
  };
};

exports.retrieveUser = function retrieveUser() {
  return function (req, res, next) {
    var badge = req.badge;
    var reservedInstance = _.findWhere(badge.claimCodes, {code: req.params.claimCode});
    var email = reservedInstance.reservedFor;
    User.findOne({user:email}, function(err,user){
      if (user) {
        req.existingUser = user;
        return next();
      }
      else {
        req.newEarnerEmail = email;
        return next();
      }
    });
  };
};
