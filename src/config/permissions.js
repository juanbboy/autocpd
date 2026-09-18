export const permissions = {
    1: {
        allowedUids: ['lg9wWMV68ldCTLhtLVaIjEjXr2P2']
    },
    3: {
        allowedUids: ['lg9wWMV68ldCTLhtLVaIjEjXr2P2']
    },

};

export function closeTimer(main, userUid) {
    const permission = permissions[main];

    // Si el código no tiene restricción, cualquier usuario puede cerrarlo
    if (!permission) {
        return true;
    }

    return permission.allowedUids.includes(userUid);
}