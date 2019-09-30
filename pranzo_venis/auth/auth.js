const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const user = require("../models/user_model.js");

const verify_method = require("./verify_token");

const logMsg = require("../log/log.js");
const jwt = require("jsonwebtoken");

//const bcrypt = require("bcryptjs");

// const simplecrypt = require("simplecrypt");
// const sc = simplecrypt();

const config = require("./config");

const Cryptr = require('cryptr');
const sc = new Cryptr(config.secret);

const messages = require("../messages/messages.js");

// ─░▄█▀▄─▒█▒█▒█▀█▀█░▐█░▐█░▐█▀▀▒██▄░▒█▌▒█▀█▀█░▐██░▐█▀█─░▄█▀▄─▒█▀█▀█░▐██▒▐█▀▀█▌▒██▄░▒█▌
// ░▐█▄▄▐█▒█▒█░░▒█░░░▐████░▐█▀▀▒▐█▒█▒█░░░▒█░░─░█▌░▐█──░▐█▄▄▐█░░▒█░░─░█▌▒▐█▄▒█▌▒▐█▒█▒█░
// ░▐█─░▐█▒▀▄▀░▒▄█▄░░▐█░▐█░▐█▄▄▒██░▒██▌░▒▄█▄░░▐██░▐█▄█░▐█─░▐█░▒▄█▄░░▐██▒▐██▄█▌▒██░▒██▌

const { check, validationResult } = require('express-validator');

router.post("/register", (req, res) => {
    logMsg("Registrazione utente");

    var pass_hashata = sc.encrypt(req.body.password);

    let useremail = req.body.email ? req.body.email : req.body.username;

    user.findOne({ email: useremail }, (err, ris) => {

        if (!ris) {
            user.create({
                    name: req.body.firstName,
                    surname: req.body.lastName,
                    email: useremail,
                    password: pass_hashata,
                    power: 0 // 0 1 2
                },
                (err, user) => {
                    if (err) return res.status(500).send(err);

                    const errors = validationResult(req);

                    if (!errors.isEmpty()) {
                        return res.status(422).json({ ok: false, msg: "errore di validazione", data: errors.array() });
                    }
                    var token = jwt.sign({ id: user._id }, config.secret, {
                        expiresIn: 86400 // il token sparisce dopo 24 h
                    });

                    return res.status(200).send({
                        ok: true,
                        msg: messages.registrato_con_successo,
                        data: token
                    });
                }
            );

        } else {
            return res.status(422).json({ ok: false, msg: "utente già esistente, cambiare email" });
        }

    });

});

/**
 * Rotta per autenticarsi
 */
router.post("/login", (req, res) => {
    logMsg("Tentativo Login");

    user.findOne({ email: req.body.email }, (err, user) => {
        if (err) return res.status(200).send({
            ok: false,
            msg: messages.errore_del_server
        });
        if (!user) {
            logMsg("Login Fallito : Utente non esistente");

            return res.status(200).send({
                ok: false,
                msg: messages.utente_non_registrato
            });
        }
        var passwordIsValid =
            sc.decrypt(user.password) === req.body.password;

        if (!passwordIsValid) {
            logMsg("Login Fallito : Password non corretta");
            return res.status(200).send({
                auth: false,
                msg: "Password non corretta",
                token: null
            });
        } else {
            logMsg("Login Con Successo");

            var token = jwt.sign({ id: user._id }, config.secret, {
                expiresIn: 86400 // expires in 24 hours
            });
            res.status(200).send({
                ok: true,
                msg: messages.autenticato_con_successo,
                data: token
            });
        }

    });
});

/**
 * Per fare il loguout ci sono 4 strade
 * 1) blacklist del token
 * 2) usare un altro metodo di login
 * 3) mettere nel database il token prima di inviarlo all'utente
 * 4) cancellare il token dal client
 */
router.get("/logout", (req, res) => {
    res.status(200).send({});
});

/**
 * Rotta per vedere il proprio utente
 */
router.get("/me", verify_method, (req, res, next) => {
    user.findById(req.userId, { password: 0 }, (err, user) => {
        if (err) return res.status(500).send({
            ok: false,
            msg: messages.errore_riprovare_piu_tardi
        });
        if (!user) return res.status(404).send({
            ok: false,
            msg: messages.utente_non_trovato
        });

        res.status(200).send({
            ok: true,
            msg: "Utente " + user.name + " trovato!",
            data: user
        });
    });
});

/**
 * Rotta per ricevere il proprio livello di potere
 */
router.get("/mylvl", verify_method, (req, res, next) => {
    user.findById(req.userId, { password: 0 }, (err, user) => {
        if (err) return res.status(500).send({
            ok: false,
            msg: messages.errore_del_server
        });
        if (!user) return res.status(404).send({
            ok: false,
            msg: messages.utente_non_trovato
        });

        res.status(200).send({
            ok: true,
            msg: "Utente " + user.name + " trovato!",
            data: user.power
        });
    });
});

router.use((user, req, res, next) => {
    res.status(200).send(user);
});

module.exports = router;