import React, { useState, useEffect } from 'react';
import './machineReferencesAdmin.css';
import {
    subscribeMachineReferences,
    saveMachineReference,
    deleteMachineReference
} from '../../config/machineReferencesConfig';

const MachineReferencesAdmin = ({ onClose, isOpen }) => {
    const [machines, setMachines] = useState({});
    const [newMachineId, setNewMachineId] = useState('');
    const [newMachineRef, setNewMachineRef] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingRef, setEditingRef] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!isOpen) return undefined;

        const unsubscribe = subscribeMachineReferences((references) => {
            setMachines(references);
        });

        return unsubscribe;
    }, [isOpen]);

    const saveMachines = async (updated) => {
        setMachines(updated);

        try {
            await Promise.all(
                Object.entries(updated).map(([machineId, reference]) =>
                    saveMachineReference(machineId, reference)
                )
            );
        } catch (error) {
            console.error('Error saving machine references:', error);
        }
    };

    const handleAddMachine = async () => {
        const machineId = newMachineId.trim();
        const machineReference = newMachineRef.trim();

        if (!machineId || !machineReference) return;

        const updated = {
            ...machines,
            [machineId]: machineReference
        };

        await saveMachines(updated);
        setNewMachineId('');
        setNewMachineRef('');
    };

    const handleUpdateReference = async (machineId) => {
        const reference = editingRef.trim();
        if (!reference) return;

        const updated = {
            ...machines,
            [machineId]: reference
        };

        await saveMachines(updated);
        setEditingId(null);
        setEditingRef('');
    };

    const handleDeleteMachine = async (machineId) => {
        if (!window.confirm(`¿Eliminar máquina ${machineId}?`)) return;

        try {
            await deleteMachineReference(machineId);
        } catch (error) {
            console.error('Error deleting machine reference:', error);
        }
    };

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

                    <div className="search-section">
                        <input
                            type="text"
                            placeholder="Buscar por ID o referencia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

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