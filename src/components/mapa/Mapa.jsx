import React, { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux';
import { get, set, remove, ref as rtdbRef, onValue } from 'firebase/database';
import useFirebaseSync from '../../hooks/useFirebaseSync';
import useMachineTimers from '../../hooks/useMachineTimers';
import { supabase } from '../pruebas/client';
import { removeUndefined } from '../../utils/Utils';
import cpd from '../../assets/cpdblanco.png';
import './mapa.css';
import { dbRef, dbi } from '../../firebase/firebase-config';
import { mainOptions, mainId } from '../../config/mainOptionsConfig';
import { secondaryOptionsMap } from '../../config/secondaryOptionsConfig';
import { getImageBySrc } from '../../config/machineColorsConfig';
import MapaModal from './MapaModal';
import { closeTimer, canManageMachineReferences } from '../../config/permissions';
import { subscribeMachineReferences, getMachineReference } from '../../config/machineReferencesConfig';
import MachineReferencesAdmin from '../admin/MachineReferencesAdmin';

//import { preParseFinder } from 'echarts/types/src/util/model.js';
// import { requestNotificationPermissionAndToken } from '../../hooks/useToken';
// import { useFCM }  from '../../hooks/useFcm';


const Mapa = () => {

  const uidActual = useSelector(state => state.auth);
  const [imgStates, setImgStates] = useState({});
  const isFirstLoad = useRef(true); // Para evitar sobrescribir al cargar por primera vez
  const ignoreNext = useRef(false); // Para evitar bucles de sincronización
  const syncTimeout = useRef(null);
  const [modal, setModal] = useState({ show: false, target: null, main: null });
  const [askedOperarios, setAskedOperarios] = useState({});
  const [machineReferences, setMachineReferences] = useState({});
  const [showAdminModal, setShowAdminModal] = useState(false);
  //const [refsLoaded, setRefsLoaded] = useState(false);



  // const { notification } = useFCM();

  useFirebaseSync(dbRef, setImgStates, ignoreNext, isFirstLoad);
  const timers = useMachineTimers(imgStates);
  const productionMachineCount = Object.values(imgStates).filter(
    state => state && state.main === 4
  ).length;

  const getTimerLabel = (id) => {
    const timer = timers[id];

    return (
      <div
        style={{
          height: 18,
          lineHeight: "18px",
          marginTop: 2,
          fontSize: 12,
          color: timer ? "#555" : "transparent",
          visibility: timer ? "visible" : "hidden"
        }}
      >
        {timer ? `⏱ ${timer}` : "\u00A0"}
      </div>
    );
  };

  // const activeTimers = Object.entries(imgStates || {})
  //   .filter(([, state]) => state && state.main !== 4 && state.startedAt)
  //   .sort(([idA], [idB]) => idA.localeCompare(idB));


  useEffect(() => {
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

    if (syncTimeout.current) {
      clearTimeout(syncTimeout.current);
    }

    syncTimeout.current = setTimeout(() => {
      set(dbRef, removeUndefined(imgStates))
        .catch((error) => {
          console.error('Error syncing machine states:', error);
        })
        .finally(() => {
          syncTimeout.current = null;
        });
    }, 300);

    return () => {
      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current);
        syncTimeout.current = null;
      }
    };
  }, [imgStates]);

  // --- Realtime listener para operarios preguntados hoy
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const askedRef = rtdbRef(dbi, `askedOperarios/${today}`);
    const unsubscribe = onValue(askedRef, (snapshot) => {
      const val = snapshot.val() || {};
      setAskedOperarios(val);
    }, (err) => {
      console.warn('Error listening askedOperarios:', err);
    });
    return () => {
      try { unsubscribe(); } catch (e) { }
    };
  }, []);

  useEffect(() => {
    limpiarMarkOperarioAsked();
  }, []);


  useEffect(() => {
    const unsubscribe = subscribeMachineReferences((references) => {
      setMachineReferences(references);
    });

    return unsubscribe;
  }, []);
  // Comprueba si un operario ya fue preguntado hoy (lookup en caché)
  const checkOperarioAsked = (nombre) => {
    return Boolean(askedOperarios && askedOperarios[nombre]);
  };

  // Marca que un operario fue preguntado hoy (escribe en RTDB)
  const markOperarioAsked = (nombre, turno) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const pathRef = rtdbRef(dbi, `askedOperarios/${today}/${nombre}`);
      set(pathRef, { ts: Date.now(), turno: turno });
    } catch (e) {
      console.error('markOperarioAsked error', e);
    }
  };

  const limpiarMarkOperarioAsked = async () => {
    const askedRef = rtdbRef(dbi, 'askedOperarios');
    const snapshot = await get(askedRef);

    const data = snapshot.val() || {};
    const hoy = new Date().toISOString().slice(0, 10);

    for (const fecha in data) {
      if (fecha !== hoy) {
        await remove(rtdbRef(dbi, `askedOperarios/${fecha}`));
      }
    }
  };

  function getSecondaryText(main, secondary, secondaryCustom) {
    if (main == null || secondary == null) return null;

    const option = (secondaryOptionsMap[main] || [])[secondary];
    const label = typeof option === "object" ? option.label : option;

    if (!label) return null;

    return label === "Otros"
      ? secondaryCustom || label
      : label;
  }



  // Abre el modal de opciones para una máquina
  function img(event) {
    setModal({ show: true, target: event.target, main: null });
  }

  // Devuelve la etiqueta de la subopción seleccionada para una máquina
  function getSecondaryLabel(id) {
    const val = imgStates[id];

    if (!val || typeof val !== "object" || val.main == null) {
      return "";
    }

    // No mostrar texto para Inicio/Fin de producción
    if (val.main === 4 || val.main === 7) {
      return "";
    }

    const mainoption = mainOptions.find(opt => opt.main === val.main) || "";
    const mainLabel = mainoption.label || "";

    if (val.secondary == null) {
      return mainLabel;
    }

    const options = secondaryOptionsMap[val.main] || [];
    const selectedOption = options[val.secondary];

    // Si es objeto, toma únicamente el label.
    // Si es texto, utiliza directamente ese texto.
    const label = typeof selectedOption === "object"
      ? selectedOption.label
      : selectedOption;

    if (label === "Otros" && val.secondaryCustom) {
      return val.secondaryCustom;
    }

    const displayLabel = label || mainLabel;

    if (displayLabel.length > 18) {
      return displayLabel.slice(0, 15) + "...";
    }

    return displayLabel;
  }

  // Devuelve la imagen correspondiente al estado de la máquina
  function getSrc(id) {
    const val = imgStates[id];
    if (!val || val.main == null) return cpd;
    return getImageBySrc(val.main, cpd);
  }

  function getSecondaryOptions() {
    if (modal.main === 4 || modal.main === 7) return [];
    return secondaryOptionsMap[modal.main] || [];
  }

  const getOperarioTurno = (nombre) => {
    if (!nombre) return null;
    const turnoFirebase = askedOperarios?.[nombre]?.turno;
    if (turnoFirebase != null && turnoFirebase !== '') {
      return turnoFirebase;
    }
    return modal.turno ?? null;
  };

  const closeModal = () => setModal({ show: false, target: null, main: null });
  const backToMainModal = () => setModal(prev => ({ ...prev, main: null, show: true }));

  function getEffectiveCode(main, secondary) {
    const mainOption = mainOptions.find(option => option.main === main);
    const secondaryOption = (secondaryOptionsMap[main] || [])[secondary];

    if (
      secondaryOption &&
      typeof secondaryOption === "object" &&
      secondaryOption.code
    ) {
      return secondaryOption.code;
    }

    return mainOption?.code || null;
  }
  // Maneja la selección de una opción principal en el modal
  function handleMainOption(main) {
    // const selectedMain = mainOptions.find(opt => opt.main === main);
    const id = modal.target.getAttribute('data-id');
    const options = secondaryOptionsMap[main] || [];
    let src = getSrc(id);

    if ((main === 4 || main === 7) && modal.target) {
      const estadoAnterior = imgStates[id] || {};
      const mainAnterior = estadoAnterior.main;
      const tienePermiso = closeTimer(mainAnterior, uidActual?.uid);
      if (!tienePermiso) {
        window.alert('No tienes permiso para cerrar este tiempo.');
        return;
      }
      setImgStates(prev => {
        const prevState = prev[id] || {};
        const now = Date.now();
        const operadorActual = prevState.operador ?? modal.operador ?? imgStates[id]?.operador ?? null;
        const turno = prevState.turno ?? modal.turno ?? getOperarioTurno(operadorActual);
        if (prevState.startedAt) {
          const elapsedSeconds = prevState.startedAt ? Math.round((now - prevState.startedAt) / 1000) : prevState.lastElapsedSeconds || 0;
          (async () => {
            try {
              const { error } = await supabase.from('historial_pruebas').insert([{
                COD_T: mainId[id] ?? id,
                COD_O: getEffectiveCode(prevState.main, prevState.secondary),
                estadoprincipal: mainOptions.find(option => option.main === prevState.main)?.label ?? null,
                causa: getSecondaryText(prevState.main, prevState.secondary, prevState.secondaryCustom),
                causa_custom: prevState.secondaryCustom ?? null,
                start_at: prevState.startedAt ? new Date(prevState.startedAt).toISOString() : null,
                end_at: new Date(now).toISOString(),
                elapsed_seconds: elapsedSeconds,
                MALAS: operadorActual,
                TURNO: turno,
                H_I: prevState.startedAt ? new Date(prevState.startedAt).getHours() : null,
                M_I: prevState.startedAt ? new Date(prevState.startedAt).getMinutes() : null,
                H_T: now ? new Date(now).getHours() : null,
                M_T: now ? new Date(now).getMinutes() : null,
              }]);
              if (error) {
                console.error('Supabase insert error:', error);
              }
            } catch (error) {
              console.error('Error inesperado conectando con Supabase:', error);
            }
          })();
        }
        return {
          ...prev,
          [id]: {
            src,
            secondary: null,
            main,
          }
        }

      });
      // fcmSendNotification(
      //   `Máquina ${id}`,
      //   `Producción`,
      //   id
      // );
      setModal({ show: false, target: null, main: null });
      return;
    }

    if (options.length === 0) {
      const src = getSrc(id);

      setImgStates(prev => {
        const prevState = prev[id] || {};
        const now = Date.now();

        return {
          ...prev,
          [id]: {
            src,
            secondary: null,
            main,
            secondaryCustom: undefined,
            startedAt: main === 5 || main === 12
              ? null
              : prevState.startedAt || now,
            operador: modal.operador ?? prevState.operador,
            turno: modal.turno ?? prevState.turno
          }
        };
      });

      setTimeout(() => {
        setModal({ show: false, target: null, main: null });
      }, 0);

      return;
    }

    setModal((prev) => ({ ...prev, main }));
  }



  // Maneja la selección de una subopción (incluye opción personalizada "Otros")
  function handleSecondaryOption(secondaryIdx, customText) {
    if (!modal.target || !modal.main) return;
    const id = modal.target.getAttribute('data-id');
    let src = getSrc(id);
    const now = Date.now();
    setImgStates(prev => {
      const prevState = prev[id] || {};
      const selectedOption = getSecondaryOptions()[secondaryIdx];
      const selectedLabel = typeof selectedOption === "object"
        ? selectedOption.label
        : selectedOption;
      return {
        ...prev,
        [id]: {
          src,
          secondary: secondaryIdx,
          main: modal.main,
          secondaryCustom: selectedLabel === "Otros" ? customText : undefined,
          startedAt: prevState.startedAt || now,
          operador: modal.operador ?? prevState.operador,
          turno: modal.turno ?? prevState.turno
        }
      };
    });
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
      {canManageMachineReferences(uidActual?.uid) && (
        <div className="text-center mb-3" style={{ fontSize: 20, color: '#198754' }}>
          Máquinas en producción: <strong>{productionMachineCount}</strong>
        </div>
      )
      }
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
            "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19", "S20", "S21", "S22", "S23", "S24", "S25",
            "28", "30", "33", "34", "35", "36", "39", "43", "44", "46", "48", "49", "50", "51", "52", "54", "55", "56", "57", "58", "64", "65", "66", "67", "69", "70", "71", "72", "73", "74", "75", "76"
          ].map(id => (
            <div key={id} style={{ marginBottom: 2, width: 90, textAlign: "center" }}>
              <input
                type="image"
                onClick={img}
                src={getSrc(id)}
                width={["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19", "S20", "S21", "S22", "S23", "S24", "S25"].includes(id) ? 90 : 60}
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
              <div className='ref'>
                {getMachineReference(machineReferences, id)}
              </div>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>
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
              {getTimerLabel(id)}
            </div>
          ))}
        </div>
      </div>
      {/* Grid de máquinas para PC/tablet */}
      <div className="px-4 d-none d-md-block">
        <div className="row py-4 text-center">
          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S24")} width={90} alt="Placeholder" data-id="S24"
              className='borde' />
            <div>
              <strong>S24</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S24")}
              </div>
              <div className="mq">
                {getSecondaryLabel("S24") || "\u00A0"}
              </div>
              {getTimerLabel("S24")}
            </div>
          </div>


          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S23")} width={90} alt="Placeholder" data-id="S23"
              className='borde' />
            <div>
              <strong>S23</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S23")}
              </div>
              <div className="mq">
                {getSecondaryLabel("S23") || "\u00A0"}
              </div>
              {getTimerLabel("S23")}
            </div>
          </div>
          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S3")} width={90} alt="Placeholder" data-id="S3"
              className='borde' />
            <div>
              <strong>S3</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S3")}
              </div>

              <div className="mq">
                {getSecondaryLabel("S3") || "\u00A0"}
              </div>
              {getTimerLabel("S3")}
            </div>
          </div>
          <div className="col p-0">

            <input type="image" onClick={img} src={getSrc("S2")} width={90} alt="Placeholder" data-id="S2"
              className='borde' />
            <div>
              <strong>S2</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S2")}
              </div>

              <div className="mq">
                {getSecondaryLabel("S2") || "\u00A0"}
              </div>
              {getTimerLabel("S2")}
            </div>
          </div>
          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S1")} width={90} alt="Placeholder" data-id="S1"
              className='borde' />
            <div>
              <strong>S1</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S1")}
              </div>

              <div className="mq">
                {getSecondaryLabel("S1") || "\u00A0"}
              </div>
              {getTimerLabel("S1")}
            </div>
          </div>
          <div className="col p-0">

            <input type="image" onClick={img} src={getSrc("S6")} width={90} alt="Placeholder" data-id="S6"
              className='borde' />
            <div>
              <strong>S6</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S6")}
              </div>

              <div className="mq">
                {getSecondaryLabel("S6") || "\u00A0"}
              </div>
              {getTimerLabel("S6")}
            </div>
          </div>
          <div className="col  p-0">
            <input type="image" onClick={img} src={getSrc("S7")} width={90} alt="Placeholder" data-id="S7"
              className='borde' />
            <div>
              <strong>S7</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S7")}
              </div>

              <div className="mq">
                {getSecondaryLabel("S7") || "\u00A0"}
              </div>
              {getTimerLabel("S7")}
            </div>
          </div>
          <div className="col p-0">

            <input type="image" onClick={img} src={getSrc("S8")} width={90} alt="Placeholder" data-id="S8"
              className='borde' />
            <div>
              <strong>S8</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S8")}
              </div>

              <div className="mq">
                {getSecondaryLabel("S8") || "\u00A0"}
              </div>
              {getTimerLabel("S8")}
            </div>
          </div>
          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S9")} width={90} alt="Placeholder" data-id="S9"
              className='borde' />
            <div>
              <strong>S9</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S9")}
              </div>

              <div className="mq">
                {getSecondaryLabel("S9") || "\u00A0"}
              </div>
              {getTimerLabel("S9")}
            </div>
          </div>
          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S10")} width={90} alt="Placeholder" data-id="S10"
              className='borde' />
            <div>
              <strong>S10</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S10")}
              </div>

              <div className="mq">
                {getSecondaryLabel("S10") || "\u00A0"}
              </div>
              {getTimerLabel("S10")}
            </div>
          </div>
          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S11")} width={90} alt="Placeholder" data-id="S11"
              className='borde' />
            <div>
              <strong>S11</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S11")}
              </div>

              <div className="mq">
                {getSecondaryLabel("S11") || "\u00A0"}
              </div>
              {getTimerLabel("S11")}
            </div>
          </div>
          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S12")} width={90} alt="Placeholder" data-id="S12"
              className='borde' />
            <div>
              <strong>S12</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S12")}
              </div>

              <div className="mq">
                {getSecondaryLabel("S12") || "\u00A0"}
              </div>
              {getTimerLabel("S12")}
            </div>
          </div>
          <div className="col p-0">

            <input type="image" onClick={img} src={getSrc("S13")} width={90} alt="Placeholder" data-id="S13"
              className='borde' />
            <div>
              <strong>S13</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S13")}
              </div>

              <div className="mq">
                {getSecondaryLabel("S13") || "\u00A0"}
              </div>
              {getTimerLabel("S13")}
            </div>
          </div>
          <div className="col p-0">

            <input type="image" onClick={img} src={getSrc("S14")} width={90} alt="Placeholder" data-id="S14"
              className='borde' />
            <div>
              <strong>S14</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S14")}
              </div>

              <div className="mq">
                {getSecondaryLabel("S14") || "\u00A0"}
              </div>
              {getTimerLabel("S14")}
            </div>
          </div>
          <div className="col p-0">

            <input type="image" onClick={img} src={getSrc("S15")} width={90} alt="Placeholder" data-id="S15"
              className='borde' />
            <div>
              <strong>S15</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S15")}
              </div>

              <div className="mq">
                {getSecondaryLabel("S15") || "\u00A0"}
              </div>
              {getTimerLabel("S15")}
            </div>
          </div>

        </div>

        <div className="row py-5 text-center no-gutters align-items-start">

          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S25")} width={90} alt="Placeholder" data-id="S25"
              className='borde' />
            <div>
              <strong>S25</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S25")}
              </div>

              <div style={{ fontSize: 14, color: "#888" }}>{getSecondaryLabel("S25")}</div>
              {getTimerLabel("S25")}
            </div>
          </div>

          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S22")} width={90} alt="Placeholder" data-id="S22"
              className='borde' />
            <div>
              <strong>S22</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S22")}
              </div>

              <div style={{ fontSize: 14, color: "#888" }}>{getSecondaryLabel("S22")}</div>
              {getTimerLabel("S22")}
            </div>
          </div>

          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S21")} width={90} alt="Placeholder" data-id="S21"
              className='borde' />
            <div>
              <strong>S21</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S21")}
              </div>

              <div style={{ fontSize: 14, color: "#888" }}>{getSecondaryLabel("S21")}</div>
              {getTimerLabel("S21")}
            </div>
          </div>

          <div className="col p-0 ">

            <input type="image" onClick={img} src={getSrc("S20")} width={90} alt="Placeholder" data-id="S20"
              className='borde' />
            <div>
              <strong>S20</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S20")}
              </div>

              <div style={{ fontSize: 14, color: "#888" }}>{getSecondaryLabel("S20")}</div>
              {getTimerLabel("S20")}
            </div>
          </div>

          <div className="col p-0 " >

            <input type="image" onClick={img} src={getSrc("S19")} width={90} alt="Placeholder" data-id="S19"
              className='borde' />
            <div>
              <strong>S19</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S19")}
              </div>

              <div style={{ fontSize: 14, color: "#888" }}>{getSecondaryLabel("S19")}</div>
              {getTimerLabel("S19")}
            </div>
          </div>
          <div className="col p-0 " >

            <input type="image" onClick={img} src={getSrc("S18")} width={90} alt="Placeholder" data-id="S18"
              className='borde' />
            <div>
              <strong>S18</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S18")}
              </div>

              <div style={{ fontSize: 14, color: "#888" }}>{getSecondaryLabel("S18")}</div>
              {getTimerLabel("S18")}
            </div>
          </div>
          <div className="col p-0 " >

            <input type="image" onClick={img} src={getSrc("S17")} width={90} alt="Placeholder" data-id="S17"
              className='borde' />
            <div>
              <strong>S17</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S17")}
              </div>

              <div style={{ fontSize: 14, color: "#888" }}>{getSecondaryLabel("S17")}</div>
              {getTimerLabel("S17")}
            </div>
          </div>
          <div className="col p-0 " >

            <input type="image" onClick={img} src={getSrc("S16")} width={90} alt="Placeholder" data-id="S16"
              className='borde' />
            <div>
              <strong>S16</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S16")}
              </div>

              <div style={{ fontSize: 14, color: "#888" }}>{getSecondaryLabel("S16")}</div>
              {getTimerLabel("S16")}
            </div>
          </div>
          <div className="col p-0 " >
            <input type="image" onClick={img} src={getSrc("S4")} width={90} alt="Placeholder" data-id="S4"
              className='borde' />
            <div>
              <strong>S4</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S4")}
              </div>

              <div style={{ fontSize: 14, color: "#888" }}>{getSecondaryLabel("S4")}</div>
              {getTimerLabel("S4")}
            </div>
          </div>
          <div className="col p-0">

            <input type="image" onClick={img} src={getSrc("S5")} width={90} alt="Placeholder" data-id="S5"
              className='borde' />
            <div>
              <strong>S5</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "S5")}
              </div>

              <div style={{ fontSize: 14, color: "#888" }}>{getSecondaryLabel("S5")}</div>
              {getTimerLabel("S5")}
            </div>
          </div>

          <div className="col ">
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("66")} width={60} alt="Placeholder" data-id="66"
                  className='borde' />
                <div>
                  <strong>66</strong>
                  <div className='ref'>
                    {getMachineReference(machineReferences, "S11")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("66") || "\u00A0"}
                  </div>
                  {getTimerLabel("66")}
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("58")} width={60} alt="Placeholder" data-id="58"
                  className='borde' />
                <div>
                  <strong>58</strong>
                  <div className='ref'>
                    {getMachineReference(machineReferences, "58")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("58") || "\u00A0"}
                  </div>
                  {getTimerLabel("58")}
                </div>
              </div>
            </div>
          </div>
          <div className="col ">
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("67")} width={60} alt="Placeholder" data-id="67"
                  className='borde' />
                <div>
                  <strong>67</strong>
                  <div className='ref'>
                    {getMachineReference(machineReferences, "67")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("67") || "\u00A0"}
                  </div>
                  {getTimerLabel("67")}
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("57")} width={60} alt="Placeholder" data-id="57"
                  className='borde' />
                <div>
                  <strong>57</strong>
                  <div className='ref'>
                    {getMachineReference(machineReferences, "57")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("57") || "\u00A0"}
                  </div>
                  {getTimerLabel("57")}
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
                  <div className='ref'>
                    {getMachineReference(machineReferences, "28")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("28") || "\u00A0"}
                  </div>
                  {getTimerLabel("28")}
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("56")} width={60} alt="Placeholder" data-id="56"
                  className='borde' />
                <div>
                  <strong>56</strong>
                  <div className='ref'>
                    {getMachineReference(machineReferences, "56")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("56") || "\u00A0"}
                  </div>
                  {getTimerLabel("56")}
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
                  <div className='ref'>
                    {getMachineReference(machineReferences, "30")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("30") || "\u00A0"}
                  </div>
                  {getTimerLabel("30")}
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("54")} width={60} alt="Placeholder" data-id="54"
                  className='borde' />
                <div>
                  <strong>54</strong>
                  <div className='ref'>
                    {getMachineReference(machineReferences, "54")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("54") || "\u00A0"}
                  </div>
                  {getTimerLabel("54")}
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
                  <div className='ref'>
                    {getMachineReference(machineReferences, "33")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("33") || "\u00A0"}
                  </div>
                  {getTimerLabel("33")}
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("52")} width={60} alt="Placeholder" data-id="52"
                  className='borde' />
                <div>
                  <strong>52</strong>
                  <div className='ref'>
                    {getMachineReference(machineReferences, "52")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("52") || "\u00A0"}
                  </div>
                  {getTimerLabel("52")}
                </div>
              </div>
            </div>
          </div>
          <div className="col ">
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("34")} width={60} alt="Placeholder" data-id="34"
                  className='borde' />
                <div>
                  <strong>34</strong>
                  <div className='ref'>
                    {getMachineReference(machineReferences, "34")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("34") || "\u00A0"}
                  </div>
                  {getTimerLabel("34")}
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("51")} width={60} alt="Placeholder" data-id="51"
                  className='borde' />
                <div>
                  <strong>51</strong>
                  <div className='ref'>
                    {getMachineReference(machineReferences, "51")}
                  </div>

                  <div className='mq'>
                    {getSecondaryLabel("51") || "\u00A0"}
                  </div>
                  {getTimerLabel("51")}
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
                  <div className='ref'>
                    {getMachineReference(machineReferences, "35")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("35") || "\u00A0"}
                  </div>
                  {getTimerLabel("35")}
                </div>
              </div>
            </div>

            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("50")} width={60} alt="Placeholder" data-id="50"
                  className='borde' />
                <div>
                  <strong>50</strong>
                  <div className='ref'>
                    {getMachineReference(machineReferences, "50")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("50") || "\u00A0"}
                  </div>
                  {getTimerLabel("50")}
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
                  <div className='ref'>
                    {getMachineReference(machineReferences, "36")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("36") || "\u00A0"}
                  </div>
                  {getTimerLabel("36")}
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("44")} width={60} alt="Placeholder" data-id="44"
                  className='borde' />
                <div>
                  <strong>44</strong>
                  <div className='ref'>
                    {getMachineReference(machineReferences, "44")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("44") || "\u00A0"}
                  </div>
                  {getTimerLabel("44")}
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
                  <div className='ref'>
                    {getMachineReference(machineReferences, "39")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("39") || "\u00A0"}
                  </div>
                  {getTimerLabel("39")}
                </div>
              </div>
            </div>
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("43")} width={60} alt="Placeholder" data-id="43"
                  className='borde' />
                <div>
                  <strong>43</strong>
                  <div className='ref'>
                    {getMachineReference(machineReferences, "43")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("43") || "\u00A0"}
                  </div>
                  {getTimerLabel("43")}
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
              <div className='ref'>
                {getMachineReference(machineReferences, "64")}
              </div>

              <div className="mq">
                {getSecondaryLabel("64") || "\u00A0"}
              </div>
              {getTimerLabel("64")}
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("65")} width={60} alt="Placeholder" data-id="65"
              className='borde' />
            <div>
              <strong>65</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "65")}
              </div>

              <div className="mq">
                {getSecondaryLabel("65") || "\u00A0"}
              </div>
              {getTimerLabel("65")}
            </div>
          </div>
          <div className="col ">

            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("55")} width={60} alt="Placeholder" data-id="55"
                  className='borde' />
                <div>
                  <strong>55</strong>
                  <div className='ref'>
                    {getMachineReference(machineReferences, "55")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("55") || "\u00A0"}
                  </div>
                  {getTimerLabel("55")}
                </div>
              </div>
            </div>
          </div>
          <div className="col ">
            <input type="image" onClick={img} src={getSrc("46")} width={60} alt="Placeholder" data-id="46"
              className='borde' />
            <div>
              <strong>46</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "46")}
              </div>

              <div className="mq">
                {getSecondaryLabel("46") || "\u00A0"}
              </div>
              {getTimerLabel("46")}
            </div>
          </div>
          <div className="col ">
            <div className="row ">
              <div className="col " >

                <input type="image" onClick={img} src={getSrc("49")} width={60} alt="Placeholder" data-id="49"
                  className='borde' />
                <div>
                  <strong>49</strong>
                  <div className='ref'>
                    {getMachineReference(machineReferences, "49")}
                  </div>

                  <div className="mq">
                    {getSecondaryLabel("49") || "\u00A0"}
                  </div>
                  {getTimerLabel("49")}
                </div>
              </div>
            </div>
          </div>
          <div className="col ">
            <input type="image" onClick={img} src={getSrc("48")} width={60} alt="Placeholder" data-id="48"
              className='borde' />
            <div>
              <strong>48</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "48")}
              </div>

              <div className="mq">
                {getSecondaryLabel("48") || "\u00A0"}
              </div>
              {getTimerLabel("48")}
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("69")} width={60} alt="Placeholder" data-id="69"
              className='borde' />
            <div>
              <strong>69</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "69")}
              </div>

              <div className="mq">
                {getSecondaryLabel("69") || "\u00A0"}
              </div>
              {getTimerLabel("69")}
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("70")} width={60} alt="Placeholder" data-id="70"
              className='borde' />
            <div>
              <strong>70</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "70")}
              </div>

              <div className="mq">
                {getSecondaryLabel("70") || "\u00A0"}
              </div>
              {getTimerLabel("70")}
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("71")} width={60} alt="Placeholder" data-id="71"
              className='borde' />
            <div>
              <strong>71</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "71")}
              </div>

              <div className="mq">
                {getSecondaryLabel("71") || "\u00A0"}
              </div>
              {getTimerLabel("71")}
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("72")} width={60} alt="Placeholder" data-id="72"
              className='borde' />
            <div>
              <strong>72</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "72")}
              </div>

              <div className="mq">
                {getSecondaryLabel("72") || "\u00A0"}
              </div>
              {getTimerLabel("72")}
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("73")} width={60} alt="Placeholder" data-id="73"
              className='borde' />
            <div>
              <strong>73</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "73")}
              </div>

              <div className="mq">
                {getSecondaryLabel("73") || "\u00A0"}
              </div>
              {getTimerLabel("73")}
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("74")} width={60} alt="Placeholder" data-id="74"
              className='borde' />
            <div>
              <strong>74</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "74")}
              </div>

              <div className="mq">
                {getSecondaryLabel("74") || "\u00A0"}
              </div>
              {getTimerLabel("74")}
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("75")} width={60} alt="Placeholder" data-id="75"
              className='borde' />
            <div>
              <strong>75</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "75")}
              </div>

              <div className="mq">
                {getSecondaryLabel("75") || "\u00A0"}
              </div>
              {getTimerLabel("75")}
            </div>
          </div>
          <div className="col ">

            <input type="image" onClick={img} src={getSrc("76")} width={60} alt="Placeholder" data-id="76" className='borde' />
            <div>
              <strong>76</strong>
              <div className='ref'>
                {getMachineReference(machineReferences, "76")}
              </div>

              <div className="mq">
                {getSecondaryLabel("76") || "\u00A0"}
              </div>
              {getTimerLabel("76")}
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acciones principales */}

      <div className="row justify-content-sm-end justify-content-center  mb-3 ">

        <div className="col-auto">
          {canManageMachineReferences(uidActual?.uid) && (
            <button
              className="m-1 btn btn-info"
              onClick={() => setShowAdminModal(true)}
              title="Gestionar referencias de máquinas"
            >
              ⚙ Gestionar referencias
            </button>
          )}
        </div>
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
      <MapaModal
        modal={modal}
        imgStates={imgStates}
        mainOptions={mainOptions}
        secondaryOptionsMap={secondaryOptionsMap}
        handleMainOption={handleMainOption}
        handleSecondaryOption={handleSecondaryOption}
        onClose={closeModal}
        onBack={backToMainModal}
        setModal={setModal}
        checkOperarioAsked={checkOperarioAsked}
        markOperarioAsked={markOperarioAsked}


      />

      <MachineReferencesAdmin
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />

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
                          {guardadoPor && <div> &nbsp;|&nbsp; <b>{guardadoPor}</b></div>}
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