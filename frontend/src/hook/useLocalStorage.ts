import {useEffect, useState} from "react";

export function useLocalStorage<T>(key: string, initial: T) {
    const [value, setValue] = useState<T> (() => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as T) : initial;
        } catch {
            return initial;
        }
    });

    //presist change
    useEffect(() => {
        try {
            localStorage.setItem(key,JSON.stringify(value));
        } catch {
        }
    }, [key,value]);

    //sync across tabs
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key == key && e.newValue) setValue(JSON.parse(e.newValue))
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [key]);
    return [value, setValue] as const;
    
}