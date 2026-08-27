/**
 * Configuración de opciones secundarias (Causas/Motivos de los paros)
 * Estructura: { mainId: [opción1, opción2, ...] }
 * Puedes agregar, quitar o modificar opciones para cada estado principal
 */

export const secondaryOptionsMap = {
    1: [
        { label: "Mant. correctivo", code: "DI118" },
        { label: "Mant. preventivo", code: "I14" },
        { label: "Selectores", code: "DI04" },
        { label: "Ajuste calidad", code: "DI06" },
        { label: "Limpieza", code: "I10" },
        { label: "Daño de cuchillas", code: "DI03" },

        "Transferencia", "Reviente LC", "Succion", "Reviente L180", "Piques",
        "Huecos y rotos", "Aguja", "Motores MPP", "Cuchillas", "correa",
        "Manguera rota", "Lubricacion", "Guia hilos", "Otros", "Limpieza", "Trasdenuto", "Escaricato"
    ],
    2: [
        { label: "Calidad M. prima", code: "I05" },
        { label: "Barrado", code: "I05" },
        { label: "Falta de materia prima", code: "I03" },
        { label: "Cambio de hilaza", code: "DI11" }
    ],
    3: [
        "Valvulas", "Motores MPP", "No enciende", "Turbina", "Motor principal", "Sensores",
        "Paros", "Sin programa", "Fusible", "Guia hilos", "Corto circuito", "Carga no conectada",
        "bloqueo", "Sensor Lubricacion", "Otros", "Motor LGL", "Trasdenuto", "Escaricato"
    ],
    4: [],
    // 5: [
    //     "Transferencia", "Vanizado", "Reviente LC", "Succion", "Reviente L180", "Piques",
    //     "Huecos y rotos", "Aguja", "Selectores", "Motores MPP", "Cuchillas",
    //     "Valvulas", "Motores MPP", "No enciende", "Turbina", "Motor principal", "Sensores",
    //     "Paros", "Sin programa", "Fusible", "Materia prima", "Motores", "Sensor Lubricacion",
    //     "Lubricacion", "Guia hilos", "Otros", "Motor LGL", "Limpieza", "Trasdenuto", "Escaricato"
    // ],
    6: [
        { label: "Cambio de talla", code: "DI01" },
        { label: "Cambio de referencia", code: "I11" },
        { label: "Desprogramada", code: "DI09" },

    ],
    7: [],
    9: [
        "Aguja -10", "Aguja +10"
    ],
    16: [
        { label: "Inasistencia ", code: "DI19" },
        { label: "Falta de mecanico", code: "DI117" },
        { label: "Falta de operario", code: "DI117" },
        { label: "Comida", code: "I08" },
        { label: "Ajuste de calidad", code: "I16" },
        { label: "Reuniones", code: "I17" },
        { label: "Inventario", code: "I19" },
        { label: "Pausas activas", code: "I20" },
        { label: "Capacitaciónes", code: "I22" },
    ]
};
