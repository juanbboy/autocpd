import React from 'react';

const OptionModal = ({
  show,
  targetId, // ID de la máquina seleccionada
  currentMainOption, // Opción principal actual seleccionada en el modal
  imgStates, // Estado global de las imágenes para obtener la fuente y etiquetas secundarias
  mainOptions, // Opciones principales (Mecánico, Electrónico, etc.)
  secondaryOptionsMap, // Mapa de opciones secundarias
  onClose, // Callback para cerrar el modal
  onSelectMainOption, // Callback para seleccionar una opción principal
  onSelectSecondaryOption, // Callback para seleccionar una opción secundaria
}) => {
  if (!show) return null;

  // Helper para obtener la etiqueta secundaria (duplicado aquí)
  const getSecondaryLabel = (id) => {
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
  };

  const currentMachineState = imgStates[targetId];
  const currentSecondaryLabel = getSecondaryLabel(targetId);

  // Manejadores internos que llaman a los callbacks pasados por props
  const handleMainOptionClick = (main) => {
    onSelectMainOption(main, targetId); // Pasa la opción principal y el ID de la máquina
  };

  const handleSecondaryOptionClick = (secondaryIdx, customText) => {
    onSelectSecondaryOption(secondaryIdx, customText, targetId); // Pasa la subopción, texto personalizado y el ID
  };

  // Obtiene las subopciones para la opción principal actual
  const getSecondaryOptionsForCurrentMain = () => {
    if (currentMainOption === 4) return []; // Si es Producción, no hay subopciones
    if (currentMainOption && secondaryOptionsMap[currentMainOption]) {
      return secondaryOptionsMap[currentMainOption];
    }
    return [];
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
          minWidth: 250,
          textAlign: 'center',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {!currentMainOption ? (
          // Paso 1: Selección de opción principal
          <>
            <div className="mb-3" style={{ fontSize: 24 }}>¿Escoge opción requerida?</div>
            {currentMachineState && currentMachineState.secondary != null ? (
              <div style={{ marginBottom: 16, fontSize: 22, color: '#007bff' }}>
                Máquina en revisión por: <b>{currentSecondaryLabel}</b>
              </div>
            ) : (
              <div style={{ marginBottom: 16, fontSize: 22, color: '#888' }}>
                En Producción
              </div>
            )}
            {mainOptions.map(opt => (
              <button
                key={opt.main}
                className={opt.className + " m-2"}
                style={{ fontSize: 28, padding: '16px 32px', ...(opt.style || {}) }}
                onClick={() => handleMainOptionClick(opt.main)}
              >
                {opt.label}
              </button>
            ))}
            <div>
              <button className="btn btn-link mt-3" style={{ fontSize: 20 }} onClick={onClose}>Cancelar</button>
            </div>
          </>
        ) : (
          // Paso 2: Selección de subopción (si aplica)
          <>
            {currentMainOption === 4 ? (
              <div className="mb-3" style={{ fontSize: 22, color: "#888" }}>
                En Producción.
              </div>
            ) : (
              <>
                <div className="mb-3" style={{ fontSize: 24 }}>Seleccione una causa</div>
                {getSecondaryOptionsForCurrentMain().map((label, idx) => (
                  label === "Otros" ? (
                    <button key={idx}
                      className="btn btn-outline-secondary m-2"
                      style={{ fontSize: 24, padding: '12px 24px' }}
                      onClick={() => {
                        const custom = window.prompt("Escribe la causa personalizada:");
                        if (custom && custom.trim().length > 0) {
                          handleSecondaryOptionClick(idx, custom.trim());
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
                      onClick={() => handleSecondaryOptionClick(idx)}
                    >
                      {label}
                    </button>
                  )
                ))}
              </>
            )}
            <div>
              <button className="btn btn-link mt-3" style={{ fontSize: 20 }} onClick={onClose}>Cancelar</button>
              {currentMainOption !== 4 && (
                <button className="btn btn-link mt-3" style={{ fontSize: 20 }} onClick={() => onSelectMainOption(null, targetId)}>Volver</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OptionModal;
