import io from 'socket.io-client';

const socket = io({ path: '/bridge' });

// const socket = io('https://videocall-be.onrender.com/', {
//       transports: ['websocket'],
//     })

export default socket;
