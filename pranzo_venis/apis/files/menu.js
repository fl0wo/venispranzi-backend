const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");

router.use(bodyParser.json({ limit: '50mb' }));
router.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const user = require("../../models/user_model.js");
const menu = require("../../models/menu_model.js");

const fs = require("fs");

var db = require("../../data/db.js");

//const messages = require("../../messages");

const uuid4 = require('uuid/v4');

const fu = require("express-fileupload");

const verify_method = require("../../auth/verify_token.js");
const power_check = require("../../auth/verify_power.js");

const dest_photo_path = __dirname + "\\pdf";

const b642pdf = require('base64topdf');

const logMsg = require("../../log/log");

router.use(fu());

router.get('/pdf/:name', function(req, res) {
    const name = dest_photo_path + "\\" + req.params.name + ".pdf";
    res.sendFile(name);
});

router.post('/pdf/upload', verify_method, function(req, res) {
    logMsg("Upload pdf");

    const b64 = req.files.file;

    const uniqueId = uuid4();

    let pdf_file_name = uniqueId;

    const file_path = dest_photo_path + "\\" + pdf_file_name;

    user.findById(req.userId, { password: 0 }, (err, user_found) => {
        if (err) return res.status(422).json({ ok: false, msg: "errore di validazione" });
        if (!user_found) return res.status(422).json({ ok: false, msg: "errore di validazione" });

        fs.writeFile(file_path + ".pdf", b64.data, { encoding: 'base64' }, (err) => {
            logMsg('File created');

            menu.create({
                name_file: pdf_file_name,
                inserted_by: user_found._id,
                inserted_on: new Date()
            }, (err, ris) => {
                logMsg("Inserted Menu into MongoDB");

                return res.status(200).send({
                    ok: true,
                    data: pdf_file_name
                });

            });

        });
    });


});

router.get("/all", verify_method, (req, res) => {
    logMsg('Get all menu');

    const lmt = req.headers.limit ? req.headers.limit | 0 : 50;

    user.findById(req.userId, { password: 0 }, (err, user_found) => {

        if (user_found) {
            menu.find({}, (err, menus_found) => {
                    return res.status(200).send({
                        ok: true,
                        data: menus_found
                    });
                }).limit(lmt)
                .sort({ inserted_on: -1 });

        }
    });

});
module.exports = router;