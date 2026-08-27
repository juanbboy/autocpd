import React from 'react';

const MapaModal = ({
    modal,
    imgStates,
    mainOptions,
    secondaryOptionsMap,
    handleMainOption,
    handleSecondaryOption,
    onClose,
    onBack,
    setModal,
    // callbacks supplied by parent `Mapa` to persist/check across terminals (realtime)
    checkOperarioAsked,
    markOperarioAsked,
    listaOperarios = ["632", "609", "606", "636", "637", "615", "603", "624", "602"]
}) => {
    if (!modal.show) return null;

    // estado actual de la máquina
    const currentId = modal.target?.getAttribute('data-id');
    const currentVal = currentId ? imgStates[currentId] : null;

    // Extrae "main" actual de la máquina (si no tiene, asumimos un valor por defecto o null)
    const estadoActualMaquina = currentVal && typeof currentVal === 'object' ? currentVal.main : null;

    // 2. Evaluamos la regla de negocio: ¿Debe pedir operador obligatoriamente?
    // Si la máquina NO está en estado 4 y tampoco en estado 7, NO debe pedir operador.
    // Por el contrario, si está en 4, en 7, o es una máquina nueva (null), sí lo pide.
    const requiereOperador = estadoActualMaquina === 4 || estadoActualMaquina === 7 || estadoActualMaquina === null;

    // Use callbacks passed from parent `Mapa` to check/mark operarios asked today
    // Parent should persist this in realtime so all terminals see the same state.
    const isOperarioAskedToday = (nombre) => {
        if (typeof checkOperarioAsked === 'function') {
            try { return checkOperarioAsked(nombre); } catch (e) { console.warn(e); return false; }
        }
        // If parent doesn't provide the callback, default to false (will ask turno)
        console.warn('checkOperarioAsked not provided; defaulting to ask turno.');
        return false;
    };
    const markOperarioAskedToday = (nombre, turno) => {
        if (typeof markOperarioAsked === 'function') {
            try { return markOperarioAsked(nombre, turno); } catch (e) { console.warn(e); }
        } else {
            console.warn('markOperarioAsked not provided; no cross-terminal persistence.');
        }
    };

    const getSecondaryOptions = () => {
        if (modal.main && secondaryOptionsMap[modal.main]) {
            return secondaryOptionsMap[modal.main];
        }
        return [];
    };

    // const getSecondaryOptions = () => {
    //     const selectedMain = mainOptions.find(opt => opt.main === modal.main);
    //     if (selectedMain.hasSecondary === false) return [];
    //     return secondaryOptionsMap[modal.main];
    // };

    const handleSeleccionarOperador = (nombre) => {
        const alreadyAsked = isOperarioAskedToday(nombre);
        setModal(prev => ({ ...prev, operador: nombre, askTurno: !alreadyAsked, turno: alreadyAsked ? prev.turno : null }));
    };

    const handleSeleccionarTurno = (turno) => {
        const operador = modal && modal.operador;
        setModal(prev => ({ ...prev, turno, askTurno: false }));
        if (operador) {
            markOperarioAskedToday(operador, turno);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: 'white', padding: 24, borderRadius: 8, minWidth: 320, textAlign: 'center', maxHeight: '90vh', overflowY: 'auto' }}>

                {/* CONDICIONAL: SI REQUIERE OPERADOR Y AÚN NO SE HA SELECCIONADO, MUESTRA LA LISTA
                    También muestra la vista para seleccionar turno si el operario fue elegido
                    y aún no tiene turno y debe preguntarse hoy. */}
                {requiereOperador && (!modal.operador || (modal.askTurno && !modal.turno)) ? (
                    modal.operador && modal.askTurno && !modal.turno ? (
                        <div>

                            <div className="d-flex flex-wrap justify-content-center my-3">
                                {[
                                    { mostrar: '6-2', interno: '1' },
                                    { mostrar: '2-10', interno: '2' },
                                    { mostrar: '10-6', interno: '3' },
                                    { mostrar: '6-18', interno: '4' },
                                    { mostrar: '18-6', interno: '5' }
                                ].map(turno => (
                                    <button
                                        key={turno.mostrar}
                                        type="button"
                                        className="btn btn-outline-primary m-2"
                                        style={{ fontSize: 22, padding: '12px 20px' }}
                                        onClick={() => handleSeleccionarTurno(turno.interno)} // <-- Envía el valor interno
                                    >
                                        {turno.mostrar} {/* <-- Muestra el texto amigable */}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary m-2"
                                    style={{ fontSize: 22, padding: '12px 20px' }}
                                    onClick={() => {
                                        const custom = window.prompt('Escribe tu turno:');
                                        // En el caso de "Otro", puedes enviar el texto directo o procesarlo si es necesario
                                        if (custom && custom.trim()) handleSeleccionarTurno(custom.trim());
                                    }}
                                >
                                    Otro
                                </button>
                            </div>


                            {/* <div className="mb-3" style={{ fontSize: 24, fontWeight: 'bold' }}>¿Cuál es tu turno?</div>
                            <p style={{ color: '#666', fontSize: 16 }}>Selecciona el turno correspondiente:</p>
                            <div className="d-flex flex-wrap justify-content-center my-3">
                                {['6-2', '2-10', '10-6', "6-18", "18-6"].map(t => (
                                    <button key={t} type="button" className="btn btn-outline-primary m-2" style={{ fontSize: 22, padding: '12px 20px' }} onClick={() => handleSeleccionarTurno(t)}>
                                        {t}
                                    </button>
                                ))}
                                <button type="button" className="btn btn-outline-secondary m-2" style={{ fontSize: 22, padding: '12px 20px' }} onClick={() => {
                                    const custom = window.prompt('Escribe tu turno:');
                                    if (custom && custom.trim()) handleSeleccionarTurno(custom.trim());
                                }}>
                                    Otro
                                </button>
                            </div>
                            <div>
                                <button type="button" className="btn btn-link mt-2" style={{ fontSize: 20 }} onClick={onClose}>
                                    Cancelar
                                </button>
                            </div> */}
                        </div>
                    ) : (
                        <div>
                            <div className="mb-3" style={{ fontSize: 24, fontWeight: 'bold' }}>¿Quién realiza el reporte?</div>
                            <p style={{ color: '#666', fontSize: 16 }}>Selecciona tu nombre de la lista:</p>
                            <div className="d-flex flex-wrap justify-content-center my-3">
                                {listaOperarios.map((nombre) => (
                                    <button key={nombre} type="button" className="btn btn-outline-primary m-2" style={{ fontSize: 28, padding: '16px 32px', fontWeight: '500' }} onClick={() => handleSeleccionarOperador(nombre)}>
                                        {nombre}
                                    </button>
                                ))}
                            </div>
                            <div>
                                <button type="button" className="btn btn-link mt-2" style={{ fontSize: 20 }} onClick={onClose}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )
                ) : (
                    /* SI LA MÁQUINA YA ESTABA EN OTRO ESTADO (DIFERENTE A 4 O 7), PASA DIRECTO AQUÍ */
                    <div>
                        {modal.operador && (
                            <div style={{ fontSize: 14, color: '#28a745', marginBottom: 15, background: '#e8f5e9', padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>
                                👤 Operario: <b>{modal.operador}</b>
                            </div>
                        )}

                        {!modal.main ? (
                            /* VISTA 1: BOTONES DEL ESTADO PRINCIPAL */
                            <div>
                                <div className="mb-3" style={{ fontSize: 24 }}>¿Escoge opción requerida?</div>
                                {(() => {
                                    let secondaryIdx = null;
                                    let mainIdx = 1;
                                    if (currentVal && typeof currentVal === 'object' && currentVal.secondary != null) {
                                        secondaryIdx = currentVal.secondary;
                                        mainIdx = currentVal.main || 1;
                                    }
                                    if (secondaryIdx != null) {
                                        const opts = secondaryOptionsMap[mainIdx] || [];
                                        return (
                                            <div style={{ marginBottom: 16, fontSize: 22, color: '#007bff' }}>
                                                Maquina en revision por: <b>
                                                    {typeof opts[secondaryIdx] === "object"
                                                        ? opts[secondaryIdx].label
                                                        : opts[secondaryIdx]}
                                                </b>
                                            </div>
                                        );
                                    }
                                    return <div style={{ marginBottom: 16, fontSize: 22, color: '#888' }}>En Producción</div>;
                                })()}

                                {mainOptions.map(opt => (
                                    <button key={opt.main} className={opt.className + ' m-2'} style={{ fontSize: 28, padding: '16px 32px', ...(opt.style || {}) }} onClick={() => handleMainOption(opt.main, modal.operador)}>
                                        {opt.label}
                                    </button>
                                ))}
                                <div>
                                    <button className="btn btn-link mt-3" style={{ fontSize: 20 }} onClick={onClose}>Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            /* VISTA 2: BOTONES DE CAUSAS SECUNDARIAS */
                            <div>
                                {modal.main === 4 ? (
                                    <div className="mb-3" style={{ fontSize: 22, color: '#888' }}>En Producción.</div>
                                ) : (
                                    <div>
                                        <div className="mb-3" style={{ fontSize: 24 }}>Seleccione una causa</div>
                                        {
                                            getSecondaryOptions().map((option, idx) => {
                                                const label = typeof option === "object" ? option.label : option;
                                                return label === 'Otros' ? (
                                                    <button key={label} className="btn btn-outline-secondary m-2" style={{ fontSize: 28, padding: '16px 32px' }} onClick={() => {
                                                        const custom = window.prompt('Escribe la causa personalizada:');
                                                        if (custom && custom.trim().length > 0) {
                                                            handleSecondaryOption(idx, custom.trim(), modal.operador);
                                                        }
                                                    }}>
                                                        Otros
                                                    </button>
                                                ) : (
                                                    <button key={label} className="btn btn-outline-secondary m-2" style={{ fontSize: 28, padding: '16px 32px' }} onClick={() => handleSecondaryOption(idx, undefined, modal.operador)}>
                                                        {label}
                                                    </button>
                                                )
                                            })}
                                    </div>
                                )}
                                <div>
                                    <button className="btn btn-link mt-3" style={{ fontSize: 20 }} onClick={onClose}>Cancelar</button>
                                    {modal.main !== 4 && modal.main !== 7 && (
                                        <button className="btn btn-link mt-3" style={{ fontSize: 20 }} onClick={onBack}>Volver</button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapaModal;
