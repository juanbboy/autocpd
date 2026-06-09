
const cpd = require('../assets/cpdblanco.png');
const cpdrojo = require('../assets/cpdrojo.png');
const cpdnegro = require('../assets/cpdnegro.png');
const cpdamarillo = require('../assets/cpdamarillo.png');
const cpdverde = require('../assets/cpdverde.png');
const cpdazul = require('../assets/cpdazul.png');
const cpdcian = require('../assets/cpdcian.png');

export const machineColorsMap = {
    1: cpdrojo,      // Mecánico - Rojo
    2: cpdnegro,     // Barrado - Negro
    3: cpdamarillo,  // Electrónico - Amarillo
    7: cpd,          // Fin Producción - Blanco
    5: cpdcian,     // Seguimiento - Cian
    6: cpdazul,       // Tallaje - Azul
    4: cpdverde      // Inicio Producción - Verde (puedes cambiarlo si quieres otro color)
};

// /**
//  * Función auxiliar para obtener la imagen de una máquina
//  * @param {number} main - ID del estado principal
//  * @param {string} defaultImage - Imagen por defecto
//  * @returns {string} - Ruta de la imagen
//  */
export function getImageBySrc(main, defaultImage = cpd) {
    return machineColorsMap[main] || defaultImage;
}
