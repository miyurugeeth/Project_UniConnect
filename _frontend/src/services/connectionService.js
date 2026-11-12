import api from "./api";

// SEND CONNECTION REQUEST
export const sendConnectionRequest = async (receiverId) => {
  const response = await api.post(
    `/connections/send/${receiverId}`
  );

  return response.data;
};


// GET RECEIVED REQUESTS
export const getReceivedRequests = async () => {
  const response = await api.get(
    "/connections/received"
  );

  return response.data;
};


// GET SENT REQUESTS
export const getSentRequests = async () => {
  const response = await api.get(
    "/connections/sent"
  );

  return response.data;
};


// ACCEPT CONNECTION REQUEST
export const acceptConnectionRequest = async (connectionId) => {
  const response = await api.put(
    `/connections/${connectionId}/accept`
  );

  return response.data;
};


// REJECT CONNECTION REQUEST
export const rejectConnectionRequest = async (connectionId) => {
  const response = await api.put(
    `/connections/${connectionId}/reject`
  );

  return response.data;
};


// GET CONNECTION STATUS
export const getConnectionStatus = async (userId) => {
  const response = await api.get(
    `/connections/status/${userId}`
  );

  return response.data;
};


// REMOVE ACCEPTED CONNECTION
export const removeConnection = async (connectionId) => {
  await api.delete(
    `/connections/${connectionId}`
  );
};


// CANCEL SENT REQUEST
export const cancelConnectionRequest = async (connectionId) => {
  await api.delete(
    `/connections/${connectionId}/cancel`
  );
};


// GET MY ACCEPTED CONNECTIONS
export const getMyConnections = async () => {
  const response = await api.get(
    "/connections/my"
  );

  return response.data;
};
