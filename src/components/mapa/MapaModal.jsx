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
    // 1. Agregamos una lista de operarios por defecto (puedes modificar estos nombres)
    listaOperarios = ["632", "609", "606", "636", "637", "615", "603", "624", "602"]
}) => {

    if (!modal.show) return null;

    const currentId = modal.target?.getAttribute('data-id');
    const currentVal = currentId ? imgStates[currentId] : null;

    const getSecondaryOptions = () => {
        if (modal.main === 4 || modal.main === 7) return [];
        if (modal.main && secondaryOptionsMap[modal.main]) {
            return secondaryOptionsMap[modal.main];
        }
        return [];
    };

    // 2. Al hacer clic sobre el botón de un operario, se guarda directamente en el estado del modal
    const handleSeleccionarOperador = (nombre) => {
        setModal(prev => ({ ...prev, operador: nombre }));
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
            <div
                style={{
                    background: 'white',
                    padding: 24,
                    borderRadius: 8,
                    minWidth: 320,
                    textAlign: 'center',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}
            >
                {/* VISTA 0: SELECCIÓN DE OPERARIO POR BOTONES */}
                {!modal.operador ? (
                    <div>
                        <div className="mb-3" style={{ fontSize: 24, fontWeight: 'bold' }}>¿Quién realiza el reporte?</div>
                        <p style={{ color: '#666', fontSize: 16 }}>Selecciona tu nombre de la lista:</p>

                        {/* 3. Mapeamos la lista de operarios creando botones idénticos a los principales */}
                        <div className="d-flex flex-wrap justify-content-center my-3">
                            {listaOperarios.map((nombre) => (
                                <button
                                    key={nombre}
                                    type="button"
                                    className="btn btn-outline-primary m-2"
                                    style={{ fontSize: 28, padding: '16px 32px', fontWeight: '500' }}
                                    onClick={() => handleSeleccionarOperador(nombre)}
                                >
                                    {nombre}
                                </button>
                            ))}
                        </div>

                        <div>
                            <button
                                type="button"
                                className="btn btn-link mt-2"
                                style={{ fontSize: 20 }}
                                onClick={onClose}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    /* VISTAS DE SELECCIÓN TRADICIONALES */
                    <div>
                        <div style={{ fontSize: 14, color: '#28a745', marginBottom: 15, background: '#e8f5e9', padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>
                            👤 Operario: <b>{modal.operador}</b>
                        </div>

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
                                        className={opt.className + ' m-2'}
                                        style={{ fontSize: 28, padding: '16px 32px', ...(opt.style || {}) }}
                                        onClick={() => handleMainOption(opt.main, modal.operador)}
                                    >
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
                                    <div className="mb-3" style={{ fontSize: 22, color: '#888' }}>
                                        En Producción.
                                    </div>
                                ) : (
                                    <div>
                                        <div className="mb-3" style={{ fontSize: 24 }}>Seleccione una causa</div>

                                        {getSecondaryOptions().map((label, idx) => (
                                            label === 'Otros' ? (
                                                <button
                                                    key={label}
                                                    className="btn btn-outline-secondary m-2"
                                                    style={{ fontSize: 28, padding: '16px 32px' }}
                                                    onClick={() => {
                                                        const custom = window.prompt('Escribe la causa personalizada:');
                                                        if (custom && custom.trim().length > 0) {
                                                            handleSecondaryOption(idx, custom.trim(), modal.operador);
                                                        }
                                                    }}
                                                >
                                                    Otros
                                                </button>
                                            ) : (
                                                <button
                                                    key={label}
                                                    className="btn btn-outline-secondary m-2"
                                                    style={{ fontSize: 28, padding: '16px 32px' }}
                                                    onClick={() => handleSecondaryOption(idx, undefined, modal.operador)}
                                                >
                                                    {label}
                                                </button>
                                            )
                                        ))}
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
