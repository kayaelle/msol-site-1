const Issuer = require('../models/issuer');
const Program = require('../models/program');
const Badge = require('../models/badge');
const phrases = require('../lib/phrases');
const logger = require('../lib/logger');
const async = require('async');
const _ = require('underscore');
const phantom = require('phantom');
const fs = require('fs');

/*
 * Administrative Pages
 */

exports.issuerIndex = function (req, res) {
  return res.render('admin/issuer-index.html', {
    title: "Issue Badges",
    page: 'issuer-index',
    badges: req.badges,
    user: req.session.user,
    access: req.session.access,
    csrf: req.session._csrf
  });
};

exports.issueBadge = function (req, res) {
  return res.render('admin/issue-badge.html', {
    title: "Issue Badge",
    page: 'issue-badge',
    badge: req.badge,
    results: req.flash('results').pop(),
    user: req.session.user,
    access: req.session.access,
    csrf: req.session._csrf
  });
};

exports.login = function (req, res) {
  if (req.session.user)
    res.redirect('/my-badges');
  return res.render('public/login.html', {
    page: 'login',
    badge: req.badge,
    errors: req.flash('errors'),
    userErr: req.flash('userErr'),
    loginErr: req.flash('loginErr'),
    email: req.flash('email'),
    csrf: req.session._csrf
  });
};

exports.forgotPw = function (req, res) {
  return res.render('public/forgot-pw.html', {
    userErr: req.flash('userErr'),
    errors: req.flash('errors'),
    success: req.flash('success'),
    expiredErr: req.flash('expired'),
    csrf: req.session._csrf
  });
}

exports.resetPw = function (req, res) {

  if (req.flash('notFound').length) {
    res.status(404);
    return res.render('public/404.html', {});
  }
  
  if (req.flash('expired').length) {
    return res.render('public/forgot-pw.html', {
      userErr: req.flash('userErr'),
      expiredErr: "The password reset link has expired.",
      errors: req.flash('errors'),
      success: req.flash('success'),
      csrf: req.session._csrf
    });
  }
  
  return res.render('public/reset-pw.html', {
    userErr: req.flash('userErr'),
    errors: req.flash('errors'),
    uniqueId: req.uniqueId,
    csrf: req.session._csrf
  });
}

exports.contactUs = function (req, res, next) {
  return res.render('public/contact-us.html', {
    page: 'contact',
    title: "Contact Us",
    success: req.flash('success'),
    errors: req.flash('errors'),
    user: req.session.user,
    access: req.session.access,
    csrf: req.session._csrf
  });
}


exports.newBadgeForm = function (req, res) {
  return res.render('admin/create-or-edit-badge.html', {
    page: 'new-badge',
    badge: new Badge,
    issuers: req.issuers,
    user: req.session.user,
    access: req.session.access,
    csrf: req.session._csrf,
  });
};

exports.editBadgeForm = function (req, res) {
  return res.render('admin/create-or-edit-badge.html', {
    page: 'edit-badge',
    title: "Create or Edit Badge",
    editing: true,
    badge: req.badge,
    issuers: req.issuers,
    user: req.session.user,
    access: req.session.access,
    csrf: req.session._csrf,
  });
};

exports.newIssuerForm = function (req, res) {
  return res.render('admin/create-or-edit-issuer.html', {
    title: "Create Issuer",
    page: 'new-issuer',
    issuer: new Issuer,
    user: req.session.user,
    access: req.session.access,
    csrf: req.session._csrf,
  });
};

exports.newProgramForm = function (req, res) {
  return res.render('admin/create-or-edit-program.html', {
    title: "Create Program",
    page: 'new-program',
    program: new Program,
    user: req.session.user,
    access: req.session.access,
    csrf: req.session._csrf,
  });
};

exports.editProgramForm = function (req, res) {
  return res.render('admin/create-or-edit-program.html', {
    title: "Edit Program",
    page: 'edit-program',
    editing: true,
    program:  req.program,
    issuers: req.issuers,
    user: req.session.user,
    access: req.session.access,
    csrf: req.session._csrf,
  });
};

exports.editIssuerForm = function (req, res) {
  return res.render('admin/create-or-edit-issuer.html', {
    title: "Edit Issuers",
    page: 'edit-issuer',
    editing: true,
    issuer: req.issuer,
    user: req.session.user,
    access: req.session.access,
    csrf: req.session._csrf,
  });
};

exports.newBehaviorForm = function (req, res) {
  return res.render('admin/new-behavior.html', {
    page: 'new-behavior',
    user: req.session.user,
    access: req.session.access,
    csrf: req.session._csrf,
    badgeShortName: req.query['for']
  });
};

exports.badgeIndex = function (req, res) {
  // get the count of issued badges for each badge
  async.map(req.badges,
    function(badge, callback) {
      badge.issuedBadgesCount(function(err, count) {
        badge.issuedCount = count;
        callback(err, badge);
      });
    },
    function (err, badges) {
      // get the total badge count
      var badgeCount = _.reduce(req.badges,
        function(memo, badge) {
          return memo + badge.issuedCount;
          }, 0);
          return res.render('admin/badge-index.html', {
            page: 'home',
            title: "Admin",
            limit: req.limit,
            pageNumber: req.page,
            search: req.query.search,
            issuers: req.issuers,
            user: req.session.user,
            access: req.session.access,
            csrf: req.session._csrf,
            badges: req.badges,
            badgeCount: badgeCount,
            undoRecords: req.undoRecords,
            behaviors: req.behaviors
          });
        });
};

exports.showBadge = function (req, res) {
  return res.render('admin/show-badge.html', {
    page: 'edit-badge',
    user: req.session.user,
    access: req.session.access,
    csrf: req.session._csrf,
    defaultBehavior: req.query['behavior'],
    badge: req.badge,
    behaviors: req.behaviors
  });
};

exports.criteria = function criteria(req, res) {
  return res.render('public/criteria.html', {
    badge: req.badge,
    user: req.session.user,
    csrf: req.session._csrf,
    access: req.session.access
  });
}

//Landing Page
exports.explore = function explore(req, res) {
  return res.render('public/explore.html', {
    title: "Explore",
    active: "explore",
    issuers: req.issuers,
    user: req.session.user,
    csrf: req.session._csrf,
    access: req.session.access
  });
};

exports.orgDetails = function orgDetails(req, res) {
  return res.render('public/org-details.html', {
    title: req.issuer.name,
    active: "explore",
    issuer: req.issuer,
    badges: req.badges,
    user: req.session.user,
    csrf: req.session._csrf,
    access: req.session.access
  });  
}

exports.badgeDetails = function badgeDetails(req, res) {
  return res.render('public/badge-details.html', {
    title: req.badge.name,
    active: "earn",
    issuer: req.issuer,
    badge: req.badge,
    programBadges: req.programBadges,
    similarBadges: req.similarBadges,
    user: req.session.user,
    csrf: req.session._csrf,
    access: req.session.access
  });  
}

exports.myBadge = function myBadge(req, res) {
  if (! req.session.user) {
    res.status(404);
    return res.render('public/404.html', {});
  }
  return res.render('public/badge-details-earned.html', {
    title: req.badge.name,
    active: "mybadges",
    issuer: req.issuer,
    badge: req.badge,
    claimCode: req.claim,
    programBadges: req.programBadges,
    similarBadges: req.similarBadges,
    user: req.session.user,
    csrf: req.session._csrf,
    access: req.session.access
  });  
};

exports.myBadgeToPdf = function myBadgeToPdf(req, res) {
  if (! req.session.user) {
    res.status(404);
    return res.render('public/404.html', {});
  }
  
  var html = req.nunjucks.render('public/badge-pdf.html', {
    title: req.badge.name,
    issuer: req.issuer,
    badge: req.badge,
    name: req.session.user.name,
    user: req.session.user,
    csrf: req.session._csrf,
    access: req.session.access
  });
  
  function setResponseHeaders(res, filename) {
    res.header('Content-disposition', 'inline; filename=' + pdffile);
    res.header('Content-type', 'application/pdf');
  }
    
  var pdffile = 'test.pdf';
  var file = "./tmp/"+pdffile;
  setResponseHeaders(res, pdffile);

  
  phantom.create(function (ph) {
    ph.createPage(function (page) {
      
      function dispatchPDF() {
        page.render(file, function() {
          fs.createReadStream(file).pipe(res);
          ph.exit();
          //return res.send();
          /* To do:
          - make pretty
          - file name = badge + earner
          - not always working...
          - remove file from tmp when done.
          - may redirect to another page for loading if its just slow...
        });
      };
          
      page.set('content', html);
      page.set('viewportSize', { width: 800, height: 600 });
      page.set('paperSize', { format: 'A4', orientation: 'portrait', border: '1cm' });
      page.set('onLoadFinished', dispatchPDF);
      
    });
  }); 
};

exports.earnList = function earnList(req, res) {
  return res.render('public/earn-list.html', {
    title: "Earn",
    active: "earn",
    sort: req.earnSort,
    badges: req.badges,
    badgesTagged: req.badgesTagged,
    badgesPrograms: req.badgesPrograms,
    user: req.session.user,
    csrf: req.session._csrf,
    access: req.session.access
  });
}

exports.about = function about(req, res) {
  return res.render('public/about.html', {
    title: "About",
    active: "about",
    user: req.session.user,
    csrf: req.session._csrf,
    access: req.session.access
  });
};

exports.faq = function faq(req, res) {
  return res.render('public/faq.html', {
    title: "FAQ",
    active: "faq",
    user: req.session.user,
    csrf: req.session._csrf,
    access: req.session.access
  });
};

exports.levelUp = function levelUp(req, res) {
  return res.render('public/level-up.html', {
    title: "Level Up",
    active: "levelup",
    user: req.session.user,
    csrf: req.session._csrf,
    access: req.session.access
  });
};


exports.privacy = function privacy(req, res) {
  return res.render('public/privacy-policy.html', {
    title: "Privacy Policy",
    active: "privacy",
    user: req.session.user,
    csrf: req.session._csrf,
    access: req.session.access
  });
};

exports.terms = function terms(req, res) {
  return res.render('public/terms.html', {
    title: "Terms of Use",
    active: "terms",
    user: req.session.user,
    csrf: req.session._csrf,
    access: req.session.access
  });
};

exports.myBadges = function myBadges(req, res) {
  if (! req.session.user) {
    res.status(404);
    return res.render('public/404.html', {});
  }
  
  if (req.params.editFunction == "edit-name") {
    req.flash('editName', 'true');
    return res.redirect(303, 'back');
  }
  
  if (req.params.editFunction == "cancel-edit-name") {
    req.flash('editName', 'false');
    return res.redirect(303, 'back');
  }
  
  if (req.params.editFunction == "edit-pw") {
    req.flash('editPw', 'true');
    return res.redirect(303, 'back');
  }
  
  if (req.params.editFunction == "cancel-edit-pw") {
    req.flash('editPw', 'false');
    return res.redirect(303, 'back');
  }
  
  return res.render('public/my-badges.html', {
    title: "My Badges",
    active: "mybadges",
    badges: req.badges,
    privatePage: req.flash('private page'),
    name: req.session.user.name,
    editName: req.flash('editName'),
    editPw: req.flash('editPw'),
    editPwSuccess: req.flash('editPwSuccess'),
    userErr: req.flash('userErr'),
    errors: req.flash('errors'),
    user: req.session.user,
    csrf: req.session._csrf,
    access: req.session.access
  });

};

exports.newUserClaim = function newUserClaim(req, res) { 
  if (req.existingUser) {
    res.redirect('/login');
  }
  else {
    return res.render('public/create-new-user.html', {
      title: "Create Account to Claim Your Badge",
      badge: req.badge,
      claimCode: req.claim,
      email: req.newEarnerEmail,
      errors: req.flash('errors'),
      name: req.flash('name'),
      active: "mybadges",
      csrf: req.session._csrf
    });
  }
};

exports.claim = function claim(req, res) {
  return res.render('public/claim.html', {
    csrf: req.session._csrf,
    code: req.query.code,
    missing: req.query.missing,
    user: req.session.user,
    access: req.session.access
  });
};

exports.confirmClaim = function confirmClaim(req, res) {
  return res.render('public/confirm-claim.html', {
    csrf: req.session._csrf,
    code: req.body.code,
    claim: req.claim,
    badge: req.badge,
    user: req.session.user,
    access: req.session.access
  });
};

exports.manageClaimCodes = function (req, res) {
  return res.render('admin/manage-claim-codes.html', {
    title: "Manage Claim Codes",
    page: 'edit-badge',
    user: req.session.user,
    access: req.session.access,
    csrf: req.session._csrf,
    badge: req.badge,
    codes: req.badge.claimCodes,
    exampleCode: phrases(1),
    access: req.session.access
  });
};

exports.getUnclaimedCodesHtml = function (req, res) {
  return res.render('admin/claim-code-printout.html', {
    title: "Print Claim Code",
    badge: req.badge,
    batchName: req.query.batchName,
    claimUrlText: process.env.OPENBADGER_CLAIM_URL_TEXT,
    claimCodes: req.badge.getClaimCodesForDistribution(req.query.batchName),
  });
};

exports.showFlushDbForm = function (req, res) {
  return res.render('admin/flush-user-info.html', {
    page: 'flush',
    user: req.session.user,
    access: req.session.access,
    csrf: req.session._csrf
  });
};

exports.userList = function userList(req, res, next) {
  return res.render('admin/user-list.html', {
    page: 'user-list',
    user: req.session.user,
    access: req.session.access,
    csrf: req.session._csrf,
    users: req.users
  });
};

exports.stats = function stats(req, res, next) {
  return res.render('admin/stats.html', {
    page: 'stats',
    stats: req.stats,
    user: req.session.user,
    access: req.session.access,
    csrf: req.session._csrf,
    users: req.users
  });
};

exports.notFound = function notFound(req, res, next) {
  res.status(404);
  return res.render('public/404.html', {});
};

exports.nextError = function nextError(req, res, next) {
  return next(new Error('some error'));
};

exports.errorHandler = function (err, req, res, next) {
  logger.error(err, 'there was an error at ' + req.url);
  res.status(500);
  return res.render('public/500.html');
};
