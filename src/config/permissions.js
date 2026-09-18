export const permissions = {
    1: {
        allowedUids: ['CWF5LqkDTGafD3vv1SD0qZxBSf23', 'eGmWLzOIzgeLkaTTjNoc0mODlJJ2']
    },
    3: {
        allowedUids: ['CWF5LqkDTGafD3vv1SD0qZxBSf23', 'eGmWLzOIzgeLkaTTjNoc0mODlJJ2']
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