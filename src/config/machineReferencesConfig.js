import { supabase } from '../components/pruebas/client';

// Referencias por defecto
const defaultReferences = {
    // // Sierras Circulares
    // "S1": "",
    // "S2": "",
    // "S3": "",
    // "S4": "",
    // "S5": "",
    // "S6": "",
    // "S7": "",
    // "S8": "",
    // "S9": "",
    // "S10": "",
    // "S11": "",
    // "S12": "",
    // "S13": "",
    // "S14": "",
    // "S15": "",
    // "S16": "",
    // "S17": "",
    // "S18": "",
    // "S19": "",

    // // Máquinas adicionales
    // "26": "",
    // "28": "",
    // "30": "",
    // "31": "",
    // "32": "",
    // "33": "",
    // "34": "",
    // "35": "",
    // "36": "",
    // "38": "",
    // "39": "",
    // "40": "",
    // "43": "",
    // "44": "",
    // "45": "",
    // "46": "",
    // "47": "",
    // "48": "",
    // "49": "",
    // "50": "",
    // "51": "",
    // "52": "",
    // "53": "",
    // "54": "",
    // "55": "",
    // "56": "",
    // "57": "",
    // "58": "",
    // "64": "",
    // "65": "",
    // "66": "",
    // "67": "",
    // "69": "",
    // "70": "",
    // "71": "",
    // "72": "",
    // "73": "",
    // "74": "",
    // "75": "",
    // "76": "",
};

// /**
//  * Obtener todas las referencias (localStorage o por defecto)
//  * @returns {Object} Objeto con ID de máquina como clave y referencia como valor
//  */
export function getMachineReferences() {
    try {
        const stored = localStorage.getItem('machineReferences');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error loading references from localStorage:', e);
    }
    return defaultReferences;
}

// /**
//  * Obtener referencia de una máquina específica
//  * @param {string} machineId - ID de la máquina
//  * @returns {string} Referencia de la máquina
//  */
export function getMachineReference(machineId) {
    const refs = getMachineReferences();
    return refs[machineId] ? refs[machineId] : '';
}

// Supabase integration

/**
 * Obtener todas las referencias desde Supabase (tabla `programa`) y guardarlas en localStorage
 */
export async function fetchReferencesFromSupabase() {
    try {
        const { data, error } = await supabase.from('programa').select('maquina_id, referencia');
        if (error) {
            console.error('Error fetching references from Supabase:', error);
            return null;
        }
        const refs = { ...defaultReferences };
        if (Array.isArray(data)) {
            data.forEach(row => {
                if (row && row.maquina_id) refs[row.maquina_id] = row.referencia || '';
            });
        }
        saveMachineReferences(refs);
        return refs;
    } catch (e) {
        console.error('Unexpected error fetching from Supabase:', e);
        return null;
    }
}

/**
 * Upsert una referencia en Supabase (tabla `programa`)
 */
export async function saveReferenceToSupabase(machineId, reference) {
    try {
        if (!machineId) return null;
        // Si la referencia está vacía, eliminamos la fila en Supabase
        if (!reference) {
            const { error } = await supabase.from('programa').delete().eq('maquina_id', machineId);
            if (error) console.error('Error deleting reference from Supabase:', error);
            return null;
        }
        const payload = { maquina_id: machineId, referencia: reference };
        const { data, error } = await supabase.from('programa').upsert(payload, { onConflict: 'maquina_id' });
        if (error) console.error('Error upserting reference to Supabase:', error);
        return data;
    } catch (e) {
        console.error('Unexpected error saving to Supabase:', e);
        return null;
    }
}

/**
 * Guardar todas las referencias en Supabase en lote
 */
export async function saveAllReferencesToSupabase(references) {
    try {
        if (!references || typeof references !== 'object') return null;
        const rows = Object.entries(references).map(([maquina_id, referencia]) => ({ maquina_id, referencia }));
        const { data, error } = await supabase.from('programa').upsert(rows, { onConflict: 'maquina_id' });
        if (error) console.error('Error upserting all references to Supabase:', error);
        return data;
    } catch (e) {
        console.error('Unexpected error saving all to Supabase:', e);
        return null;
    }
}

// /**
//  * Guardar todas las referencias en localStorage
//  * @param {Object} references - Objeto con referencias
//  */
export function saveMachineReferences(references) {
    try {
        localStorage.setItem('machineReferences', JSON.stringify(references));
        return true;
    } catch (e) {
        console.error('Error saving references to localStorage:', e);
        return false;
    }
}

// /**
//  * Agregar nueva máquina
//  * @param {string} machineId - ID de la máquina
//  * @param {string} reference - Referencia de la máquina
//  */
export async function addMachineReference(machineId, reference) {
    const refs = getMachineReferences();
    refs[machineId] = reference;
    const ok = saveMachineReferences(refs);
    // Persist to Supabase (best-effort)
    try {
        await saveReferenceToSupabase(machineId, reference);
    } catch (e) {
        console.error('Error saving reference to Supabase:', e);
    }
    return ok;
}

// /**
//  * Actualizar referencia existente
//  * @param {string} machineId - ID de la máquina
//  * @param {string} reference - Nueva referencia
//  */
export async function updateMachineReference(machineId, reference) {
    return addMachineReference(machineId, reference);
}

/**
 * Eliminar máquina
 * @param {string} machineId - ID de la máquina
 */
export async function deleteMachineReference(machineId) {
    const refs = getMachineReferences();
    delete refs[machineId];
    const ok = saveMachineReferences(refs);
    try {
        // remove from Supabase
        await saveReferenceToSupabase(machineId, '');
    } catch (e) {
        console.error('Error deleting reference from Supabase:', e);
    }
    return ok;
}

/**
 * Restaurar referencias por defecto
 */
export async function resetToDefaults() {
    const ok = saveMachineReferences(defaultReferences);
    try {
        await saveAllReferencesToSupabase(defaultReferences);
    } catch (e) {
        console.error('Error resetting defaults to Supabase:', e);
    }
    return ok;
}

/**
 * Exportar referencias en JSON
 */
export function exportReferences() {
    const refs = getMachineReferences();
    const dataStr = JSON.stringify(refs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `machine-references-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Importar referencias desde JSON
 */
export function importReferences(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const refs = JSON.parse(e.target.result);
                saveMachineReferences(refs);
                resolve(refs);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Exportar referencias por defecto para uso directo
export const machineReferences = defaultReferences;
