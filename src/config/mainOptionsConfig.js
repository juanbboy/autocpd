/**
 * Configuración de opciones principales (Estados de máquinas)
 * Aquí puedes agregar, quitar o modificar los estados principales
 */

export const mainOptions = [
    { label: "Mecánico", main: 1, className: "btn btn-danger" },
    { label: "Barrado", main: 2, className: "btn btn-dark" },
    { label: "Electrónico", main: 3, className: "btn btn-warning" },
    { label: "Tallaje", main: 6, className: "btn btn-primary" },
    { label: "Seguimiento", main: 5, className: "btn btn-info" },
    { label: "Inicio Producción", main: 4, className: "btn btn-success" },
    { label: "Fin Producción", main: 7, className: "btn btn-light" }
];

/**
 * Mapa de etiquetas para los valores numéricos
 */
export const mainLabels = {
    1: "Mecanico",
    2: "Barrado",
    3: "Electronico",
    4: "Inicio Produccion",
    5: "Seguimiento",
    6: "Tallaje",
    7: "Fin Produccion",
};

export const mainCode = {
    1: "I06",
    2: "I05",
    3: "I26",
    4: "I29",
    5: "I55",
    6: "I11",
    7: "I30",
};
