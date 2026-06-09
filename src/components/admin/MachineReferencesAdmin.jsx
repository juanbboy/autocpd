import React, { useState, useEffect } from 'react';
import './machineReferencesAdmin.css';
import {
    fetchReferencesFromSupabase,
    saveMachineReferences,
    saveReferenceToSupabase,
    saveAllReferencesToSupabase
} from '../../config/machineReferencesConfig';

const MachineReferencesAdmin = ({ onClose, isOpen }) => {
    const [machines, setMachines] = useState({});
    const [newMachineId, setNewMachineId] = useState('');
    const [newMachineRef, setNewMachineRef] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingRef, setEditingRef] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Cargar referencias desde Supabase (o fallback a localStorage)
    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                const refs = await fetchReferencesFromSupabase();
                if (mounted && refs) {
                    setMachines(refs);
                    return;
                }
            } catch (e) {
                console.error('Error fetching refs from Supabase:', e);
            }
            // fallback a localStorage
            const stored = localStorage.getItem('machineReferences');
            if (stored) {
                try {
                    if (mounted) setMachines(JSON.parse(stored));
                } catch (e) {
                    console.error('Error loading references:', e);
                }
            }
        }
        if (isOpen) load();
        return () => { mounted = false; };
    }, [isOpen]);

    // Guardar referencias localmente y en Supabase (best-effort)
    const saveMachines = (updated) => {
        setMachines(updated);
        saveMachineReferences(updated);
        // persistir en Supabase en segundo plano
        (async () => {
            try {
                await saveAllReferencesToSupabase(updated);
            } catch (e) {
                console.error('Error saving machines to Supabase:', e);
            }
        })();
    };

    // Agregar nueva máquina
    const handleAddMachine = () => {
        if (newMachineId.trim() && newMachineRef.trim()) {
            const updated = {
                ...machines,
                [newMachineId]: newMachineRef
            };
            saveMachines(updated);
            // upsert individual immediately
            (async () => {
                try {
                    await saveReferenceToSupabase(newMachineId, newMachineRef);
                } catch (e) {
                    console.error('Error saving new reference to Supabase:', e);
                }
            })();
            setNewMachineId('');
            setNewMachineRef('');
        }
    };

    // Actualizar referencia existente
    const handleUpdateReference = (machineId) => {
        if (editingRef.trim()) {
            const updated = {
                ...machines,
                [machineId]: editingRef
            };
            saveMachines(updated);
            (async () => {
                try {
                    await saveReferenceToSupabase(machineId, editingRef);
                } catch (e) {
                    console.error('Error updating reference to Supabase:', e);
                }
            })();
            setEditingId(null);
            setEditingRef('');
        }
    };

    // Eliminar máquina
    const handleDeleteMachine = (machineId) => {
        if (window.confirm(`¿Eliminar máquina ${machineId}?`)) {
            const updated = { ...machines };
            delete updated[machineId];
            saveMachines(updated);
            (async () => {
                try {
                    await saveReferenceToSupabase(machineId, '');
                } catch (e) {
                    console.error('Error deleting reference from Supabase:', e);
                }
            })();
        }
    };

    // Filtrar máquinas por búsqueda
    const filteredMachines = Object.entries(machines).filter(([id, ref]) =>
        id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="machine-admin-overlay">
            <div className="machine-admin-modal">
                <div className="machine-admin-header">
                    <h2>Administrador de Referencias de Máquinas</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="machine-admin-body">
                    {/* Formulario para agregar nueva máquina */}
                    <div className="add-machine-section">
                        <h3>Agregar Nueva Máquina</h3>
                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="ID de Máquina (ej: M-100)"
                                value={newMachineId}
                                onChange={(e) => setNewMachineId(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddMachine()}
                            />
                            <input
                                type="text"
                                placeholder="Referencia (ej: DJ11L4)"
                                value={newMachineRef}
                                onChange={(e) => setNewMachineRef(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddMachine()}
                            />
                            <button className="btn-add" onClick={handleAddMachine}>
                                + Agregar
                            </button>
                        </div>
                    </div>

                    {/* Buscador */}
                    <div className="search-section">
                        <input
                            type="text"
                            placeholder="Buscar por ID o referencia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    {/* Lista de máquinas */}
                    <div className="machines-list">
                        <h3>Máquinas Registradas ({filteredMachines.length})</h3>
                        {filteredMachines.length === 0 ? (
                            <div className="empty-state">
                                <p>No hay máquinas registradas</p>
                            </div>
                        ) : (
                            <div className="machines-table">
                                <div className="table-header">
                                    <div className="col-id">ID Máquina</div>
                                    <div className="col-ref">Referencia</div>
                                    <div className="col-actions">Acciones</div>
                                </div>
                                <div className="table-body">
                                    {filteredMachines.map(([machineId, reference]) => (
                                        <div key={machineId} className="table-row">
                                            <div className="col-id">
                                                <strong>{machineId}</strong>
                                            </div>
                                            <div className="col-ref">
                                                {editingId === machineId ? (
                                                    <input
                                                        type="text"
                                                        value={editingRef}
                                                        onChange={(e) => setEditingRef(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleUpdateReference(machineId)}
                                                        autoFocus
                                                        className="edit-input"
                                                    />
                                                ) : (
                                                    <span>{reference}</span>
                                                )}
                                            </div>
                                            <div className="col-actions">
                                                {editingId === machineId ? (
                                                    <>
                                                        <button
                                                            className="btn-save"
                                                            onClick={() => handleUpdateReference(machineId)}
                                                            title="Guardar"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            className="btn-cancel"
                                                            onClick={() => setEditingId(null)}
                                                            title="Cancelar"
                                                        >
                                                            ✕
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="btn-edit"
                                                            onClick={() => {
                                                                setEditingId(machineId);
                                                                setEditingRef(reference);
                                                            }}
                                                            title="Editar"
                                                        >
                                                            ✎
                                                        </button>
                                                        <button
                                                            className="btn-delete"
                                                            onClick={() => handleDeleteMachine(machineId)}
                                                            title="Eliminar"
                                                        >
                                                            🗑
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="machine-admin-footer">
                    <button className="btn-close" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default MachineReferencesAdmin;
