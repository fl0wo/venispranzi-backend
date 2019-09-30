var jwt = require('jsonwebtoken');
var config = require('./config.js');

function verifyToken(req, res, next) {
    var token = req.headers['authorization'];
    if (!token)
        return res.status(403).send({
            ok: false,
            msg: "Non è stato inserito il token"
        });
    jwt.verify(token, config.secret, function(err, decoded) {
        if (err)
            return res.status(401).send({
                ok: false,
                msg: "Fallimento nell'autenticazione"
            });
        req.userId = decoded.id;
        next();
    });
}
module.exports = verifyToken;