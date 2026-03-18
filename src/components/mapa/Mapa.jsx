import React, { useEffect, useState, useRef } from 'react'
import { set } from 'firebase/database';
import useFirebaseSync from '../../hooks/useFirebaseSync';
import { removeUndefined } from '../../utils/Utils';
import cpd from '../../assets/cpdblanco.png';
import './mapa.css';
import { dbRef } from '../../firebase/firebase-config';


const Mapa = () => {

  const [imgStates, setImgStates] = useState({});
  const isFirstLoad = useRef(true); // Para evitar sobrescribir al cargar por primera vez
  const ignoreNext = useRef(false); // Para evitar bucles de sincronización
  const [modal, setModal] = useState({ show: false, target: null, main: null });


  // Usa el hook personalizado para escuchar cambios en la base de datos
  useFirebaseSync(dbRef, setImgStates, ignoreNext, isFirstLoad);

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