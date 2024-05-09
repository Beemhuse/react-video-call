import React, { createContext, useContext, useState } from 'react';

const WebRTCContext = createContext();

export const useWebRTC = () => useContext(WebRTCContext);

export const WebRTCProvider = ({ children }) => {
    const [offer, setOffer] = useState(null);
    const [answer, setAnswer] = useState(null);
    const [iceCandidates, setIceCandidates] = useState([]);

    return (
        <WebRTCContext.Provider value={{
            offer,
            setOffer,
            answer,
            setAnswer,
            iceCandidates,
            setIceCandidates
        }}>
            {children}
        </WebRTCContext.Provider>
    );
};
