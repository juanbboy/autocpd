export const userPermissions = {
    admin: [
        { uid: 'yeT0Zn7Q5meOeZbunU0sGNaU0Xd2', alias: 'Admin' }
    ],

    manageReferences: [
        { uid: 'yeT0Zn7Q5meOeZbunU0sGNaU0Xd2', alias: 'Admin' },
    ],
    closeTimer: {
        1: [
            { uid: 'CWF5LqkDTGafD3vv1SD0qZxBSf23', alias: 'mirella' },
            { uid: 'eGmWLzOIzgeLkaTTjNoc0mODlJJ2', alias: 'josua' },
            { uid: 'yYnt0ggSm4cZbaV4f4C5kGOllC93', alias: 'nestor' },
            { uid: 'yeT0Zn7Q5meOeZbunU0sGNaU0Xd2', alias: 'Admin' }
        ],
        3: [
            { uid: 'CWF5LqkDTGafD3vv1SD0qZxBSf23', alias: 'mirella' },
            { uid: 'eGmWLzOIzgeLkaTTjNoc0mODlJJ2', alias: 'josua' },
            { uid: 'yYnt0ggSm4cZbaV4f4C5kGOllC93', alias: 'nestor' },
            { uid: 'yeT0Zn7Q5meOeZbunU0sGNaU0Xd2', alias: 'Admin' }
        ]
    }
};

export const getAllowedUsersByMain = (main) => {
    const normalizedMain = Number(main);
    const list = userPermissions.closeTimer?.[normalizedMain] || [];

    return list.map((entry) => {
        if (typeof entry === 'string') {
            return { uid: entry, alias: entry };
        }
        return entry;
    });
};

export const getUidAlias = (uid) => {
    for (const main of Object.keys(userPermissions.closeTimer || {})) {
        const users = getAllowedUsersByMain(main);
        const match = users.find((user) => user.uid === uid);
        if (match) return match.alias;
    }

    return uid;
};

export const hasPermission = (main, userUid) => {
    if (!main || !userUid) return false;
    return getAllowedUsersByMain(main).some((user) => user.uid === userUid);
};

export function closeTimer(main, userUid) {
    const allowedUsers = getAllowedUsersByMain(main);

    if (!allowedUsers.length) {
        return true;
    }

    return allowedUsers.some((user) => user.uid === userUid);
}

export const canManageMachineReferences = (userUid) => {
    const allowedUsers = [
        ...(userPermissions.manageReferences || []),
        ...(userPermissions.admin || [])
    ];

    return allowedUsers.some((user) => user.uid === userUid);
};