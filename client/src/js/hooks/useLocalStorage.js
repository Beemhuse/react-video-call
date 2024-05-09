import { useState, useEffect } from "react";

function useLocalStorage(key) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.log(error);
            return null;
        }
    });

    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === key) {
                setStoredValue(JSON.parse(event.newValue));
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Cleanup the event listener when the component unmounts
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [key]);

    return storedValue;
}
export default useLocalStorage