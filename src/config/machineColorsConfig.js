
const cpd = require('../assets/cpdblanco.png');
const cpdrojo = require('../assets/cpdrojo.png');
const cpdnegro = require('../assets/cpdnegro.png');
const cpdamarillo = require('../assets/cpdamarillo.png');
const cpdverde = require('../assets/cpdverde.png');
const cpdazul = require('../assets/cpdazul.png');
const cpdcian = require('../assets/cpdcian.png');

export const machineColorsMap = {
    1: cpdamarillo,
    3: cpdamarillo,
    8: cpdamarillo,
    13: cpdamarillo,
    11: cpdamarillo,
    10: cpdamarillo,
    2: cpdcian,
    6: cpdnegro,
    9: cpdrojo,
    16: cpdazul,
    15: cpdverde,
    4: cpdverde,
    7: cpd
}
// /**
//  * Función auxiliar para obtener la imagen de una máquina
//  * @param {number} main - ID del estado principal
//  * @param {string} defaultImage - Imagen por defecto
//  * @returns {string} - Ruta de la imagen
//  */
export function getImageBySrc(main, defaultImage = cpd) {
    return machineColorsMap[main] || defaultImage;
}
