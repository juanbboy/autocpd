import React, { useEffect, useState, useRef } from 'react'
import { onValue, off, set } from 'firebase/database';
import { removeUndefined } from '../../utils/Utils';
import cpd from '../../assets/cpdblanco.png';
import './mapa.css';
import { dbRef } from '../../firebase/firebase-config';

const Mapa = () => {

  const [imgStates, setImgStates] = useState({});
  const isFirstLoad = useRef(true); // Para evitar sobrescribir al cargar por primera vez
  const ignoreNext = useRef(false); // Para evitar bucles de sincronización
  // --- Estado y helpers para mostrar todos los snapshots guardados en Firebase ---
  // const [allSnapshots, setAllSnapshots] = useState([]);
  // const [showAllSnapshots, setShowAllSnapshots] = useState(false);
  // const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  // const [showObservaciones, setShowObservaciones] = useState(false);
  // const [observacionesList, setObservacionesList] = useState([]);
  // --- Opciones principales para los estados de las máquinas ---
  const [modal, setModal] = useState({ show: false, target: null, main: null });


  useEffect(() => {
    // Escucha cambios en la base de datos y actualiza el estado local
    const handler = onValue(dbRef, (snapshot) => {
      const remote = snapshot.val();
      if (remote && typeof remote === "object" && Object.keys(remote).length > 0) {
        ignoreNext.current = true;
        setImgStates(remote);
      }
      isFirstLoad.current = false;
    });
    return () => off(dbRef, "value", handler);
  }, []);

  useEffect(() => {
    // Sube los cambios locales a Firebase (evita subir si el cambio viene de Firebase)
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (ignoreNext.current) {
      ignoreNext.current = false;
      return;
    }
    if (!imgStates || Object.keys(imgStates).length === 0) {
      return;
    }
    // Limpia claves undefined antes de subir a Firebase
    const cleanImgStates = removeUndefined(imgStates);
    set(dbRef, cleanImgStates);
  }, [imgStates]);




  // Opciones principales (colores y etiquetas)
  const mainOptions = [
    { label: "Mecánico", main: 1, className: "btn btn-danger" },
    { label: "Barrado", main: 2, className: "btn btn-dark" },
    { label: "Electrónico", main: 3, className: "btn btn-warning" },
    { label: "Tallaje", main: 6, className: "btn btn-primary" },
    { label: "Seguimiento", main: 5, className: "btn btn-success" },
    { label: "Producción", main: 4, className: "btn btn-light" }
  ];

  // Opciones secundarias (subopciones por cada tipo principal)
  const secondaryOptionsMap = React.useMemo(() => ({
    1: [
      "Transferencia", "Vanizado", "Reviente LC", "Succion", "Reviente L180", "Piques",
      "Huecos y rotos", "Aguja", "Selectores", "Motores MPP", "Cuchillas", "correa", "Manguera rota", "Lubricacion", "Guia hilos", "Otros", "Limpieza", "Trasdenuto", "Escaricato"
    ],
    2: [
      "Licra", "Nylon", "Motores", "Sin programa"
    ],
    3: [
      "Valvulas", "Motores MPP", "No enciende", "Turbina", "Motor principal", "Sensores",
      "Paros", "Sin programa", "Fusible", "Guia hilos", "Corto circuito", "Carga no conectada", "bloqueo", "Sensor Lubricacion", "Otros", "Motor LGL", "Trasdenuto", "Escaricato"
    ],
    4: [],
    5: [
      "Transferencia", "Vanizado", "Reviente LC", "Succion", "Reviente L180", "Piques",
      "Huecos y rotos", "Aguja", "Selectores", "Motores MPP", "Cuchillas",
      "Valvulas", "Motores MPP", "No enciende", "Turbina", "Motor principal", "Sensores",
      "Paros", "Sin programa", "Fusible", "Materia prima", "Motores", "Sensor Lubricacion", "Lubricacion", "Guia hilos", "Otros", "Motor LGL", "Limpieza", "Trasdenuto", "Escaricato"
    ],
    6: [
      "Cambio de talla", "Cambio de referencia", "Desprogramada"
    ]
  }), []);

  // // --- Guardar snapshot del estado de las máquinas (entrega de turno) ---
  // const handleSaveSnapshotNow = async () => {
  //   // Lista de nombres para seleccionar quién guarda el estado
  //   const nombres = ["F. Riobo", "N. Castañeda", "M. Gomez", "J. Bobadilla", "J. Salazar", "L. Paez"];
  //   let step = 1;
  //   let nombreSeleccionado = null;
  //   let bitacoraEstados = {};
  //   let lastScrollTop = 0; // Guarda la posición del scroll en la bitácora
  //   let observacionesGenerales = ""; // Nuevo campo para observaciones

  //   return new Promise((resolve) => {
  //     // Modal principal para la bitácora
  //     const modalDiv = document.createElement('div');
  //     modalDiv.style.position = 'fixed';
  //     modalDiv.style.top = 0;
  //     modalDiv.style.left = 0;
  //     modalDiv.style.width = '100vw';
  //     modalDiv.style.height = '100vh';
  //     modalDiv.style.background = 'rgba(0,0,0,0.3)';
  //     modalDiv.style.display = 'flex';
  //     modalDiv.style.alignItems = 'center';
  //     modalDiv.style.justifyContent = 'center';
  //     modalDiv.style.zIndex = 99999;

  //     const inner = document.createElement('div');
  //     inner.style.background = 'white';
  //     inner.style.padding = '32px 24px';
  //     inner.style.borderRadius = '12px';
  //     inner.style.textAlign = 'center';
  //     inner.style.minWidth = '260px';

  //     // Renderiza el paso actual del modal (selección de nombre o bitácora)
  //     const renderStep = () => {
  //       inner.innerHTML = '';
  //       if (step === 1) {
  //         // Paso 1: Selección de nombre
  //         const title = document.createElement('div');
  //         title.style.fontSize = '22px';
  //         title.style.marginBottom = '18px';
  //         title.innerText = '¿Quién guarda el estado?';
  //         inner.appendChild(title);

  //         nombres.forEach((nombre, idx) => {
  //           const btn = document.createElement('button');
  //           btn.innerText = nombre;
  //           btn.className = 'btn btn-primary m-2';
  //           btn.style.fontSize = '20px';
  //           btn.style.padding = '10px 24px';
  //           btn.onclick = () => {
  //             nombreSeleccionado = nombre;
  //             step = 2;
  //             renderStep();
  //           };
  //           inner.appendChild(btn);
  //         });

  //         // Botón "Otro" para ingresar nombre personalizado
  //         const otroBtn = document.createElement('button');
  //         otroBtn.innerText = 'Otro...';
  //         otroBtn.className = 'btn btn-outline-secondary m-2';
  //         otroBtn.style.fontSize = '20px';
  //         otroBtn.style.padding = '10px 24px';
  //         otroBtn.onclick = () => {
  //           const nombreOtro = window.prompt('Escribe el nombre de quien guarda el estado:');
  //           if (nombreOtro && nombreOtro.trim().length > 0) {
  //             nombreSeleccionado = nombreOtro.trim();
  //             step = 2;
  //             renderStep();
  //           }
  //         };
  //         inner.appendChild(otroBtn);

  //         // Espaciado visual
  //         const spacer = document.createElement('div');
  //         spacer.style.height = '24px';
  //         inner.appendChild(spacer);

  //         // Botón para cerrar el modal
  //         const btnCerrar = document.createElement('button');
  //         btnCerrar.innerText = 'Cerrar';
  //         btnCerrar.className = 'btn btn-secondary mt-2';
  //         btnCerrar.style.fontSize = '20px';
  //         btnCerrar.style.marginTop = '16px';
  //         btnCerrar.onclick = () => {
  //           document.body.removeChild(modalDiv);
  //           resolve(null);
  //         };
  //         inner.appendChild(btnCerrar);
  //       } else if (step === 2) {
  //         // Paso 2: Bitácora gráfica de máquinas
  //         const title = document.createElement('div');
  //         title.style.fontSize = '22px';
  //         title.style.marginBottom = '18px';
  //         title.innerText = 'Bitácora del día: selecciona el estado de cada máquina atendida';
  //         inner.appendChild(title);

  //         // Lista de máquinas a mostrar
  //         const maquinas = [
  //           "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19",
  //           "26", "28", "30", "31", "32", "33", "34", "35", "36", "38", "39", "40", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "64", "65", "66", "67", "69", "70", "71", "72", "73", "74", "75", "76"
  //         ];

  //         // Contenedor con scroll para la bitácora
  //         const scrollContainer = document.createElement('div');
  //         scrollContainer.style.maxHeight = '60vh';
  //         scrollContainer.style.overflowY = 'auto';
  //         scrollContainer.style.marginBottom = '18px';

  //         // Restaura la posición del scroll después de renderizar el grid
  //         setTimeout(() => { scrollContainer.scrollTop = lastScrollTop; }, 0);

  //         // Grid de máquinas
  //         const grid = document.createElement('div');
  //         grid.style.display = "grid";
  //         grid.style.gap = "0";
  //         grid.style.justifyItems = "center";
  //         grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(90px, 1fr))";
  //         grid.style.marginBottom = "18px";

  //         maquinas.forEach(id => {
  //           // Celda de cada máquina
  //           const cell = document.createElement('div');
  //           cell.style.marginBottom = "2px";
  //           cell.style.width = "90px";
  //           cell.style.textAlign = "center";

  //           // Imagen de la máquina (input tipo image)
  //           const input = document.createElement('input');
  //           input.type = "image";
  //           input.width = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19"].includes(id) ? 90 : 60;
  //           input.style.borderRadius = "16px";
  //           input.style.marginBottom = "0";
  //           input.style.border = "2px solid #eee";
  //           input.style.background = "#fff";
  //           input.setAttribute("data-id", id);
  //           // Selecciona la imagen según el estado
  //           input.src = (() => {
  //             const val = bitacoraEstados[id];
  //             if (!val || val.main == null) return require('../../assets/cpdblanco.png');
  //             switch (val.main) {
  //               case 1: return require('../../assets/cpdrojo.png');
  //               case 2: return require('../../assets/cpdnegro.png');
  //               case 3: return require('../../assets/cpdamarillo.png');
  //               case 4: return require('../../assets/cpdblanco.png');
  //               case 5: return require('../../assets/cpdverde.png');
  //               case 6: return require('../../assets/cpdazul.png');
  //               default: return require('../../assets/cpdblanco.png');
  //             }
  //           })();
  //           // Al hacer click en la imagen, abre el modal de opciones
  //           input.onclick = (event) => {
  //             lastScrollTop = scrollContainer.scrollTop; // Guarda la posición antes de abrir modal
  //             // Modal para seleccionar opción principal
  //             const id = event.target.getAttribute('data-id');
  //             const modalOpc = document.createElement('div');
  //             modalOpc.style.position = 'fixed';
  //             modalOpc.style.top = 0;
  //             modalOpc.style.left = 0;
  //             modalOpc.style.width = '100vw';
  //             modalOpc.style.height = '100vh';
  //             modalOpc.style.background = 'rgba(0,0,0,0.3)';
  //             modalOpc.style.display = 'flex';
  //             modalOpc.style.alignItems = 'center';
  //             modalOpc.style.justifyContent = 'center';
  //             modalOpc.style.zIndex = 999999;

  //             const innerOpc = document.createElement('div');
  //             innerOpc.style.background = 'white';
  //             innerOpc.style.padding = '24px';
  //             innerOpc.style.borderRadius = '12px';
  //             innerOpc.style.textAlign = 'center';
  //             innerOpc.style.minWidth = '220px';

  //             const titleOpc = document.createElement('div');
  //             titleOpc.style.fontSize = '20px';
  //             titleOpc.style.marginBottom = '16px';
  //             titleOpc.innerText = `Máquina ${id}: Selecciona opción`;
  //             innerOpc.appendChild(titleOpc);

  //             // Botones de opciones principales
  //             mainOptions.forEach(opt => {
  //               const btn = document.createElement('button');
  //               btn.innerText = opt.label;
  //               btn.className = opt.className + " m-2";
  //               btn.style.fontSize = "20px";
  //               btn.style.padding = "10px 24px";
  //               if (opt.style) Object.assign(btn.style, opt.style);
  //               btn.onclick = () => {
  //                 if (!bitacoraEstados[id]) bitacoraEstados[id] = {};
  //                 bitacoraEstados[id].main = opt.main;
  //                 bitacoraEstados[id].secondary = null;
  //                 bitacoraEstados[id].secondaryCustom = undefined; // <-- Asegura limpiar secondaryCustom al cambiar main
  //                 document.body.removeChild(modalOpc);
  //                 // Si requiere subopción, abre modal de subopciones
  //                 if (opt.main !== 4 && secondaryOptionsMap[opt.main] && secondaryOptionsMap[opt.main].length > 0) {
  //                   const modalSub = document.createElement('div');
  //                   modalSub.style.position = 'fixed';
  //                   modalSub.style.top = 0;
  //                   modalSub.style.left = 0;
  //                   modalSub.style.width = '100vw';
  //                   modalSub.style.height = '100vh';
  //                   modalSub.style.background = 'rgba(0,0,0,0.3)';
  //                   modalSub.style.display = 'flex';
  //                   modalSub.style.alignItems = 'center';
  //                   modalSub.style.justifyContent = 'center';
  //                   modalSub.style.zIndex = 999999;

  //                   const innerSub = document.createElement('div');
  //                   innerSub.style.background = 'white';
  //                   innerSub.style.padding = '24px';
  //                   innerSub.style.borderRadius = '12px';
  //                   innerSub.style.textAlign = 'center';
  //                   innerSub.style.minWidth = '220px';

  //                   const titleSub = document.createElement('div');
  //                   titleSub.style.fontSize = '20px';
  //                   titleSub.style.marginBottom = '16px';
  //                   titleSub.innerText = `Máquina ${id}: Selecciona subopción`;
  //                   innerSub.appendChild(titleSub);

  //                   // Botones de subopciones
  //                   secondaryOptionsMap[opt.main].forEach((sub, idx) => {
  //                     if (sub === "Otros") {
  //                       const btnSub = document.createElement('button');
  //                       btnSub.innerText = sub;
  //                       btnSub.className = "btn btn-outline-secondary m-2";
  //                       btnSub.style.fontSize = "18px";
  //                       btnSub.style.padding = "8px 18px";
  //                       btnSub.onclick = () => {
  //                         const custom = window.prompt("Escribe la causa personalizada:");
  //                         if (custom && custom.trim().length > 0) {
  //                           bitacoraEstados[id].secondary = idx;
  //                           bitacoraEstados[id].secondaryCustom = custom.trim();
  //                           document.body.removeChild(modalSub);
  //                           renderStep();
  //                           setTimeout(() => { scrollContainer.scrollTop = lastScrollTop; }, 0);
  //                         }
  //                       };
  //                       innerSub.appendChild(btnSub);
  //                     } else {
  //                       const btnSub = document.createElement('button');
  //                       btnSub.innerText = sub;
  //                       btnSub.className = "btn btn-outline-secondary m-2";
  //                       btnSub.style.fontSize = "18px";
  //                       btnSub.style.padding = "8px 18px";
  //                       btnSub.onclick = () => {
  //                         bitacoraEstados[id].secondary = idx;
  //                         bitacoraEstados[id].secondaryCustom = undefined; // <-- Limpia secondaryCustom si no es "Otros"
  //                         document.body.removeChild(modalSub);
  //                         renderStep();
  //                         setTimeout(() => { scrollContainer.scrollTop = lastScrollTop; }, 0);
  //                       };
  //                       innerSub.appendChild(btnSub);
  //                     }
  //                   });

  //                   // Botón cancelar subopción
  //                   const btnCancel = document.createElement('button');
  //                   btnCancel.innerText = "Cancelar";
  //                   btnCancel.className = "btn btn-link mt-3";
  //                   btnCancel.style.fontSize = "16px";
  //                   btnCancel.onclick = () => {
  //                     document.body.removeChild(modalSub);
  //                     setTimeout(() => { scrollContainer.scrollTop = lastScrollTop; }, 0);
  //                   };
  //                   innerSub.appendChild(btnCancel);

  //                   modalSub.appendChild(innerSub);
  //                   document.body.appendChild(modalSub);
  //                 } else {
  //                   renderStep();
  //                   setTimeout(() => { scrollContainer.scrollTop = lastScrollTop; }, 0);
  //                 }
  //               };
  //               innerOpc.appendChild(btn);
  //             });

  //             // Botón cancelar opción principal
  //             const btnCancel = document.createElement('button');
  //             btnCancel.innerText = "Cancelar";
  //             btnCancel.className = "btn btn-link mt-3";
  //             btnCancel.style.fontSize = "16px";
  //             btnCancel.onclick = () => {
  //               document.body.removeChild(modalOpc);
  //               setTimeout(() => { scrollContainer.scrollTop = lastScrollTop; }, 0);
  //             };
  //             innerOpc.appendChild(btnCancel);

  //             modalOpc.appendChild(innerOpc);
  //             document.body.appendChild(modalOpc);
  //           };

  //           cell.appendChild(input);

  //           // Muestra el ID de la máquina
  //           const idDiv = document.createElement('div');
  //           idDiv.innerHTML = `<strong>${id}</strong>`;
  //           cell.appendChild(idDiv);

  //           // Etiqueta de subopción seleccionada
  //           const val = bitacoraEstados[id];
  //           let subLabel = "";
  //           if (val && typeof val === "object" && val.secondary != null && val.main != null) {
  //             const opts = secondaryOptionsMap[val.main] || [];
  //             if (opts[val.secondary] === "Otros" && val.secondaryCustom) {
  //               subLabel = val.secondaryCustom;
  //             } else {
  //               subLabel = opts[val.secondary] || "";
  //               if (subLabel.length > 18) subLabel = subLabel.slice(0, 15) + "...";
  //             }
  //           }
  //           const subDiv = document.createElement('div');
  //           subDiv.style.fontSize = "13px";
  //           subDiv.style.color = "#888";
  //           subDiv.style.minHeight = "20px";
  //           subDiv.style.height = "20px";
  //           subDiv.style.display = "flex";
  //           subDiv.style.alignItems = "center";
  //           subDiv.style.justifyContent = "center";
  //           subDiv.style.overflow = "hidden";
  //           subDiv.style.textOverflow = "ellipsis";
  //           subDiv.style.whiteSpace = "nowrap";
  //           subDiv.style.width = "100%";
  //           subDiv.style.borderRadius = "12px";
  //           subDiv.innerText = subLabel || "\u00A0";
  //           cell.appendChild(subDiv);

  //           grid.appendChild(cell);
  //         });

  //         scrollContainer.appendChild(grid);
  //         inner.appendChild(scrollContainer);

  //         // --- Observaciones generales ---
  //         const obsDiv = document.createElement('div');
  //         obsDiv.style.margin = '18px 0 8px 0';
  //         obsDiv.style.textAlign = 'left';

  //         const obsLabel = document.createElement('label');
  //         obsLabel.innerText = 'Observaciones generales:';
  //         obsLabel.style.fontWeight = 'bold';
  //         obsLabel.style.display = 'block';
  //         obsLabel.style.marginBottom = '6px';
  //         obsDiv.appendChild(obsLabel);

  //         const obsTextarea = document.createElement('textarea');
  //         obsTextarea.rows = 3;
  //         obsTextarea.style.width = '100%';
  //         obsTextarea.style.borderRadius = '8px';
  //         obsTextarea.style.border = '1px solid #ccc';
  //         obsTextarea.style.padding = '6px';
  //         obsTextarea.value = observacionesGenerales;
  //         obsTextarea.placeholder = 'Escribe aquí cualquier observación general...';
  //         obsTextarea.oninput = (e) => {
  //           observacionesGenerales = e.target.value;
  //         };
  //         obsDiv.appendChild(obsTextarea);

  //         inner.appendChild(obsDiv);

  //         // Botón para guardar el estado de la bitácora
  //         const btnGuardar = document.createElement('button');
  //         btnGuardar.innerText = 'Guardar estado';
  //         btnGuardar.className = 'btn btn-success m-2';
  //         btnGuardar.style.fontSize = '20px';
  //         btnGuardar.style.padding = '10px 24px';
  //         btnGuardar.onclick = () => {
  //           const seleccionadas = maquinas.filter(id => bitacoraEstados[id] && bitacoraEstados[id].main != null);
  //           // Si el usuario es "L. Paez", solo guardar observaciones generales (no guarda máquinas ni bitácora)
  //           if (nombreSeleccionado === "L. Paez") {
  //             document.body.removeChild(modalDiv);
  //             resolve({
  //               nombre: nombreSeleccionado,
  //               bitacora: [],
  //               bitacoraEstados: {},
  //               soloObservaciones: true,
  //               observacionesGenerales: observacionesGenerales.trim()
  //             });
  //             return;
  //           }
  //           // Si no hay ninguna máquina seleccionada, pero hay observaciones generales, permitir guardar solo observaciones
  //           if (seleccionadas.length === 0 && observacionesGenerales.trim() !== "") {
  //             document.body.removeChild(modalDiv);
  //             resolve({
  //               nombre: nombreSeleccionado,
  //               bitacora: [],
  //               bitacoraEstados: {},
  //               soloObservaciones: true,
  //               observacionesGenerales: observacionesGenerales.trim()
  //             });
  //             return;
  //           }
  //           document.body.removeChild(modalDiv);
  //           resolve({ nombre: nombreSeleccionado, bitacora: seleccionadas, bitacoraEstados: { ...bitacoraEstados } });
  //         };
  //         inner.appendChild(btnGuardar);

  //         // Botón para volver al paso anterior (selección de nombre)
  //         const btnAtras = document.createElement('button');
  //         btnAtras.innerText = 'Volver';
  //         btnAtras.className = 'btn btn-link mt-3';
  //         btnAtras.style.fontSize = '18px';
  //         btnAtras.onclick = () => {
  //           step = 1;
  //           renderStep();
  //         };
  //         inner.appendChild(btnAtras);
  //       }
  //     };

  //     renderStep();
  //     modalDiv.appendChild(inner);
  //     document.body.appendChild(modalDiv);
  //   }).then(async (result) => {
  //     if (!result) return;
  //     const nombre = typeof result === "string" ? result : result.nombre;
  //     // Si es solo observaciones y es "L. Paez", no guardar máquinas ni bitácora
  //     const soloObservaciones = result.soloObservaciones || false;
  //     const obsGenerales = result.observacionesGenerales || observacionesGenerales;
  //     let bitacora = [];
  //     let bitacoraEstados = {};
  //     if (!soloObservaciones || nombre !== "L. Paez") {
  //       bitacora = typeof result === "string" ? [] : result.bitacora || [];
  //       bitacoraEstados = typeof result === "string" ? {} : result.bitacoraEstados || {};
  //     }

  //     // --- Filtrar solo "Electrónico" si el usuario es "J. Salazar" SOLO AL GUARDAR ---
  //     let filteredImgStates = imgStates;
  //     if (nombre === "J. Salazar") {
  //       filteredImgStates = Object.fromEntries(
  //         Object.entries(imgStates).filter(([_, val]) => val?.main === 3)
  //       );
  //     }

  //     // Limpia claves undefined antes de guardar en Firebase
  //     Object.keys(bitacoraEstados).forEach(id => {
  //       if (bitacoraEstados[id] && typeof bitacoraEstados[id] === "object") {
  //         Object.keys(bitacoraEstados[id]).forEach(k => {
  //           if (bitacoraEstados[id][k] === undefined) {
  //             delete bitacoraEstados[id][k];
  //           }
  //         });
  //       }
  //     });

  //     // Guarda solo los estados que NO son de producción (main !== 4)
  //     const snapshot = {};
  //     if (!soloObservaciones || nombre !== "L. Paez") {
  //       Object.entries(filteredImgStates).forEach(([id, val]) => {
  //         // Solo guardar Electrónico si es J. Salazar, si no, igual que antes
  //         if (
  //           (nombre === "J. Salazar" && val?.main === 3) ||
  //           (nombre !== "J. Salazar" && val?.main !== 4)
  //         ) {
  //           let mainLabel = "";
  //           let secondaryLabel = "";
  //           if (val?.main != null) {
  //             const mainOpt = mainOptions.find(opt => opt.main === val.main);
  //             mainLabel = mainOpt ? mainOpt.label : "";
  //           }
  //           if (val?.main != null && val?.secondary != null) {
  //             const opts = secondaryOptionsMap[val.main] || [];
  //             if (opts[val.secondary] === "Otros" && val.secondaryCustom) {
  //               secondaryLabel = val.secondaryCustom;
  //             } else {
  //               secondaryLabel = opts[val.secondary] || "";
  //             }
  //           }
  //           const snapVal = {
  //             main: mainLabel,
  //             secondary: secondaryLabel,
  //             src: getSrc(id)
  //           };
  //           if (
  //             typeof val?.secondaryCustom === "string" &&
  //             val.secondaryCustom.trim() !== ""
  //           ) {
  //             snapVal.secondaryCustom = val.secondaryCustom;
  //           }
  //           snapshot[id] = snapVal;
  //         }
  //       });
  //     }

  //     // --- Guardar bitacoraEstados with main y secondary como texto y color (color de la imagen) ---
  //     let bitacoraEstadosTexto = {};
  //     if (!soloObservaciones || nombre !== "L. Paez") {
  //       Object.entries(bitacoraEstados).forEach(([id, val]) => {
  //         if (val && val.main != null) {
  //           let mainLabel = "";
  //           let secondaryLabel = "";
  //           let color = "";
  //           let src = "";
  //           const mainOpt = mainOptions.find(opt => opt.main === val.main);
  //           mainLabel = mainOpt ? mainOpt.label : "";
  //           color = mainOpt && mainOpt.className ? mainOpt.className : "";
  //           // Obtener src de la imagen según el estado
  //           switch (val.main) {
  //             case 1: src = require('../../assets/cpdrojo.png'); break;
  //             case 2: src = require('../../assets/cpdnegro.png'); break;
  //             case 3: src = require('../../assets/cpdamarillo.png'); break;
  //             case 4: src = require('../../assets/cpdblanco.png'); break;
  //             case 5: src = require('../../assets/cpdverde.png'); break;
  //             case 6: src = require('../../assets/cpdazul.png'); break;
  //             default: src = cpd;
  //           }
  //           if (val.secondary != null) {
  //             const opts = secondaryOptionsMap[val.main] || [];
  //             if (opts[val.secondary] === "Otros" && val.secondaryCustom) {
  //               secondaryLabel = val.secondaryCustom;
  //             } else {
  //               secondaryLabel = opts[val.secondary] || "";
  //             }
  //           }
  //           bitacoraEstadosTexto[id] = {
  //             main: mainLabel,
  //             secondary: secondaryLabel,
  //             color: color,
  //             src: src
  //           };
  //           if (
  //             typeof val?.secondaryCustom === "string" &&
  //             val.secondaryCustom.trim() !== ""
  //           ) {
  //             bitacoraEstadosTexto[id].secondaryCustom = val.secondaryCustom;
  //           }
  //         }
  //       });
  //     }

  //     if ((Object.keys(snapshot).length === 0 && !soloObservaciones) || (nombre === "L. Paez" && !obsGenerales)) {
  //       alert('No hay estados fuera de producción para guardar.');
  //       return;
  //     }
  //     // Genera clave única para el snapshot
  //     const now = new Date();
  //     const pad = n => n.toString().padStart(2, '0');
  //     const key = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  //     if (!soloObservaciones || nombre !== "L. Paez") {
  //       await set(ref(db, `snapshots/${key}`), snapshot);
  //     }
  //     await set(ref(db, `snapshotsInfo/${key}`), {
  //       guardadoPor: nombre,
  //       fecha: now.toISOString(),
  //       bitacora: (nombre === "L. Paez" && soloObservaciones) ? [] : bitacora,
  //       bitacoraEstados: (nombre === "L. Paez" && soloObservaciones) ? {} : bitacoraEstadosTexto,
  //       observaciones: obsGenerales // Guardar observaciones generales
  //     });
  //     alert('Estado guardado correctamente por ' + nombre + '.');
  //     // Envía notificación de entrega de turno
  //     fcmSendNotification(
  //       `Entrega de turno por ${nombre}`,
  //       `${new Date().toLocaleString('es-ES')}`,
  //     );
  //   });
  // };

  // Abre el modal de opciones para una máquina
  function img(event) {
    setModal({ show: true, target: event.target, main: null });
  }
  // Devuelve la etiqueta de la subopción seleccionada para una máquina
  function getSecondaryLabel(id) {
    const val = imgStates[id];
    if (!val || typeof val !== "object" || val.secondary == null || val.main == null) {
      return "";
    }
    const opts = secondaryOptionsMap[val.main] || [];
    if (opts[val.secondary] === "Otros" && val.secondaryCustom) {
      return val.secondaryCustom;
    }
    const label = opts[val.secondary] || "";
    if (label.length > 18) {
      return label.slice(0, 15) + "...";
    }
    return label;
  }
  // Devuelve la imagen correspondiente al estado de la máquina
  function getSrc(id) {
    const val = imgStates[id];
    if (!val || val.main == null) return cpd;
    switch (val.main) {
      case 1: return require('../../assets/cpdrojo.png');
      case 2: return require('../../assets/cpdnegro.png');
      case 3: return require('../../assets/cpdamarillo.png');
      case 4: return require('../../assets/cpdblanco.png');
      case 5: return require('../../assets/cpdverde.png');
      case 6: return require('../../assets/cpdazul.png');
      default: return cpd;
    }
  }
  // Devuelve las subopciones para el modal actual
  function getSecondaryOptions() {
    if (modal.main === 4) return [];
    if (modal.main && secondaryOptionsMap[modal.main]) {
      return secondaryOptionsMap[modal.main];
    }
    return [];
  }
  // Maneja la selección de una opción principal en el modal
  function handleMainOption(main) {
    if (main === 4 && modal.target) {
      const id = modal.target.getAttribute('data-id');
      let src = getSrc(id);
      setImgStates(prev => ({
        ...prev,
        [id]: { src, secondary: null, main }
      }));
      // fcmSendNotification(
      //   `Máquina ${id}`,
      //   `Producción`,
      //   id
      // );
      setModal({ show: false, target: null, main: null });
      return;
    }
    setModal((prev) => ({ ...prev, main }));
  }
  // Maneja la selección de una subopción (incluye opción personalizada "Otros")
  function handleSecondaryOption(secondaryIdx, customText) {
    if (!modal.target || !modal.main) return;
    const id = modal.target.getAttribute('data-id');
    let src = getSrc(id);
    setImgStates(prev => ({
      ...prev,
      [id]: {
        src,
        secondary: secondaryIdx,
        main: modal.main,
        secondaryCustom: (secondaryIdx !== undefined && getSecondaryOptions()[secondaryIdx] === "Otros") ? customText : undefined
      }
    }));
    // const mainLabels = {
    //   1: "Mecánico",
    //   2: "Barrado",
    //   3: "Electrónico",
    //   4: "Producción",
    //   5: "Seguimiento"
    // };
    // const mainLabel = mainLabels[modal.main] || "";
    // const subLabel = getSecondaryOptions()[secondaryIdx] === "Otros"
    //   ? customText
    //   : getSecondaryOptions()[secondaryIdx] || "";
    // fcmSendNotification(
    //   `Máquina ${id}`,
    //   `${mainLabel}${subLabel ? " - " + subLabel : ""}`,
    //   id
    // );
    setTimeout(() => {
      setModal({ show: false, target: null, main: null });
    }, 0);
  }



  return (
    <div className="App">
      <h1 className="text-center p-4">
        <span className="d-block d-md-none" style={{ fontSize: 26 }}>Circulares Pequeño Diametro</span>
        <span className="d-none d-md-block" style={{ fontSize: 36 }}>Circulares Pequeño Diametro</span>
      </h1>
      {/* Grid de máquinas para móvil */}
      <div className="p-1 d-block d-md-none">
        {/* Aquí se renderiza el grid de máquinas para móvil */}
        <div
          style={{
            display: "grid",
            gap: 0,
            justifyItems: "center",
            gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))"
          }}
        >
          {[
            // Solo IDs únicos para móvil, sin repetición de máquinas
            "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19",
            "26", "28", "30", "31", "32", "33", "34", "35", "36", "38", "39", "40", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "64", "65", "66", "67", "69", "70", "71", "72", "73", "74", "75", "76"
          ].map(id => (
            <div key={id} style={{ marginBottom: 2, width: 90, textAlign: "center" }}>
              <input
                type="image"
                onClick={img}
                src={getSrc(id)}
                width={["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19"].includes(id) ? 90 : 60}
                alt={id}
                data-id={id}
                style={{
                  borderRadius: 16,
                  marginBottom: 0, // sin margen inferior
                  border: "2px solid #eee",
                  background: "#fff"
                }}
              />
              <div>
                <strong>{id}</strong>
              </div>
              <div style={{
                fontSize: 13,
                color: "#888",
                minHeight: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "100%",
                borderRadius: 12
              }}>
                {getSecondaryLabel(id) || "\u00A0"}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Grid de máquinas para PC/tablet */}
      <div className="px-4 d-none d-md-block">
        <div className="row py-4 text-center">
          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S19")} width={90} alt="Placeholder" data-id="S19"
              className='borde' />
            <div>
              <strong>S19</strong>
              <div className="mq">
                {getSecondaryLabel("S19") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S3")} width={90} alt="Placeholder" data-id="S3"
              className='borde' />
            <div>
              <strong>S3</strong>
              <div className="mq">
                {getSecondaryLabel("S3") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col p-0">

            <input type="image" onClick={img} src={getSrc("S2")} width={90} alt="Placeholder" data-id="S2"
              className='borde' />
            <div>
              <strong>S2</strong>
              <div className="mq">
                {getSecondaryLabel("S2") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S1")} width={90} alt="Placeholder" data-id="S1"
              className='borde' />
            <div>
              <strong>S1</strong>
              <div className="mq">
                {getSecondaryLabel("S1") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col p-0">

            <input type="image" onClick={img} src={getSrc("S6")} width={90} alt="Placeholder" data-id="S6"
              className='borde' />
            <div>
              <strong>S6</strong>
              <div className="mq">
                {getSecondaryLabel("S6") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col  p-0">
            <input type="image" onClick={img} src={getSrc("S7")} width={90} alt="Placeholder" data-id="S7"
              className='borde' />
            <div>
              <strong>S7</strong>
              <div className="mq">
                {getSecondaryLabel("S7") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col p-0">

            <input type="image" onClick={img} src={getSrc("S8")} width={90} alt="Placeholder" data-id="S8"
              className='borde' />
            <div>
              <strong>S8</strong>
              <div className="mq">
                {getSecondaryLabel("S8") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S9")} width={90} alt="Placeholder" data-id="S9"
              className='borde' />
            <div>
              <strong>S9</strong>
              <div className="mq">
                {getSecondaryLabel("S9") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S10")} width={90} alt="Placeholder" data-id="S10"
              className='borde' />
            <div>
              <strong>S10</strong>
              <div className="mq">
                {getSecondaryLabel("S10") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S11")} width={90} alt="Placeholder" data-id="S11"
              className='borde' />
            <div>
              <strong>S11</strong>
              <div className="mq">
                {getSecondaryLabel("S11") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S12")} width={90} alt="Placeholder" data-id="S12"
              className='borde' />
            <div>
              <strong>S12</strong>
              <div className="mq">
                {getSecondaryLabel("S12") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col p-0">

            <input type="image" onClick={img} src={getSrc("S13")} width={90} alt="Placeholder" data-id="S13"
              className='borde' />
            <div>
              <strong>S13</strong>
              <div className="mq">
                {getSecondaryLabel("S13") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col p-0">

            <input type="image" onClick={img} src={getSrc("S14")} width={90} alt="Placeholder" data-id="S14"
              className='borde' />
            <div>
              <strong>S14</strong>
              <div className="mq">
                {getSecondaryLabel("S14") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col p-0">

            <input type="image" onClick={img} src={getSrc("S15")} width={90} alt="Placeholder" data-id="S15"
              className='borde' />
            <div>
              <strong>S15</strong>
              <div className="mq">
                {getSecondaryLabel("S15") || "\u00A0"}
              </div>
            </div>
          </div>

        </div>

        <div className="row py-5 text-center no-gutters align-items-center">
          <div className="col p-0 " >

            <input type="image" onClick={img} src={getSrc("S18")} width={90} alt="Placeholder" data-id="S18"
              className='borde' />
            <div>
              <strong>S18</strong>
              <div style={{ fontSize: 14, color: "#888" }}>{getSecondaryLabel("S18")}</div>
            </div>
          </div>
          <div className="col p-0 " >

            <input type="image" onClick={img} src={getSrc("S17")} width={90} alt="Placeholder" data-id="S17"
              className='borde' />
            <div>
              <strong>S17</strong>
              <div style={{ fontSize: 14, color: "#888" }}>{getSecondaryLabel("S17")}</div>
            </div>
          </div>
          <div className="col p-0 " >

            <input type="image" onClick={img} src={getSrc("S16")} width={90} alt="Placeholder" data-id="S16"
              className='borde' />
            <div>
              <strong>S16</strong>
              <div style={{ fontSize: 14, color: "#888" }}>{getSecondaryLabel("S16")}</div>
            </div>
          </div>
          <div className="col p-0 " >
            <input type="image" onClick={img} src={getSrc("S4")} width={90} alt="Placeholder" data-id="S4"
              className='borde' />
            <div>
              <strong>S4</strong>
              <div style={{ fontSize: 14, color: "#888" }}>{getSecondaryLabel("S4")}</div>
            </div>
          </div>
          <div className="col p-0">

            <input type="image" onClick={img} src={getSrc("S5")} width={90} alt="Placeholder" data-id="S5"
              className='borde' />
            <div>
              <strong>S5</strong>
              <div style={{ fontSize: 14, color: "#888" }}>{getSecondaryLabel("S5")}</div>
            </div>
          </div>

          <div className="col">
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("67")} width={60} alt="Placeholder" data-id="67"
                  className='borde' />
                <div>
                  <strong>67</strong>
                  <div className="mq">
                    {getSecondaryLabel("67") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("66")} width={60} alt="Placeholder" data-id="66"
                  className='borde' />
                <div>
                  <strong>66</strong>
                  <div className="mq">
                    {getSecondaryLabel("66") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col ">
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("26")} width={60} alt="Placeholder" data-id="26"
                  className='borde' />
                <div>
                  <strong>26</strong>
                  <div className="mq">
                    {getSecondaryLabel("26") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("49")} width={60} alt="Placeholder" data-id="49"
                  className='borde' />
                <div>
                  <strong>49</strong>
                  <div className="mq">
                    {getSecondaryLabel("49") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col ">
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("28")} width={60} alt="Placeholder" data-id="28"
                  className='borde' />
                <div>
                  <strong>28</strong>
                  <div className="mq">
                    {getSecondaryLabel("28") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("55")} width={60} alt="Placeholder" data-id="55"
                  className='borde' />
                <div>
                  <strong>55</strong>
                  <div className="mq">
                    {getSecondaryLabel("55") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col ">
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("30")} width={60} alt="Placeholder" data-id="30"
                  className='borde' />
                <div>
                  <strong>30</strong>
                  <div className="mq">
                    {getSecondaryLabel("30") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("58")} width={60} alt="Placeholder" data-id="58"
                  className='borde' />
                <div>
                  <strong>58</strong>
                  <div className="mq">
                    {getSecondaryLabel("58") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col ">
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("31")} width={60} alt="Placeholder" data-id="31"
                  className='borde' />
                <div>
                  <strong>31</strong>
                  <div className="mq">
                    {getSecondaryLabel("31") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("57")} width={60} alt="Placeholder" data-id="57"
                  className='borde' />
                <div>
                  <strong>57</strong>
                  <div className="mq">
                    {getSecondaryLabel("57") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col ">
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("32")} width={60} alt="Placeholder" data-id="32"
                  className='borde' />
                <div>
                  <strong>32</strong>
                  <div className="mq">
                    {getSecondaryLabel("32") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("56")} width={60} alt="Placeholder" data-id="56"
                  className='borde' />
                <div>
                  <strong>56</strong>
                  <div className="mq">
                    {getSecondaryLabel("56") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col ">
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("33")} width={60} alt="Placeholder" data-id="33"
                  className='borde' />
                <div>
                  <strong>33</strong>
                  <div className="mq">
                    {getSecondaryLabel("33") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("54")} width={60} alt="Placeholder" data-id="54"
                  className='borde' />
                <div>
                  <strong>54</strong>
                  <div className="mq">
                    {getSecondaryLabel("54") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col ">
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("35")} width={60} alt="Placeholder" data-id="35"
                  className='borde' />
                <div>
                  <strong>35</strong>
                  <div className="mq">
                    {getSecondaryLabel("35") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("52")} width={60} alt="Placeholder" data-id="52"
                  className='borde' />
                <div>
                  <strong>52</strong>
                  <div className="mq">
                    {getSecondaryLabel("52") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col ">
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("36")} width={60} alt="Placeholder" data-id="36"
                  className='borde' />
                <div>
                  <strong>36</strong>
                  <div className="mq">
                    {getSecondaryLabel("36") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("51")} width={60} alt="Placeholder" data-id="51"
                  className='borde' />
                <div>
                  <strong>51</strong>
                  <div className='mq'>
                    {getSecondaryLabel("51") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col ">
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("38")} width={60} alt="Placeholder" data-id="38"
                  className='borde' />
                <div>
                  <strong>38</strong>
                  <div className='mq'>
                    {getSecondaryLabel("38") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("50")} width={60} alt="Placeholder" data-id="50"
                  className='borde' />
                <div>
                  <strong>50</strong>
                  <div className="mq">
                    {getSecondaryLabel("50") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col ">
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("39")} width={60} alt="Placeholder" data-id="39"
                  className='borde' />
                <div>
                  <strong>39</strong>
                  <div className="mq">
                    {getSecondaryLabel("39") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("44")} width={60} alt="Placeholder" data-id="44"
                  className='borde' />
                <div>
                  <strong>44</strong>
                  <div className="mq">
                    {getSecondaryLabel("44") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col ">
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("40")} width={60} alt="Placeholder" data-id="40"
                  className='borde' />
                <div>
                  <strong>40</strong>
                  <div className="mq">
                    {getSecondaryLabel("40") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("43")} width={60} alt="Placeholder" data-id="43"
                  className='borde' />
                <div>
                  <strong>43</strong>
                  <div className="mq">
                    {getSecondaryLabel("43") || "\u00A0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row py-5 text-center">

          <div className="col ">

            <input type="image" onClick={img} src={getSrc("64")} width={60} alt="Placeholder" data-id="64"
              className='borde' />
            <div>
              <strong>64</strong>
              <div className="mq">
                {getSecondaryLabel("64") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("65")} width={60} alt="Placeholder" data-id="65"
              className='borde' />
            <div>
              <strong>65</strong>
              <div className="mq">
                {getSecondaryLabel("65") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("45")} width={60} alt="Placeholder" data-id="45"
              className='borde' />
            <div>
              <strong>45</strong>
              <div className="mq">
                {getSecondaryLabel("45") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("46")} width={60} alt="Placeholder" data-id="46"
              className='borde' />
            <div>
              <strong>46</strong>
              <div className="mq">
                {getSecondaryLabel("46") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("47")} width={60} alt="Placeholder" data-id="47"
              className='borde' />
            <div>
              <strong>47</strong>
              <div className="mq">
                {getSecondaryLabel("47") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("48")} width={60} alt="Placeholder" data-id="48"
              className='borde' />
            <div>
              <strong>48</strong>
              <div className="mq">
                {getSecondaryLabel("48") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("69")} width={60} alt="Placeholder" data-id="69"
              className='borde' />
            <div>
              <strong>69</strong>
              <div className="mq">
                {getSecondaryLabel("69") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("70")} width={60} alt="Placeholder" data-id="70"
              className='borde' />
            <div>
              <strong>70</strong>
              <div className="mq">
                {getSecondaryLabel("70") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("71")} width={60} alt="Placeholder" data-id="71"
              className='borde' />
            <div>
              <strong>71</strong>
              <div className="mq">
                {getSecondaryLabel("71") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("72")} width={60} alt="Placeholder" data-id="72"
              className='borde' />
            <div>
              <strong>72</strong>
              <div className="mq">
                {getSecondaryLabel("72") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("73")} width={60} alt="Placeholder" data-id="73"
              className='borde' />
            <div>
              <strong>73</strong>
              <div className="mq">
                {getSecondaryLabel("73") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("74")} width={60} alt="Placeholder" data-id="74"
              className='borde' />
            <div>
              <strong>74</strong>
              <div className="mq">
                {getSecondaryLabel("74") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("75")} width={60} alt="Placeholder" data-id="75"
              className='borde' />
            <div>
              <strong>75</strong>
              <div className="mq">
                {getSecondaryLabel("75") || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("76")} width={60} alt="Placeholder" data-id="76" className='borde' />
            <div>
              <strong>76</strong>
              <div className="mq">
                {getSecondaryLabel("76") || "\u00A0"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acciones principales */}
      <div className="row justify-content-sm-end justify-content-center  mb-3 ">
        <div className="col-auto">
          {/* <button className=" m-1 btn btn-success 2" onClick={handleSaveSnapshotNow}>
            Guardar estado
          </button> */}
        </div>
        <div className="col-auto">
          {/* <button className=" m-1 btn btn-secondary " onClick={handleShowAllSnapshots}>
            Ver estados guardados
          </button> */}
        </div>
        {/* Botón para pedir permiso de notificaciones en móviles */}
        {/* {("Notification" in window && Notification.permission !== "granted" && !notifAsked) && (
          // <button className="btn btn-warning" onClick={handleAskNotif}>
          //   Activar notificaciones
          // </button>
        )
        } */}
        <div className="col-auto">
          {/* <button className="m-1 btn btn-primary " onClick={handleShowObservaciones}>
            Observaciones Proceso
          </button> */}
        </div>
      </div>

      {/* Modal de opciones principales de maquinas */}
      {
        modal.show && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}>
            <div
              style={{
                background: 'white',
                padding: 24,
                borderRadius: 8,
                minWidth: 250,
                textAlign: 'center',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              {!modal.main ? (
                <>
                  <div className="mb-3" style={{ fontSize: 24 }}>¿Escoge opción requerida?</div>
                  {/* Mostrar subopción elegida anteriormente si existe */}
                  {(() => {
                    let id = modal.target && modal.target.getAttribute('data-id');
                    let val = id && imgStates[id];
                    let secondaryIdx = null;
                    let mainIdx = 1;
                    if (val && typeof val === "object" && val.secondary != null) {
                      secondaryIdx = val.secondary;
                      mainIdx = val.main || 1;
                    }
                    if (secondaryIdx != null) {
                      const opts = secondaryOptionsMap[mainIdx] || [];
                      return (
                        <div style={{ marginBottom: 16, fontSize: 22, color: '#007bff' }}>
                          Maquina en revision por: <b>{opts[secondaryIdx]}</b>
                        </div>
                      );
                    }
                    return (
                      <div style={{ marginBottom: 16, fontSize: 22, color: '#888' }}>
                        En Producción
                      </div>
                    );
                  })()}
                  {mainOptions.map(opt => (
                    <button
                      key={opt.main}
                      className={opt.className + " m-2"}
                      style={{ fontSize: 28, padding: '16px 32px', ...(opt.style || {}) }}
                      onClick={() => handleMainOption(opt.main)}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <div>
                    <button className="btn btn-link mt-3" style={{ fontSize: 20 }} onClick={() => setModal({ show: false, target: null, main: null })}>Cancelar</button>
                  </div>
                </>
              ) : (
                <>
                  {/* Si es Produccion, no mostrar subopciones ni botones */}
                  {modal.main === 4 ? (
                    <div className="mb-3" style={{ fontSize: 22, color: "#888" }}>
                      En Producción.
                    </div>
                  ) : (
                    <>
                      <div className="mb-3" style={{ fontSize: 24 }}>Seleccione una causa</div>
                      {getSecondaryOptions().map((label, idx) => (
                        label === "Otros" ? (
                          <button key={idx}
                            className="btn btn-outline-secondary m-2"
                            style={{ fontSize: 24, padding: '12px 24px' }}
                            onClick={() => {
                              // Mostrar input para texto personalizado
                              const custom = window.prompt("Escribe la causa personalizada:");
                              if (custom && custom.trim().length > 0) {
                                handleSecondaryOption(idx, custom.trim());
                              }
                            }}
                          >
                            Otros
                          </button>

                        ) : (
                          <button
                            key={idx}
                            className="btn btn-outline-secondary m-2"
                            style={{ fontSize: 24, padding: '12px 24px' }}
                            onClick={() => handleSecondaryOption(idx)}
                          >
                            {label}
                          </button>
                        )
                      ))}
                    </>
                  )}
                  <div>
                    <button className="btn btn-link mt-3" style={{ fontSize: 20 }} onClick={() => setModal({ show: false, target: null, main: null })}>Cancelar</button>
                    {modal.main !== 4 && (
                      <button className="btn btn-link mt-3" style={{ fontSize: 20 }} onClick={() => setModal({ show: true, target: modal.target, main: null })}>Volver</button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )
      }

      {/* --- Modal para mostrar observaciones generales de los snapshots --- */}
      {/* {
        showObservaciones && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
          }}>
            <div style={{
              background: 'white',
              padding: 24,
              borderRadius: 8,
              minWidth: 320,
              maxWidth: 600,
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowObservaciones(false)}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  zIndex: 1000,
                  fontSize: 22,
                  background: 'transparent',
                  border: 'none',
                  color: '#333',
                  cursor: 'pointer'
                }}
                aria-label="Cerrar"
                title="Cerrar"
              >
                ×
              </button>
              <h4>Observaciones generales</h4>
              {loadingSnapshots ? (
                <div>Cargando...</div>
              ) : (
                observacionesList.length === 0 ? (
                  <div>No hay observaciones generales guardadas.</div>
                ) : (
                  <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                    {observacionesList.map(({ key, fecha, guardadoPor, observaciones }) => (
                      <div key={key} style={{
                        borderBottom: "1px solid #ddd",
                        marginBottom: 12,
                        paddingBottom: 8
                      }}>
                        <div style={{ fontSize: 15, color: "#000" }}>
                          {fecha}
                          {guardadoPor && <> &nbsp;|&nbsp; <b>{guardadoPor}</b></>}
                        </div>
                        <div style={{ textAlign: "start", fontSize: 16, color: "#333", margin: 5, whiteSpace: "pre-line" }}>
                          {observaciones}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
              <div style={{ textAlign: "center", marginTop: 18 }}>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 18, padding: "8px 32px" }}
                  onClick={() => setShowObservaciones(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )
      } */}

      {/* Modal para mostrar todos los snapshots guardados */}

    
      
    </div >
  )
}

export default Mapa