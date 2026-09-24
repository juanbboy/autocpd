import {
    ref,
    onValue,
    get,
    set,
    remove
} from 'firebase/database';
import { dbi } from '../firebase/firebase-config';

const referencesRef = ref(dbi, 'machineReferences');

export function subscribeMachineReferences(callback) {
    return onValue(
        referencesRef,
        (snapshot) => {
            callback(snapshot.val() || {});
        },
        (error) => {
            console.error('Error loading machine references:', error);
            callback({});
        }
    );
}

export async function fetchMachineReferences() {
    const snapshot = await get(referencesRef);
    return snapshot.val() || {};
}

export async function saveMachineReference(machineId, reference) {
    const id = String(machineId || '').trim();
    const value = String(reference || '').trim();

    if (!id) {
        throw new Error('Machine ID is required');
    }

    if (!value) {
        await remove(ref(dbi, `machineReferences/${id}`));
        return;
    }

    await set(ref(dbi, `machineReferences/${id}`), value);
}

export async function saveMachineReferences(references) {
    await set(referencesRef, references || {});
}

export async function deleteMachineReference(machineId) {
    const id = String(machineId || '').trim();

    if (id) {
        await remove(ref(dbi, `machineReferences/${id}`));
    }
}

export function getMachineReference(references, machineId) {
    return references?.[machineId] || '';
}