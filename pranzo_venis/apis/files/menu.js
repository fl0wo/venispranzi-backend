const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");

router.use(bodyParser.json({ limit: '50mb' }));
router.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const user = require("../../models/user_model.js");
const menu = require("../../models/menu_model.js");
const ingredients_model = require("../../models/ingredient_model.js");

const fs = require("fs");

var db = require("../../data/db.js");

//const messages = require("../../messages");

const uuid4 = require('uuid/v4');

const fu = require("express-fileupload");

const verify_method = require("../../auth/verify_token.js");
const power_check = require("../../auth/verify_power.js");

const dest_photo_path = __dirname + "\\pdf";

const logMsg = require("../../log/log");

router.use(fu());

const desc_kofler = [{
    type: "Primo Piatto",
    price: 10
}, {
    type: "Secondo Piatto",
    price: 12
}, {
    type: "Piatto Bilanciato",
    price: 15
}, {
    type: "Dolce",
    price: 3.50
}];

const desc_freq_fin = [5 + 1, 3, 1, 1];

router.get('/pdf/:name', function(req, res) {
    const name = dest_photo_path + "\\" + req.params.name + ".pdf";
    res.sendFile(name);
});

const pdfExtract = require('pdf-parse');

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
        });

        pdfExtract(b64.data).then(data => {

            let plates = extractFromPDF(data.text);

            console.log("L PIATTI INSERITI : " + plates.length);

            menu.create({
                name_file: pdf_file_name,
                inserted_by: {
                    _id: user_found._id,
                    name: user_found.name,
                    surname: user_found.surname,
                    email: user_found.email
                },
                inserted_on: new Date(),
                plates: plates
            }, (err, ris) => {
                logMsg("Inserted Menu into MongoDB");

                return res.send({
                    ok: true,
                    data: pdf_file_name,
                    msg: "Inserio correttamente"
                });
            });

        }).catch(reason => {
            return res.send({
                ok: false,
                msg: "Errore : File non valido",
                data: reason
            });
        });

    });
});

router.get("/all", verify_method, (req, res) => {
    logMsg('Get all menu');

    const lmt = req.headers.limit ? req.headers.limit | 0 : 50;

    user.findById(req.userId, { password: 0 }, (err, user_found) => {

        if (user_found) {
            // menu nella quale io sono presente chiaramente
            menu.find({}, { participants: 0, _v: 0 }, (err, menus_found) => {
                    return res.status(200).send({
                        ok: true,
                        data: menus_found
                    });
                }).limit(lmt)
                .sort({ inserted_on: -1 });
        }
    });

});

router.post("/choice", verify_method, (req, res) => {
    logMsg('Seleziona scelta');

    let { idMenu, plate } = req.body;
    user.findById(req.userId, { password: 0 }, (err, user_found) => {

        if (user_found) {
            menu.findById(idMenu, (err, menu_found) => {

                if (menu_found) {

                    //controllo più accurato namePlate
                    let same_user_same_plate = trovaPreOrdine(user_found.email, plate.name, menu_found);

                    const choise_to_insert = { user: { surname: user_found.surname, name: user_found.name, email: user_found.email, _id: user_found._id }, plate: plate };

                    if (same_user_same_plate == -1) {
                        menu_found.participants.push(choise_to_insert);
                    } else {
                        console.log(same_user_same_plate);
                        menu_found.participants[same_user_same_plate] = choise_to_insert;
                    }

                    menu_found.save(() => {
                        return res.status(200).send({
                            ok: true,
                            msg: "Scelta inviata!"
                        });
                    });
                } else {
                    return res.status(200).send({
                        ok: true,
                        msg: "Menu non trovato!"
                    });
                }
            });
        }
    });
});

router.post("/choice/all", verify_method, (req, res) => {
    logMsg('Get all menu');

    const idMenu = req.body.idMenu;

    user.findById(req.userId, { password: 0 }, (err, user_found) => {
        if (user_found) {
            menu.findById(idMenu, (err, menus_found) => {
                let participants = menus_found.participants;

                //OCCHIO ALL'ID
                //fixxa qui

                return res.status(200).send({
                    ok: true,
                    data: participants
                });
            });

        }
    });

});


function trovaPreOrdine(email, nomePiatto, menu_found) {

    for (let i = 0; i < menu_found.participants.length; i++) {

        let participant = menu_found.participants[i];

        console.log(participant.user.email + " != " + email + " && " + participant.plate.name + " != " + nomePiatto);

        if (participant.user.email == email && participant.plate.name.trim() == nomePiatto.trim()) {
            return i;
        }

    }

    return -1;

}


function extractFromPDF(stng) {

    //let stng = pdfParser.getRawTextContent().toString();

    let arr = stng.split("\n");

    let buildArr = [];

    let tmpStr = "";

    let desc_freq = desc_freq_fin;

    let i_desc = 0;
    arr.forEach((el) => {
        if (el.charAt(0) === " " || el.charAt(0) === "-");
        else if (el.charAt(0) === el.charAt(0).toUpperCase()) {
            if (tmpStr !== "") {
                if (desc_freq[i_desc] === 1) i_desc = i_desc == desc_kofler.length - 1 ? i_desc : i_desc + 1;
                else desc_freq[i_desc]--;

                let prod_name = tmpStr.trim().replace("\r", "");

                if (prod_name.includes("con")) {
                    let ingredienti = prod_name.substring(prod_name.indexOf("con") + "con".length + 1, prod_name.length).split(/ e |,/);
                    ingredienti.forEach(ing => { ing = ing.trim(); });

                    buildArr.push({
                        name: prod_name.substring(0, prod_name.indexOf("con")),
                        ingredients: ingredienti,
                        type: desc_kofler[i_desc].type,
                        price: desc_kofler[i_desc].price
                    });

                } else if (prod_name.length > 2) {
                    buildArr.push({
                        name: prod_name,
                        ingredients: [],
                        type: desc_kofler[i_desc].type,
                        price: desc_kofler[i_desc].price
                    });
                }

            }

            tmpStr = el;
        } else {
            tmpStr += " " + el;
        }
    });

    // buildArr.forEach((plate) => {
    //     console.log(JSON.stringify(plate));

    //     // da migliroare con un $unwind + $addToSet
    //     plate.ingredients.forEach((name) => {
    //         ingredients_model.updateOne({ name: name }, { name: name }, { upsert: true }, () => {
    //             //logMsg("Inserito nuovo ingrediente a DB");
    //         });
    //     });
    // });

    return buildArr;
}

module.exports = router;