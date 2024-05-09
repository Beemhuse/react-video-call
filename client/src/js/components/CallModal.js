import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { faCommentsDollar, faPhone, faVideo } from '@fortawesome/free-solid-svg-icons';
import ActionButton from './ActionButton';

function CallModal({ status, callFrom, acceptCall, rejectCall }) {

  console.log("Status ==>", status, "Call from ==> ", callFrom)
  const acceptWithVideo = async (video) => {
    const config = { audio: true, video };
 acceptCall(callFrom, config);
  };
  const [isModalOpen, setIsModalOpen] = useState(true);

  const closeModal = () => setIsModalOpen(false);

  if (!isModalOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center ${isModalOpen ? '' : 'hidden'}`}>
      
    {/* The modal content */}
    <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full p-4">
      <div className="flex justify-between items-center pb-3">
        <p className="text-lg font-bold">{`${callFrom} is calling`}</p>
        <div className="modal-close cursor-pointer z-50" onClick={closeModal}>
          X
        </div>
      </div>
      
      {/* The modal body */}
      <div className="mt-2">
        {/* <ActionButton
          icon={faVideo}
          onClick={() => acceptWithVideo(true)}
        /> */}
        <button onClick={()=>acceptWithVideo(true)}>Accept</button>
        <ActionButton
          icon={faPhone}
          onClick={() => acceptWithVideo(false)}
        />
        <ActionButton
          className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
          icon={faPhone}
          onClick={rejectCall}
        />
      </div>

    </div>
  </div>
  );
}

CallModal.propTypes = {
  status: PropTypes.string.isRequired,
  callFrom: PropTypes.string.isRequired,
  acceptCall: PropTypes.func.isRequired,
  rejectCall: PropTypes.func.isRequired
};

export default CallModal;
