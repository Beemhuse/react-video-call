
// // This will store user sockets indexed by their ID
// const userSockets = {};

// // This will store call information, where each call ID points to an array of participant socket IDs
// const calls = {};


// /**
//  * Creates a new user or updates an existing one.
//  * @param {SocketIO.Socket} socket - The socket instance associated with the user.
//  * @param {string} id - The unique ID of the user.
//  * @param {string} name - The name of the user.
//  * @returns {Object} The user object.
//  */
// function createOrUpdate(socket, id, name) {
//   if (!id) return null; // Ensure the user ID is valid

//   if (userSockets[id]) {
//       // Update existing user
//       userSockets[id].socket = socket; // Update the socket instance
//       userSockets[id].name = name; // Update the user's name
//   } else {
//       // Create new user
//       userSockets[id] = {
//           socket: socket,
//           name: name,
//           id: id
//       };
//   }

//   return userSockets[id];
// }
// /**
//  * Creates a user session.
//  * @param {SocketIO.Socket} socket - The socket instance of the connected user.
//  * @param {string} id - The unique ID of the user.
//  */
// function create(socket, id) {
//     if (userSockets[id]) {
//         return null;  // ID is already in use
//     }
//     userSockets[id] = socket;
//     return { id, socket };
// }

// /**
//  * Retrieves a user's socket by their ID.
//  * @param {string} id - The ID of the user to retrieve.
//  * @return {SocketIO.Socket | undefined} The socket of the user, or undefined if not found.
//  */
// function get(id) {
//     return userSockets[id];
// }

// /**
//  * Removes a user session.
//  * @param {string} id - The ID of the user to remove.
//  */
// function remove(id) {
//     delete userSockets[id];
//     // Also remove from any calls they might be in
//     for (let callId in calls) {
//         const index = calls[callId].indexOf(id);
//         if (index > -1) {
//             calls[callId].splice(index, 1);
//         }
//     }
// }

// /**
//  * Retrieves participants of a specific call.
//  * @param {string} callId - The ID of the call.
//  * @return {Array.<SocketIO.Socket>} An array of sockets participating in the call.
//  */
// function getParticipants(callId) {
//     return calls[callId] ? calls[callId].map(id => userSockets[id]).filter(socket => socket) : [];
// }

// /**
//  * Adds a participant to a specific call.
//  * @param {string} callId - The ID of the call to join.
//  * @param {SocketIO.Socket} socket - The socket of the user joining the call.
//  */
// function addParticipant(callId, socket) {
//     if (!calls[callId]) {
//         calls[callId] = [];
//     }
//     calls[callId].push(socket.id);
// }

// module.exports = { create, get, remove,createOrUpdate, getParticipants, addParticipant };



class UserManager {
  constructor() {
      this.userSockets = {}; // This will store user sockets indexed by their ID
  }

  /**
   * Creates a new user or updates an existing one.
   * @param {SocketIO.Socket} socket - The socket instance associated with the user.
   * @param {string} id - The unique ID of the user.
   * @param {string} name - The name of the user.
   * @returns {Object} The user object.
   */

  
  createOrUpdate(socket, id, name) {
      if (!id) return null; // Ensure the user ID is valid

      if (this.userSockets[id]) {
          // Update existing user
          this.userSockets[id].socket = socket; // Update the socket instance
          this.userSockets[id].name = name; // Update the user's name
      } else {
          // Create new user
          this.userSockets[id] = {
              socket: socket,
              name: name,
              id: id
          };
      }

      return this.userSockets[id];
  }

  /**
   * Retrieves a user's socket by their ID.
   * @param {string} id - The ID of the user to retrieve.
   * @return {SocketIO.Socket | undefined} The socket of the user, or undefined if not found.
   */
  get(id) {
      return this.userSockets[id] ? this.userSockets[id].socket : undefined;
  }

  /**
   * Removes a user session.
   * @param {string} id - The ID of the user to remove.
   */
  remove(id) {
      delete this.userSockets[id];
  }
}

module.exports = UserManager;
