var jwt = require('jwt-simple');
var moment = require('moment-timezone');



module.exports = function(config) {

    function createJWT(user, uid) {
        var payload = {
            sub: uid,
            oid: user.id,
            iat: moment().unix(),
            exp: moment().add(14, 'days').unix()
        };

        return jwt.encode(payload, config.auth.jwtSecret);
    }

    return {
        profile: function(req, res) {
            res.json(req.user);
        },

        impersonate: function(req, res) {

            var uid = req.body.uid;
            if (!uid) {
                return res.json(400);
            }

            console.log(req.user.name.first + " " + req.user.name.last + " is requesting to impersonate user " + uid);
            if (req.user.perms.indexOf('system.developer') === -1) {
                console.log("Access to impersonate user denied");
                return res.json(403);
            } else {
                console.log("User is a developer");
            }

            console.log("Access token issued to impersonate user.");
            res.send({ token: createJWT(req.user, uid) });
        }
    }
}
