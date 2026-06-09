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
    1: "Mecánico",
    2: "Barrado",
    3: "Electrónico",
    4: "Inicio Producción",
    5: "Seguimiento",
    6: "Tallaje",
    7: "Fin Producción",
};
