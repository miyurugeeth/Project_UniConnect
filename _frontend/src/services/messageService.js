import api from "./api";

// SEND MESSAGE
export const sendMessage = async (receiverId, content) => {

  const response = await api.post(
    `/messages/send/${receiverId}`,
    {
      content: content
    }
  );

  return response.data;
};


// GET CONVERSATION
export const getConversation = async (userId) => {

  const response = await api.get(
    `/messages/conversation/${userId}`
  );

  return response.data;
};


// GET MY SENT MESSAGES
export const getMySentMessages = async () => {

  const response = await api.get(
    "/messages/sent"
  );

  return response.data;
};


// GET MY RECEIVED MESSAGES
export const getMyReceivedMessages = async () => {

  const response = await api.get(
    "/messages/received"
  );

  return response.data;
};


// GET UNREAD MESSAGE COUNT
export const getUnreadMessageCount = async () => {

  const response = await api.get(
    "/messages/unread-count"
  );

  return response.data;
};


// MARK MESSAGE AS READ
export const markMessageAsRead = async (messageId) => {

  const response = await api.patch(
    `/messages/${messageId}/read`
  );

  return response.data;
};


// DELETE MESSAGE
export const deleteMessage = async (messageId) => {

  await api.delete(
    `/messages/${messageId}`
  );
};

