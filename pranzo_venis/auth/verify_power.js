const ADMIN = 2;
const USER = 1;
const GUEST = 0;

function verifyPower(user, power) {
    return user.power >= power;
}

module.exports = {
    verifyPower: verifyPower,
    ADMIN,
    USER,
    GUEST
};