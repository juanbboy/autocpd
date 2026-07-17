/**
 * Configuración de opciones secundarias (Causas/Motivos de los paros)
 * Estructura: { mainId: [opción1, opción2, ...] }
 * Puedes agregar, quitar o modificar opciones para cada estado principal
 */

export const secondaryOptionsMap = {
    1: [
        "Transferencia", "Vanizado", "Reviente LC", "Succion", "Reviente L180", "Piques",
        "Huecos y rotos", "Aguja", "Selectores", "Motores MPP", "Cuchillas", "correa",
        "Manguera rota", "Lubricacion", "Guia hilos", "Otros", "Limpieza", "Trasdenuto", "Escaricato"
    ],
    2: [
        "Licra", "Nylon", "Motores", "Sin programa"
    ],
    3: [
        "Valvulas", "Motores MPP", "No enciende", "Turbina", "Motor principal", "Sensores",
        "Paros", "Sin programa", "Fusible", "Guia hilos", "Corto circuito", "Carga no conectada",
        "bloqueo", "Sensor Lubricacion", "Otros", "Motor LGL", "Trasdenuto", "Escaricato"
    ],
    4: null,
    5: [
        "Transferencia", "Vanizado", "Reviente LC", "Succion", "Reviente L180", "Piques",
        "Huecos y rotos", "Aguja", "Selectores", "Motores MPP", "Cuchillas",
        "Valvulas", "Motores MPP", "No enciende", "Turbina", "Motor principal", "Sensores",
        "Paros", "Sin programa", "Fusible", "Materia prima", "Motores", "Sensor Lubricacion",
        "Lubricacion", "Guia hilos", "Otros", "Motor LGL", "Limpieza", "Trasdenuto", "Escaricato"
    ],
    6: [
        "Cambio de talla", "Cambio de referencia", "Desprogramada"
    ],
    7: null,
    8: null,
    9: null,
    10: null,
    11: null,
    12: null,
    13: null,
};


// export const mainSecondaryCode = {
//     1: "I06",
//     2: "I05",
//     3: "I26",
//     4: "I29",
//     5: "I55",
//     6: "I11",
//     7: "I30",
//     8: "DI01",
//     9: "DI02",
//     10: "DI117",
//     11: "DI11",
//     12: "I16",

// };