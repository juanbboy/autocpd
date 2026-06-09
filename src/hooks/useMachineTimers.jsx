import { useEffect, useMemo, useState } from 'react';

const formatDuration = (seconds) => {
    const pad = (value) => String(value).padStart(2, '0');
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
};

const getMachineTimerText = (state, now) => {
    if (!state || state.main === 4 || !state.startedAt) return null;
    const elapsedSeconds = Math.max(0, Math.round((now - state.startedAt) / 1000));
    return formatDuration(elapsedSeconds);
};

const useMachineTimers = (imgStates) => {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return useMemo(() => {
        const timers = {};
        if (!imgStates || typeof imgStates !== 'object') return timers;
        Object.entries(imgStates).forEach(([id, state]) => {
            const text = getMachineTimerText(state, now);
            if (text) {
                timers[id] = text;
            }
        });
        return timers;
    }, [imgStates, now]);
};

export default useMachineTimers;
export { formatDuration, getMachineTimerText };